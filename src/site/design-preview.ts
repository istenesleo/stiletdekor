// Until the real home page is built, each dev site shows its direction's mockup on "/", so both directions
// can be reviewed on a shareable URL. Never used in production (see src/pages/index.astro).
import galeria from '../../design/mockups/b-galeria-editorial.html?raw';
import neon from '../../design/mockups/a-neon-muhely.html?raw';
import type { SiteTheme, SiteThemeId } from './themes';

const MOCKUPS: Readonly<Record<SiteThemeId, string>> = {
  'neon-muhely': neon,
  'galeria-editorial': galeria,
};

/**
 * The mockup as a full document. The mockup files start at <title> (Artifacts add the doctype and head),
 * so the doctype, charset, viewport and noindex are added here. Each mockup names its direction itself
 * (title, footer, designer notes).
 */
export function designPreviewHtml(theme: SiteTheme): string {
  return [
    '<!doctype html>',
    '<html lang="hu">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<meta name="robots" content="noindex, nofollow">',
    MOCKUPS[theme.id],
  ].join('\n');
}
