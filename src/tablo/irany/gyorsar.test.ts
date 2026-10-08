import { describe, expect, it } from 'vitest';
import { estimateOrderReadyDate, formatReadyBy } from '@/domain/leadtime';
import { formatHuf } from '@/domain/money';
import { priceConfiguration } from '@/domain/pricing';
import { molinoGyorsAr } from './gyorsar';

const NOW = new Date('2026-10-07T08:00:00Z');

describe('molinoGyorsAr', () => {
  it('prices a standard molinó cut to size with the real pricing and lead-time rules', () => {
    const be = { widthCm: 300, heightCm: 100, quantity: 2, express: false };
    const price = priceConfiguration({ productId: 'molino', materialId: 'standard', edgeFinishId: 'meretre-vagas', ...be });
    expect(molinoGyorsAr(be, NOW)).toEqual({
      ok: true,
      brutto: formatHuf(price.grossTotal),
      netto: formatHuf(price.netTotal),
      afa: formatHuf(price.vatTotal),
      minimum: false,
      kesz: formatReadyBy(estimateOrderReadyDate(NOW, { express: false })),
    });
  });

  it('applies the minimum item price to small pieces', () => {
    const r = molinoGyorsAr({ widthCm: 50, heightCm: 50, quantity: 1, express: false }, NOW);
    expect(r.ok && r.minimum).toBe(true);
  });

  it('explains an invalid size in Hungarian instead of pricing it', () => {
    const r = molinoGyorsAr({ widthCm: 10, heightCm: 100, quantity: 1, express: false }, NOW);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.uzenet.length).toBeGreaterThan(5);
  });

  it('brings the ready date forward with express', () => {
    const normal = molinoGyorsAr({ widthCm: 300, heightCm: 100, quantity: 1, express: false }, NOW);
    const express = molinoGyorsAr({ widthCm: 300, heightCm: 100, quantity: 1, express: true }, NOW);
    expect(normal.ok && express.ok && normal.kesz !== express.kesz).toBe(true);
  });
});
