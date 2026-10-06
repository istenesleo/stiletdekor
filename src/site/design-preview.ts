// Until the real home page is built, each dev site shows its direction's mockup on "/", so both directions
// can be reviewed on a shareable URL. Never used in production (see src/pages/index.astro).
import galeria from '../../design/mockups/b-galeria-editorial.html?raw';
import neon from '../../design/mockups/a-neon-muhely.html?raw';
import galeriaBackup from '../../design/mockups/mentes/2026-10-06-hosszu-szoveg/b-galeria-editorial.html?raw';
import neonBackup from '../../design/mockups/mentes/2026-10-06-hosszu-szoveg/a-neon-muhely.html?raw';
import type { SiteTheme, SiteThemeId } from './themes';

/**
 * Which mockup to show: the current one, or the backup taken before the home page text was shortened
 * (2026-10-06), served on /mentes so the two can be compared.
 */
export type DesignPreviewVersion = 'current' | 'backup';

const MOCKUPS: Readonly<Record<DesignPreviewVersion, Readonly<Record<SiteThemeId, string>>>> = {
  current: { 'neon-muhely': neon, 'galeria-editorial': galeria },
  backup: { 'neon-muhely': neonBackup, 'galeria-editorial': galeriaBackup },
};

/** Prefixed to the backup's <title>, so the browser tab shows which version is open. */
export const BACKUP_TITLE_PREFIX = 'Mentés, 2026-10-06 · ';

/**
 * The mockup as a full document. The mockup files start at <title> (Artifacts add the doctype and head),
 * so the doctype, charset, viewport and noindex are added here. Each mockup names its direction itself
 * (title, footer, designer notes).
 */
export function designPreviewHtml(theme: SiteTheme, version: DesignPreviewVersion = 'current'): string {
  const mockup = MOCKUPS[version][theme.id];
  return [
    '<!doctype html>',
    '<html lang="hu">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<meta name="robots" content="noindex, nofollow">',
    version === 'backup' ? mockup.replace('<title>', `<title>${BACKUP_TITLE_PREFIX}`) : mockup,
  ].join('\n');
}
