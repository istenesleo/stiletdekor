import { describe, expect, it } from 'vitest';
import { BACKUP_TITLE_PREFIX, designPreviewHtml } from './design-preview';
import { siteThemeOf } from './themes';

describe('design preview', () => {
  it.each([
    ['neon-muhely', 'Stilet Neon Műhely'],
    ['galeria-editorial', 'Stilet Galéria Editorial'],
  ])('%s: a full noindex document with the direction mockup', (id, title) => {
    const html = designPreviewHtml(siteThemeOf(id));
    expect(html.startsWith('<!doctype html>\n<html lang="hu">')).toBe(true);
    expect(html).toContain('<meta name="viewport" content="width=device-width, initial-scale=1">');
    expect(html).toContain('<meta name="robots" content="noindex, nofollow">');
    expect(html).toContain(`<title>${title}</title>`);
  });

  it.each([
    ['neon-muhely', 'Stilet Neon Műhely'],
    ['galeria-editorial', 'Stilet Galéria Editorial'],
  ])('%s: the backup is the same kind of document, its tab title marked', (id, title) => {
    const html = designPreviewHtml(siteThemeOf(id), 'backup');
    expect(html.startsWith('<!doctype html>\n<html lang="hu">')).toBe(true);
    expect(html).toContain('<meta name="robots" content="noindex, nofollow">');
    expect(html).toContain(`<title>${BACKUP_TITLE_PREFIX}${title}</title>`);
    expect(html.match(/<title>/g)).toHaveLength(1);
  });
});
