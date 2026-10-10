// From the browser's analysis of a print file to the configurator: the size to fill in (with the suggested scale
// applied), the standard format it matches (plakát, roll-up, vászonkép), the preflight at the chosen size, and a line
// about the file. Only the analyzer's small modules are imported: the analyzer itself (pdf-lib) loads on demand.
import { matchStandardFormat, type StandardFormat } from '@/domain/artwork/formats';
import { suggestScale } from '@/domain/artwork/hints';
import type { ArtworkAnalysis } from '@/domain/artwork/types';
import { applyScale } from '@/domain/artwork/units';
import { MATRICA, MOLINO, type Orientation, PLAKAT, ROLLUP, type ShopProductId, TABLA, VASZONKEP } from '@/domain/catalog';
import { formatNumberHu } from '@/domain/money';
import { type FitMode, preflight } from '@/domain/preflight';
import type { PreflightSummary } from '@/domain/config-schemas';

export interface ArtworkSize {
  widthCm: number;
  heightCm: number;
  /** The product's standard format the file matches (or "egyedi" for a canvas that matches none). */
  formatId?: string | undefined;
  orientation?: Orientation | undefined;
  /** The suggested scale (10 for a 1:10 file), already applied to the size. */
  scale: number | null;
  /** The file has more pages; the first one is used. */
  multiPage: boolean;
}

/** Below this longer side the file is probably a scaled drawing (brief 8). */
const MIN_SIDE_MM: Readonly<Record<ShopProductId, number>> = {
  molino: MOLINO.size.minCm * 10,
  matrica: MATRICA.size.minCm * 10,
  tabla: TABLA.size.minCm * 10,
  plakat: PLAKAT.bluebackSize.minCm * 10,
  vaszonkep: VASZONKEP.custom.size.minCm * 10,
  rollup: Math.min(...ROLLUP.formats.map((f) => f.widthCm)) * 10,
};

const inMm = (formats: readonly { id: string; widthCm: number; heightCm: number }[]): StandardFormat[] =>
  formats.map((f) => ({ id: f.id, widthMm: Math.round(f.widthCm * 10), heightMm: Math.round(f.heightCm * 10) }));
const PLAKAT_FORMATS = inMm(PLAKAT.formats);
const VASZON_FORMATS = inMm(VASZONKEP.formats);

/** Whole millimetres, in cm. */
const cm = (mm: number) => Math.round(mm) / 10;

export function artworkSizeFor(productId: ShopProductId, analysis: Pick<ArtworkAnalysis, 'pages' | 'hints'>): ArtworkSize | null {
  const page = analysis.pages[0];
  if (!page) return null;
  // The price is for the whole printed size, bleed included (brief 8).
  const scale = suggestScale(page.printSize, MIN_SIDE_MM[productId], analysis.hints.scale);
  const size = scale ? applyScale(page.printSize, scale) : page.printSize;
  const base: ArtworkSize = { widthCm: cm(size.widthMm), heightCm: cm(size.heightMm), scale, multiPage: analysis.pages.length > 1 };
  const orientation: Orientation = size.widthMm > size.heightMm ? 'fekvo' : 'allo';
  switch (productId) {
    case 'plakat': {
      const match = matchStandardFormat(size, PLAKAT_FORMATS);
      return match ? { ...base, formatId: match.id, orientation } : base;
    }
    case 'vaszonkep': {
      const match = matchStandardFormat(size, VASZON_FORMATS, { bleedsMm: [0] });
      return { ...base, formatId: match ? match.id : 'egyedi', orientation };
    }
    case 'rollup': {
      const format = ROLLUP.formats.find((f) => Math.abs(f.widthCm * 10 - size.widthMm) <= 1);
      return format ? { ...base, formatId: format.id } : base;
    }
    default:
      return base;
  }
}

/** The preflight of a raster image at the product size, for the cart and the workshop; null for vector files. */
export function preflightSummary(
  analysis: Pick<ArtworkAnalysis, 'pixels'>,
  widthCm: number,
  heightCm: number,
  fitMode: FitMode,
): PreflightSummary | null {
  if (!analysis.pixels || !(widthCm > 0) || !(heightCm > 0)) return null;
  const result = preflight(analysis.pixels.width, analysis.pixels.height, widthCm, heightCm, fitMode);
  return {
    dpi: Math.min(result.dpi, 100_000),
    rating: result.rating,
    aspectMismatch: result.aspect.exceeds,
    ...(result.needsFitChoice ? { fitMode } : {}),
  };
}

/** One line about the file for its row: "841 × 1189 mm · vektoros · 2 oldal". */
export function artworkDetail(analysis: Pick<ArtworkAnalysis, 'pages' | 'pixels' | 'confidence'>): string {
  const page = analysis.pages[0];
  const parts: string[] = [];
  if (page) parts.push(`${formatNumberHu(page.size.widthMm, 1)} × ${formatNumberHu(page.size.heightMm, 1)} mm`);
  else if (analysis.pixels) parts.push(`${analysis.pixels.width} × ${analysis.pixels.height} px`);
  if (analysis.confidence === 'exact') parts.push('vektoros');
  if (analysis.pages.length > 1) parts.push(`${analysis.pages.length} oldal`);
  return parts.length > 0 ? parts.join(' · ') : 'A méretét nem tudtuk kiolvasni';
}
