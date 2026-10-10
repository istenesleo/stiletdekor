/** @vitest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { type CartEntry, parseStoredCart } from '@/domain/cart';
import { CART_STORAGE_KEY } from '@/domain/cart-count';
import { formatHuf } from '@/domain/money';
import { priceConfiguration } from '@/domain/pricing';
import { CartPage } from './CartPage';

const ENTRY: CartEntry = {
  key: 'a1',
  config: { productId: 'molino', materialId: 'standard', edgeFinishId: 'szeges-ringli', widthCm: 200, heightCm: 100, quantity: 1, express: false },
  files: [{ uploadId: '3f8a2b6c-1d4e-4f5a-9b7c-0e1d2c3b4a59', name: 'logo.pdf', size: 1000, uploadedAt: new Date().toISOString() }],
  addedAt: new Date().toISOString(),
};
const plain = (text: string | null | undefined) => (text ?? '').replace(/[  ]/g, ' ');

afterEach(() => localStorage.clear());

describe('CartPage', () => {
  it('says when the cart is empty and where to go', () => {
    render(<CartPage />);
    expect(screen.getByText('A kosár üres.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Vissza a webshopba' }).getAttribute('href')).toBe('/webshop');
  });

  it('lists the items, changes the quantity, and leads to the checkout', () => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ v: 1, items: [ENTRY, { broken: true }] }));
    render(<CartPage />);
    expect(screen.getByText(/Egy tétel már nem rendelhető így/)).toBeTruthy();
    expect(plain(document.body.textContent)).toContain('Grafika: logo.pdf');
    expect(screen.getByRole('link', { name: 'Módosítás' }).getAttribute('href')).toBe('/webshop/molino#tetel=a1');
    fireEvent.click(screen.getByRole('button', { name: 'Eggyel több' }));
    expect(parseStoredCart(localStorage.getItem(CART_STORAGE_KEY)).entries[0]?.config.quantity).toBe(2);
    const total = priceConfiguration({ ...ENTRY.config, quantity: 2 }).grossTotal;
    expect(plain(document.body.textContent)).toContain(plain(formatHuf(total)));
    expect(screen.getByRole('link', { name: 'Tovább a pénztárba' }).getAttribute('href')).toBe('/penztar');
  });

  it('removes an item', () => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ v: 1, items: [ENTRY] }));
    render(<CartPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Tétel törlése: Molinó' }));
    expect(screen.getByText('A kosár üres.')).toBeTruthy();
  });
});
