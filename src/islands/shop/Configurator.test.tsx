/** @vitest-environment jsdom */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ArtworkAnalysis } from '@/domain/artwork/types';
import { type CartEntry, parseStoredCart, serializeCart } from '@/domain/cart';
import { CART_STORAGE_KEY } from '@/domain/cart-count';
import { formatHuf } from '@/domain/money';
import { type MolinoConfig, priceConfiguration } from '@/domain/pricing';
import { Configurator } from './Configurator';
import { uploadFile } from './upload-client';

const UPLOAD = '3f8a2b6c-1d4e-4f5a-9b7c-0e1d2c3b4a59';
const { ANALYSIS } = vi.hoisted(() => ({
  ANALYSIS: {
    format: 'pdf',
    pages: [
      {
        index: 1,
        size: { widthMm: 3000, heightMm: 1500 },
        sizeSource: 'trimbox',
        printSize: { widthMm: 3000, heightMm: 1500 },
        bleedMm: null,
        rotation: 0,
        contentKey: null,
      },
    ],
    pixels: null,
    dpi: null,
    confidence: 'exact',
    hints: { scale: null, bleedMmFromText: null, title: null },
    warnings: [],
  } as ArtworkAnalysis,
}));

vi.mock('./upload-client', async (importOriginal) => ({ ...(await importOriginal<typeof import('./upload-client')>()), uploadFile: vi.fn() }));
vi.mock('@/domain/artwork/analyze', () => ({ analyzeArtwork: vi.fn(async () => ANALYSIS) }));

const MOLINO: MolinoConfig = { productId: 'molino', materialId: 'standard', edgeFinishId: 'szeges-ringli', widthCm: 200, heightCm: 100, quantity: 1, express: false };
/** Prices contain no-break spaces; compare text with plain ones. */
const plain = (text: string | null | undefined) => (text ?? '').replace(/[  ]/g, ' ');
const pageText = () => plain(document.body.textContent);
const priceText = (config: MolinoConfig) => plain(formatHuf(priceConfiguration(config).grossTotal));
const addButton = (name: string) => screen.getByRole('button', { name }) as HTMLButtonElement;

beforeEach(() => {
  vi.mocked(uploadFile).mockResolvedValue({ id: UPLOAD, name: 'nyitas.pdf', size: 8, format: 'pdf' });
  window.location.hash = '';
});
afterEach(() => localStorage.clear());

describe('Configurator', () => {
  it('prices the default molinó, follows the size typed in, and stops at a wrong size', () => {
    render(<Configurator productId="molino" />);
    expect(pageText()).toContain(priceText(MOLINO));
    fireEvent.change(screen.getByLabelText('Szélesség'), { target: { value: '300' } });
    expect(pageText()).toContain(priceText({ ...MOLINO, widthCm: 300 }));
    fireEvent.change(screen.getByLabelText('Szélesség'), { target: { value: '900' } });
    expect(pageText()).toContain('A szélesség 20 és 500 cm között lehet.');
    expect(addButton('Kosárba').disabled).toBe(true);
  });

  it('fills the size from the uploaded file and puts the item with its file in the cart', async () => {
    render(<Configurator productId="molino" />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(['%PDF-1.7'], 'nyitas.pdf', { type: 'application/pdf' })] } });
    await waitFor(() => expect((screen.getByLabelText('Szélesség') as HTMLInputElement).value).toBe('300'));
    expect((screen.getByLabelText('Magasság') as HTMLInputElement).value).toBe('150');
    expect(pageText()).toContain('A méret a fájlból');
    await waitFor(() => expect(addButton('Kosárba').disabled).toBe(false));
    fireEvent.click(addButton('Kosárba'));
    const { entries } = parseStoredCart(localStorage.getItem(CART_STORAGE_KEY));
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      config: { ...MOLINO, widthCm: 300, heightCm: 150 },
      files: [{ uploadId: UPLOAD, name: 'nyitas.pdf', size: 8 }],
    });
    expect(screen.getByRole('link', { name: 'Tovább a pénztárba' }).getAttribute('href')).toBe('/penztar');
  });

  it('edits a cart item opened with #tetel=', () => {
    const entry: CartEntry = { key: 'k1', config: { ...MOLINO, widthCm: 250 }, files: [], addedAt: '2026-10-09T10:00:00.000Z' };
    localStorage.setItem(CART_STORAGE_KEY, serializeCart([entry]));
    window.location.hash = '#tetel=k1';
    render(<Configurator productId="molino" />);
    expect((screen.getByLabelText('Szélesség') as HTMLInputElement).value).toBe('250');
    fireEvent.change(screen.getByLabelText('Magasság'), { target: { value: '120' } });
    fireEvent.click(addButton('Tétel frissítése'));
    const { entries } = parseStoredCart(localStorage.getItem(CART_STORAGE_KEY));
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ key: 'k1', config: { widthCm: 250, heightCm: 120 } });
  });
});
