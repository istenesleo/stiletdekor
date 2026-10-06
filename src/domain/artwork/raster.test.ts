import { describe, expect, it } from 'vitest';
import { analyzeArtwork } from './index';

// Synthetic files: headers and metadata only, built byte by byte. Only what the reader looks at is real.

const ascii = (s: string): number[] => [...s].map((c) => c.charCodeAt(0));
const u16be = (n: number) => [(n >>> 8) & 0xff, n & 0xff];
const u32be = (n: number) => [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff];
const u16le = (n: number) => [n & 0xff, (n >>> 8) & 0xff];
const u24le = (n: number) => [n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff];
const u32le = (n: number) => [n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff];
const bytes = (...parts: number[][]): Uint8Array => Uint8Array.from(parts.flat());

/** Pixels per metre for a resolution in dpi, as PNG stores it. */
const ppm = (dpi: number) => Math.round(dpi / 0.0254);

function png(width: number, height: number, phys?: { x: number; y: number; unit: number }): Uint8Array {
  const chunk = (type: string, data: number[] = []) => [...u32be(data.length), ...ascii(type), ...data, 0, 0, 0, 0];
  return bytes(
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    chunk('IHDR', [...u32be(width), ...u32be(height), 8, 2, 0, 0, 0]),
    phys ? chunk('pHYs', [...u32be(phys.x), ...u32be(phys.y), phys.unit]) : [],
    chunk('IDAT', [0x78, 0x9c, 0x03, 0x00, 0x00, 0x00, 0x00, 0x01]),
    chunk('IEND'),
  );
}

type TiffValue = { short: number } | { long: number } | { rational: readonly [number, number] };

function tiff(order: 'II' | 'MM', entries: readonly (readonly [tag: number, value: TiffValue])[]): number[] {
  const u16 = order === 'II' ? u16le : u16be;
  const u32 = order === 'II' ? u32le : u32be;
  const dataStart = 8 + 2 + entries.length * 12 + 4;
  const ifd = [...u16(entries.length)];
  const data: number[] = [];
  for (const [tag, value] of entries) {
    if ('short' in value) ifd.push(...u16(tag), ...u16(3), ...u32(1), ...u16(value.short), 0, 0);
    else if ('long' in value) ifd.push(...u16(tag), ...u16(4), ...u32(1), ...u32(value.long));
    else {
      ifd.push(...u16(tag), ...u16(5), ...u32(1), ...u32(dataStart + data.length));
      data.push(...u32(value.rational[0]), ...u32(value.rational[1]));
    }
  }
  return [...ascii(order), ...u16(42), ...u32(8), ...ifd, ...u32(0), ...data];
}

/** XResolution, YResolution and ResolutionUnit (2 = inch, 3 = cm) as a TIFF IFD0 or Exif block holds them. */
const resolutionTags = (rational: readonly [number, number], unit?: number) =>
  [
    [282, { rational }],
    [283, { rational }],
    ...(unit === undefined ? [] : [[296, { short: unit }] as const]),
  ] as const;

/** One Photoshop image resource; the name is empty and the data padded to an even length. */
const irb = (id: number, data: number[], signature = '8BIM') => [
  ...ascii(signature),
  ...u16be(id),
  0,
  0,
  ...u32be(data.length),
  ...data,
  ...(data.length % 2 ? [0] : []),
];
const fixed = (n: number) => u32be(Math.round(n * 65536));
/** ResolutionInfo (0x03ED): always pixels per inch; the unit fields (here cm) only affect Photoshop's display. */
const resolutionInfo = (dpi: number) => irb(0x03ed, [...fixed(dpi), 0, 2, 0, 2, ...fixed(dpi), 0, 2, 0, 2]);
const iptc = irb(0x0404, [0x1c, 0x02, 0x00, 0x00, 0x00]); // odd length: tests the padding

interface JpegMeta {
  jfif?: readonly [units: number, x: number, y: number];
  exif?: number[];
  photoshop?: number[];
}

function jpeg(width: number, height: number, { jfif, exif, photoshop }: JpegMeta = {}): Uint8Array {
  const segment = (marker: number, payload: number[]) => [0xff, marker, ...u16be(payload.length + 2), ...payload];
  return bytes(
    [0xff, 0xd8],
    jfif ? segment(0xe0, [...ascii('JFIF\0'), 1, 2, jfif[0], ...u16be(jfif[1]), ...u16be(jfif[2]), 0, 0]) : [],
    exif ? segment(0xe1, [...ascii('Exif\0\0'), ...exif]) : [],
    photoshop ? segment(0xed, [...ascii('Photoshop 3.0\0'), ...photoshop]) : [],
    segment(0xdb, Array.from({ length: 65 }, () => 1)), // quantization table, skipped
    segment(0xc0, [8, ...u16be(height), ...u16be(width), 1, 1, 0x11, 0]),
    segment(0xda, [1, 1, 0, 0, 0x3f, 0]),
    [0x12, 0x34, 0xff, 0x00, 0x56, 0xff, 0xd9],
  );
}

function psd(width: number, height: number, resources: number[], version = 1): Uint8Array {
  return bytes(
    ascii('8BPS'),
    u16be(version),
    [0, 0, 0, 0, 0, 0],
    u16be(3),
    u32be(height),
    u32be(width),
    u16be(8),
    u16be(3),
    u32be(0), // color mode data
    u32be(resources.length),
    resources,
    u32be(0), // layer and mask information
    u16be(0),
  );
}

function webp(chunk: string, data: number[]): Uint8Array {
  const body = [...ascii('WEBP'), ...ascii(chunk), ...u32le(data.length), ...data, ...(data.length % 2 ? [0] : [])];
  return bytes(ascii('RIFF'), u32le(body.length), body);
}

const mm = (widthMm: number, heightMm: number) => ({ widthMm, heightMm });

describe('PNG', () => {
  it('reads the size from the pHYs resolution (pixels per metre)', async () => {
    // 600 × 200 mm at 150 dpi: 3543 × 1181 px, 5906 px/m
    const result = await analyzeArtwork(png(3543, 1181, { x: ppm(150), y: ppm(150), unit: 1 }), 'molino.png');
    expect(result).toMatchObject({
      format: 'png',
      pixels: { width: 3543, height: 1181 },
      dpi: { x: 150.01, y: 150.01 },
      confidence: 'metadata',
      warnings: [],
    });
    expect(result.pages).toEqual([
      { index: 1, size: mm(599.9, 200), sizeSource: 'dpi', printSize: mm(599.9, 200), bleedMm: null, rotation: 0, contentKey: null },
    ]);
  });

  it('gives no size without a resolution, or with an aspect ratio only (unit 0)', async () => {
    for (const file of [png(3543, 1181), png(3543, 1181, { x: 1, y: 1, unit: 0 })]) {
      const result = await analyzeArtwork(file, 'kep.png');
      expect(result).toMatchObject({ pages: [], dpi: null, confidence: 'none', pixels: { width: 3543, height: 1181 } });
      expect(result.warnings).toEqual([{ code: 'raster-no-dpi' }]);
    }
  });

  it.each([
    [72, 2835, mm(254, 127)],
    [96, 3780, mm(190.5, 95.2)],
  ])('treats %s dpi as an application default: size only as a suggestion', async (dpi, pxPerMetre, sizeIfTrusted) => {
    const result = await analyzeArtwork(png(720, 360, { x: pxPerMetre, y: pxPerMetre, unit: 1 }), 'kep.png');
    expect(result.pages).toEqual([]);
    expect(result.confidence).toBe('none');
    expect(result.warnings).toEqual([{ code: 'raster-default-dpi', dpi, sizeIfTrusted }]);
  });

  it('reports a damaged file instead of throwing', async () => {
    const result = await analyzeArtwork(png(100, 100).subarray(0, 12), 'kep.png');
    expect(result).toMatchObject({ format: 'png', pages: [], confidence: 'none' });
    expect(result.warnings.map((w) => w.code)).toEqual(['unreadable']);
  });
});

describe('JPEG', () => {
  it.each([
    ['dots per inch', [1, 254, 254] as const],
    ['dots per cm', [2, 100, 100] as const],
  ])('reads the JFIF density in %s', async (_label, jfif) => {
    const result = await analyzeArtwork(jpeg(3000, 1000, { jfif }), 'foto.jpg');
    expect(result.format).toBe('jpeg');
    expect(result.dpi).toEqual({ x: 254, y: 254 });
    expect(result.pages[0]?.size).toEqual(mm(300, 100));
  });

  it('falls back to Exif when JFIF only gives an aspect ratio (little-endian, inches)', async () => {
    const exif = tiff('II', resolutionTags([300, 1], 2));
    const result = await analyzeArtwork(jpeg(3543, 2362, { jfif: [0, 1, 1], exif }), 'foto.jpg');
    expect(result.dpi).toEqual({ x: 300, y: 300 });
    expect(result.pages[0]?.size).toEqual(mm(300, 200));
  });

  it('reads Exif without JFIF (big-endian, centimetres)', async () => {
    const exif = tiff('MM', resolutionTags([100, 1], 3));
    const result = await analyzeArtwork(jpeg(3000, 1000, { exif }), 'foto.jpg');
    expect(result.dpi).toEqual({ x: 254, y: 254 });
    expect(result.pages[0]?.size).toEqual(mm(300, 100));
  });

  // 600 × 300 mm in 2000 × 1000 px is 84.667 dpi. JFIF can only store 85, which would give 597.6 × 298.8 mm.
  const fractionalDpi = 2000 / (600 / 25.4);

  it('takes the fractional resolution from Photoshop when it agrees with the rounded JFIF one', async () => {
    const result = await analyzeArtwork(
      jpeg(2000, 1000, { jfif: [1, 85, 85], photoshop: [...iptc, ...resolutionInfo(fractionalDpi)] }),
      'plakat.jpg',
    );
    expect(result.dpi).toEqual({ x: 84.67, y: 84.67 });
    expect(result.pages[0]?.size).toEqual(mm(600, 300));
  });

  it('takes the fractional resolution from Exif when it agrees with the rounded JFIF one', async () => {
    const exif = tiff('MM', resolutionTags([Math.round(fractionalDpi * 10000), 10000], 2));
    const result = await analyzeArtwork(jpeg(2000, 1000, { jfif: [1, 85, 85], exif }), 'plakat.jpg');
    expect(result.pages[0]?.size).toEqual(mm(600, 300));
  });

  it('ignores Exif and Photoshop resolutions that contradict JFIF (stale, e.g. from the camera)', async () => {
    const exif = tiff('II', resolutionTags([72, 1], 2));
    const result = await analyzeArtwork(
      jpeg(3543, 2362, { jfif: [1, 300, 300], exif, photoshop: resolutionInfo(150) }),
      'foto.jpg',
    );
    expect(result.dpi).toEqual({ x: 300, y: 300 });
    expect(result.pages[0]?.size).toEqual(mm(300, 200));
  });

  it('treats 72 dpi as an application default', async () => {
    const result = await analyzeArtwork(jpeg(3000, 1000, { jfif: [1, 72, 72] }), 'foto.jpg');
    expect(result.pages).toEqual([]);
    expect(result.warnings).toEqual([{ code: 'raster-default-dpi', dpi: 72, sizeIfTrusted: mm(1058.3, 352.8) }]);
  });

  it('survives a damaged Exif block', async () => {
    const exif = [...ascii('II'), ...u16le(42), ...u32le(0xfff0)]; // IFD offset beyond the file
    const result = await analyzeArtwork(jpeg(3000, 1000, { jfif: [1, 254, 254], exif }), 'foto.jpg');
    expect(result.warnings).toEqual([]);
    expect(result.pages[0]?.size).toEqual(mm(300, 100));
  });

  it('reports a file without a frame header as unreadable', async () => {
    const result = await analyzeArtwork(bytes([0xff, 0xd8, 0xff, 0xd9]), 'foto.jpg');
    expect(result.warnings.map((w) => w.code)).toEqual(['unreadable']);
  });
});

describe('TIFF', () => {
  it('reads a little-endian file with the resolution in inches', async () => {
    const file = tiff('II', [[256, { long: 3000 }], [257, { long: 1000 }], ...resolutionTags([254, 1], 2)]);
    const result = await analyzeArtwork(Uint8Array.from(file), 'nyomat.tif');
    expect(result).toMatchObject({ format: 'tiff', pixels: { width: 3000, height: 1000 }, dpi: { x: 254, y: 254 } });
    expect(result.pages[0]?.size).toEqual(mm(300, 100));
  });

  it('reads a big-endian file with 16-bit dimensions and the resolution in centimetres', async () => {
    const file = tiff('MM', [[256, { short: 3000 }], [257, { short: 1000 }], ...resolutionTags([100, 1], 3)]);
    const result = await analyzeArtwork(Uint8Array.from(file), 'nyomat.tif');
    expect(result.pages[0]?.size).toEqual(mm(300, 100));
  });

  it('assumes inches when ResolutionUnit is missing, as the TIFF standard says', async () => {
    const file = tiff('II', [[256, { long: 3000 }], [257, { long: 1000 }], ...resolutionTags([254, 1])]);
    expect((await analyzeArtwork(Uint8Array.from(file), 'nyomat.tif')).pages[0]?.size).toEqual(mm(300, 100));
  });

  it('gives no size when the unit is "none"', async () => {
    const file = tiff('II', [[256, { long: 3000 }], [257, { long: 1000 }], ...resolutionTags([254, 1], 1)]);
    const result = await analyzeArtwork(Uint8Array.from(file), 'nyomat.tif');
    expect(result.pages).toEqual([]);
    expect(result.warnings).toEqual([{ code: 'raster-no-dpi' }]);
  });
});

describe('PSD', () => {
  it('reads ResolutionInfo after other resources', async () => {
    const result = await analyzeArtwork(psd(3000, 1000, [...iptc, ...resolutionInfo(254)]), 'terv.psd');
    expect(result).toMatchObject({ format: 'psd', pixels: { width: 3000, height: 1000 }, dpi: { x: 254, y: 254 } });
    expect(result.pages[0]?.size).toEqual(mm(300, 100));
  });

  it('reads large documents (PSB) the same way', async () => {
    const result = await analyzeArtwork(psd(30000, 10000, resolutionInfo(100), 2), 'molino.psb');
    expect(result.pages[0]?.size).toEqual(mm(7620, 2540));
  });

  it('gives no size without ResolutionInfo', async () => {
    const result = await analyzeArtwork(psd(3000, 1000, iptc), 'terv.psd');
    expect(result.pages).toEqual([]);
    expect(result.warnings).toEqual([{ code: 'raster-no-dpi' }]);
  });
});

describe('formats without a print resolution', () => {
  it.each([
    ['WebP (VP8X)', webp('VP8X', [0, 0, 0, 0, ...u24le(1199), ...u24le(799)]), 'webp', 1200, 800],
    ['WebP (VP8L)', webp('VP8L', [0x2f, ...u32le(639 | (479 << 14))]), 'webp', 640, 480],
    ['WebP (VP8)', webp('VP8 ', [0x30, 0x01, 0x00, 0x9d, 0x01, 0x2a, ...u16le(320), ...u16le(240)]), 'webp', 320, 240],
    ['GIF', bytes(ascii('GIF89a'), u16le(100), u16le(50), [0, 0, 0, 0x3b]), 'gif', 100, 50],
  ])('%s: pixel size only', async (_label, file, format, width, height) => {
    const result = await analyzeArtwork(file, 'kep');
    expect(result).toMatchObject({ format, pixels: { width, height }, pages: [], confidence: 'none' });
    expect(result.warnings).toEqual([{ code: 'raster-no-dpi' }]);
  });
});

describe('hints for raster files', () => {
  it('reads the scale and the bleed from the file name', async () => {
    const result = await analyzeArtwork(png(3543, 1181, { x: ppm(150), y: ppm(150), unit: 1 }), 'molino_M1-10_bleed_5mm.png');
    expect(result.hints).toEqual({ scale: 10, bleedMmFromText: 5, title: null });
  });
});
