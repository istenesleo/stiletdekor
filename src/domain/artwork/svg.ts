import type { ArtworkPage } from './types';
import { toSize } from './units';

// Absolute CSS units only. px and unitless values are ambiguous (72 or 96 per inch depending on the tool).
const MM_PER_UNIT: Readonly<Record<string, number>> = { mm: 1, cm: 10, in: 25.4, pt: 25.4 / 72, pc: 25.4 / 6, q: 0.25 };

function attribute(tag: string, name: string): string | null {
  const match = new RegExp(String.raw`(?:^|\s)${name}\s*=\s*(?:"([^"]*)"|'([^']*)')`, 'i').exec(tag);
  return match ? (match[1] ?? match[2] ?? null) : null;
}

function lengthMm(value: string | null): number | null {
  if (!value) return null;
  const match = /^\s*\+?((?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)\s*([a-z%]*)\s*$/i.exec(value);
  if (!match) return null;
  const factor = MM_PER_UNIT[(match[2] ?? '').toLowerCase()];
  if (factor === undefined) return null;
  const n = Number(match[1]);
  return n > 0 ? n * factor : null;
}

/** Size of the root <svg> element when width and height use absolute units. */
export function svgPages(bytes: Uint8Array): { pages: ArtworkPage[]; relativeUnits: boolean } {
  const text = new TextDecoder().decode(bytes.subarray(0, 65536));
  const tag = /<svg\b[^>]*>/i.exec(text)?.[0];
  const width = tag ? lengthMm(attribute(tag, 'width')) : null;
  const height = tag ? lengthMm(attribute(tag, 'height')) : null;
  if (width === null || height === null) return { pages: [], relativeUnits: true };
  const size = toSize(width, height);
  return {
    pages: [{ index: 1, size, sizeSource: 'svg-units', printSize: size, bleedMm: null, rotation: 0, contentKey: null }],
    relativeUnits: false,
  };
}
