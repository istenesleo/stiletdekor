import type { SizeMm } from './types';

export interface StandardFormat {
  readonly id: string;
  readonly widthMm: number;
  readonly heightMm: number;
}

/** ISO 216 A series, portrait. */
export const ISO_A_FORMATS: readonly StandardFormat[] = [
  { id: 'a0', widthMm: 841, heightMm: 1189 },
  { id: 'a1', widthMm: 594, heightMm: 841 },
  { id: 'a2', widthMm: 420, heightMm: 594 },
  { id: 'a3', widthMm: 297, heightMm: 420 },
  { id: 'a4', widthMm: 210, heightMm: 297 },
  { id: 'a5', widthMm: 148, heightMm: 210 },
  { id: 'a6', widthMm: 105, heightMm: 148 },
];

export interface FormatMatch {
  readonly id: string;
  /** True when the file is the landscape version of a portrait format (or vice versa). */
  readonly rotated: boolean;
  /** Bleed on each side that makes the file match the format. */
  readonly bleedMm: number;
}

/**
 * Finds the standard format a file size corresponds to, orientation-insensitive. A file equal to the
 * format plus a bleed on every side also matches; no bleed is preferred, then the smallest bleed.
 */
export function matchStandardFormat(
  size: SizeMm,
  formats: readonly StandardFormat[],
  { toleranceMm = 1, bleedsMm = [0, 2, 3, 5, 10] }: { toleranceMm?: number; bleedsMm?: readonly number[] } = {},
): FormatMatch | null {
  const tolerance = toleranceMm + 1e-9;
  for (const bleed of [...bleedsMm].sort((a, b) => a - b)) {
    for (const format of formats) {
      for (const rotated of [false, true]) {
        const w = (rotated ? format.heightMm : format.widthMm) + 2 * bleed;
        const h = (rotated ? format.widthMm : format.heightMm) + 2 * bleed;
        if (Math.abs(size.widthMm - w) <= tolerance && Math.abs(size.heightMm - h) <= tolerance) {
          return { id: format.id, rotated, bleedMm: bleed };
        }
      }
    }
  }
  return null;
}
