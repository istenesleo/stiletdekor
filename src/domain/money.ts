// Forint amounts are whole numbers everywhere in the domain. These helpers round and format them.

// `useGrouping: 'always'` groups 4-digit amounts too ("1 990 Ft"), matching the brief's price list;
// hu-HU would otherwise print "1990 Ft". The separators are U+00A0 (no-break space).
const hufFormatter = new Intl.NumberFormat('hu-HU', {
  style: 'currency',
  currency: 'HUF',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
  useGrouping: 'always',
});

const decimalFormatters = new Map<number, Intl.NumberFormat>();

function assertFinite(value: number, name: string): void {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number, got ${value}`);
}

/** Rounds to whole forints, halves away from zero (997.5 → 998, −997.5 → −998). */
export function roundHuf(value: number): number {
  assertFinite(value, 'value');
  const rounded = Math.sign(value) * Math.round(Math.abs(value));
  return rounded === 0 ? 0 : rounded; // no −0
}

/** `percent` % of an integer amount, rounded to whole forints. Exact for integer inputs. */
export function percentOf(amount: number, percent: number): number {
  return roundHuf((amount * percent) / 100);
}

/** "12 990 Ft" (hu-HU, no decimals, no-break spaces). Fractions are rounded. */
export function formatHuf(amount: number): string {
  assertFinite(amount, 'amount');
  return hufFormatter.format(amount);
}

/** Hungarian decimal formatting for quantities: 0.25 → "0,25", 1234.5 → "1 234,5". */
export function formatNumberHu(value: number, maximumFractionDigits = 2): string {
  assertFinite(value, 'value');
  let formatter = decimalFormatters.get(maximumFractionDigits);
  if (!formatter) {
    formatter = new Intl.NumberFormat('hu-HU', { maximumFractionDigits, useGrouping: 'always' });
    decimalFormatters.set(maximumFractionDigits, formatter);
  }
  return formatter.format(value);
}

/** "12,5", "12.5" or "1 200" → a number; an unreadable text stays text, so a schema can say it is not a number. */
export function parseNumberHu(text: string): number | string | null {
  const compact = text.replace(/\s/g, '');
  if (!compact) return null;
  return /^-?\d+([.,]\d+)?$/.test(compact) ? Number(compact.replace(',', '.')) : text.trim();
}

/** "2,4 MB", "830 kB" (decimal units, like most operating systems). */
export function formatFileSize(bytes: number): string {
  return bytes >= 1_000_000
    ? `${formatNumberHu(bytes / 1_000_000, 1)}\u00a0MB`
    : `${formatNumberHu(Math.max(1, bytes / 1000), 0)}\u00a0kB`;
}
