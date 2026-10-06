import { describe, expect, it } from 'vitest';
import { MATRICA, MOLINO, TABLA } from '@/domain/catalog';
import { grossOf } from '@/domain/pricing';
import { materialOption, materialSpecs } from './catalog-ui';

describe('materialOption', () => {
  it('turns a catalog material into a card with its gross price and data sheet', () => {
    const standard = MOLINO.materials.find((m) => m.id === 'standard')!;
    expect(materialOption(standard)).toEqual({
      id: 'standard',
      name: 'Standard frontlit molinó',
      price: grossOf(standard.priceNetPerM2),
      unit: 'm2',
      texture: 'frontlit',
      specs: [
        ['Súly', '440–510\u00a0g/m²'],
        ['Felhasználás', 'kül- és beltér'],
        ['Élettartam', '≈\u00a01–3\u00a0év kültéren*'],
      ],
    });
  });

  it('gives every shop material a swatch', () => {
    for (const m of [...MOLINO.materials, ...MATRICA.materials, ...TABLA.materials]) {
      expect(materialOption(m).texture, m.id).toBeDefined();
    }
  });

  it('prints thickness and indoor-only use for boards', () => {
    expect(materialSpecs(TABLA.materials.find((m) => m.id === 'pvc-3mm')!)).toEqual([
      ['Vastagság', '3\u00a0mm'],
      ['Felhasználás', 'beltér'],
    ]);
  });
});
