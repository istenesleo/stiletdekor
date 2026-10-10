import { describe, expect, it } from 'vitest';
import { SHOP_PRODUCT_IDS } from '@/domain/catalog';
import { defaultDraft, draftFromConfig, draftIssues, draftToConfig, hasFreeSize, sizeText } from './draft';

describe('the configurator draft', () => {
  it('starts every product with a valid configuration that survives the round trip', () => {
    for (const id of SHOP_PRODUCT_IDS) {
      const draft = defaultDraft(id);
      expect(draftIssues(draft)).toEqual({});
      expect(draftFromConfig(draftToConfig(draft))).toEqual(draft);
    }
  });

  it('reads the sizes the way people type them', () => {
    expect(draftToConfig({ ...defaultDraft('molino'), width: '120,5', height: ' 80 ' })).toMatchObject({ widthCm: 120.5, heightCm: 80 });
    expect(sizeText(29.7)).toBe('29,7');
  });

  it('names the wrong fields with the catalog messages', () => {
    expect(draftIssues({ ...defaultDraft('molino'), width: '600', height: '' })).toEqual({
      widthCm: 'A szélesség 20 és 500 cm között lehet.',
      heightCm: 'Adja meg a magasságot centiméterben.',
    });
    expect(draftIssues({ ...defaultDraft('tabla'), furat: 99 })).toHaveProperty(['addOnCounts.furat']);
  });

  it('types the size only for free-size products and formats', () => {
    const blueback = { ...defaultDraft('plakat'), formatId: 'blueback', width: '300', height: '200' };
    expect(draftToConfig(blueback)).toEqual({ productId: 'plakat', formatId: 'blueback', widthCm: 300, heightCm: 200, quantity: 1, express: false });
    expect(hasFreeSize(blueback)).toBe(true);
    expect(hasFreeSize(defaultDraft('plakat'))).toBe(false);
    expect(hasFreeSize({ ...defaultDraft('vaszonkep'), formatId: 'egyedi' })).toBe(true);
    expect(hasFreeSize(defaultDraft('molino'))).toBe(true);
    expect(hasFreeSize(defaultDraft('rollup'))).toBe(false);
  });
});
