// The cart in the browser for the islands: read and write the stored cart, tell the header (CART_CHANGED_EVENT), and
// a hook that follows changes from this tab and the others.
import { useCallback, useEffect, useState } from 'react';
import { type CartEntry, parseStoredCart, serializeCart } from '@/domain/cart';
import { CART_CHANGED_EVENT, CART_STORAGE_KEY } from '@/domain/cart-count';

export function readCart(): { entries: CartEntry[]; dropped: number } {
  try {
    return parseStoredCart(localStorage.getItem(CART_STORAGE_KEY));
  } catch {
    return { entries: [], dropped: 0 };
  }
}

export function writeCart(entries: readonly CartEntry[]): void {
  try {
    if (entries.length > 0) localStorage.setItem(CART_STORAGE_KEY, serializeCart(entries));
    else localStorage.removeItem(CART_STORAGE_KEY);
  } catch {
    // Private mode or full storage: the cart lasts as long as the page.
  }
  window.dispatchEvent(new Event(CART_CHANGED_EVENT));
}

export interface CartApi {
  entries: CartEntry[];
  /** Items dropped when the cart was loaded (no longer valid). */
  dropped: number;
  /** False until the stored cart is read. */
  ready: boolean;
  add(entry: CartEntry): void;
  /** Replaces the item with the same key (editing). */
  replace(entry: CartEntry): void;
  remove(key: string): void;
  setQuantity(key: string, quantity: number): void;
  clear(): void;
}

export function useCart(): CartApi {
  const [state, setState] = useState({ entries: [] as CartEntry[], dropped: 0, ready: false });
  useEffect(() => {
    const first = readCart();
    if (first.dropped > 0) writeCart(first.entries);
    setState({ entries: first.entries, dropped: first.dropped, ready: true });
    const reload = () => setState((current) => ({ ...current, entries: readCart().entries }));
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === CART_STORAGE_KEY) reload();
    };
    window.addEventListener(CART_CHANGED_EVENT, reload);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(CART_CHANGED_EVENT, reload);
      window.removeEventListener('storage', onStorage);
    };
  }, []);
  const update = useCallback((change: (entries: CartEntry[]) => CartEntry[]) => writeCart(change(readCart().entries)), []);
  return {
    ...state,
    add: (entry) => update((list) => [...list, entry]),
    replace: (entry) => update((list) => list.map((item) => (item.key === entry.key ? entry : item))),
    remove: (key) => update((list) => list.filter((item) => item.key !== key)),
    setQuantity: (key, quantity) =>
      update((list) => list.map((item) => (item.key === key ? { ...item, config: { ...item.config, quantity } } : item))),
    clear: () => writeCart([]),
  };
}
