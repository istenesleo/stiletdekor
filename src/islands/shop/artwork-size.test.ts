import { describe, expect, it } from 'vitest';
import type { ArtworkAnalysis, ArtworkPage } from '@/domain/artwork/types';
import { artworkDetail, artworkSizeFor, preflightSummary } from './artwork-size';

const page = (widthMm: number, heightMm: number, index = 1): ArtworkPage => ({
  index,
  size: { widthMm, heightMm },
  sizeSource: 'trimbox',
  printSize: { widthMm, heightMm },
  bleedMm: null,
  rotation: 0,
  contentKey: null,
});

const analysis = (pages: ArtworkPage[], extra: Partial<ArtworkAnalysis> = {}): ArtworkAnalysis => ({
  format: 'pdf',
  pages,
  pixels: null,
  dpi: null,
  confidence: pages.length ? 'exact' : 'none',
  hints: { scale: null, bleedMmFromText: null, title: null },
  warnings: [],
  ...extra,
});

describe('artworkSizeFor', () => {
  it('takes the size of the first page, in whole millimetres', () => {
    expect(artworkSizeFor('molino', analysis([page(2000.04, 1000)]))).toEqual({ widthCm: 200, heightCm: 100, scale: null, multiPage: false });
    expect(artworkSizeFor('molino', analysis([page(1000, 500), page(1000, 500, 2)]))?.multiPage).toBe(true);
    expect(artworkSizeFor('molino', analysis([]))).toBeNull();
  });

  it('scales a 1:10 drawing up, as the file name says or when it is below the minimum', () => {
    expect(artworkSizeFor('molino', analysis([page(300, 100)], { hints: { scale: 10, bleedMmFromText: null, title: null } }))).toMatchObject({
      widthCm: 300,
      heightCm: 100,
      scale: 10,
    });
    expect(artworkSizeFor('rollup', analysis([page(85, 200)]))).toMatchObject({ formatId: '85x200', scale: 10 });
  });

  it('finds the standard poster, canvas and roll-up formats', () => {
    expect(artworkSizeFor('plakat', analysis([page(594, 420)]))).toMatchObject({ formatId: 'a2', orientation: 'fekvo' });
    expect(artworkSizeFor('plakat', analysis([page(610, 430)]))?.formatId).toBeUndefined();
    expect(artworkSizeFor('vaszonkep', analysis([page(500, 700)]))).toMatchObject({ formatId: '50x70', orientation: 'allo' });
    expect(artworkSizeFor('vaszonkep', analysis([page(450, 450)]))).toMatchObject({ formatId: 'egyedi', widthCm: 45, heightCm: 45 });
    expect(artworkSizeFor('rollup', analysis([page(1000, 2000)]))?.formatId).toBe('100x200');
  });
});

describe('preflightSummary', () => {
  it('rates a raster image at the chosen size, and asks how to fit a different shape', () => {
    const photo = analysis([], { format: 'jpeg', pixels: { width: 6000, height: 3000 } });
    expect(preflightSummary(photo, 200, 100, 'fill')).toEqual({ dpi: 76, rating: 'megfelelo', aspectMismatch: false });
    expect(preflightSummary(photo, 100, 100, 'fit')).toMatchObject({ aspectMismatch: true, fitMode: 'fit' });
    expect(preflightSummary(analysis([page(100, 100)]), 10, 10, 'fill')).toBeNull();
  });
});

describe('artworkDetail', () => {
  it('says what was read from the file', () => {
    // formatNumberHu groups thousands with a no-break space ("1 189").
    const plain = (text: string) => text.replace(/[  ]/g, ' ');
    expect(plain(artworkDetail(analysis([page(841, 1189), page(841, 1189, 2)])))).toBe('841 × 1 189 mm · vektoros · 2 oldal');
    expect(artworkDetail(analysis([], { pixels: { width: 4000, height: 3000 } }))).toBe('4000 × 3000 px');
    expect(artworkDetail(analysis([]))).toBe('A méretét nem tudtuk kiolvasni');
  });
});
