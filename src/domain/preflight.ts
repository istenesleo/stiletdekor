// Print-readiness checks for uploaded raster artwork: effective resolution and aspect ratio.

export type DpiRating = 'kivalo' | 'megfelelo' | 'gyenge';
export type FitMode = 'fill' | 'fit';

export const DPI_THRESHOLDS = { excellent: 150, acceptable: 72 } as const;

/** Relative aspect-ratio difference above which the customer must choose a fit mode. */
export const ASPECT_TOLERANCE = 0.02;

export const DPI_RATINGS: Readonly<Record<DpiRating, { label: string; description: string; tone: 'ok' | 'warn' | 'bad' }>> = {
  kivalo: {
    label: 'Kiváló',
    description: 'A felbontás közelről nézve is éles nyomatot ad.',
    tone: 'ok',
  },
  megfelelo: {
    label: 'Molinóra, nagy távolságra megfelelő',
    description: 'Távolról nézve rendben lesz, közelről a kép kissé lágy lehet.',
    tone: 'warn',
  },
  gyenge: {
    label: 'Gyenge',
    description: 'A nyomat pixeles lehet. Ha tud, töltsön fel nagyobb felbontású fájlt.',
    tone: 'bad',
  },
};

export const FIT_MODES: Readonly<Record<FitMode, { label: string; description: string }>> = {
  fill: { label: 'Kitöltés (vágással)', description: 'A kép kitölti a teljes felületet, a széleiből levágunk.' },
  fit: { label: 'Illesztés (kerettel)', description: 'A teljes kép látszik, a maradék helyre háttérszín kerül.' },
};

function assertPositive(values: Record<string, number>): void {
  for (const [name, value] of Object.entries(values)) {
    if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${name} must be a positive number, got ${value}`);
  }
}

/**
 * Effective print resolution in dots per inch.
 * 'fill' (default): min over the axes of px / (cm / 2.54), the resolution of the binding axis when
 * the image covers the whole surface. 'fit': max over the axes, since the image is scaled down to fit.
 */
export function effectiveDpi(pxW: number, pxH: number, cmW: number, cmH: number, mode: FitMode = 'fill'): number {
  assertPositive({ pxW, pxH, cmW, cmH });
  const dpiW = pxW / (cmW / 2.54);
  const dpiH = pxH / (cmH / 2.54);
  return mode === 'fill' ? Math.min(dpiW, dpiH) : Math.max(dpiW, dpiH);
}

/** ≥150 kiváló · 72–149 megfelelő · <72 gyenge. */
export function rateDpi(dpi: number): DpiRating {
  if (dpi >= DPI_THRESHOLDS.excellent) return 'kivalo';
  if (dpi >= DPI_THRESHOLDS.acceptable) return 'megfelelo';
  return 'gyenge';
}

export interface AspectCheck {
  imageRatio: number;
  targetRatio: number;
  /** Symmetric relative difference: max(r1, r2) / min(r1, r2) − 1. */
  difference: number;
  /** True when the difference exceeds 2%: the customer must choose 'fill' or 'fit'. */
  exceeds: boolean;
}

export function aspectMismatch(pxW: number, pxH: number, cmW: number, cmH: number): AspectCheck {
  assertPositive({ pxW, pxH, cmW, cmH });
  const imageRatio = pxW / pxH;
  const targetRatio = cmW / cmH;
  const difference = Math.max(imageRatio, targetRatio) / Math.min(imageRatio, targetRatio) - 1;
  // Small epsilon so an exact 2% difference does not flip on floating-point noise.
  return { imageRatio, targetRatio, difference, exceeds: difference > ASPECT_TOLERANCE + 1e-9 };
}

/**
 * Where the image lands on the print surface, in fractions of the surface (0..1).
 * 'fill' scales the image to cover the surface (x/y may be negative: those parts are cut off);
 * 'fit' scales it to fit inside (the uncovered area gets a frame / background colour).
 */
export function fitBox(
  pxW: number,
  pxH: number,
  cmW: number,
  cmH: number,
  mode: FitMode,
): { x: number; y: number; width: number; height: number } {
  assertPositive({ pxW, pxH, cmW, cmH });
  const scaleX = cmW / pxW;
  const scaleY = cmH / pxH;
  const scale = mode === 'fill' ? Math.max(scaleX, scaleY) : Math.min(scaleX, scaleY);
  const width = (pxW * scale) / cmW;
  const height = (pxH * scale) / cmH;
  return { x: (1 - width) / 2, y: (1 - height) / 2, width, height };
}

export interface PreflightResult {
  /** Rounded down, so the shown number never contradicts the rating. */
  dpi: number;
  rating: DpiRating;
  label: string;
  aspect: AspectCheck;
  /** The customer must pick 'fill' or 'fit' before ordering. */
  needsFitChoice: boolean;
}

export function preflight(pxW: number, pxH: number, cmW: number, cmH: number, mode: FitMode = 'fill'): PreflightResult {
  const dpi = effectiveDpi(pxW, pxH, cmW, cmH, mode);
  const rating = rateDpi(dpi);
  const aspect = aspectMismatch(pxW, pxH, cmW, cmH);
  return { dpi: Math.floor(dpi), rating, label: DPI_RATINGS[rating].label, aspect, needsFitChoice: aspect.exceeds };
}
