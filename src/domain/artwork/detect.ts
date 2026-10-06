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

/** Detects the format from the content; the file name only tells an Illustrator file from a PDF or EPS. */
export function detectArtworkFormat(bytes: Uint8Array, fileName = ''): ArtworkFormat {
  const isAi = /\.ai$/i.test(fileName.trim());
  const head = latin1(bytes.subarray(0, 16));
  if (head.startsWith('%PDF-')) return isAi ? 'ai' : 'pdf';
  if (startsWith(bytes, [0xc5, 0xd0, 0xd3, 0xc6]) || head.startsWith('%!PS-Adobe')) return isAi ? 'ai' : 'eps';
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png';
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return 'jpeg';
  if (head.startsWith('II*\0') || head.startsWith('MM\0*')) return 'tiff';
  if (head.startsWith('8BPS')) return 'psd';
  if (head.startsWith('RIFF') && head.slice(8, 12) === 'WEBP') return 'webp';
  if (head.startsWith('GIF87a') || head.startsWith('GIF89a')) return 'gif';
  if (isPdfBytes(bytes)) return isAi ? 'ai' : 'pdf';
  if (looksLikeSvg(bytes)) return 'svg';
  return 'unknown';
}
