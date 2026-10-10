/** @vitest-environment jsdom */
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type CartEntry, parseStoredCart, serializeCart } from '@/domain/cart';
import { CART_CHANGED_EVENT, CART_STORAGE_KEY } from '@/domain/cart-count';
import type { MolinoConfig } from '@/domain/pricing';
import { useCart, writeCart } from './cart-store';

const CONFIG: MolinoConfig = { productId: 'molino', materialId: 'standard', edgeFinishId: 'szeges-ringli', widthCm: 200, heightCm: 100, quantity: 1, express: false };
const ENTRY: CartEntry = {
  key: 'a1',
  config: CONFIG,
  files: [],
  addedAt: '2026-10-09T10:00:00.000Z',
};

afterEach(() => localStorage.clear());

describe('useCart', () => {
  it('loads the stored cart, drops the broken items for good, and changes it', () => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ v: 1, items: [ENTRY, { broken: true }] }));
    const { result } = renderHook(() => useCart());
    expect(result.current).toMatchObject({ ready: true, entries: [ENTRY], dropped: 1 });
    expect(parseStoredCart(localStorage.getItem(CART_STORAGE_KEY))).toEqual({ entries: [ENTRY], dropped: 0 });

    act(() => result.current.add({ ...ENTRY, key: 'b2' }));
    act(() => result.current.setQuantity('a1', 3));
    expect(result.current.entries.map((e) => [e.key, e.config.quantity])).toEqual([
      ['a1', 3],
      ['b2', 1],
    ]);
    act(() => result.current.replace({ ...ENTRY, key: 'b2', config: { ...CONFIG, widthCm: 300 } }));
    expect(result.current.entries[1]?.config).toMatchObject({ widthCm: 300 });
    act(() => result.current.remove('a1'));
    expect(result.current.entries.map((e) => e.key)).toEqual(['b2']);
    act(() => result.current.clear());
    expect(localStorage.getItem(CART_STORAGE_KEY)).toBeNull();
  });

  it('follows the cart changed in another tab', () => {
    const { result } = renderHook(() => useCart());
    act(() => {
      localStorage.setItem(CART_STORAGE_KEY, serializeCart([ENTRY]));
      window.dispatchEvent(new StorageEvent('storage', { key: CART_STORAGE_KEY }));
    });
    expect(result.current.entries).toEqual([ENTRY]);
  });

  it('tells the header about every change', () => {
    const listener = vi.fn();
    window.addEventListener(CART_CHANGED_EVENT, listener);
    writeCart([ENTRY]);
    window.removeEventListener(CART_CHANGED_EVENT, listener);
    expect(listener).toHaveBeenCalledOnce();
  });
});
