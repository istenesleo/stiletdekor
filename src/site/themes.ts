// The design directions the site can run as: A and B (decision of 2026-10-06: keep both for now, one dev site
// each) and C, the synthesis from Claude Design (2026-10-08), for the final choice. The name matches design/tokens/themes/<name>.tokens.json and the data-theme selector in tokens.css.
import galeria from '../../design/tokens/themes/galeria-editorial.tokens.json';
import merolap from '../../design/tokens/themes/merolap.tokens.json';
import neon from '../../design/tokens/themes/neon-muhely.tokens.json';

export interface SiteTheme {
  readonly id: 'neon-muhely' | 'galeria-editorial' | 'merolap';
  /** How the dev site and the docs refer to the direction. */
  readonly label: string;
  /** Google Fonts stylesheet with the direction's typefaces. */
  readonly fontsHref: string;
}

const FONTS_KEY = 'hu.stiletdekor.fonts';

export const SITE_THEMES: readonly SiteTheme[] = [
  { id: 'neon-muhely', label: 'A · Neon műhely', fontsHref: neon.$extensions[FONTS_KEY] },
  { id: 'galeria-editorial', label: 'B · Galéria / editorial', fontsHref: galeria.$extensions[FONTS_KEY] },
  { id: 'merolap', label: 'C · Mérőlap', fontsHref: merolap.$extensions[FONTS_KEY] },
];

export type SiteThemeId = SiteTheme['id'];

/** The theme a SITE_THEME value names; the first direction when it is missing or unknown. */
export function siteThemeOf(value: unknown): SiteTheme {
  const found = SITE_THEMES.find((theme) => theme.id === value);
  if (found) return found;
  const [fallback] = SITE_THEMES;
  if (!fallback) throw new Error('No site themes defined');
  return fallback;
}
