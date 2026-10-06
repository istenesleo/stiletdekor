import { describe, expect, it } from 'vitest';
import {
  ISO_A_FORMATS,
  applyScale,
  groupIdenticalSurfaces,
  matchStandardFormat,
  parseBleedHint,
  parseScaleHint,
  suggestScale,
  totalAreaM2,
  type ArtworkPage,
} from './index';

const mm = (widthMm: number, heightMm: number) => ({ widthMm, heightMm });

describe('parseScaleHint', () => {
  it.each([
    ['molino_M1-10.pdf', 10],
    ['molino M1_10.pdf', 10],
    ['molino_1_10.pdf', 10],
    ['Molino M 1:20', 20],
    ['m=1:10', 10],
    ['terv 1:50 nyomdai.pdf', 50],
    ['scale 1-25', 25],
    ['Méretarány 1:5', 5],
    ['meretarany_1-100', 100],
    ['felületenként, 1:1, 10 mm ráhagyással', 1],
    ['1:3 vázlat, végleges M1-10', 10], // an unusual ratio is skipped, the next explicit one counts
  ])('%s → %s', (text, scale) => {
    expect(parseScaleHint(text)).toBe(scale);
  });

  it.each([
    'plakat-1-10.pdf', // a bare hyphen: page range or revision
    '2024_1_10_molino.pdf', // a date
    'molino_1_10_2024.pdf',
    'v1_10.pdf',
    'nyitva 11:10-ig',
    'arany 1:3',
    'M1:1000',
    'IMG_0001.jpg',
    'program1-10',
    '',
  ])('ignores %j', (text) => {
    expect(parseScaleHint(text)).toBeNull();
  });
});

describe('parseBleedHint', () => {
  it.each([
    ['10 mm ráhagyással', 10],
    ['3 mm-es kifutóval', 3],
    ['3mm bleed', 3],
    ['bleed 3mm', 3],
    ['Ráhagyás: 2,5 mm', 2.5],
    ['molino_10mm_rahagyassal.pdf', 10],
    ['plakat_Bleed_5mm.pdf', 5],
    ['300x100mm_bleed3mm.pdf', 3], // the 100 belongs to the size
    ['A1 594 × 841 mm kifutó 3 mm', 3],
  ])('%s → %s', (text, bleed) => {
    expect(parseBleedHint(text)).toBe(bleed);
  });

  it.each(['ráhagyás nélkül', '300x100mm.pdf', 'kifutó', ''])('ignores %j', (text) => {
    expect(parseBleedHint(text)).toBeNull();
  });
});

describe('suggestScale', () => {
  it('follows an explicit hint; 1:1 means "do not scale"', () => {
    expect(suggestScale(mm(300, 100), 500, 10)).toBe(10);
    expect(suggestScale(mm(30, 10), 500, 1)).toBeNull();
  });

  it('suggests 1:10 when the file is below the product minimum and ten times it is not', () => {
    expect(suggestScale(mm(300, 100), 500, null)).toBe(10);
    expect(suggestScale(mm(100, 300), 500, null)).toBe(10);
  });

  it('suggests nothing when the size is already fine or 1:10 would still be too small', () => {
    expect(suggestScale(mm(600, 200), 500, null)).toBeNull();
    expect(suggestScale(mm(30, 10), 500, null)).toBeNull();
  });

  it('applyScale gives the real size, rounded to 0.1 mm', () => {
    expect(applyScale(mm(29.7, 21), 10)).toEqual(mm(297, 210));
    expect(applyScale(mm(84.13, 109.77), 10)).toEqual(mm(841.3, 1097.7));
  });
});

describe('matchStandardFormat', () => {
  it.each([
    [mm(594, 841), { id: 'a1', rotated: false, bleedMm: 0 }],
    [mm(841, 594), { id: 'a1', rotated: true, bleedMm: 0 }],
    [mm(594.8, 840.4), { id: 'a1', rotated: false, bleedMm: 0 }],
    [mm(595, 842), { id: 'a1', rotated: false, bleedMm: 0 }], // exactly 1 mm off
    [mm(600, 847), { id: 'a1', rotated: false, bleedMm: 3 }],
    [mm(614, 861), { id: 'a1', rotated: false, bleedMm: 10 }],
    [mm(303, 216), { id: 'a4', rotated: true, bleedMm: 3 }],
    [mm(1189, 841), { id: 'a0', rotated: true, bleedMm: 0 }],
  ])('%j → %j', (size, match) => {
    expect(matchStandardFormat(size, ISO_A_FORMATS)).toEqual(match);
  });

  it.each([mm(596, 841), mm(594, 843.5), mm(500, 700)])('finds no format for %j', (size) => {
    expect(matchStandardFormat(size, ISO_A_FORMATS)).toBeNull();
  });

  it('prefers no bleed over a format that would need one', () => {
    const formats = [
      { id: 'kisebb', widthMm: 94, heightMm: 94 },
      { id: 'pontos', widthMm: 100, heightMm: 100 },
    ];
    expect(matchStandardFormat(mm(100, 100), formats)).toEqual({ id: 'pontos', rotated: false, bleedMm: 0 });
  });

  it('accepts other format lists, bleeds and tolerances', () => {
    const posters = [{ id: '50x70', widthMm: 500, heightMm: 700 }];
    expect(matchStandardFormat(mm(506, 706), posters)).toEqual({ id: '50x70', rotated: false, bleedMm: 3 });
    expect(matchStandardFormat(mm(600, 847), ISO_A_FORMATS, { bleedsMm: [0] })).toBeNull();
    expect(matchStandardFormat(mm(594.8, 840.4), ISO_A_FORMATS, { toleranceMm: 0.1 })).toBeNull();
  });
});

describe('surfaces', () => {
  const page = (index: number, widthMm: number, heightMm: number, contentKey: string | null): ArtworkPage => ({
    index,
    size: mm(widthMm, heightMm),
    sizeSource: 'mediabox',
    printSize: mm(widthMm, heightMm),
    bleedMm: null,
    rotation: 0,
    contentKey,
  });

  it('groups only pages with the same size and the same content', () => {
    const groups = groupIdenticalSurfaces([
      page(1, 100, 100, 'a'),
      page(2, 100, 200, 'a'), // same drawing, different size
      page(3, 100, 100, 'b'),
      page(4, 100, 100, 'a'),
    ]);
    expect(groups).toEqual([
      { pages: [1, 4], size: mm(100, 100), quantity: 2, areaM2: 0.02 },
      { pages: [2], size: mm(100, 200), quantity: 1, areaM2: 0.02 },
      { pages: [3], size: mm(100, 100), quantity: 1, areaM2: 0.01 },
    ]);
  });

  it('never groups pages without a content key (non-PDF sources)', () => {
    const groups = groupIdenticalSurfaces([page(1, 100, 100, null), page(2, 100, 100, null)]);
    expect(groups.map((g) => g.pages)).toEqual([[1], [2]]);
  });

  it('sums the area of every page, rounded to 0.001 m²', () => {
    expect(totalAreaM2([page(1, 840, 1097, 'a'), page(2, 665, 1160, 'b'), page(3, 665, 1160, 'b')])).toBe(2.464);
    expect(totalAreaM2([])).toBe(0);
  });
});
