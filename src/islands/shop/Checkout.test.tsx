/** @vitest-environment jsdom */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type CartEntry, serializeCart } from '@/domain/cart';
import { CART_STORAGE_KEY } from '@/domain/cart-count';
import { Checkout } from './Checkout';

const ENTRY: CartEntry = {
  key: 'a1',
  config: { productId: 'molino', materialId: 'standard', edgeFinishId: 'szeges-ringli', widthCm: 200, heightCm: 100, quantity: 1, express: false },
  files: [],
  addedAt: '2026-10-09T10:00:00.000Z',
};

const fetchMock = vi.fn();
const respond = (status: number, body: unknown) => fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(body), { status }));
const send = () => fireEvent.click(screen.getByRole('button', { name: 'Rendelés elküldése ellenőrzésre' }));

function fill() {
  fireEvent.change(screen.getByLabelText(/^Név/), { target: { value: 'Minta Mária' } });
  fireEvent.change(screen.getByLabelText(/^E-mail-cím/), { target: { value: 'maria@example.hu' } });
  fireEvent.change(screen.getByLabelText(/^Telefonszám/), { target: { value: '+36 70 123 4567' } });
  fireEvent.change(screen.getByLabelText(/^Irányítószám/), { target: { value: '1061' } });
  fireEvent.change(screen.getByLabelText(/^Település/), { target: { value: 'Budapest' } });
  fireEvent.change(screen.getByLabelText(/^Utca, házszám/), { target: { value: 'Minta utca 1.' } });
  fireEvent.click(screen.getByRole('radio', { name: /Személyes átvétel/ }));
  fireEvent.click(screen.getByRole('checkbox', { name: /ÁSZF/ }));
}

beforeEach(() => {
  localStorage.setItem(CART_STORAGE_KEY, serializeCart([ENTRY]));
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe('Checkout', () => {
  it('lists what is missing at the top and moves the focus there', () => {
    render(<Checkout navigate={vi.fn()} />);
    send();
    const summary = screen.getByRole('alert');
    expect(summary.textContent).toContain('Adja meg a nevét.');
    expect(summary.textContent).toContain('Válasszon átvételi módot.');
    expect(document.activeElement).toBe(summary);
    expect(screen.getByRole('link', { name: 'Adja meg a nevét.' }).getAttribute('href')).toBe('#penztar-name');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends the order, empties the cart and goes to the status page', async () => {
    const navigate = vi.fn();
    respond(201, { reference: 'R-0007', statusPath: '/rendeles/AbCdEfGhIjKlMnOpQrStUv' });
    render(<Checkout navigate={navigate} />);
    fill();
    send();
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/rendeles/AbCdEfGhIjKlMnOpQrStUv?uj=1'));
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/orders');
    expect(JSON.parse(String(init.body))).toMatchObject({
      formToken: expect.stringMatching(/^[0-9a-f-]{36}$/),
      customer: { name: 'Minta Mária', billingAddress: { city: 'Budapest' } },
      shippingMethod: 'szemelyes',
      items: [{ config: ENTRY.config }],
      acceptTerms: true,
    });
    expect(localStorage.getItem(CART_STORAGE_KEY)).toBeNull();
  });

  it('shows the server messages next to the fields and keeps what was typed', async () => {
    respond(422, { errors: { 'customer.email': 'Ez az e-mail-cím nem jó.' } });
    render(<Checkout navigate={vi.fn()} />);
    fill();
    send();
    await waitFor(() => expect(screen.getAllByText('Ez az e-mail-cím nem jó.').length).toBeGreaterThan(0));
    expect((screen.getByLabelText(/^Név/) as HTMLInputElement).value).toBe('Minta Mária');
  });

  it('offers the phone when the order cannot be sent', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    render(<Checkout navigate={vi.fn()} />);
    fill();
    send();
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('+36 70 538 5030'));
  });
});
