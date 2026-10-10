// Prices for the shop's islands: the configurator's breakdown (the domain's net lines of one piece as gross rows, then
// the quantity, the discount and the express surcharge) and the cart's totals. The totals are the domain's own sums;
// a gross row may differ from the net line × 1,27 by a forint of rounding.
import type { CartEntry } from '@/domain/cart';
import { EXPRESS_SURCHARGE_PERCENT, QUANTITY_DISCOUNT_TIERS } from '@/domain/catalog';
import { formatHuf, formatNumberHu } from '@/domain/money';
import { type ConfigurationPrice, grossOf, tryPriceConfiguration } from '@/domain/pricing';
import type { PriceRow } from '@/ui/PriceBreakdown/PriceBreakdown';

/** "2–4 db: −5% · 5–9 db: −10% · 10 db-tól: −15%". */
export const DISCOUNT_SUMMARY = QUANTITY_DISCOUNT_TIERS.filter((tier) => tier.pct > 0)
  .map((tier) => `${tier.label}: −${tier.pct}%`)
  .join(' · ');

export function priceRows(price: ConfigurationPrice): PriceRow[] {
  const rows: PriceRow[] = price.lines.map((line) => ({
    label: line.label,
    detail: `${formatNumberHu(line.quantity)} ${line.unit} × ${formatHuf(grossOf(line.unitPriceNet))}`,
    amount: grossOf(line.amountNet),
  }));
  if (price.quantity > 1) {
    rows.push({
      label: `${price.quantity} darab`,
      detail: `${formatHuf(grossOf(price.itemNet))} × ${price.quantity}`,
      amount: grossOf(price.subtotalNet),
      kind: 'muted',
    });
  }
  if (price.discountNet > 0) {
    rows.push({ label: `Mennyiségi kedvezmény (−${price.discountPct}%)`, amount: -grossOf(price.discountNet), kind: 'discount' });
  }
  if (price.expressSurchargeNet > 0) {
    rows.push({ label: `Expressz gyártás (+${EXPRESS_SURCHARGE_PERCENT}%)`, amount: grossOf(price.expressSurchargeNet) });
  }
  return rows;
}

/** The cart's items together, without shipping (chosen at the checkout). */
export function cartTotals(entries: readonly CartEntry[]): { gross: number; net: number; vat: number } {
  const totals = { gross: 0, net: 0, vat: 0 };
  for (const entry of entries) {
    const priced = tryPriceConfiguration(entry.config);
    if (!priced.ok) continue;
    totals.gross += priced.price.grossTotal;
    totals.net += priced.price.netTotal;
    totals.vat += priced.price.vatTotal;
  }
  return totals;
}
