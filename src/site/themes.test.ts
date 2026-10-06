import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SITE_THEMES, siteThemeOf } from './themes';

describe('site themes', () => {
  it('match the token themes and the selectors in tokens.css', () => {
    const files = fs.readdirSync('design/tokens/themes').map((f) => f.replace('.tokens.json', ''));
    expect(SITE_THEMES.map((t) => t.id).sort()).toEqual(files.sort());
    const css = fs.readFileSync('src/styles/tokens.css', 'utf8');
    for (const theme of SITE_THEMES) {
      expect(css).toContain(`:root[data-theme="${theme.id}"]`);
      expect(theme.fontsHref).toMatch(/^https:\/\/fonts\.googleapis\.com\/css2\?/);
    }
  });

  it('falls back to direction A for a missing or unknown SITE_THEME', () => {
    expect(siteThemeOf('galeria-editorial').id).toBe('galeria-editorial');
    expect(siteThemeOf(undefined).id).toBe('neon-muhely');
    expect(siteThemeOf('pink').id).toBe('neon-muhely');
  });
});
