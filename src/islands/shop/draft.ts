// The configurator's editable state: what the customer has chosen so far, with the sizes as typed ("29,7"), and its
// conversion to the domain's ProductConfig, which validateConfiguration checks and priceConfiguration prices.
import type { Orientation, ShopProductId } from '@/domain/catalog';
import { parseNumberHu } from '@/domain/money';
import {
  type MatricaConfig,
  type MolinoConfig,
  type PlakatFormatConfig,
  type ProductConfig,
  type RollupConfig,
  type TablaConfig,
  validateConfiguration,
  type VaszonkepFormatConfig,
} from '@/domain/pricing';

export interface Draft {
  productId: ShopProductId;
  /** Molinó, matrica, tábla. */
  materialId: string;
  /** Molinó. */
  edgeFinishId: string;
  /** Roll-up; plakát (a3 … b1, or "blueback"); vászonkép (30x40 …, or "egyedi"). */
  formatId: string;
  /** Plakát. */
  paperFinish: string;
  /** Plakát and vászonkép formats. */
  orientation: Orientation;
  /** Roll-up. */
  graphicOnly: boolean;
  /** Matrica. */
  addOnIds: string[];
  /** Tábla. */
  furat: number;
  tavtarto: number;
  /** As typed, in cm. */
  width: string;
  height: string;
  quantity: number;
  express: boolean;
}

const BASE = {
  materialId: '',
  edgeFinishId: '',
  formatId: '',
  paperFinish: 'matt',
  orientation: 'allo' as Orientation,
  graphicOnly: false,
  addOnIds: [] as string[],
  furat: 0,
  tavtarto: 0,
  width: '',
  height: '',
  quantity: 1,
  express: false,
};

/** What a product's configurator starts with. */
export function defaultDraft(productId: ShopProductId): Draft {
  switch (productId) {
    case 'molino':
      return { ...BASE, productId, materialId: 'standard', edgeFinishId: 'szeges-ringli', width: '200', height: '100' };
    case 'rollup':
      return { ...BASE, productId, formatId: '85x200' };
    case 'matrica':
      return { ...BASE, productId, materialId: 'monomer', width: '50', height: '50' };
    case 'plakat':
      return { ...BASE, productId, formatId: 'a2' };
    case 'tabla':
      return { ...BASE, productId, materialId: 'pvc-3mm', width: '60', height: '40' };
    case 'vaszonkep':
      return { ...BASE, productId, formatId: '50x70' };
  }
}

/** A size in cm the way it is typed in Hungarian: 29.7 → "29,7". */
export const sizeText = (cm: number): string => String(cm).replace('.', ',');

const cmOf = (text: string): number => {
  const value = parseNumberHu(text);
  return typeof value === 'number' ? value : Number.NaN;
};

/** True when the customer types the size (not a fixed format). */
export function hasFreeSize(draft: Draft): boolean {
  switch (draft.productId) {
    case 'molino':
    case 'matrica':
    case 'tabla':
      return true;
    case 'plakat':
      return draft.formatId === 'blueback';
    case 'vaszonkep':
      return draft.formatId === 'egyedi';
    case 'rollup':
      return false;
  }
}

export function draftToConfig(d: Draft): ProductConfig {
  const common = { quantity: d.quantity, express: d.express };
  const size = { widthCm: cmOf(d.width), heightCm: cmOf(d.height) };
  switch (d.productId) {
    case 'molino':
      return {
        productId: 'molino',
        materialId: d.materialId as MolinoConfig['materialId'],
        edgeFinishId: d.edgeFinishId as MolinoConfig['edgeFinishId'],
        ...size,
        ...common,
      };
    case 'rollup':
      return { productId: 'rollup', formatId: d.formatId as RollupConfig['formatId'], graphicOnly: d.graphicOnly, ...common };
    case 'matrica':
      return {
        productId: 'matrica',
        materialId: d.materialId as MatricaConfig['materialId'],
        addOnIds: d.addOnIds as MatricaConfig['addOnIds'],
        ...size,
        ...common,
      };
    case 'plakat':
      return d.formatId === 'blueback'
        ? { productId: 'plakat', formatId: 'blueback', ...size, ...common }
        : {
            productId: 'plakat',
            formatId: d.formatId as PlakatFormatConfig['formatId'],
            paperFinish: d.paperFinish as PlakatFormatConfig['paperFinish'],
            orientation: d.orientation,
            ...common,
          };
    case 'tabla':
      return {
        productId: 'tabla',
        materialId: d.materialId as TablaConfig['materialId'],
        addOnCounts: { furat: d.furat, tavtarto: d.tavtarto },
        ...size,
        ...common,
      };
    case 'vaszonkep':
      return d.formatId === 'egyedi'
        ? { productId: 'vaszonkep', formatId: 'egyedi', ...size, ...common }
        : { productId: 'vaszonkep', formatId: d.formatId as VaszonkepFormatConfig['formatId'], orientation: d.orientation, ...common };
  }
}

/** The draft of a saved configuration (editing a cart item). */
export function draftFromConfig(config: ProductConfig): Draft {
  const d: Draft = { ...defaultDraft(config.productId), quantity: config.quantity, express: config.express };
  switch (config.productId) {
    case 'molino':
      return { ...d, materialId: config.materialId, edgeFinishId: config.edgeFinishId, width: sizeText(config.widthCm), height: sizeText(config.heightCm) };
    case 'rollup':
      return { ...d, formatId: config.formatId, graphicOnly: config.graphicOnly };
    case 'matrica':
      return { ...d, materialId: config.materialId, addOnIds: [...config.addOnIds], width: sizeText(config.widthCm), height: sizeText(config.heightCm) };
    case 'plakat':
      if (config.formatId === 'blueback') return { ...d, formatId: 'blueback', width: sizeText(config.widthCm), height: sizeText(config.heightCm) };
      if (config.formatId === 'egyedi') {
        return { ...d, formatId: 'egyedi', paperFinish: config.paperFinish, width: sizeText(config.widthCm), height: sizeText(config.heightCm) };
      }
      return { ...d, formatId: config.formatId, paperFinish: config.paperFinish, orientation: config.orientation };
    case 'tabla':
      return {
        ...d,
        materialId: config.materialId,
        furat: config.addOnCounts.furat,
        tavtarto: config.addOnCounts.tavtarto,
        width: sizeText(config.widthCm),
        height: sizeText(config.heightCm),
      };
    case 'vaszonkep':
      return config.formatId === 'egyedi'
        ? { ...d, formatId: 'egyedi', width: sizeText(config.widthCm), height: sizeText(config.heightCm) }
        : { ...d, formatId: config.formatId, orientation: config.orientation };
  }
}

/** Messages for the draft, keyed by the configuration's path ("widthCm", "addOnCounts.furat"); empty when it can be priced. */
export function draftIssues(draft: Draft): Record<string, string> {
  const issues: Record<string, string> = {};
  for (const issue of validateConfiguration(draftToConfig(draft))) issues[issue.path.join('.')] ??= issue.message;
  return issues;
}
