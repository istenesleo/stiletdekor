import { describe, expect, it } from 'vitest';
import { expiredFiles, parseStoredCart, serializeCart, toOrderItems, type CartEntry } from './cart';
import { cartItemCount } from './cart-count';

const FILE = { uploadId: '3f8a2b6c-1d4e-4f5a-9b7c-0e1d2c3b4a59', name: 'logo.pdf', size: 2_400_000, uploadedAt: '2026-10-09T10:00:00.000Z' };
const ENTRY: CartEntry = {
  key: 'a1',
  config: { productId: 'molino', materialId: 'standard', edgeFinishId: 'szeges-ringli', widthCm: 200, heightCm: 100, quantity: 2, express: false },
  files: [FILE],
  preflight: { dpi: 150, rating: 'kivalo', aspectMismatch: false },
  addedAt: '2026-10-09T10:01:00.000Z',
};

describe('the stored cart', () => {
  it('reads back what it wrote', () => {
    expect(parseStoredCart(serializeCart([ENTRY]))).toEqual({ entries: [ENTRY], dropped: 0 });
  });

  it('is empty when missing, broken or of another version', () => {
    for (const raw of [null, '', '{', '{"v":2,"items":[]}', '[]']) expect(parseStoredCart(raw)).toEqual({ entries: [], dropped: 0 });
  });

  it('drops the items that are no longer valid and counts them', () => {
    const broken = { ...ENTRY, key: 'b2', config: { ...ENTRY.config, widthCm: 9000 } };
    const raw = JSON.stringify({ v: 1, items: [ENTRY, broken, { nonsense: true }] });
    expect(parseStoredCart(raw)).toEqual({ entries: [ENTRY], dropped: 2 });
  });

  it('finds the files the cron may have deleted', () => {
    expect(expiredFiles(ENTRY, new Date('2026-10-11T10:00:00Z'))).toEqual([]);
    expect(expiredFiles(ENTRY, new Date('2026-10-12T10:00:01Z'))).toEqual([FILE]);
  });

  it('turns the entries into the order items', () => {
    expect(toOrderItems([ENTRY, { ...ENTRY, key: 'c3', files: [], preflight: undefined }])).toEqual([
      { config: ENTRY.config, uploadIds: [FILE.uploadId], preflight: ENTRY.preflight },
      { config: ENTRY.config, uploadIds: [] },
    ]);
  });

  it('counts the items for the header without checking them', () => {
    expect(cartItemCount(serializeCart([ENTRY, ENTRY]))).toBe(2);
    expect(cartItemCount(null)).toBe(0);
    expect(cartItemCount('{')).toBe(0);
    expect(cartItemCount('{"v":2,"items":[1]}')).toBe(0);
  });
});
