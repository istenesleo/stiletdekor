// Where the cart lives in the browser, and its item count without the cart's schema: the header's small script
// (src/scripts/cart-badge.ts) reads it on every page, so this file imports nothing.

export const CART_STORAGE_KEY = 'stilet-kosar';
/** Fired on window after this tab changed the cart; the storage event only reaches the other tabs. */
export const CART_CHANGED_EVENT = 'stilet-kosar';

/** Number of items (lines) in the stored cart; 0 when it is missing or not a cart of this version. */
export function cartItemCount(raw: string | null): number {
  if (!raw) return 0;
  try {
    const data = JSON.parse(raw) as { v?: unknown; items?: unknown } | null;
    return data?.v === 1 && Array.isArray(data.items) ? data.items.length : 0;
  } catch {
    return 0;
  }
}
