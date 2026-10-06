import type { SizeMm } from './types';
import { roundMm } from './units';

const ALLOWED_SCALES = new Set([1, 2, 5, 10, 20, 25, 50, 100]);

// Explicit notations only. Windows file names cannot contain ':', so "1_10" counts as well. A bare "1-10" is
// too ambiguous (page ranges, dates) and is ignored, as is a "1_10" that is part of a date like 2024_1_10.
const SCALE_PATTERNS = [
  /(?<![0-9])(?:m\s*=?\s*)?1\s*:\s*(\d{1,3})(?![0-9])/iu, // 1:10, M1:10, M 1:10, m=1:10
  /(?<![0-9\p{L}])m\s*1\s*[-_]\s*(\d{1,3})(?![0-9])/iu, // M1-10, M1_10, M 1-10
  /(?:scale|m[eé]ret\s*ar[aá]ny)[\s_:-]*1\s*[-_:]\s*(\d{1,3})(?![0-9])/iu, // scale 1-10, méretarány 1:10
  /(?<![0-9\p{L}]|\d[_.-])1_(\d{1,3})(?![0-9]|[_.-]\d)/iu, // molino_1_10
];

/** Scale written in a file name or title: "molino_M1-10.pdf" → 10, "1:1" → 1, nothing explicit → null. */
export function parseScaleHint(text: string): number | null {
  for (const pattern of SCALE_PATTERNS) {
    const match = pattern.exec(text);
    if (!match) continue;
    const scale = Number(match[1]);
    if (ALLOWED_SCALES.has(scale)) return scale;
  }
  return null;
}

const BLEED_NUMBER = String.raw`(\d+(?:[.,]\d+)?)\s*mm`;
const BLEED_WORD = String.raw`(?:r[aá]hagy[aá]s\p{L}*|kifut[oó]\p{L}*|bleed)`;
const SEP = String.raw`[\s_-]*`; // file names often use _ or - instead of spaces
const BLEED_PATTERNS = [
  // 10 mm ráhagyással, 3 mm-es kifutóval, 10mm_rahagyas; but not the 100 of "300x100mm_bleed3mm"
  new RegExp(String.raw`(?<![\d.,]|[x×]\s*)${BLEED_NUMBER}(?:-\p{L}+)?${SEP}${BLEED_WORD}`, 'iu'),
  // bleed 3mm, ráhagyás: 10 mm, Bleed_5mm
  new RegExp(String.raw`${BLEED_WORD}${SEP}:?${SEP}${BLEED_NUMBER}`, 'iu'),
];

/** Bleed mentioned in a file name or title: "10 mm ráhagyással" → 10, "bleed 3mm" → 3. */
export function parseBleedHint(text: string): number | null {
  for (const pattern of BLEED_PATTERNS) {
    const match = pattern.exec(text);
    if (match?.[1]) return roundMm(Number(match[1].replace(',', '.')));
  }
  return null;
}

/**
 * Scale to suggest for a file: an explicit hint wins (1 means "do not scale"); otherwise 10 when the
 * file's longer side is below the product minimum and ten times the size would reach it.
 */
export function suggestScale(size: SizeMm, minSideMm: number, hintScale: number | null): number | null {
  if (hintScale !== null) return hintScale > 1 ? hintScale : null;
  const longer = Math.max(size.widthMm, size.heightMm);
  return longer < minSideMm && longer * 10 >= minSideMm ? 10 : null;
}
