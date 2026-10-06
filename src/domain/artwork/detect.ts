import type { ArtworkFormat } from './types';
import { latin1 } from './units';

const startsWith = (bytes: Uint8Array, signature: readonly number[], offset = 0): boolean =>
  signature.every((b, i) => bytes[offset + i] === b);

/** True if the bytes are a PDF (the header may follow up to 1 KB of junk, as Acrobat tolerates). */
export function isPdfBytes(bytes: Uint8Array): boolean {
  return latin1(bytes.subarray(0, 1024)).includes('%PDF-');
}

/** True for an SVG root element after an optional BOM, XML declaration, comments or DOCTYPE. */
export function looksLikeSvg(bytes: Uint8Array): boolean {
  const head = new TextDecoder().decode(bytes.subarray(0, 4096)).replace(/^﻿/, '');
  const rest = head.replace(/^(?:\s+|<\?[\s\S]*?\?>|<!--[\s\S]*?-->|<!DOCTYPE[^>[]*(?:\[[\s\S]*?\])?\s*>)*/i, '');
  return /^<svg[\s>]/i.test(rest);
}

const AVIF_BRANDS = new Set(['avif', 'avis']);
const HEIF_BRANDS = new Set(['heic', 'heix', 'heim', 'heis', 'hevc', 'hevx', 'mif1', 'msf1']);
const BMP_HEADER_SIZES = new Set([12, 40, 52, 56, 64, 108, 124]);

/** HEIF/AVIF: an ISO base media file whose 'ftyp' box lists an image brand (AVIF also lists mif1). */
function isoImageFormat(bytes: Uint8Array): 'heic' | 'avif' | null {
  if (bytes.length < 16 || latin1(bytes.subarray(4, 8)) !== 'ftyp') return null;
  const size = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(0);
  const brands = [latin1(bytes.subarray(8, 12))];
  for (let off = 16; off + 4 <= Math.min(size, bytes.length, 256); off += 4) brands.push(latin1(bytes.subarray(off, off + 4)));
  if (brands.some((b) => AVIF_BRANDS.has(b))) return 'avif';
  return brands.some((b) => HEIF_BRANDS.has(b)) ? 'heic' : null;
}

/** Detects the format from the content; the file name only tells an Illustrator file from a PDF or EPS. */
export function detectArtworkFormat(bytes: Uint8Array, fileName = ''): ArtworkFormat {
  const name = fileName.trim();
  const isAi = /\.ai$/i.test(name);
  const head = latin1(bytes.subarray(0, 16));
  if (head.startsWith('%PDF-')) return isAi ? 'ai' : 'pdf';
  if (startsWith(bytes, [0xc5, 0xd0, 0xd3, 0xc6]) || head.startsWith('%!PS-Adobe')) return isAi ? 'ai' : 'eps';
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png';
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return 'jpeg';
  if (head.startsWith('II*\0') || head.startsWith('MM\0*')) return 'tiff';
  if (head.startsWith('8BPS')) return 'psd';
  if (head.startsWith('RIFF') && head.slice(8, 12) === 'WEBP') return 'webp';
  if (head.startsWith('GIF87a') || head.startsWith('GIF89a')) return 'gif';
  if (head.startsWith('BM') && BMP_HEADER_SIZES.has((bytes[14] ?? 0) | ((bytes[15] ?? 0) << 8))) return 'bmp';
  const iso = isoImageFormat(bytes);
  if (iso) return iso;
  // CorelDRAW: RIFF up to version X3, a ZIP container since X4 (recognised by the extension only).
  if (head.startsWith('RIFF') && head.slice(8, 11).toLowerCase() === 'cdr') return 'cdr';
  if (head.startsWith('PK\x03\x04') && /\.cdr$/i.test(name)) return 'cdr';
  if (isPdfBytes(bytes)) return isAi ? 'ai' : 'pdf';
  if (looksLikeSvg(bytes)) return 'svg';
  return 'unknown';
}
