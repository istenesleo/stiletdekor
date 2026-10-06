import { describe, expect, it } from 'vitest';
import { analyzeArtwork, detectArtworkFormat } from './index';

const text = (s: string): Uint8Array => new TextEncoder().encode(s);
const u32le = (n: number) => [n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff];
const mm = (widthMm: number, heightMm: number) => ({ widthMm, heightMm });

const eps = (lines: readonly string[], eol = '\n') =>
  text(['%!PS-Adobe-3.0 EPSF-3.0', '%%Creator: teszt', ...lines, '%%EOF'].join(eol));

/** DOS binary EPS: a 30-byte header pointing at the PostScript part; the preview comes first here. */
function dosEps(postScript: Uint8Array, preview: Uint8Array, psLength = postScript.length): Uint8Array {
  const header = [
    0xc5, 0xd0, 0xd3, 0xc6,
    ...u32le(30 + preview.length), ...u32le(psLength), // PostScript
    ...u32le(0), ...u32le(0), // no WMF preview
    ...u32le(30), ...u32le(preview.length), // TIFF preview
    0xff, 0xff,
  ];
  return Uint8Array.from([...header, ...preview, ...postScript]);
}

const svg = (attributes: string, body = '') =>
  text(`<svg xmlns="http://www.w3.org/2000/svg" ${attributes}>${body}</svg>`);

describe('EPS', () => {
  it('prefers %%HiResBoundingBox over the rounded %%BoundingBox', async () => {
    const result = await analyzeArtwork(eps(['%%BoundingBox: 0 0 851 284', '%%HiResBoundingBox: 0 0 850.3937 283.4646']), 'logo.eps');
    expect(result).toMatchObject({ format: 'eps', confidence: 'exact', warnings: [] });
    expect(result.pages).toEqual([
      { index: 1, size: mm(300, 100), sizeSource: 'bbox', printSize: mm(300, 100), bleedMm: null, rotation: 0, contentKey: null },
    ]);
  });

  it('uses %%BoundingBox (whole points) when there is no HiRes box, at any origin', async () => {
    for (const box of ['0 0 851 284', '100 200 951 484']) {
      const result = await analyzeArtwork(eps([`%%BoundingBox: ${box}`]), 'logo.eps');
      expect(result.pages[0]?.size).toEqual(mm(300.2, 100.2));
    }
  });

  it('follows (atend) to the trailer and takes the last box there', async () => {
    const lines = [
      '%%HiResBoundingBox: (atend)',
      '%%BoundingBox: 0 0 1684 2384',
      '%%EndComments',
      '%%HiResBoundingBox: 0 0 1 1', // inside an embedded document, overridden by the trailer
      '0 0 moveto',
      '%%Trailer',
      '%%HiResBoundingBox: 0 0 1683.7795 2383.937',
    ];
    const result = await analyzeArtwork(eps(lines, '\r\n'), 'plakat.eps');
    expect(result.pages[0]?.size).toEqual(mm(594, 841));
  });

  it('reads only the PostScript part of a DOS binary EPS, not its preview', async () => {
    const postScript = eps(['%%HiResBoundingBox: 0 0 850.3937 283.4646']);
    const preview = text('II*\0\n%%HiResBoundingBox: 0 0 1 1\n(preview data that happens to look like a DSC comment)');
    const result = await analyzeArtwork(dosEps(postScript, preview), 'logo.eps');
    expect(result.format).toBe('eps');
    expect(result.pages[0]?.size).toEqual(mm(300, 100));
  });

  it('reports a DOS EPS header that points outside the file', async () => {
    const postScript = eps(['%%BoundingBox: 0 0 851 284']);
    const result = await analyzeArtwork(dosEps(postScript, text('x'), postScript.length + 100), 'logo.eps');
    expect(result.pages).toEqual([]);
    expect(result.warnings.map((w) => w.code)).toEqual(['unreadable']);
  });

  it('gives no size without a usable bounding box', async () => {
    for (const lines of [[], ['%%BoundingBox: 0 0 0 0'], ['%%BoundingBox: (atend)']]) {
      const result = await analyzeArtwork(eps(lines), 'logo.eps');
      expect(result).toMatchObject({ pages: [], confidence: 'none' });
    }
  });

  it('does not size PostScript-only Illustrator files: their box is the artwork, not the artboard', async () => {
    const result = await analyzeArtwork(eps(['%%BoundingBox: 12 30 400 200']), 'regi-logo.ai');
    expect(result).toMatchObject({ format: 'ai', pages: [], confidence: 'none' });
    expect(result.warnings).toEqual([{ code: 'ai-without-pdf' }]);
  });
});

describe('SVG', () => {
  it.each([
    ['width="300mm" height="100mm" viewBox="0 0 300 100"', mm(300, 100)],
    ['width="30cm" height="10cm"', mm(300, 100)],
    ['width="2in" height="1.5in"', mm(50.8, 38.1)],
    ['width="850.3937pt" height="283.4646pt"', mm(300, 100)],
    ['width="12pc" height="6pc"', mm(50.8, 25.4)],
    ['width="1200q" height="400Q"', mm(300, 100)],
    ["width='3e2mm' height=' 100 mm '", mm(300, 100)],
  ])('reads absolute units: %s', async (attributes, size) => {
    const result = await analyzeArtwork(svg(attributes), 'matrica.svg');
    expect(result).toMatchObject({ format: 'svg', confidence: 'exact', warnings: [] });
    expect(result.pages[0]?.size).toEqual(size);
    expect(result.pages[0]?.sizeSource).toBe('svg-units');
  });

  it.each([
    'width="1200" height="400"',
    'width="1200px" height="400px"',
    'width="100%" height="100%"',
    'viewBox="0 0 300 100"',
    'width="300mm"',
    'width="0mm" height="100mm"',
  ])('does not guess relative or missing sizes: %s', async (attributes) => {
    const result = await analyzeArtwork(svg(attributes), 'matrica.svg');
    expect(result).toMatchObject({ pages: [], confidence: 'none' });
    expect(result.warnings).toEqual([{ code: 'svg-relative-units' }]);
  });

  it('reads only the root element and its own width and height', async () => {
    const root = svg('stroke-width="2mm" data-width="5mm" width="300mm" height="100mm"', '<rect width="999mm" height="1mm"/>');
    expect((await analyzeArtwork(root, 'a.svg')).pages[0]?.size).toEqual(mm(300, 100));
    const child = svg('width="10" height="10"', '<svg width="300mm" height="100mm"/>');
    expect((await analyzeArtwork(child, 'b.svg')).pages).toEqual([]);
  });

  it('finds the root after a BOM, XML declaration, comment and DOCTYPE', async () => {
    const file = text(
      '﻿<?xml version="1.0" encoding="UTF-8"?>\n<!-- Generator: Adobe Illustrator -->\n' +
        '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n' +
        '<svg version="1.1" width="420mm" height="297mm"></svg>',
    );
    const result = await analyzeArtwork(file, 'export');
    expect(result.format).toBe('svg');
    expect(result.pages[0]?.size).toEqual(mm(420, 297));
  });
});

describe('format detection', () => {
  const pdf = text('%PDF-1.7\n%âãÏÓ\n');
  const ps = text('%!PS-Adobe-3.0 EPSF-3.0\n');

  it.each([
    ['terv.pdf', 'pdf', pdf],
    ['terv.eps', 'pdf', pdf], // the content decides, not the extension
    ['Logo.AI ', 'ai', pdf],
    ['logo.eps', 'eps', ps],
    ['logo.ai', 'ai', ps],
    ['dos.eps', 'eps', Uint8Array.from([0xc5, 0xd0, 0xd3, 0xc6, 0, 0])],
    ['junk.pdf', 'pdf', text('junk before the header\n%PDF-1.4\n')],
    ['png.jpg', 'png', Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
    ['jpeg', 'jpeg', Uint8Array.from([0xff, 0xd8, 0xff, 0xe0])],
    ['ii.tif', 'tiff', text('II*\0')],
    ['mm.tif', 'tiff', text('MM\0*')],
    ['kep.psd', 'psd', text('8BPS')],
    ['kep.webp', 'webp', text('RIFF\0\0\0\0WEBPVP8 ')],
    ['kep.gif', 'gif', text('GIF87a')],
    ['html.svg', 'unknown', text('<!DOCTYPE html><html></html>')],
    ['', 'unknown', new Uint8Array(0)],
  ] as const)('%s → %s', (name, format, bytes) => {
    expect(detectArtworkFormat(bytes, name)).toBe(format);
  });
});
