#!/usr/bin/env node
/**
 * Builds the site's CSS custom properties from the design tokens.
 *
 *   design/tokens/stilet.tokens.json          source of truth (DTCG-style: $value, $type, $description)
 *   design/tokens/themes/<name>.tokens.json   a design direction: overrides some base tokens
 *   src/styles/tokens.css                     generated output, never edited by hand
 *
 * The CSS holds the base values on :root and each theme's values on [data-theme="<name>"]; the site sets
 * data-theme on <html> from the SITE_THEME var, so one build can run as either direction. Any other element
 * with data-theme (the UI library's ThemeRoot) re-themes its subtree, also inside another theme.
 *
 * Usage:
 *   node scripts/build-tokens.mjs            write src/styles/tokens.css
 *   node scripts/build-tokens.mjs --check    exit 1 if src/styles/tokens.css is out of date
 *
 * A token is an object with "$value"; a group may set "$type" for its children. The CSS name is the
 * token path joined with "-" (color.text-muted -> --color-text-muted). References such as
 * "{color.brand}" become var(--color-brand), also inside larger values like color-mix().
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const TOKENS_FILE = path.join(ROOT, 'design/tokens/stilet.tokens.json');
export const THEMES_DIR = path.join(ROOT, 'design/tokens/themes');
export const CSS_FILE = path.join(ROOT, 'src/styles/tokens.css');

const NAME = /^[a-z0-9][a-z0-9-]*$/;
const REF = /\{([a-z0-9][a-z0-9.-]*)\}/g;
const GENERIC_FAMILIES = new Set([
  'serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui', 'ui-serif', 'ui-sans-serif',
  'ui-monospace', 'ui-rounded', 'emoji', 'math', 'fangsong', '-apple-system', 'BlinkMacSystemFont',
]);

const isToken = (node) => node !== null && typeof node === 'object' && !Array.isArray(node) && '$value' in node;
const isGroup = (node) => node !== null && typeof node === 'object' && !Array.isArray(node) && !('$value' in node);

/** Flattens the token tree into [{ path, value, type, description }] in file order. */
export function collectTokens(tree, prefix = [], inheritedType) {
  const out = [];
  const groupType = tree.$type ?? inheritedType;
  for (const [key, node] of Object.entries(tree)) {
    if (key.startsWith('$')) continue;
    if (!NAME.test(key)) throw new Error(`Invalid token name "${[...prefix, key].join('.')}": use lowercase letters, digits and "-".`);
    if (isToken(node)) {
      out.push({ path: [...prefix, key], value: node.$value, type: node.$type ?? groupType, description: node.$description });
    } else if (isGroup(node)) {
      out.push(...collectTokens(node, [...prefix, key], groupType));
    } else {
      throw new Error(`"${[...prefix, key].join('.')}" is neither a token (with $value) nor a group.`);
    }
  }
  return out;
}

/** Deep-merges a theme over the base: a token in the theme replaces the base token at the same path. */
export function mergeTokens(base, override) {
  const result = { ...base };
  for (const [key, node] of Object.entries(override)) {
    if (key.startsWith('$')) continue;
    if (isToken(node) && isToken(base[key])) result[key] = { ...base[key], ...node };
    else if (isGroup(node) && isGroup(base[key])) result[key] = mergeTokens(base[key], node);
    else result[key] = node;
  }
  return result;
}

const cssVar = (ref) => `var(--${ref.replaceAll('.', '-')})`;

function quoteFamily(name) {
  return GENERIC_FAMILIES.has(name) ? name : `"${name.replaceAll('"', '\\"')}"`;
}

/** Converts one token value to CSS text. `known` is the set of token paths references may point to. */
export function formatValue(value, type, known, where = 'token') {
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') {
    return value.replace(REF, (_, ref) => {
      if (known && !known.has(ref)) throw new Error(`${where}: unknown reference {${ref}}.`);
      return cssVar(ref);
    });
  }
  if (Array.isArray(value)) {
    if (type === 'fontFamily') return value.map(quoteFamily).join(', ');
    if (type === 'cubicBezier') {
      if (value.length !== 4) throw new Error(`${where}: cubicBezier needs 4 numbers.`);
      return `cubic-bezier(${value.join(', ')})`;
    }
    return value.map((v) => formatValue(v, type, known, where)).join(', ');
  }
  if (value && typeof value === 'object' && 'value' in value && 'unit' in value) {
    return `${value.value}${value.unit}`;
  }
  throw new Error(`${where}: unsupported value ${JSON.stringify(value)}.`);
}

/**
 * Builds the CSS file: every base token on :root, then for each theme (sorted by name) the tokens that any
 * theme changes, on :root[data-theme="<name>"] and [data-theme="<name>"]: its own value, or the base value
 * where only another theme changes it. So a theme nested in another one shows its own values, not the outer
 * theme's. A theme token takes its $type from the base token it replaces.
 */
export function buildCss(tree, { themes = [] } = {}) {
  const tokens = collectTokens(tree);
  const known = new Set(tokens.map((t) => t.path.join('.')));
  const lines = [
    '/*',
    ' * GENERATED by scripts/build-tokens.mjs from design/tokens/stilet.tokens.json and design/tokens/themes/.',
    ' * Do not edit by hand: change the JSON, then run `npm run tokens`.',
    ' * Every pink on the site must come from --color-brand.',
    ' * <html data-theme="…"> (from the SITE_THEME var) selects a design direction; without it the base applies.',
    ' * data-theme on another element (the UI ThemeRoot) re-themes that subtree.',
    ' */',
    ':root {',
    '  color-scheme: dark;',
  ];
  let group = '';
  for (const t of tokens) {
    if (t.path[0] !== group) {
      group = t.path[0];
      lines.push('', `  /* ${group} */`);
    }
    lines.push(`  --${t.path.join('-')}: ${formatValue(t.value, t.type, known, t.path.join('.'))};`);
  }
  lines.push('}');
  const changed = new Set(themes.flatMap((theme) => collectTokens(theme.tree).map((t) => t.path.join('.'))));
  for (const { name, tree: overrides } of [...themes].sort((a, b) => a.name.localeCompare(b.name))) {
    if (!NAME.test(name)) throw new Error(`Invalid theme name "${name}": use lowercase letters, digits and "-".`);
    const merged = collectTokens(mergeTokens(tree, overrides));
    const mergedKnown = new Set(merged.map((t) => t.path.join('.')));
    lines.push('', `:root[data-theme="${name}"],`, `[data-theme="${name}"] {`);
    for (const t of merged) {
      const key = t.path.join('.');
      if (changed.has(key)) lines.push(`  --${t.path.join('-')}: ${formatValue(t.value, t.type, mergedKnown, `${name}: ${key}`)};`);
    }
    lines.push('}');
  }
  lines.push('');
  return lines.join('\n');
}

// ---- contrast guard (WCAG 2.x) -------------------------------------------------------------

/** Resolves a token to a literal by following plain references ("{color.brand}"); null if not a literal hex. */
export function resolveHex(tokens, ref, seen = new Set()) {
  if (seen.has(ref)) throw new Error(`Circular reference at {${ref}}.`);
  seen.add(ref);
  const t = tokens.find((x) => x.path.join('.') === ref);
  if (!t) throw new Error(`Unknown token {${ref}}.`);
  const v = t.value;
  if (typeof v !== 'string') return null;
  const only = /^\{([a-z0-9][a-z0-9.-]*)\}$/.exec(v.trim());
  if (only) return resolveHex(tokens, only[1], seen);
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v.trim()) ? v.trim() : null;
}

function luminance(hex) {
  let h = hex.slice(1);
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) =>
    c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** Pairs every theme must keep readable: [foreground, background, minimum ratio]. */
export const CONTRAST_PAIRS = [
  ['color.text', 'color.bg', 4.5],
  ['color.text-muted', 'color.bg', 4.5],
  ['color.brand', 'color.bg', 4.5],
  ['color.on-brand', 'color.brand', 4.5],
  ['color.text', 'color.surface', 4.5],
  ['color.text-muted', 'color.surface', 4.5],
];

/** Returns contrast results; pairs whose colors are not literal hex values (e.g. color-mix) are skipped. */
export function checkContrast(tree) {
  const tokens = collectTokens(tree);
  return CONTRAST_PAIRS.map(([fg, bg, min]) => {
    const a = resolveHex(tokens, fg);
    const b = resolveHex(tokens, bg);
    if (!a || !b) return { fg, bg, min, skipped: true };
    const ratio = contrastRatio(a, b);
    return { fg, bg, min, ratio, ok: ratio >= min };
  });
}

// ---- CLI ---------------------------------------------------------------------------------------

/** The themes in design/tokens/themes, as [{ name, tree }] with the unmerged override trees. */
export function loadThemes() {
  return fs
    .readdirSync(THEMES_DIR)
    .filter((f) => f.endsWith('.tokens.json'))
    .sort()
    .map((f) => ({ name: f.replace('.tokens.json', ''), tree: JSON.parse(fs.readFileSync(path.join(THEMES_DIR, f), 'utf8')) }));
}

/** The base tree, or the base merged with one theme (for contrast checks). */
export function loadTree(theme) {
  const base = JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf8'));
  if (!theme) return base;
  const found = loadThemes().find((t) => t.name === theme);
  if (!found) throw new Error(`Theme not found: ${theme}`);
  return mergeTokens(base, found.tree);
}

function main(argv) {
  const check = argv.includes('--check');
  const themes = loadThemes();
  const css = buildCss(loadTree(), { themes });
  let failed = false;
  for (const name of [undefined, ...themes.map((t) => t.name)]) {
    for (const f of checkContrast(loadTree(name)).filter((r) => r.ok === false)) {
      console.error(`${name ?? 'base'}: contrast too low: ${f.fg} on ${f.bg} = ${f.ratio.toFixed(2)}:1 (needs ${f.min}:1)`);
      failed = true;
    }
  }
  if (failed) process.exit(1);

  const rel = path.relative(ROOT, CSS_FILE);
  if (check) {
    const current = fs.existsSync(CSS_FILE) ? fs.readFileSync(CSS_FILE, 'utf8').replaceAll('\r\n', '\n') : '';
    if (current !== css) {
      console.error(`${rel} is out of date. Run \`npm run tokens\` and commit the result.`);
      process.exit(1);
    }
    console.log(`${rel} is up to date.`);
    return;
  }
  fs.writeFileSync(CSS_FILE, css);
  console.log(`Wrote ${rel} (base and ${themes.length} themes).`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main(process.argv.slice(2));
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
}
