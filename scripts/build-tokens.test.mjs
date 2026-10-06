import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CSS_FILE,
  THEMES_DIR,
  buildCss,
  checkContrast,
  collectTokens,
  contrastRatio,
  formatValue,
  loadThemes,
  loadTree,
  mergeTokens,
} from './build-tokens.mjs';

describe('collectTokens', () => {
  it('flattens groups and inherits $type', () => {
    const tokens = collectTokens({
      color: { $type: 'color', bg: { $value: '#000' }, signal: { ok: { $value: '#0f0' } } },
    });
    expect(tokens.map((t) => [t.path.join('.'), t.type])).toEqual([
      ['color.bg', 'color'],
      ['color.signal.ok', 'color'],
    ]);
  });

  it('rejects names that would not be valid CSS custom properties', () => {
    expect(() => collectTokens({ color: { 'Brand Pink': { $value: '#f0f' } } })).toThrow(/Invalid token name/);
  });
});

describe('formatValue', () => {
  const known = new Set(['color.brand', 'color.bg']);

  it('turns references into var(), also inside color-mix()', () => {
    expect(formatValue('{color.brand}', 'color', known)).toBe('var(--color-brand)');
    expect(formatValue('color-mix(in oklab, {color.brand} 20%, {color.bg})', 'color', known)).toBe(
      'color-mix(in oklab, var(--color-brand) 20%, var(--color-bg))',
    );
  });

  it('fails on unknown references', () => {
    expect(() => formatValue('{color.nope}', 'color', known, 'color.x')).toThrow(/unknown reference \{color\.nope\}/);
  });

  it('quotes font names but not generic families', () => {
    expect(formatValue(['Bodoni Moda', 'Didot', 'serif'], 'fontFamily', known)).toBe('"Bodoni Moda", "Didot", serif');
    expect(formatValue(['system-ui', '-apple-system', 'Segoe UI'], 'fontFamily', known)).toBe(
      'system-ui, -apple-system, "Segoe UI"',
    );
  });

  it('formats cubic-bezier arrays and DTCG {value, unit} objects', () => {
    expect(formatValue([0.2, 0.7, 0.2, 1], 'cubicBezier', known)).toBe('cubic-bezier(0.2, 0.7, 0.2, 1)');
    expect(formatValue({ value: 120, unit: 'ms' }, 'duration', known)).toBe('120ms');
    expect(formatValue(1.55, 'number', known)).toBe('1.55');
  });
});

describe('mergeTokens', () => {
  it('replaces only the tokens a theme defines', () => {
    const base = { color: { $type: 'color', bg: { $value: '#000', $description: 'bg' }, text: { $value: '#fff' } } };
    const merged = mergeTokens(base, { color: { bg: { $value: '#111' } } });
    expect(merged.color.bg).toEqual({ $value: '#111', $description: 'bg' });
    expect(merged.color.text).toEqual({ $value: '#fff' });
    expect(merged.color.$type).toBe('color');
  });
});

describe('buildCss', () => {
  const base = {
    color: { $type: 'color', bg: { $value: '#000' }, focus: { $value: '{color.bg}' } },
    font: { $type: 'fontFamily', body: { $value: ['Arial', 'sans-serif'] } },
  };

  it('puts the base on :root and only the overridden tokens on each theme, typed by the base', () => {
    const css = buildCss(base, { themes: [{ name: 'b', tree: { font: { body: { $value: ['Bodoni Moda', 'serif'] } } } }] });
    expect(css).toContain(':root {\n  color-scheme: dark;');
    expect(css).toContain('  --color-focus: var(--color-bg);');
    expect(css).toContain(':root[data-theme="b"],\n[data-theme="b"] {\n  --font-body: "Bodoni Moda", serif;\n}');
  });

  it('sorts themes by name and rejects names that cannot be an attribute value', () => {
    const themes = [
      { name: 'z', tree: { color: { bg: { $value: '#111' } } } },
      { name: 'a', tree: { color: { bg: { $value: '#222' } } } },
    ];
    const css = buildCss(base, { themes });
    expect(css.indexOf('data-theme="a"')).toBeLessThan(css.indexOf('data-theme="z"'));
    expect(() => buildCss(base, { themes: [{ name: 'Neon Műhely', tree: {} }] })).toThrow(/Invalid theme name/);
  });

  it('checks references inside themes', () => {
    expect(() => buildCss(base, { themes: [{ name: 'x', tree: { color: { bg: { $value: '{color.nope}' } } } }] })).toThrow(
      /x: color.bg: unknown reference/,
    );
  });
});

describe('contrast', () => {
  it('computes WCAG ratios', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#777', '#777')).toBeCloseTo(1, 5);
  });
});

describe('the repository tokens', () => {
  const themes = fs
    .readdirSync(THEMES_DIR)
    .filter((f) => f.endsWith('.tokens.json'))
    .map((f) => f.replace('.tokens.json', ''));

  it('src/styles/tokens.css is generated from the current JSON (run `npm run tokens`)', () => {
    expect(fs.readFileSync(CSS_FILE, 'utf8').replaceAll('\r\n', '\n')).toBe(buildCss(loadTree(), { themes: loadThemes() }));
  });

  it('tokens.css carries both design directions', () => {
    expect(loadThemes().map((t) => t.name)).toEqual(['galeria-editorial', 'neon-muhely']);
    const css = fs.readFileSync(CSS_FILE, 'utf8');
    for (const name of themes) expect(css).toContain(`:root[data-theme="${name}"],\n[data-theme="${name}"] {`);
  });

  it.each([['base'], ...themes.map((t) => [t])])('%s keeps readable contrast', (name) => {
    const results = checkContrast(loadTree(name === 'base' ? undefined : name));
    for (const r of results.filter((x) => !x.skipped)) {
      expect.soft(r.ratio, `${r.fg} on ${r.bg}`).toBeGreaterThanOrEqual(r.min);
    }
    // The brand pair is the point of the check: it must always be measurable.
    expect(results.find((r) => r.fg === 'color.brand')?.skipped).not.toBe(true);
  });

  it.each(themes.map((t) => [t]))('theme %s only uses token names that exist in the base file', (name) => {
    const base = new Set(collectTokens(loadTree()).map((t) => t.path.join('.')));
    const theme = JSON.parse(fs.readFileSync(path.join(THEMES_DIR, `${name}.tokens.json`), 'utf8'));
    const extra = collectTokens(theme).map((t) => t.path.join('.')).filter((p) => !base.has(p));
    expect(extra).toEqual([]);
  });

  it.each(themes.map((t) => [t]))('theme %s builds without unknown references', (name) => {
    const theme = loadThemes().find((t) => t.name === name);
    expect(() => buildCss(loadTree(), { themes: [theme] })).not.toThrow();
  });
});
