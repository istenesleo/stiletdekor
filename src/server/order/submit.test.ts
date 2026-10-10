import { describe, expect, it, vi } from 'vitest';
import { describeConfiguration, priceCart, type ProductConfig } from '@/domain/pricing';
import type { UploadRecord } from '../upload/store';
import type { NewOrder } from './store';
import { ORDER_FILE_MISSING_MESSAGE, submitOrder, type SubmitOrderDeps } from './submit';

const TOKEN = '3f8a2b6c-1d4e-4f5a-9b7c-0e1d2c3b4a59';
const A = '9c1d2e3f-4a5b-4c6d-8e7f-a0b1c2d3e4f5';
const B = '0b1c2d3e-4f5a-4b6c-8d7e-9f0a1b2c3d4e';
const STATUS = 'AbCdEfGhIjKlMnOpQrStUv';
const NOW = new Date('2026-10-09T10:00:00.000Z');
const MOLINO: ProductConfig = { productId: 'molino', materialId: 'standard', edgeFinishId: 'szeges-ringli', widthCm: 200, heightCm: 100, quantity: 2, express: false };

const INPUT = {
  formToken: TOKEN,
  honlap: '',
  source: '/kosar',
  customer: {
    name: 'Minta Mária',
    email: 'maria@example.hu',
    phone: '+36 70 123 4567',
    company: '',
    billingAddress: { postalCode: '1061', city: 'Budapest', address: 'Minta utca 1.' },
  },
  shippingMethod: 'futar',
  items: [{ config: MOLINO, uploadIds: [A], preflight: { dpi: 150, rating: 'kivalo', aspectMismatch: false } }],
  acceptTerms: true,
  // The browser never decides the price: this must be ignored.
  grossTotal: 1,
};

const record = (id: string, orderId: number | null): UploadRecord => ({
  id,
  r2Key: `feltoltes/${id}`,
  fileName: 'logo.pdf',
  sizeBytes: 1,
  format: 'pdf',
  contentType: 'application/pdf',
  createdAt: NOW.toISOString(),
  orderId,
  orderItemId: null,
});

function deps(overrides: Partial<SubmitOrderDeps> = {}, uploads: UploadRecord[] = [record(A, null)]) {
  const saved: NewOrder[] = [];
  const d: SubmitOrderDeps = {
    store: {
      insert: vi.fn(async (o: NewOrder) => (saved.push(o), { id: 7, statusToken: o.statusToken, created: true })),
      findByFormToken: vi.fn(async () => null),
    },
    uploads: { findMany: vi.fn(async (ids: readonly string[]) => uploads.filter((u) => ids.includes(u.id))) },
    allow: async () => true,
    now: () => NOW,
    newStatusToken: () => STATUS,
    siteOrigin: 'https://stiletdekor.example',
    ...overrides,
  };
  return { saved, deps: d };
}

describe('submitOrder', () => {
  it('saves a valid order at the price the server calculates, and answers with the reference and the status link', async () => {
    const { saved, deps: d } = deps();
    expect(await submitOrder(INPUT, d)).toEqual({
      status: 201,
      body: { reference: 'R-0007', statusPath: `/rendeles/${STATUS}` },
      notifyId: 7,
    });
    const price = priceCart([{ config: MOLINO }], 'futar');
    expect(saved[0]).toEqual({
      formToken: TOKEN,
      statusToken: STATUS,
      siteOrigin: 'https://stiletdekor.example',
      customer: { name: 'Minta Mária', email: 'maria@example.hu', phone: '+36 70 123 4567', company: undefined, taxNumber: undefined },
      billingAddress: { postalCode: '1061', city: 'Budapest', address: 'Minta utca 1.' },
      shippingMethod: 'futar',
      shippingAddress: undefined,
      surveyRequested: false,
      note: undefined,
      price,
      items: [
        {
          config: MOLINO,
          description: describeConfiguration(MOLINO),
          price: price.items[0],
          uploadIds: [A],
          preflight: { dpi: 150, rating: 'kivalo', aspectMismatch: false },
        },
      ],
      sitePhotoIds: [],
      source: '/kosar',
      createdAt: NOW.toISOString(),
    });
  });

  it('answers a resubmitted form with the first order and saves nothing', async () => {
    const { saved, deps: d } = deps({
      store: { insert: vi.fn(), findByFormToken: vi.fn(async () => ({ id: 3, statusToken: 'x'.repeat(22) })) },
    });
    expect(await submitOrder(INPUT, d)).toEqual({ status: 200, body: { reference: 'R-0003', statusPath: `/rendeles/${'x'.repeat(22)}` } });
    expect(saved).toEqual([]);
  });

  it('names every wrong field with its dotted key', async () => {
    const result = await submitOrder({ ...INPUT, customer: { ...INPUT.customer, email: 'nem' }, acceptTerms: false }, deps().deps);
    expect(result).toEqual({
      status: 422,
      body: {
        errors: {
          'customer.email': 'Kérjük, érvényes e-mail-címet adjon meg.',
          acceptTerms: 'A rendeléshez fogadja el az Általános Szerződési Feltételeket.',
        },
      },
    });
  });

  it('refuses files that are gone or belong to another order', async () => {
    const gone = await submitOrder({ ...INPUT, items: [{ config: MOLINO, uploadIds: [B] }] }, deps().deps);
    expect(gone).toEqual({ status: 422, body: { errors: { 'items.0.uploadIds': ORDER_FILE_MISSING_MESSAGE } } });
    const taken = await submitOrder(INPUT, deps({}, [record(A, 5)]).deps);
    expect(taken).toEqual({ status: 422, body: { errors: { 'items.0.uploadIds': ORDER_FILE_MISSING_MESSAGE } } });
  });

  it('pretends to accept a filled trap field, and refuses garbage and too many orders', async () => {
    const { saved, deps: d } = deps();
    expect(await submitOrder({ ...INPUT, honlap: 'x' }, d)).toEqual({ status: 201, body: { reference: null, statusPath: null } });
    expect(saved).toEqual([]);
    expect((await submitOrder('nem objektum', d)).status).toBe(400);
    expect((await submitOrder({ ...INPUT, formToken: 'nem-uuid' }, d)).status).toBe(400);
    expect((await submitOrder(INPUT, deps({ allow: async () => false }).deps)).status).toBe(429);
  });

  it('offers the phone when saving fails', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const failing = { insert: vi.fn(async () => Promise.reject(new Error('D1 down'))), findByFormToken: vi.fn(async () => null) };
    const result = await submitOrder(INPUT, deps({ store: failing }).deps);
    expect(result.status).toBe(500);
    expect(result.body).toEqual({ error: expect.stringContaining('+36 70 538 5030') });
    error.mockRestore();
  });
});
