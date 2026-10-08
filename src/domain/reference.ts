// Short reference numbers the customer can read out on the phone: "AK-0142" (quote request), "VH-0087"
// (callback request). The number is the row's id in its own D1 table, padded to at least four digits
// (docs/superpowers/specs/2026-10-08-weboldal-mukodesi-elvek-design.md, 4.2).

export type ReferencePrefix = 'AK' | 'VH';

const MIN_DIGITS = 4;

/** "VH-0087" from the prefix "VH" and the id 87. */
export function formatReference(prefix: ReferencePrefix, id: number): string {
  if (!Number.isSafeInteger(id) || id < 1) throw new RangeError(`Invalid reference id: ${id}`);
  return `${prefix}-${String(id).padStart(MIN_DIGITS, '0')}`;
}

/** The reference in `value` when it is one of `prefix` (normalized, "VH-0087"), otherwise null. */
export function parseReference(value: unknown, prefix: ReferencePrefix): string | null {
  if (typeof value !== 'string') return null;
  const match = new RegExp(`^${prefix}-(\\d{${MIN_DIGITS},9})$`).exec(value.trim());
  if (!match?.[1]) return null;
  const id = Number(match[1]);
  return id >= 1 ? formatReference(prefix, id) : null;
}
