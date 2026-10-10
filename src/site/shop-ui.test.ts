import { describe, expect, it } from 'vitest';
import { formatHuf } from '@/domain/money';
import { productPriceTable, productTiles } from './shop-ui';

describe('productTiles', () => {
  it('lists the six products with their lowest gross price and their page', () => {
    const tiles = productTiles();
    expect(tiles.map((t) => t.id)).toEqual(['molino', 'rollup', 'matrica', 'plakat', 'tabla', 'vaszonkep']);
    expect(tiles[0]).toMatchObject({ name: 'Molinó', price: 5067, unit: 'm2', product: 'molino', href: '/webshop/molino' });
    expect(tiles[1]).toMatchObject({ price: 31623, unit: 'db' });
    expect(tiles[5]).toMatchObject({ product: 'vaszon', href: '/webshop/vaszonkep' });
  });
});

describe('productPriceTable', () => {
  it('prices the options gross, per the unit they are sold in', () => {
    const molino = productPriceTable('molino');
    expect(molino[0]).toEqual({ label: 'Standard frontlit molinó', price: `${formatHuf(5067)}/m²` });
    expect(molino).toContainEqual({ label: 'Szélkidolgozás: Méretre vágás', price: 'felár nélkül' });
    expect(productPriceTable('plakat').at(-1)).toEqual({ label: 'Blueback (utcai plakát)', price: `${formatHuf(3797)}/m²` });
    expect(productPriceTable('tabla')).toContainEqual({ label: 'Furatolás', price: `+${formatHuf(635)}/db` });
  });
});
