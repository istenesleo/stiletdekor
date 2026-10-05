import { describe, expect, it } from 'vitest';
import { DPI_RATINGS, FIT_MODES, aspectMismatch, effectiveDpi, fitBox, preflight, rateDpi } from './preflight';

describe('effectiveDpi', () => {
  it('is px / (cm / 2.54) on the binding axis', () => {
    expect(effectiveDpi(3000, 1500, 200, 100)).toBeCloseTo(38.1, 10);
    // A4 at 300 dpi
    expect(effectiveDpi(2480, 3508, 21, 29.7)).toBeCloseTo(299.962, 2);
  });

  it('takes the minimum over the axes for fill, the maximum for fit', () => {
    // 1000 × 1000 px on 50 × 25 cm: 50,8 dpi horizontally, 101,6 dpi vertically
    expect(effectiveDpi(1000, 1000, 50, 25)).toBeCloseTo(50.8, 10);
    expect(effectiveDpi(1000, 1000, 50, 25, 'fill')).toBeCloseTo(50.8, 10);
    expect(effectiveDpi(1000, 1000, 50, 25, 'fit')).toBeCloseTo(101.6, 10);
  });

  it.each([
    [0, 100, 10, 10],
    [100, -1, 10, 10],
    [100, 100, 0, 10],
    [100, 100, 10, Number.NaN],
  ])('rejects non-positive input (%s, %s, %s, %s)', (pxW, pxH, cmW, cmH) => {
    expect(() => effectiveDpi(pxW, pxH, cmW, cmH)).toThrow(RangeError);
  });
});

describe('rateDpi', () => {
  it.each([
    [300, 'kivalo'],
    [150, 'kivalo'],
    [149.99, 'megfelelo'],
    [72, 'megfelelo'],
    [71.99, 'gyenge'],
    [0, 'gyenge'],
  ] as const)('%s dpi → %s', (dpi, rating) => {
    expect(rateDpi(dpi)).toBe(rating);
  });

  it('has Hungarian labels', () => {
    expect(DPI_RATINGS.kivalo.label).toBe('Kiváló');
    expect(DPI_RATINGS.megfelelo.label).toBe('Molinóra, nagy távolságra megfelelő');
    expect(DPI_RATINGS.gyenge.label).toBe('Gyenge');
    expect(FIT_MODES.fill.label).toBe('Kitöltés (vágással)');
    expect(FIT_MODES.fit.label).toBe('Illesztés (kerettel)');
  });
});

describe('aspectMismatch', () => {
  it('matching ratios do not need a choice', () => {
    const check = aspectMismatch(2000, 1000, 200, 100);
    expect(check.difference).toBe(0);
    expect(check.exceeds).toBe(false);
  });

  it('exactly 2% is tolerated, more is not', () => {
    const atLimit = aspectMismatch(1020, 1000, 100, 100);
    expect(atLimit.difference).toBeCloseTo(0.02, 12);
    expect(atLimit.exceeds).toBe(false);
    expect(aspectMismatch(1021, 1000, 100, 100).exceeds).toBe(true);
  });

  it('is symmetric (portrait vs landscape deviation)', () => {
    const wide = aspectMismatch(1100, 1000, 100, 100);
    const tall = aspectMismatch(1000, 1100, 100, 100);
    expect(wide.difference).toBeCloseTo(tall.difference, 12);
    expect(wide.difference).toBeCloseTo(0.1, 12);
  });

  it('reports both ratios', () => {
    expect(aspectMismatch(4000, 3000, 200, 100)).toMatchObject({ imageRatio: 4 / 3, targetRatio: 2, exceeds: true });
  });
});

describe('fitBox', () => {
  it('fill covers the surface and crops the overflow', () => {
    // 2:1 image on a square surface
    expect(fitBox(2000, 1000, 100, 100, 'fill')).toEqual({ x: -0.5, y: 0, width: 2, height: 1 });
  });

  it('fit shows the whole image with a frame', () => {
    expect(fitBox(2000, 1000, 100, 100, 'fit')).toEqual({ x: 0, y: 0.25, width: 1, height: 0.5 });
  });
});

describe('preflight', () => {
  it('summarises resolution and aspect ratio', () => {
    const result = preflight(3000, 1500, 200, 100);
    expect(result).toMatchObject({ dpi: 38, rating: 'gyenge', label: 'Gyenge', needsFitChoice: false });
  });

  it('rounds the shown dpi down so it never contradicts the rating', () => {
    // 1181 px over 20 cm = 149.98… dpi → shown as 149, rated "megfelelő"
    const result = preflight(1181, 1181, 20, 20);
    expect(result.dpi).toBe(149);
    expect(result.rating).toBe('megfelelo');
  });

  it('asks for a fit mode when the ratio differs by more than 2%', () => {
    expect(preflight(4000, 3000, 200, 100).needsFitChoice).toBe(true);
    expect(preflight(4000, 3000, 200, 100, 'fit').dpi).toBeGreaterThan(preflight(4000, 3000, 200, 100, 'fill').dpi);
  });
});
