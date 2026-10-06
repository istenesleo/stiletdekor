import type { SizeMm } from './types';

export const MM_PER_INCH = 25.4;
export const MM_PER_PT = 25.4 / 72;

/** Rounds to 0.1 mm. Only applied to reported values, never to intermediate math. */
export const roundMm = (mm: number): number => Math.round(mm * 10) / 10;

export const toSize = (widthMm: number, heightMm: number): SizeMm => ({
  widthMm: roundMm(widthMm),
  heightMm: roundMm(heightMm),
});

/** Area in m² (not rounded). */
export const areaM2 = (size: SizeMm): number => (size.widthMm / 1000) * (size.heightMm / 1000);

/** The real size of a scaled drawing, e.g. a 1:10 file → scale 10. */
export const applyScale = (size: SizeMm, scale: number): SizeMm => toSize(size.widthMm * scale, size.heightMm * scale);

/** Decodes bytes one byte per character (Latin-1); TextDecoder('latin1') is not available in every runtime. */
export function latin1(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 8192) out += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return out;
}
