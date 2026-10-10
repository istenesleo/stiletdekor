import { describe, expect, it } from 'vitest';
import type { CartEntry } from '@/domain/cart';
import { formatHuf } from '@/domain/money';
import { grossOf, priceConfiguration, type ProductConfig } from '@/domain/pricing';
import { cartTotals, DISCOUNT_SUMMARY, priceRows } from './price-rows';

const MOLINO: ProductConfig = { productId: 'molino', materialId: 'standard', edgeFinishId: 'szeges-ringli', widthCm: 200, heightCm: 100, quantity: 5, express: true };

describe('priceRows', () => {
  it('shows one piece gross, then the quantity, the discount and the express surcharge', () => {
    const price = priceConfiguration(MOLINO);
    expect(priceRows(price)).toEqual([
      { label: 'Standard frontlit molinó', detail: `2 m² × ${formatHuf(grossOf(3990))}`, amount: grossOf(7980) },
      { label: 'Szélkidolgozás: Szegés + ringli', detail: `6 fm × ${formatHuf(grossOf(350))}`, amount: grossOf(2100) },
      { label: '5 darab', detail: `${formatHuf(grossOf(10080))} × 5`, amount: grossOf(50400), kind: 'muted' },
      { label: 'Mennyiségi kedvezmény (−10%)', amount: -grossOf(5040), kind: 'discount' },
      { label: 'Expressz gyártás (+30%)', amount: grossOf(13608) },
    ]);
  });

  it('adds up the cart and sums up the discount tiers', () => {
    const entry = (config: ProductConfig): CartEntry => ({ key: 'k', config, files: [], addedAt: '2026-10-09T10:00:00.000Z' });
    const one = priceConfiguration(MOLINO);
    expect(cartTotals([entry(MOLINO), entry(MOLINO)])).toEqual({
      gross: 2 * one.grossTotal,
      net: 2 * one.netTotal,
      vat: 2 * one.vatTotal,
    });
    expect(DISCOUNT_SUMMARY).toBe('2–4 db: −5% · 5–9 db: −10% · 10 db-tól: −15%');
  });
});
