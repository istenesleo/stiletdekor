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

function bmpFile(width: number, height: number, pxPerMetre: number): Uint8Array {
  const header = [...u32le(40), ...u32le(width), ...u32le(height), ...u16le(1), ...u16le(24), ...u32le(0), ...u32le(0)];
  return bytes(ascii('BM'), u32le(54), [0, 0, 0, 0], u32le(54), header, u32le(pxPerMetre), u32le(pxPerMetre), u32le(0), u32le(0));
}

describe('BMP', () => {
  it('reads the resolution from the header (pixels per metre), also for top-down bitmaps', async () => {
    const result = await analyzeArtwork(bmpFile(3543, -1181, ppm(150)), 'tabla.bmp');
    expect(result).toMatchObject({ format: 'bmp', pixels: { width: 3543, height: 1181 }, confidence: 'metadata' });
    expect(result.pages[0]?.size).toEqual(mm(599.9, 200));
  });

  it('treats the Windows default of 96 dpi as no size, and reads the old OS/2 header', async () => {
    expect((await analyzeArtwork(bmpFile(800, 600, 3780), 'kep.bmp')).warnings.map((w) => w.code)).toEqual(['raster-default-dpi']);
    const os2 = bytes(ascii('BM'), u32le(26), [0, 0, 0, 0], u32le(26), u32le(12), u16le(640), u16le(480), u16le(1), u16le(24));
    const result = await analyzeArtwork(os2, 'regi.bmp');
    expect(result).toMatchObject({ format: 'bmp', pixels: { width: 640, height: 480 }, pages: [] });
    expect(result.warnings).toEqual([{ code: 'raster-no-dpi' }]);
  });
});

// ISO base media boxes, as in HEIC (iPhone) and AVIF files.
const box = (type: string, ...content: number[][]) => [...u32be(content.flat().length + 8), ...ascii(type), ...content.flat()];
const fullBox = (type: string, ...content: number[][]) => box(type, [0, 0, 0, 0], ...content);
const ispe = (width: number, height: number) => fullBox('ispe', u32be(width), u32be(height));

function heif(
  brands: readonly string[],
  properties: number[][],
  primary?: { item: number; associations: readonly (readonly [item: number, propertyIndexes: readonly number[]])[] },
): Uint8Array {
  const [major = 'heic', ...compatible] = brands;
  const ipma = primary
    ? fullBox(
        'ipma',
        u32be(primary.associations.length),
        ...primary.associations.map(([item, indexes]) => [...u16be(item), indexes.length, ...indexes.map((i) => 0x80 | i)]),
      )
    : [];
  const meta = fullBox(
    'meta',
    fullBox('hdlr', u32be(0), ascii('pict'), u32be(0), u32be(0), u32be(0), [0]),
    primary ? fullBox('pitm', u16be(primary.item)) : [],
    box('iprp', box('ipco', ...properties), ipma),
  );
  return bytes(box('ftyp', ascii(major), u32be(0), ...compatible.map(ascii)), meta, box('mdat', [0, 0, 0, 0]));
}

describe('HEIC and AVIF', () => {
  // An iPhone photo: 512 × 512 tiles, a 4032 × 3024 grid as the primary item, turned a quarter (irot 1).
  const tiles = ispe(512, 512);
  const grid = ispe(4032, 3024);
  const quarterTurn = box('irot', [1]);

  it('reads the primary image, not a tile or the thumbnail, and applies its rotation', async () => {
    const file = heif(['heic', 'mif1', 'heic'], [box('hvcC', [1]), tiles, grid, quarterTurn, ispe(320, 240)], {
      item: 49,
      associations: [
        [1, [1, 2]],
        [49, [3, 4]],
        [50, [1, 5]],
      ],
    });
    const result = await analyzeArtwork(file, 'IMG_0412.HEIC');
    expect(result).toMatchObject({ format: 'heic', pixels: { width: 3024, height: 4032 }, pages: [], confidence: 'none' });
    expect(result.warnings).toEqual([{ code: 'raster-no-dpi' }]);
  });

  it('falls back to the largest image when the item associations are missing', async () => {
    const result = await analyzeArtwork(heif(['mif1', 'heic'], [tiles, grid]), 'foto.heif');
    expect(result.pixels).toEqual({ width: 4032, height: 3024 });
  });

  it('tells AVIF from HEIC by its brand', async () => {
    const file = heif(['avif', 'mif1', 'miaf'], [ispe(1920, 1080)], { item: 1, associations: [[1, [1]]] });
    expect(await analyzeArtwork(file, 'kep.avif')).toMatchObject({ format: 'avif', pixels: { width: 1920, height: 1080 } });
  });

  it('reports a file without image properties as unreadable', async () => {
    const result = await analyzeArtwork(bytes(box('ftyp', ascii('heic'), u32be(0), ascii('mif1'))), 'hibas.heic');
    expect(result.format).toBe('heic');
    expect(result.warnings.map((w) => w.code)).toEqual(['unreadable']);
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
