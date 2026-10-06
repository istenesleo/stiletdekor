// Price calculation for shop configurations and carts. All amounts are integer net/gross HUF.
//
// Order of operations for one configuration (priceConfiguration):
//   1. Per-piece lines: area × rate per m², perimeter × edge rate per running metre,
//      per-m² add-ons × area, per-piece add-ons × count, or the fixed format price.
//      Sizes are taken in whole millimetres; EACH LINE is rounded to whole forints (half up), and
//      the per-piece base is the sum of the rounded lines, so the itemised breakdown always adds up.
//   2. Per-item minimum: if the base is below the product's minimum, a top-up line is added and
//      the piece price becomes the minimum (minimumApplied). → itemNet
//   3. subtotal = itemNet × quantity.
//   4. Quantity discount: discountNet = round(subtotal × tier% / 100); discounted = subtotal − discountNet.
//   5. Express: surcharge = round(discounted × 30 / 100) on the DISCOUNTED net.
//   6. netTotal = discounted + surcharge; vatTotal = round(netTotal × 27 / 100); gross = net + VAT.
//
// Cart (priceCart): every item is priced as above; shipping is a separate net line with its own VAT.
// Cart VAT is the sum of the item and shipping VAT amounts (invoice-line style), so the cart gross
// always equals the sum of the gross amounts the customer sees per line. Installation has no list
// price: it counts as 0 in the totals and is flagged priceOnRequest; the workshop adds it on confirmation.

import {
  EXPRESS_SURCHARGE_PERCENT,
  MATRICA,
  MAX_QUANTITY,
  MOLINO,
  PLAKAT,
  QUANTITY_DISCOUNT_TIERS,
  ROLLUP,
  SHIPPING_METHODS,
  SHOP_PRODUCTS,
  TABLA,
  VASZONKEP,
  VAT_PERCENT,
  isShopProductId,
  type DiscountTier,
  type MatricaAddOnId,
  type MatricaMaterialId,
  type MolinoEdgeFinishId,
  type MolinoMaterialId,
  type Orientation,
  type PaperFinishId,
  type PlakatFormatId,
  type RollupFormatId,
  type ShippingMethodId,
  type ShopProductId,
  type TablaAddOnId,
  type TablaMaterialId,
  type VaszonkepFormatId,
} from './catalog';
import { formatNumberHu, percentOf, roundHuf } from './money';

// ─── Configuration types ─────────────────────────────────────────────────────────────────────────

interface ConfigCommon {
  /** Number of identical pieces, 1..MAX_QUANTITY. */
  quantity: number;
  express: boolean;
}

export interface MolinoConfig extends ConfigCommon {
  productId: 'molino';
  materialId: MolinoMaterialId;
  edgeFinishId: MolinoEdgeFinishId;
  widthCm: number;
  heightCm: number;
}

export interface RollupConfig extends ConfigCommon {
  productId: 'rollup';
  formatId: RollupFormatId;
  /** Replacement graphic for an existing stand: flat price whatever the format. */
  graphicOnly: boolean;
}

export interface MatricaConfig extends ConfigCommon {
  productId: 'matrica';
  materialId: MatricaMaterialId;
  widthCm: number;
  heightCm: number;
  addOnIds: MatricaAddOnId[];
}

export interface PlakatFormatConfig extends ConfigCommon {
  productId: 'plakat';
  formatId: PlakatFormatId;
  paperFinish: PaperFinishId;
  orientation: Orientation;
}

export interface PlakatBluebackConfig extends ConfigCommon {
  productId: 'plakat';
  formatId: 'blueback';
  widthCm: number;
  heightCm: number;
}

export interface PlakatCustomConfig extends ConfigCommon {
  productId: 'plakat';
  formatId: 'egyedi';
  paperFinish: PaperFinishId;
  widthCm: number;
  heightCm: number;
}

export type PlakatConfig = PlakatFormatConfig | PlakatBluebackConfig | PlakatCustomConfig;

export interface TablaConfig extends ConfigCommon {
  productId: 'tabla';
  materialId: TablaMaterialId;
  widthCm: number;
  heightCm: number;
  addOnCounts: Record<TablaAddOnId, number>;
}

export interface VaszonkepFormatConfig extends ConfigCommon {
  productId: 'vaszonkep';
  formatId: VaszonkepFormatId;
  orientation: Orientation;
}

export interface VaszonkepCustomConfig extends ConfigCommon {
  productId: 'vaszonkep';
  formatId: 'egyedi';
  widthCm: number;
  heightCm: number;
}

export type VaszonkepConfig = VaszonkepFormatConfig | VaszonkepCustomConfig;

export type ProductConfig = MolinoConfig | RollupConfig | MatricaConfig | PlakatConfig | TablaConfig | VaszonkepConfig;

// ─── Result types ────────────────────────────────────────────────────────────────────────────────

export interface PriceLine {
  label: string;
  /** m², running metres (fm) or pieces, per ONE piece of the configuration. */
  quantity: number;
  unit: string;
  unitPriceNet: number;
  amountNet: number;
}

export interface DiscountHint {
  /** Pieces to add to reach the next tier. */
  additionalQty: number;
  pct: number;
}

export interface ConfigurationPrice {
  productId: ShopProductId;
  /** Breakdown of ONE piece; sums to itemNet (includes the minimum top-up line, if any). */
  lines: PriceLine[];
  /** One piece incl. options, after the minimum. */
  itemNet: number;
  minimumNet: number | null;
  minimumApplied: boolean;
  quantity: number;
  /** itemNet × quantity. */
  subtotalNet: number;
  discountPct: number;
  discountNet: number;
  express: boolean;
  expressSurchargeNet: number;
  netTotal: number;
  vatTotal: number;
  grossTotal: number;
  nextDiscountHint: DiscountHint | null;
}

export interface ShippingPrice {
  methodId: ShippingMethodId;
  name: string;
  largeParcel: boolean;
  /** True for installation: no list price, net/vat/gross are 0 until the workshop quotes it. */
  priceOnRequest: boolean;
  net: number;
  vat: number;
  gross: number;
}

export interface CartPrice {
  items: ConfigurationPrice[];
  itemsNet: number;
  shipping: ShippingPrice;
  netTotal: number;
  vatTotal: number;
  grossTotal: number;
}

export interface ConfigIssue {
  path: (string | number)[];
  message: string;
}

export class ConfigurationError extends Error {
  readonly issues: readonly ConfigIssue[];

  constructor(issues: readonly ConfigIssue[]) {
    super(issues.map((issue) => issue.message).join(' '));
    this.name = 'ConfigurationError';
    this.issues = issues;
  }
}

// ─── Validation ──────────────────────────────────────────────────────────────────────────────────

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const findById = <T extends { readonly id: string }>(list: readonly T[], id: unknown): T | undefined =>
  typeof id === 'string' ? list.find((entry) => entry.id === id) : undefined;

const MM_TOLERANCE = 1e-6;

function checkSide(
  issues: ConfigIssue[],
  field: 'widthCm' | 'heightCm',
  value: unknown,
  limits: { readonly minCm: number; readonly maxCm: number },
): void {
  const [name, accusative] = field === 'widthCm' ? ['szélesség', 'szélességet'] : ['magasság', 'magasságot'];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    issues.push({ path: [field], message: `Adja meg a ${accusative} centiméterben.` });
    return;
  }
  if (value < limits.minCm || value > limits.maxCm) {
    const range = `${formatNumberHu(limits.minCm, 1)} és ${formatNumberHu(limits.maxCm, 1)} cm`;
    issues.push({ path: [field], message: `A ${name} ${range} között lehet.` });
    return;
  }
  if (Math.abs(value * 10 - Math.round(value * 10)) > MM_TOLERANCE) {
    issues.push({ path: [field], message: `A ${name} legfeljebb milliméter pontosságú lehet (egy tizedesjegy).` });
  }
}

function checkQuantity(issues: ConfigIssue[], value: unknown): void {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    issues.push({ path: ['quantity'], message: 'Adja meg a darabszámot.' });
  } else if (!Number.isInteger(value)) {
    issues.push({ path: ['quantity'], message: 'A darabszám csak egész szám lehet.' });
  } else if (value < 1 || value > MAX_QUANTITY) {
    issues.push({ path: ['quantity'], message: `A darabszám 1 és ${MAX_QUANTITY} között lehet.` });
  }
}

function checkOrientation(issues: ConfigIssue[], value: unknown): void {
  if (value !== 'allo' && value !== 'fekvo') issues.push({ path: ['orientation'], message: 'Válasszon tájolást.' });
}

/**
 * Checks a configuration against the catalog: known product and options, sizes, counts, quantity.
 * Returns Hungarian, user-facing issues; an empty array means the configuration can be priced.
 * Defensive on purpose: input may come straight from a client.
 */
export function validateConfiguration(config: ProductConfig): ConfigIssue[] {
  const c: unknown = config;
  if (!isRecord(c) || !isShopProductId(c.productId)) {
    return [{ path: ['productId'], message: 'Ismeretlen termék.' }];
  }
  const issues: ConfigIssue[] = [];
  checkQuantity(issues, c.quantity);
  if (typeof c.express !== 'boolean') {
    issues.push({ path: ['express'], message: 'Adja meg, kér-e expressz gyártást.' });
  }

  switch (c.productId) {
    case 'molino':
      if (!findById(MOLINO.materials, c.materialId)) issues.push({ path: ['materialId'], message: 'Válasszon anyagot.' });
      if (!findById(MOLINO.edgeFinishes, c.edgeFinishId)) {
        issues.push({ path: ['edgeFinishId'], message: 'Válasszon szélkidolgozást.' });
      }
      checkSide(issues, 'widthCm', c.widthCm, MOLINO.size);
      checkSide(issues, 'heightCm', c.heightCm, MOLINO.size);
      break;

    case 'rollup':
      if (!findById(ROLLUP.formats, c.formatId)) issues.push({ path: ['formatId'], message: 'Válasszon méretet.' });
      if (typeof c.graphicOnly !== 'boolean') {
        issues.push({ path: ['graphicOnly'], message: 'Adja meg, hogy teljes roll-upot vagy csak cseregrafikát kér.' });
      }
      break;

    case 'matrica': {
      if (!findById(MATRICA.materials, c.materialId)) issues.push({ path: ['materialId'], message: 'Válasszon anyagot.' });
      checkSide(issues, 'widthCm', c.widthCm, MATRICA.size);
      checkSide(issues, 'heightCm', c.heightCm, MATRICA.size);
      const addOns = c.addOnIds;
      if (!Array.isArray(addOns)) {
        issues.push({ path: ['addOnIds'], message: 'Érvénytelen opciólista.' });
      } else {
        addOns.forEach((id, index) => {
          if (!findById(MATRICA.areaAddOns, id)) issues.push({ path: ['addOnIds', index], message: 'Ismeretlen opció.' });
        });
        if (new Set(addOns).size !== addOns.length) {
          issues.push({ path: ['addOnIds'], message: 'Minden opció csak egyszer választható.' });
        }
      }
      break;
    }

    case 'plakat': {
      const checkFinish = () => {
        if (!findById(PLAKAT.paperFinishes, c.paperFinish)) {
          issues.push({ path: ['paperFinish'], message: 'Válasszon papírfelületet (matt vagy fényes).' });
        }
      };
      if (c.formatId === PLAKAT.blueback.id) {
        checkSide(issues, 'widthCm', c.widthCm, PLAKAT.bluebackSize);
        checkSide(issues, 'heightCm', c.heightCm, PLAKAT.bluebackSize);
      } else if (c.formatId === PLAKAT.custom.id) {
        checkFinish();
        checkSide(issues, 'widthCm', c.widthCm, PLAKAT.custom.size);
        checkSide(issues, 'heightCm', c.heightCm, PLAKAT.custom.size);
      } else {
        if (!findById(PLAKAT.formats, c.formatId)) issues.push({ path: ['formatId'], message: 'Válasszon méretet.' });
        checkFinish();
        checkOrientation(issues, c.orientation);
      }
      break;
    }

    case 'tabla': {
      if (!findById(TABLA.materials, c.materialId)) issues.push({ path: ['materialId'], message: 'Válasszon anyagot.' });
      checkSide(issues, 'widthCm', c.widthCm, TABLA.size);
      checkSide(issues, 'heightCm', c.heightCm, TABLA.size);
      const counts = c.addOnCounts;
      if (!isRecord(counts)) {
        issues.push({ path: ['addOnCounts'], message: 'Érvénytelen opciók.' });
        break;
      }
      for (const key of Object.keys(counts)) {
        if (!findById(TABLA.pieceAddOns, key)) issues.push({ path: ['addOnCounts', key], message: 'Ismeretlen opció.' });
      }
      for (const addOn of TABLA.pieceAddOns) {
        const count = counts[addOn.id];
        if (typeof count !== 'number' || !Number.isInteger(count) || count < 0 || count > addOn.maxCount) {
          issues.push({
            path: ['addOnCounts', addOn.id],
            message: `${addOn.name}: a darabszám 0 és ${addOn.maxCount} közötti egész szám lehet.`,
          });
        }
      }
      break;
    }

    case 'vaszonkep':
      if (c.formatId === 'egyedi') {
        checkSide(issues, 'widthCm', c.widthCm, VASZONKEP.custom.size);
        checkSide(issues, 'heightCm', c.heightCm, VASZONKEP.custom.size);
      } else {
        if (!findById(VASZONKEP.formats, c.formatId)) issues.push({ path: ['formatId'], message: 'Válasszon méretet.' });
        checkOrientation(issues, c.orientation);
      }
      break;
  }
  return issues;
}

// ─── Pricing ─────────────────────────────────────────────────────────────────────────────────────

const toMm = (cm: number): number => Math.round(cm * 10);
const MM2_PER_M2 = 1_000_000;

function areaLine(label: string, widthCm: number, heightCm: number, pricePerM2: number, minAreaM2 = 0): PriceLine {
  const areaMm2 = Math.max(toMm(widthCm) * toMm(heightCm), Math.round(minAreaM2 * MM2_PER_M2));
  return {
    label,
    quantity: areaMm2 / MM2_PER_M2,
    unit: 'm²',
    unitPriceNet: pricePerM2,
    amountNet: roundHuf((areaMm2 * pricePerM2) / MM2_PER_M2),
  };
}

function perimeterLine(label: string, widthCm: number, heightCm: number, pricePerM: number): PriceLine {
  const perimeterMm = 2 * (toMm(widthCm) + toMm(heightCm));
  return {
    label,
    quantity: perimeterMm / 1000,
    unit: 'fm',
    unitPriceNet: pricePerM,
    amountNet: roundHuf((perimeterMm * pricePerM) / 1000),
  };
}

const pieceLine = (label: string, count: number, unit: string, priceNet: number): PriceLine => ({
  label,
  quantity: count,
  unit,
  unitPriceNet: priceNet,
  amountNet: count * priceNet,
});

/** Looks up a catalog entry that validateConfiguration has already proven to exist. */
function mustFind<T extends { readonly id: string }>(list: readonly T[], id: string): T {
  const found = list.find((entry) => entry.id === id);
  if (!found) throw new Error(`Catalog entry not found: ${id}`);
  return found;
}

function baseLines(config: ProductConfig): { lines: PriceLine[]; minimumNet: number | null } {
  switch (config.productId) {
    case 'molino': {
      const material = mustFind(MOLINO.materials, config.materialId);
      const edge = mustFind(MOLINO.edgeFinishes, config.edgeFinishId);
      return {
        lines: [
          areaLine(material.name, config.widthCm, config.heightCm, material.priceNetPerM2),
          perimeterLine(`Szélkidolgozás: ${edge.name}`, config.widthCm, config.heightCm, edge.priceNetPerM),
        ],
        minimumNet: MOLINO.minimumNet,
      };
    }
    case 'rollup': {
      const format = mustFind(ROLLUP.formats, config.formatId);
      const line = config.graphicOnly
        ? pieceLine(`${ROLLUP.graphicOnly.name}, ${format.name}`, 1, 'db', ROLLUP.graphicOnly.priceNet)
        : pieceLine(`Roll-up, ${format.name}`, 1, 'db', format.priceNet);
      return { lines: [line], minimumNet: ROLLUP.minimumNet };
    }
    case 'matrica': {
      const material = mustFind(MATRICA.materials, config.materialId);
      const lines = [areaLine(material.name, config.widthCm, config.heightCm, material.priceNetPerM2)];
      for (const addOn of MATRICA.areaAddOns) {
        if (config.addOnIds.includes(addOn.id)) {
          lines.push(areaLine(addOn.name, config.widthCm, config.heightCm, addOn.priceNetPerM2));
        }
      }
      return { lines, minimumNet: MATRICA.minimumNet };
    }
    case 'plakat': {
      if (config.formatId === 'blueback') {
        const blueback = PLAKAT.blueback;
        return {
          lines: [areaLine(blueback.name, config.widthCm, config.heightCm, blueback.priceNetPerM2)],
          minimumNet: PLAKAT.minimumNet,
        };
      }
      if (config.formatId === 'egyedi') {
        const finish = mustFind(PLAKAT.paperFinishes, config.paperFinish);
        const label = `Plakát, ${PLAKAT.custom.name.toLowerCase()}, ${finish.name.toLowerCase()}`;
        return {
          lines: [areaLine(label, config.widthCm, config.heightCm, PLAKAT.custom.priceNetPerM2)],
          minimumNet: PLAKAT.custom.minimumNet,
        };
      }
      const format = mustFind(PLAKAT.formats, config.formatId);
      const finish = mustFind(PLAKAT.paperFinishes, config.paperFinish);
      return {
        lines: [pieceLine(`Plakát ${format.name}, ${finish.name.toLowerCase()}`, 1, 'db', format.priceNet)],
        minimumNet: PLAKAT.minimumNet,
      };
    }
    case 'tabla': {
      const material = mustFind(TABLA.materials, config.materialId);
      const belowMinimumArea = toMm(config.widthCm) * toMm(config.heightCm) < TABLA.minBillableM2 * MM2_PER_M2;
      const label = belowMinimumArea
        ? `${material.name} (minimum ${formatNumberHu(TABLA.minBillableM2)} m²)`
        : material.name;
      const lines = [areaLine(label, config.widthCm, config.heightCm, material.priceNetPerM2, TABLA.minBillableM2)];
      for (const addOn of TABLA.pieceAddOns) {
        const count = config.addOnCounts[addOn.id];
        if (count > 0) lines.push(pieceLine(addOn.name, count, addOn.unit, addOn.priceNet));
      }
      return { lines, minimumNet: TABLA.minimumNet };
    }
    case 'vaszonkep': {
      if (config.formatId === 'egyedi') {
        return {
          lines: [areaLine(`Vászonkép, ${VASZONKEP.custom.name.toLowerCase()}`, config.widthCm, config.heightCm, VASZONKEP.custom.priceNetPerM2)],
          minimumNet: VASZONKEP.minimumNet,
        };
      }
      const format = mustFind(VASZONKEP.formats, config.formatId);
      return { lines: [pieceLine(`Vászonkép ${format.name}`, 1, 'db', format.priceNet)], minimumNet: null };
    }
  }
}

/** The tier that applies to `quantity` identical pieces. */
export function discountTierFor(quantity: number): DiscountTier {
  let tier = QUANTITY_DISCOUNT_TIERS[0];
  for (const candidate of QUANTITY_DISCOUNT_TIERS) {
    if (quantity >= candidate.minQty) tier = candidate;
  }
  if (!tier) throw new Error('No quantity discount tiers defined');
  return tier;
}

/** "Még 2 db és −10%": the next tier above `quantity`, or null at the top tier. */
export function nextDiscountHint(quantity: number): DiscountHint | null {
  const next = QUANTITY_DISCOUNT_TIERS.find((tier) => tier.minQty > quantity);
  return next ? { additionalQty: next.minQty - quantity, pct: next.pct } : null;
}

export const vatOf = (net: number): number => percentOf(net, VAT_PERCENT);
export const grossOf = (net: number): number => net + vatOf(net);

/**
 * Prices one configuration (see the order of operations at the top of this file).
 * Throws ConfigurationError with Hungarian issues if the configuration is invalid.
 */
export function priceConfiguration(config: ProductConfig): ConfigurationPrice {
  const issues = validateConfiguration(config);
  if (issues.length > 0) throw new ConfigurationError(issues);

  const { lines, minimumNet } = baseLines(config);
  const base = lines.reduce((sum, line) => sum + line.amountNet, 0);
  const minimumApplied = minimumNet !== null && base < minimumNet;
  if (minimumApplied) {
    const topUp = minimumNet - base;
    lines.push({ label: 'Kiegészítés a minimális tételárig', quantity: 1, unit: 'db', unitPriceNet: topUp, amountNet: topUp });
  }
  const itemNet = minimumApplied ? minimumNet : base;

  const subtotalNet = itemNet * config.quantity;
  const { pct: discountPct } = discountTierFor(config.quantity);
  const discountNet = percentOf(subtotalNet, discountPct);
  const discounted = subtotalNet - discountNet;
  const expressSurchargeNet = config.express ? percentOf(discounted, EXPRESS_SURCHARGE_PERCENT) : 0;
  const netTotal = discounted + expressSurchargeNet;
  const vatTotal = vatOf(netTotal);

  return {
    productId: config.productId,
    lines,
    itemNet,
    minimumNet,
    minimumApplied,
    quantity: config.quantity,
    subtotalNet,
    discountPct,
    discountNet,
    express: config.express,
    expressSurchargeNet,
    netTotal,
    vatTotal,
    grossTotal: netTotal + vatTotal,
    nextDiscountHint: nextDiscountHint(config.quantity),
  };
}

/** Non-throwing variant for live UI calculation. */
export function tryPriceConfiguration(
  config: ProductConfig,
): { ok: true; price: ConfigurationPrice } | { ok: false; issues: ConfigIssue[] } {
  const issues = validateConfiguration(config);
  return issues.length > 0 ? { ok: false, issues } : { ok: true, price: priceConfiguration(config) };
}

/** Prices a cart. Throws ConfigurationError (paths prefixed with ['items', index]) on invalid input. */
export function priceCart(
  items: readonly { readonly config: ProductConfig }[],
  shippingMethodId: ShippingMethodId,
): CartPrice {
  const method = SHIPPING_METHODS.find((m) => m.id === shippingMethodId);
  const issues: ConfigIssue[] = method ? [] : [{ path: ['shippingMethod'], message: 'Válasszon átvételi módot.' }];
  items.forEach((item, index) => {
    for (const issue of validateConfiguration(item.config)) {
      issues.push({ path: ['items', index, 'config', ...issue.path], message: issue.message });
    }
  });
  if (!method || issues.length > 0) throw new ConfigurationError(issues);

  const priced = items.map((item) => priceConfiguration(item.config));
  const itemsNet = priced.reduce((sum, p) => sum + p.netTotal, 0);
  const itemsVat = priced.reduce((sum, p) => sum + p.vatTotal, 0);

  const largeParcel = items.some((item) => SHOP_PRODUCTS[item.config.productId].parcel === 'large');
  const listPrice = largeParcel ? method.largeParcelPriceNet : method.priceNet;
  const priceOnRequest = listPrice === null;
  const shippingNet = items.length === 0 || listPrice === null ? 0 : listPrice;
  const shippingVat = vatOf(shippingNet);
  const netTotal = itemsNet + shippingNet;
  const vatTotal = itemsVat + shippingVat;

  return {
    items: priced,
    itemsNet,
    shipping: {
      methodId: method.id,
      name: method.name,
      largeParcel,
      priceOnRequest,
      net: shippingNet,
      vat: shippingVat,
      gross: shippingNet + shippingVat,
    },
    netTotal,
    vatTotal,
    grossTotal: netTotal + vatTotal,
  };
}

// ─── Configuration helpers for previews, preflight and summaries ─────────────────────────────────

/** Physical print size of one piece in cm, honouring orientation for fixed formats. */
export function configDimensionsCm(config: ProductConfig): { widthCm: number; heightCm: number } {
  const oriented = (format: { readonly widthCm: number; readonly heightCm: number }, orientation: Orientation) => {
    const short = Math.min(format.widthCm, format.heightCm);
    const long = Math.max(format.widthCm, format.heightCm);
    return orientation === 'allo' ? { widthCm: short, heightCm: long } : { widthCm: long, heightCm: short };
  };
  switch (config.productId) {
    case 'rollup': {
      const format = mustFind(ROLLUP.formats, config.formatId);
      return { widthCm: format.widthCm, heightCm: format.heightCm };
    }
    case 'plakat':
      return config.formatId === 'blueback' || config.formatId === 'egyedi'
        ? { widthCm: config.widthCm, heightCm: config.heightCm }
        : oriented(mustFind(PLAKAT.formats, config.formatId), config.orientation);
    case 'vaszonkep':
      return config.formatId === 'egyedi'
        ? { widthCm: config.widthCm, heightCm: config.heightCm }
        : oriented(mustFind(VASZONKEP.formats, config.formatId), config.orientation);
    default:
      return { widthCm: config.widthCm, heightCm: config.heightCm };
  }
}

const sizeLabel = (widthCm: number, heightCm: number): string =>
  `${formatNumberHu(widthCm, 1)} × ${formatNumberHu(heightCm, 1)} cm`;

/** One-line Hungarian summary for cart rows, order e-mails and admin views. Assumes a valid config. */
export function describeConfiguration(config: ProductConfig): string {
  const product = SHOP_PRODUCTS[config.productId];
  const parts: string[] = [product.name];
  const { widthCm, heightCm } = configDimensionsCm(config);
  switch (config.productId) {
    case 'molino':
      parts.push(mustFind(MOLINO.materials, config.materialId).name, sizeLabel(widthCm, heightCm));
      parts.push(mustFind(MOLINO.edgeFinishes, config.edgeFinishId).name);
      break;
    case 'rollup':
      parts.push(mustFind(ROLLUP.formats, config.formatId).name);
      if (config.graphicOnly) parts.push(ROLLUP.graphicOnly.name.toLowerCase());
      break;
    case 'matrica':
      parts.push(mustFind(MATRICA.materials, config.materialId).name, sizeLabel(widthCm, heightCm));
      for (const addOn of MATRICA.areaAddOns) if (config.addOnIds.includes(addOn.id)) parts.push(addOn.name);
      break;
    case 'plakat':
      if (config.formatId === 'blueback') {
        parts.push(PLAKAT.blueback.name, sizeLabel(widthCm, heightCm));
      } else if (config.formatId === 'egyedi') {
        parts.push(`${PLAKAT.custom.name}, ${sizeLabel(widthCm, heightCm)}`, mustFind(PLAKAT.paperFinishes, config.paperFinish).name);
      } else {
        parts.push(mustFind(PLAKAT.formats, config.formatId).name, mustFind(PLAKAT.paperFinishes, config.paperFinish).name);
        parts.push(config.orientation === 'allo' ? 'álló' : 'fekvő');
      }
      break;
    case 'tabla':
      parts.push(mustFind(TABLA.materials, config.materialId).name, sizeLabel(widthCm, heightCm));
      for (const addOn of TABLA.pieceAddOns) {
        const count = config.addOnCounts[addOn.id];
        if (count > 0) parts.push(`${addOn.name} × ${count}`);
      }
      break;
    case 'vaszonkep':
      parts.push(config.formatId === 'egyedi' ? `${VASZONKEP.custom.name}, ${sizeLabel(widthCm, heightCm)}` : sizeLabel(widthCm, heightCm));
      break;
  }
  if (config.express) parts.push('expressz');
  return parts.join(' · ');
}
