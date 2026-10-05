import { describe, expect, it } from 'vitest';
import {
  EXPRESS_LEAD_BUSINESS_DAYS,
  EXPRESS_SURCHARGE_PERCENT,
  MATRICA,
  MOLINO,
  ORDER_CUTOFF_HOUR,
  BUSINESS_TIME_ZONE,
  PLAKAT,
  PRICES,
  PRICES_ARE_PLACEHOLDERS,
  QUANTITY_DISCOUNT_TIERS,
  QUOTE_TYPES,
  QUOTE_TYPE_IDS,
  ROLLUP,
  SERVICE_GROUPS,
  SHIPPING_METHODS,
  SHIPPING_METHOD_IDS,
  SHOP_PRODUCTS,
  SHOP_PRODUCT_IDS,
  STANDARD_LEAD_BUSINESS_DAYS,
  TABLA,
  VASZONKEP,
  VAT_PERCENT,
  VAT_RATE,
  getQuoteType,
  isQuoteBased,
  isShopOrderable,
  type QuoteType,
} from './catalog';

const allItems = SERVICE_GROUPS.flatMap((group) => group.items);

describe('service taxonomy (brief 3)', () => {
  it('has the four groups with their slugs and item counts', () => {
    expect(SERVICE_GROUPS.map((g) => [g.slug, g.name, g.items.length])).toEqual([
      ['foliazas', 'Fóliázás', 4],
      ['ceger-vilagito-reklam', 'Cégér és világító reklám', 5],
      ['nyomtatas', 'Nyomtatás', 7],
      ['rendezveny-egyedi', 'Rendezvény és egyedi', 5],
    ]);
  });

  it('item slugs are unique and URL-safe', () => {
    const slugs = allItems.map((item) => item.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  });

  it('every item is shop-orderable or quote-based, and its references exist', () => {
    for (const item of allItems) {
      expect(isShopOrderable(item) || isQuoteBased(item), item.slug).toBe(true);
      if (item.quoteTypeId) expect(getQuoteType(item.quoteTypeId), item.slug).toBeDefined();
      if (item.shopProductId) expect(SHOP_PRODUCTS[item.shopProductId].serviceItemSlug).toBe(item.slug);
    }
  });

  it('every shop product belongs to exactly one service item in Nyomtatás', () => {
    const printing = SERVICE_GROUPS.find((g) => g.slug === 'nyomtatas');
    for (const id of SHOP_PRODUCT_IDS) {
      const owners = allItems.filter((item) => item.shopProductId === id);
      expect(owners, id).toHaveLength(1);
      expect(printing?.items).toContain(owners[0]);
    }
  });

  it('every quote type is reachable from at least one service item', () => {
    for (const id of QUOTE_TYPE_IDS) {
      expect(allItems.some((item) => item.quoteTypeId === id), id).toBe(true);
    }
  });
});

describe('prices (brief 4.1, placeholders)', () => {
  it('are flagged as placeholders', () => {
    expect(PRICES_ARE_PLACEHOLDERS).toBe(true);
  });

  it('molinó', () => {
    expect(MOLINO.materials.map((m) => [m.id, m.priceNetPerM2])).toEqual([
      ['standard', 3990],
      ['mesh', 4490],
      ['blockout', 6990],
      ['textil', 5490],
    ]);
    expect(MOLINO.edgeFinishes.map((e) => [e.id, e.priceNetPerM])).toEqual([
      ['meretre-vagas', 0],
      ['ringli', 200],
      ['szeges-ringli', 350],
      ['alagut', 600],
    ]);
    expect(MOLINO.minimumNet).toBe(4990);
    expect(MOLINO.size).toEqual({ minCm: 20, maxCm: 500 });
    expect(MOLINO.materials[0]?.grammageGsm).toEqual({ min: 440, max: 510 });
  });

  it('roll-up', () => {
    expect(ROLLUP.formats.map((f) => [f.id, f.widthCm, f.heightCm, f.priceNet])).toEqual([
      ['85x200', 85, 200, 24900],
      ['100x200', 100, 200, 34900],
      ['120x200', 120, 200, 39900],
      ['150x200', 150, 200, 49900],
    ]);
    expect(ROLLUP.graphicOnly.priceNet).toBe(12900);
  });

  it('matrica', () => {
    expect(MATRICA.materials.map((m) => [m.id, m.priceNetPerM2])).toEqual([
      ['monomer', 6990],
      ['polimer', 9990],
      ['one-way-vision', 8990],
    ]);
    expect(MATRICA.areaAddOns.map((a) => [a.id, a.priceNetPerM2])).toEqual([
      ['konturvagas', 2500],
      ['uv-laminalas', 2000],
    ]);
  });

  it('plakát', () => {
    expect(PLAKAT.formats.map((f) => [f.id, f.priceNet])).toEqual([
      ['a3', 990],
      ['a2', 1990],
      ['a1', 3490],
      ['a0', 5990],
      ['b1', 3990],
    ]);
    expect(PLAKAT.formats.find((f) => f.id === 'b1')).toMatchObject({ widthCm: 70, heightCm: 100 });
    expect(PLAKAT.blueback.priceNetPerM2).toBe(2990);
    expect(PLAKAT.paper.grammageGsm).toEqual({ min: 150, max: 150 });
  });

  it('tábla', () => {
    expect(TABLA.materials.map((m) => [m.id, m.thicknessMm, m.priceNetPerM2])).toEqual([
      ['pvc-3mm', 3, 9990],
      ['pvc-5mm', 5, 12990],
      ['dibond-3mm', 3, 19990],
      ['plexi-3mm', 3, 24990],
    ]);
    expect(TABLA.pieceAddOns.map((a) => [a.id, a.priceNet])).toEqual([
      ['furat', 500],
      ['tavtarto', 1990],
    ]);
    expect(TABLA.minBillableM2).toBe(0.1);
  });

  it('vászonkép', () => {
    expect(VASZONKEP.formats.map((f) => [f.id, f.priceNet])).toEqual([
      ['30x40', 7990],
      ['50x70', 13990],
      ['60x90', 17990],
    ]);
    expect(VASZONKEP.custom.priceNetPerM2).toBe(19990);
    expect(VASZONKEP.minimumNet).toBe(6990);
  });

  it('shipping, VAT, discounts, express and lead time', () => {
    expect(SHIPPING_METHODS.map((m) => [m.id, m.priceNet, m.largeParcelPriceNet])).toEqual([
      ['szemelyes', 0, 0],
      ['futar', 2990, 4990],
    ]);
    expect(SHIPPING_METHODS.map((m) => m.id)).toEqual([...SHIPPING_METHOD_IDS]);
    expect(Object.entries(SHOP_PRODUCTS).filter(([, p]) => p.parcel === 'large').map(([id]) => id)).toEqual(['rollup', 'tabla']);
    expect(VAT_PERCENT).toBe(27);
    expect(VAT_RATE).toBe(0.27);
    expect(QUANTITY_DISCOUNT_TIERS.map((t) => [t.minQty, t.pct])).toEqual([
      [1, 0],
      [2, 5],
      [5, 10],
      [10, 15],
    ]);
    expect(EXPRESS_SURCHARGE_PERCENT).toBe(30);
    expect([STANDARD_LEAD_BUSINESS_DAYS, EXPRESS_LEAD_BUSINESS_DAYS, ORDER_CUTOFF_HOUR]).toEqual([3, 1, 12]);
    expect(BUSINESS_TIME_ZONE).toBe('Europe/Budapest');
  });

  it('every price in the catalog is a non-negative whole forint amount', () => {
    const walk = (value: unknown): number[] =>
      typeof value === 'number' ? [value] : typeof value === 'object' && value ? Object.values(value).flatMap(walk) : [];
    for (const price of walk(PRICES)) expect(Number.isInteger(price) && price >= 0).toBe(true);
  });
});

describe('shop products', () => {
  it('SHOP_PRODUCT_IDS lists every product once, ids match their keys', () => {
    expect([...SHOP_PRODUCT_IDS].sort()).toEqual(Object.keys(SHOP_PRODUCTS).sort());
    for (const [key, product] of Object.entries(SHOP_PRODUCTS)) expect(product.id).toBe(key);
  });

  it('material and option ids are unique per product', () => {
    const lists = [MOLINO.materials, MOLINO.edgeFinishes, MATRICA.materials, MATRICA.areaAddOns, TABLA.materials, TABLA.pieceAddOns];
    for (const list of lists) {
      const ids = list.map((entry) => entry.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('lifespans are always marked as estimates', () => {
    const materials = [...MOLINO.materials, ...MATRICA.materials, ...TABLA.materials];
    for (const material of materials) {
      if (material.lifespan) {
        expect(material.lifespan.isEstimate).toBe(true);
        expect(material.lifespan.minYears).toBeLessThanOrEqual(material.lifespan.maxYears);
      }
    }
  });
});

describe('quote types (brief 4.2)', () => {
  it('has the nine wizard types in the brief order', () => {
    expect(QUOTE_TYPES.map((t) => t.id)).toEqual([...QUOTE_TYPE_IDS]);
    expect(QUOTE_TYPES.map((t) => t.name)).toEqual([
      'Autófóliázás, flotta-dekor',
      'Kirakat- és üvegfóliázás',
      'Cégér, reklámtábla',
      'Világító és plasztik betűk, logók',
      'LED-fal',
      'Rendezvény díszlet, fotófal',
      'Kínálópult fóliázás és telepítés',
      '3D nyomtatás',
      'Egyéb arculati megoldás',
    ]);
  });

  it('field definitions are internally consistent', () => {
    for (const type of QUOTE_TYPES as readonly QuoteType[]) {
      const ids = type.fields.map((f) => f.id);
      expect(new Set(ids).size, type.id).toBe(ids.length);
      for (const field of type.fields) {
        if (field.type === 'select' || field.type === 'multiselect') {
          expect(field.options.length, field.id).toBeGreaterThan(1);
          const values = field.options.map((o) => o.value);
          expect(new Set(values).size, field.id).toBe(values.length);
        }
        if (field.type === 'number') expect(field.min, field.id).toBeLessThan(field.max);
        if (field.type === 'file') expect(field.accept.length, field.id).toBeGreaterThan(0);
        if (field.visibleWhen) {
          const controller = type.fields.find((f) => f.id === field.visibleWhen?.field);
          expect(controller?.type, field.id).toBe('select');
          if (controller?.type === 'select') {
            for (const value of field.visibleWhen.equals) {
              expect(controller.options.map((o) => o.value)).toContain(value);
            }
          }
        }
      }
      for (const group of type.requireOneOf ?? []) {
        for (const id of group.fields) {
          const field = type.fields.find((f) => f.id === id);
          expect(field, `${type.id}.${id}`).toBeDefined();
          expect(field?.required, `${type.id}.${id}`).toBe(false);
        }
      }
    }
  });

  it('asks what the brief lists', () => {
    const fieldIds = (id: string) => getQuoteType(id)?.fields.map((f) => f.id);
    expect(fieldIds('autofoliazas')).toEqual(['jarmuTipus', 'darabszam', 'terjedelem', 'jarmuFotok', 'grafika', 'grafikaFajlok']);
    expect(fieldIds('3d-nyomtatas')).toEqual(['modellFajl', 'leiras', 'anyag', 'meret', 'darabszam']);
    expect(getQuoteType('3d-nyomtatas')?.fields[0]).toMatchObject({ type: 'file', accept: ['.stl', '.obj', '.3mf'] });
    expect(getQuoteType('led-fal')?.fields.find((f) => f.id === 'rendezvenyDatuma')).toMatchObject({
      type: 'date',
      visibleWhen: { field: 'konstrukcio', equals: ['berles'] },
    });
  });

  it('only 3D printing and "egyéb" work without an on-site address', () => {
    expect(QUOTE_TYPES.filter((t) => !t.locationRequired).map((t) => t.id)).toEqual(['3d-nyomtatas', 'egyeb']);
  });

  it('getQuoteType returns undefined for unknown ids', () => {
    expect(getQuoteType('nincs-ilyen')).toBeUndefined();
  });
});
