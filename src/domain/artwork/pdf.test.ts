import { PDFDocument, PDFName, PDFNumber, degrees, drawObject, popGraphicsState, pushGraphicsState, rgb, type PDFPage } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { analyzeArtwork, groupIdenticalSurfaces, totalAreaM2 } from './index';

const PT = 72 / 25.4; // points per mm

async function pdf(setup: (doc: PDFDocument) => void | Promise<void>, title?: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  await setup(doc);
  if (title) doc.setTitle(title);
  return doc.save();
}

/** A page of the given size in mm with a drawing that differs per design number. */
function addPage(doc: PDFDocument, widthMm: number, heightMm: number, design = 0): PDFPage {
  const page = doc.addPage([widthMm * PT, heightMm * PT]);
  page.drawRectangle({ x: 5 + design, y: 5, width: 10 + design * 2, height: 10, color: rgb((design % 7) / 7, 0.2, 0.4) });
  return page;
}

const only = async (bytes: Uint8Array, name = 'terv.pdf') => {
  const result = await analyzeArtwork(bytes, name);
  expect(result.pages).toHaveLength(1);
  return { result, page: result.pages[0]! };
};

describe('PDF page boxes', () => {
  it('reads an A4 MediaBox', async () => {
    const { result, page } = await only(await pdf((d) => void addPage(d, 210, 297)));
    expect(result.format).toBe('pdf');
    expect(result.confidence).toBe('exact');
    expect(page.size).toEqual({ widthMm: 210, heightMm: 297 });
    expect(page.sizeSource).toBe('mediabox');
    expect(page.bleedMm).toBeNull();
  });

  it('uses the TrimBox as the product size and reports a uniform bleed', async () => {
    const bytes = await pdf((d) => {
      const page = addPage(d, 600, 847);
      page.setBleedBox(0, 0, 600 * PT, 847 * PT);
      page.setTrimBox(3 * PT, 3 * PT, 594 * PT, 841 * PT);
    });
    const { page } = await only(bytes);
    expect(page.size).toEqual({ widthMm: 594, heightMm: 841 });
    expect(page.sizeSource).toBe('trimbox');
    expect(page.printSize).toEqual({ widthMm: 600, heightMm: 847 });
    expect(page.bleedMm).toBe(3);
  });

  it('keeps the TrimBox size but reports no bleed when the margins differ', async () => {
    const bytes = await pdf((d) => void addPage(d, 600, 850).setTrimBox(3 * PT, 5 * PT, 594 * PT, 841 * PT));
    const { page } = await only(bytes);
    expect(page.size).toEqual({ widthMm: 594, heightMm: 841 });
    expect(page.bleedMm).toBeNull();
  });

  it('swaps width and height for /Rotate 90 and -270', async () => {
    const bytes = await pdf((d) => {
      addPage(d, 300, 100).setRotation(degrees(90));
      addPage(d, 300, 100, 1).node.set(PDFName.of('Rotate'), PDFNumber.of(-270));
    });
    const result = await analyzeArtwork(bytes, 'x.pdf');
    for (const page of result.pages) {
      expect(page.size).toEqual({ widthMm: 100, heightMm: 300 });
      expect(page.rotation).toBe(90);
    }
  });

  it('multiplies by /UserUnit (large-canvas Illustrator files)', async () => {
    const bytes = await pdf((d) => void addPage(d, 300, 100).node.set(PDFName.of('UserUnit'), PDFNumber.of(10)));
    const { page } = await only(bytes);
    expect(page.size).toEqual({ widthMm: 3000, heightMm: 1000 });
  });

  it('inherits MediaBox and Rotate from the page tree', async () => {
    const bytes = await pdf((d) => {
      const page = addPage(d, 50, 50);
      page.node.delete(PDFName.of('MediaBox'));
      d.catalog.Pages().set(PDFName.of('MediaBox'), d.context.obj([0, 0, 210 * PT, 297 * PT]));
      d.catalog.Pages().set(PDFName.of('Rotate'), PDFNumber.of(90));
    });
    const { page } = await only(bytes);
    expect(page.size).toEqual({ widthMm: 297, heightMm: 210 });
    expect(page.rotation).toBe(90);
    expect(page.sizeSource).toBe('mediabox');
  });

  it('normalizes reversed and negative-origin rectangles', async () => {
    const bytes = await pdf((d) => {
      addPage(d, 10, 10).node.set(PDFName.of('MediaBox'), d.context.obj([300 * PT, 100 * PT, 0, 0]));
      addPage(d, 10, 10, 1).node.set(PDFName.of('MediaBox'), d.context.obj([-150 * PT, -50 * PT, 150 * PT, 50 * PT]));
    });
    const result = await analyzeArtwork(bytes, 'x.pdf');
    expect(result.pages.map((p) => p.size)).toEqual([
      { widthMm: 300, heightMm: 100 },
      { widthMm: 300, heightMm: 100 },
    ]);
  });

  it('uses a CropBox that is smaller than the MediaBox', async () => {
    const bytes = await pdf((d) => void addPage(d, 300, 200).setCropBox(10 * PT, 10 * PT, 280 * PT, 180 * PT));
    const { page } = await only(bytes);
    expect(page.size).toEqual({ widthMm: 280, heightMm: 180 });
    expect(page.sizeSource).toBe('cropbox');
  });

  it('reads Illustrator files saved with PDF compatibility', async () => {
    const { result, page } = await only(await pdf((d) => void addPage(d, 850, 2000)), 'rollup.ai');
    expect(result.format).toBe('ai');
    expect(page.size).toEqual({ widthMm: 850, heightMm: 2000 });
  });

  it('flags encrypted PDFs but still reads their boxes', async () => {
    const bytes = await pdf((d) => {
      addPage(d, 210, 297);
      d.context.trailerInfo.Encrypt = d.context.obj({ Filter: 'Standard' });
    });
    const result = await analyzeArtwork(bytes, 'x.pdf');
    expect(result.warnings).toContainEqual({ code: 'pdf-encrypted' });
    expect(result.pages[0]?.size).toEqual({ widthMm: 210, heightMm: 297 });
  });

  it('does not throw on a truncated file', async () => {
    const bytes = (await pdf((d) => void addPage(d, 210, 297))).subarray(0, 60);
    const result = await analyzeArtwork(bytes, 'x.pdf');
    expect(result.format).toBe('pdf');
    expect(result.pages).toEqual([]);
    expect(result.confidence).toBe('none');
    expect(result.warnings.some((w) => w.code === 'unreadable')).toBe(true);
  });
});

describe('identical surfaces', () => {
  it('groups pages with the same drawing and keeps different ones apart', async () => {
    const bytes = await pdf((d) => {
      addPage(d, 100, 100, 1);
      addPage(d, 100, 100, 2);
      addPage(d, 100, 100, 1);
      addPage(d, 100, 100, 3);
    });
    const result = await analyzeArtwork(bytes, 'x.pdf');
    const keys = result.pages.map((p) => p.contentKey);
    expect(keys[0]).toBe(keys[2]);
    expect(new Set(keys).size).toBe(3);
    expect(groupIdenticalSurfaces(result.pages).map((g) => g.pages)).toEqual([[1, 3], [2], [4]]);
  });

  it('tells apart pages that draw different images under the same resource name', async () => {
    const bytes = await pdf((d) => {
      for (const path of ['0 0 m 10 10 l S', '0 0 m 10 0 l S']) {
        const form = d.context.register(
          d.context.flateStream(path, { Type: 'XObject', Subtype: 'Form', BBox: [0, 0, 10, 10] }),
        );
        const page = d.addPage([100, 100]);
        page.node.setXObject(PDFName.of('X0'), form);
        page.pushOperators(pushGraphicsState(), drawObject('X0'), popGraphicsState());
      }
    });
    const result = await analyzeArtwork(bytes, 'x.pdf');
    expect(result.pages[0]?.contentKey).not.toBe(result.pages[1]?.contentKey);
  });

  it('reproduces a real window-film job: 22 surfaces, 14 designs, 6.457 m²', async () => {
    const sizes = [
      [840, 1097], [665, 1160], [665, 1160], [440, 335], [440, 335], [440, 335], [435, 335], [435, 335],
      [435, 335], [435, 335], [435, 335], [435, 335], [440, 335], [440, 335], [440, 335], [440, 570],
      [665, 570], [435, 570], [840, 570], [435, 570], [665, 570], [440, 570],
    ] as const;
    const sameDesign = [[4, 5, 13, 14], [8, 9, 11, 12], [17, 21], [18, 20]];
    const designOf = (page: number) => {
      const group = sameDesign.findIndex((g) => g.includes(page));
      return group >= 0 ? 100 + group : page;
    };
    const bytes = await pdf((d) => {
      sizes.forEach(([w, h], i) => void addPage(d, w, h, designOf(i + 1)));
    }, 'HajWellness Szalon — C változat (Gyűrű a homlokzaton) — felületenként, 1:1, 10 mm ráhagyással');
    const result = await analyzeArtwork(bytes, 'C-valtozat-feluletenkent.pdf');
    expect(result.pages.map((p) => [p.size.widthMm, p.size.heightMm])).toEqual(sizes.map(([w, h]) => [w, h]));
    const groups = groupIdenticalSurfaces(result.pages);
    expect(groups).toHaveLength(14);
    for (const pages of sameDesign) expect(groups.map((g) => g.pages)).toContainEqual(pages);
    expect(totalAreaM2(result.pages)).toBe(6.457);
    expect(result.hints).toMatchObject({ scale: 1, bleedMmFromText: 10 });
  });
});
