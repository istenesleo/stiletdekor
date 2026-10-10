/** @vitest-environment jsdom */
import { afterEach, describe, expect, it } from 'vitest';
import { CART_CHANGED_EVENT, CART_STORAGE_KEY } from '@/domain/cart-count';
import { initCartBadge } from './cart-badge';

afterEach(() => {
  localStorage.clear();
  document.body.innerHTML = '';
});

describe('initCartBadge', () => {
  it('shows the number of items in the cart, and follows changes', () => {
    document.body.innerHTML = '<a href="/kosar" aria-label="Kosár" data-cart-link><span data-cart-count hidden></span></a>';
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ v: 1, items: [{}, {}] }));
    initCartBadge(document);
    const link = document.querySelector('a')!;
    const badge = document.querySelector<HTMLElement>('[data-cart-count]')!;
    expect(badge.hidden).toBe(false);
    expect(badge.textContent).toBe('2');
    expect(link.getAttribute('aria-label')).toBe('Kosár, 2 tétel');

    localStorage.removeItem(CART_STORAGE_KEY);
    window.dispatchEvent(new Event(CART_CHANGED_EVENT));
    expect(badge.hidden).toBe(true);
    expect(link.getAttribute('aria-label')).toBe('Kosár');
  });
});
