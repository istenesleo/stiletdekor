import { describe, expect, it } from 'vitest';
import { QUOTE_TYPE_IDS, SERVICE_GROUPS, SHOP_PRODUCT_IDS } from '@/domain/catalog';
import { PIKTOGRAM_CSOPORT, PIKTOGRAM_MUNKA, PIKTOGRAM_TERMEK } from './piktogramok';

const ALL = [...Object.values(PIKTOGRAM_CSOPORT), ...Object.values(PIKTOGRAM_MUNKA), ...Object.values(PIKTOGRAM_TERMEK)];

describe('the pictogram family', () => {
  it('covers every service group, quote type and shop product', () => {
    expect(Object.keys(PIKTOGRAM_CSOPORT).sort()).toEqual(SERVICE_GROUPS.map((g) => g.slug).sort());
    expect(Object.keys(PIKTOGRAM_MUNKA).sort()).toEqual([...QUOTE_TYPE_IDS].sort());
    expect(Object.keys(PIKTOGRAM_TERMEK).sort()).toEqual([...SHOP_PRODUCT_IDS].sort());
  });

  it('uses only basic shapes, styled by CSS rather than attributes', () => {
    for (const markup of ALL) {
      const tags = [...markup.matchAll(/<([a-z]+)/g)].map((m) => m[1]);
      expect(tags.length).toBeGreaterThan(0);
      for (const tag of tags) expect(['path', 'rect', 'circle', 'line', 'polyline']).toContain(tag);
      expect(markup).not.toMatch(/\s(fill|stroke|style)=/);
    }
  });

  it('has a fillable shape in every pictogram, so the filled style differs', () => {
    for (const markup of ALL) expect(markup).toContain('class="f"');
  });
});
