import type { ArtworkFormat, ArtworkPage, ArtworkWarning } from './types';
import { latin1, MM_PER_INCH, toSize } from './units';

export interface RasterInfo {
  readonly width: number;
  readonly height: number;
  /** Resolution from the file's metadata, in pixels per inch. */
  readonly dpi: { readonly x: number; readonly y: number } | null;
}

const view = (bytes: Uint8Array) => new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
const tag = (bytes: Uint8Array, offset: number, length: number) => latin1(bytes.subarray(offset, offset + length));

function png(bytes: Uint8Array): RasterInfo {
  const v = view(bytes);
  let width = 0;
  let height = 0;
  let dpi: RasterInfo['dpi'] = null;
  for (let off = 8; off + 8 <= bytes.length; ) {
    const length = v.getUint32(off);
    const type = tag(bytes, off + 4, 4);
    const data = off + 8;
    if (type === 'IHDR') {
      width = v.getUint32(data);
      height = v.getUint32(data + 4);
    } else if (type === 'pHYs' && length >= 9) {
      const x = v.getUint32(data);
      const y = v.getUint32(data + 4);
      if (v.getUint8(data + 8) === 1 && x > 0 && y > 0) dpi = { x: x * 0.0254, y: y * 0.0254 }; // unit 1: per metre
    } else if (type === 'IDAT' || type === 'IEND') {
      break;
    }
    off = data + length + 4;
  }
  if (!width || !height) throw new Error('PNG without IHDR');
  return { width, height, dpi };
}

/** IFD0 of a TIFF structure starting at `base` (a TIFF file, or the TIFF block inside JPEG Exif). */
export function tiffIfd0(v: DataView, base: number): RasterInfo {
  const order = v.getUint16(base);
  const le = order === 0x4949;
  if (!le && order !== 0x4d4d) throw new Error('Invalid TIFF byte order');
  if (v.getUint16(base + 2, le) !== 42) throw new Error('Invalid TIFF header');
  const ifd = base + v.getUint32(base + 4, le);
  const count = v.getUint16(ifd, le);
  let width = 0;
  let height = 0;
  let xRes: number | null = null;
  let yRes: number | null = null;
  let unit = 2; // TIFF default: inch
  for (let i = 0; i < count; i++) {
    const e = ifd + 2 + i * 12;
    const id = v.getUint16(e, le);
    const type = v.getUint16(e + 2, le);
    const integer = () => (type === 3 ? v.getUint16(e + 8, le) : v.getUint32(e + 8, le));
    const rational = () => {
      const p = base + v.getUint32(e + 8, le);
      const den = v.getUint32(p + 4, le);
      return den ? v.getUint32(p, le) / den : null;
    };
    if (id === 256) width = integer();
    else if (id === 257) height = integer();
    else if (id === 282 && type === 5) xRes = rational();
    else if (id === 283 && type === 5) yRes = rational();
    else if (id === 296) unit = integer();
  }
  const factor = unit === 2 ? 1 : unit === 3 ? 2.54 : null;
  const dpi = factor && xRes && yRes ? { x: xRes * factor, y: yRes * factor } : null;
  return { width, height, dpi };
}

type Dpi = NonNullable<RasterInfo['dpi']>;

const IRB_SIGNATURES = new Set(['8BIM', 'MeSa', 'PHUT', 'AgHg', 'DCSR']);

/**
 * ResolutionInfo (0x03ED) from a block of Photoshop image resources (PSD header, JPEG APP13). It is
 * stored as 16.16 fixed-point pixels per inch, so it keeps the fractions that JFIF rounds away.
 */
function photoshopResolution(bytes: Uint8Array, start: number, end: number): Dpi | null {
  const v = view(bytes);
  for (let off = start; off + 12 <= end && IRB_SIGNATURES.has(tag(bytes, off, 4)); ) {
    const id = v.getUint16(off + 4);
    const nameLength = 1 + v.getUint8(off + 6); // Pascal string, padded to an even length
    const data = off + 6 + nameLength + (nameLength % 2) + 4;
    if (data > end) break;
    const size = v.getUint32(data - 4);
    if (id === 0x03ed && tag(bytes, off, 4) === '8BIM') {
      if (size < 16 || data + 16 > end) return null;
      // hRes, hResUnit, widthUnit, vRes, vResUnit, heightUnit: the units only set how Photoshop displays it.
      const x = v.getUint32(data) / 65536;
      const y = v.getUint32(data + 8) / 65536;
      return x > 0 && y > 0 ? { x, y } : null;
    }
    off = data + size + (size % 2);
  }
  return null;
}

const close = (a: Dpi, b: Dpi): boolean => Math.abs(a.x - b.x) < 1 && Math.abs(a.y - b.y) < 1;

function jpeg(bytes: Uint8Array): RasterInfo {
  const v = view(bytes);
  let width = 0;
  let height = 0;
  let jfif: Dpi | null = null;
  let exif: Dpi | null = null;
  let photoshop: Dpi | null = null;
  for (let off = 2; off + 4 <= bytes.length; ) {
    if (v.getUint8(off) !== 0xff) {
      off++;
      continue;
    }
    const marker = v.getUint8(off + 1);
    if (marker === 0xff) {
      off++;
      continue;
    }
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      off += 2;
      continue;
    }
    if (marker === 0xd9 || marker === 0xda) break; // end of image / start of scan data
    const data = off + 4;
    const end = Math.min(bytes.length, off + 2 + v.getUint16(off + 2));
    if (marker === 0xe0 && tag(bytes, data, 5) === 'JFIF\0') {
      const units = v.getUint8(data + 7);
      const x = v.getUint16(data + 8);
      const y = v.getUint16(data + 10);
      if ((units === 1 || units === 2) && x > 0 && y > 0) {
        const f = units === 2 ? 2.54 : 1;
        jfif = { x: x * f, y: y * f };
      }
    } else if (marker === 0xe1 && tag(bytes, data, 6) === 'Exif\0\0') {
      try {
        exif = tiffIfd0(v, data + 6).dpi;
      } catch {
        exif = null; // a damaged Exif block does not make the image unreadable
      }
    } else if (marker === 0xed && tag(bytes, data, 14) === 'Photoshop 3.0\0') {
      photoshop = photoshopResolution(bytes, data + 14, end);
    } else if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      height = v.getUint16(data + 1);
      width = v.getUint16(data + 3);
    }
    off += 2 + v.getUint16(off + 2);
  }
  if (!width || !height) throw new Error('JPEG without frame header');
  // JFIF stores whole numbers only. Photoshop's record and the Exif rationals keep the fractions, but they
  // refine JFIF only when they agree with it: one that disagrees is usually stale, left behind by a tool
  // that changed just the JFIF density.
  const precise = [photoshop, exif].find((d) => d !== null && (jfif === null || close(d, jfif)));
  return { width, height, dpi: precise ?? jfif };
}

function psd(bytes: Uint8Array): RasterInfo {
  const v = view(bytes);
  const version = v.getUint16(4);
  if (version !== 1 && version !== 2) throw new Error('Unsupported PSD version');
  const height = v.getUint32(14);
  const width = v.getUint32(18);
  const resources = 26 + 4 + v.getUint32(26); // image resources follow the color mode data
  const end = Math.min(bytes.length, resources + 4 + v.getUint32(resources));
  return { width, height, dpi: photoshopResolution(bytes, resources + 4, end) };
}

function webp(bytes: Uint8Array): RasterInfo {
  const v = view(bytes);
  const chunk = tag(bytes, 12, 4);
  const d = 20;
  const u24 = (o: number) => v.getUint8(o) | (v.getUint8(o + 1) << 8) | (v.getUint8(o + 2) << 16);
  if (chunk === 'VP8X') return { width: u24(d + 4) + 1, height: u24(d + 7) + 1, dpi: null };
  if (chunk === 'VP8L') {
    if (v.getUint8(d) !== 0x2f) throw new Error('Invalid VP8L signature');
    const bits = v.getUint32(d + 1, true);
    return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1, dpi: null };
  }
  if (chunk === 'VP8 ') return { width: v.getUint16(d + 6, true) & 0x3fff, height: v.getUint16(d + 8, true) & 0x3fff, dpi: null };
  throw new Error('Unknown WebP chunk');
}

const gif = (bytes: Uint8Array): RasterInfo => ({ width: view(bytes).getUint16(6, true), height: view(bytes).getUint16(8, true), dpi: null });

export const RASTER_FORMATS = new Set<ArtworkFormat>(['png', 'jpeg', 'tiff', 'psd', 'webp', 'gif']);

export function readRaster(bytes: Uint8Array, format: ArtworkFormat): RasterInfo {
  switch (format) {
    case 'png':
      return png(bytes);
    case 'jpeg':
      return jpeg(bytes);
    case 'tiff':
      return tiffIfd0(view(bytes), 0);
    case 'psd':
      return psd(bytes);
    case 'webp':
      return webp(bytes);
    case 'gif':
      return gif(bytes);
    default:
      throw new Error(`Not a raster format: ${format}`);
  }
}

// Application defaults that say nothing about the intended print size.
const DEFAULT_DPIS = [72, 96];
const round2 = (n: number) => Math.round(n * 100) / 100;

/** Turns raster metadata into a page, unless the resolution is missing or an application default. */
export function rasterPages(info: RasterInfo): { pages: ArtworkPage[]; warnings: ArtworkWarning[]; dpi: RasterInfo['dpi'] } {
  if (!info.dpi) return { pages: [], warnings: [{ code: 'raster-no-dpi' }], dpi: null };
  const dpi = { x: round2(info.dpi.x), y: round2(info.dpi.y) };
  const size = toSize((info.width / info.dpi.x) * MM_PER_INCH, (info.height / info.dpi.y) * MM_PER_INCH);
  if ([info.dpi.x, info.dpi.y].some((d) => DEFAULT_DPIS.some((def) => Math.abs(d - def) < 0.5))) {
    return { pages: [], warnings: [{ code: 'raster-default-dpi', dpi: Math.round(info.dpi.x), sizeIfTrusted: size }], dpi };
  }
  return {
    pages: [{ index: 1, size, sizeSource: 'dpi', printSize: size, bleedMm: null, rotation: 0, contentKey: null }],
    warnings: [],
    dpi,
  };
}
