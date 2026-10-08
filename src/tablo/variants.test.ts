import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { LANES, VARIANT_GROUPS, VARIANTS, finishedVariantByPage, variantsOf } from './variants';

describe('the /tablo variants', () => {
  it('have unique ids and unique files', () => {
    expect(new Set(VARIANTS.map((v) => v.id)).size).toBe(VARIANTS.length);
    expect(new Set(VARIANTS.map((v) => v.file)).size).toBe(VARIANTS.length);
  });

  it('match the spec: 34 variants; at least 3 token-based and 1 experimental per element group', () => {
    expect(VARIANTS).toHaveLength(34);
    const counts = Object.fromEntries(VARIANT_GROUPS.map((g) => [g.id, VARIANTS.filter((v) => v.group === g.id).length]));
    expect(counts).toEqual({ irany: 6, hero: 6, szolgaltatas: 5, folyamat: 5, referencia: 6, grafika: 6 });
    for (const g of VARIANT_GROUPS.filter((x) => x.id !== 'irany')) {
      expect(variantsOf(g.id, 'tokenes').length, g.id).toBeGreaterThanOrEqual(3);
      expect(variantsOf(g.id, 'kiserleti').length, g.id).toBeGreaterThanOrEqual(1);
    }
    expect(variantsOf('irany', 'tokenes')).toEqual([]);
    expect(variantsOf('irany', 'kiserleti').map((v) => v.id)).toEqual(['X1', 'X2', 'X3', 'X4', 'X5', 'X6']);
  });

  it('say which rule an experiment breaks, and only experiments do', () => {
    for (const v of VARIANTS) {
      if (v.lane === 'kiserleti') {
        expect(v.breaks, v.id).toBeTruthy();
        expect(v.round, v.id).toBe(v.group === 'irany' ? 6 : 5);
      } else {
        expect(v.breaks, v.id).toBeUndefined();
        expect(v.tokenProposals, v.id).toBeUndefined();
      }
    }
  });

  it('keep each file in its group folder', () => {
    for (const v of VARIANTS) expect(v.file, v.id).toMatch(new RegExp(`^${v.group}/[A-Z][A-Za-z0-9]*\\.astro$`));
  });

  it('have a component for every finished variant, listed in Variant.astro', () => {
    const variantAstro = fs.readFileSync('src/tablo/Variant.astro', 'utf8');
    for (const v of VARIANTS.filter((x) => x.status === 'kesz')) {
      expect(fs.existsSync(`src/tablo/${v.file}`), v.file).toBe(true);
      expect(variantAstro, v.id).toContain(`id === '${v.id}'`);
    }
  });

  it('lists lanes token-based first and keeps the list order within a lane', () => {
    expect(LANES).toEqual(['tokenes', 'kiserleti']);
    expect(variantsOf('grafika', 'tokenes').map((v) => v.id)).toEqual(['G1', 'G2', 'G3', 'G4']);
  });

  it('give every full direction, and only those, its own page', () => {
    expect(VARIANTS.filter((v) => v.page).map((v) => [v.id, v.page])).toEqual([
      ['X1', 'x1'],
      ['X2', 'x2'],
      ['X3', 'x3'],
      ['X4', 'x4'],
      ['X5', 'x5'],
      ['X6', 'x6'],
    ]);
    expect(VARIANTS.filter((v) => v.page).every((v) => v.group === 'irany')).toBe(true);
  });

  it('find a finished full direction by its page, and nothing else', () => {
    expect(finishedVariantByPage(undefined)).toBeUndefined();
    expect(finishedVariantByPage('nincs-ilyen')).toBeUndefined();
    for (const v of VARIANTS.filter((x) => x.page)) {
      expect(finishedVariantByPage(v.page), v.id).toBe(v.status === 'kesz' ? v : undefined);
    }
  });
});
