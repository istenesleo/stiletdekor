// The webshop's catalog data for its pages: the product tiles with their lowest gross price, and each product's price
// table. Prices become gross here, as everywhere on the site.
import { MATRICA, MOLINO, PLAKAT, ROLLUP, SHOP_PRODUCT_IDS, SHOP_PRODUCTS, type ShopProductId, TABLA, VASZONKEP } from '@/domain/catalog';
import { formatHuf } from '@/domain/money';
import { grossOf } from '@/domain/pricing';
import type { ProductKind } from '@/ui/CategoryTile/CategoryTile';

/** The pictogram of each product (the canvas is "vaszon" there). */
export const PRODUCT_KIND: Readonly<Record<ShopProductId, ProductKind>> = {
  molino: 'molino',
  rollup: 'rollup',
  matrica: 'matrica',
  plakat: 'plakat',
  tabla: 'tabla',
  vaszonkep: 'vaszon',
};

export const productHref = (id: ShopProductId): string => `/webshop/${id}`;

export interface ProductTile {
  id: ShopProductId;
  name: string;
  description: string;
  /** Lowest gross price ("-tól"). */
  price: number;
  unit: 'm2' | 'db';
  product: ProductKind;
  href: string;
}

const lowest = (netPrices: readonly number[]) => grossOf(Math.min(...netPrices));

export function productTiles(): ProductTile[] {
  const from: Record<ShopProductId, { price: number; unit: 'm2' | 'db' }> = {
    molino: { price: lowest(MOLINO.materials.map((m) => m.priceNetPerM2)), unit: 'm2' },
    rollup: { price: lowest(ROLLUP.formats.map((f) => f.priceNet)), unit: 'db' },
    matrica: { price: lowest(MATRICA.materials.map((m) => m.priceNetPerM2)), unit: 'm2' },
    plakat: { price: lowest(PLAKAT.formats.map((f) => f.priceNet)), unit: 'db' },
    tabla: { price: lowest(TABLA.materials.map((m) => m.priceNetPerM2)), unit: 'm2' },
    vaszonkep: { price: lowest(VASZONKEP.formats.map((f) => f.priceNet)), unit: 'db' },
  };
  return SHOP_PRODUCT_IDS.map((id) => ({
    id,
    name: SHOP_PRODUCTS[id].name,
    description: SHOP_PRODUCTS[id].shortDescription,
    ...from[id],
    product: PRODUCT_KIND[id],
    href: productHref(id),
  }));
}

export interface PriceTableRow {
  label: string;
  price: string;
}

const perM2 = (net: number) => `${formatHuf(grossOf(net))}/m²`;
const each = (net: number) => formatHuf(grossOf(net));
const extra = (net: number, unit: string) => (net === 0 ? 'felár nélkül' : `+${formatHuf(grossOf(net))}/${unit}`);

/** The product's prices for its page: materials, formats and options, gross. */
export function productPriceTable(id: ShopProductId): PriceTableRow[] {
  switch (id) {
    case 'molino':
      return [
        ...MOLINO.materials.map((m) => ({ label: m.name, price: perM2(m.priceNetPerM2) })),
        ...MOLINO.edgeFinishes.map((e) => ({ label: `Szélkidolgozás: ${e.name}`, price: extra(e.priceNetPerM, 'fm') })),
        { label: 'Legkisebb tételár', price: each(MOLINO.minimumNet) },
      ];
    case 'rollup':
      return [
        ...ROLLUP.formats.map((f) => ({ label: f.name, price: each(f.priceNet) })),
        { label: ROLLUP.graphicOnly.name, price: each(ROLLUP.graphicOnly.priceNet) },
      ];
    case 'matrica':
      return [
        ...MATRICA.materials.map((m) => ({ label: m.name, price: perM2(m.priceNetPerM2) })),
        ...MATRICA.areaAddOns.map((a) => ({ label: a.name, price: extra(a.priceNetPerM2, 'm²') })),
      ];
    case 'plakat':
      return [
        ...PLAKAT.formats.map((f) => ({ label: `${f.name}, matt vagy fényes`, price: each(f.priceNet) })),
        { label: PLAKAT.blueback.name, price: perM2(PLAKAT.blueback.priceNetPerM2) },
      ];
    case 'tabla':
      return [
        ...TABLA.materials.map((m) => ({ label: m.name, price: perM2(m.priceNetPerM2) })),
        ...TABLA.pieceAddOns.map((a) => ({ label: a.name, price: extra(a.priceNet, a.unit) })),
        { label: 'Legkisebb számlázott terület', price: '0,1 m²' },
      ];
    case 'vaszonkep':
      return [
        ...VASZONKEP.formats.map((f) => ({ label: f.name, price: each(f.priceNet) })),
        { label: VASZONKEP.custom.name, price: perM2(VASZONKEP.custom.priceNetPerM2) },
        { label: 'Egyedi méret legkisebb ára', price: each(VASZONKEP.minimumNet) },
      ];
  }
}
