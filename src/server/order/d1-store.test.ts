import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { describeConfiguration, priceCart, type ProductConfig } from '@/domain/pricing';
import { testDatabase } from '../test-d1';
import { d1UploadStore } from '../upload/d1-store';
import { d1OrderStore } from './d1-store';
import type { NewOrder } from './store';

let t: Awaited<ReturnType<typeof testDatabase>>;

const A = '3f8a2b6c-1d4e-4f5a-9b7c-0e1d2c3b4a59';
const B = '9c1d2e3f-4a5b-4c6d-8e7f-a0b1c2d3e4f5';
const NOW = '2026-10-09T10:00:00.000Z';
const MOLINO: ProductConfig = { productId: 'molino', materialId: 'standard', edgeFinishId: 'szeges-ringli', widthCm: 200, heightCm: 100, quantity: 2, express: false };
const PLAKAT: ProductConfig = { productId: 'plakat', formatId: 'a2', paperFinish: 'matt', orientation: 'allo', quantity: 1, express: true };
const PRICE = priceCart([{ config: MOLINO }, { config: PLAKAT }], 'telepites');
const PREFLIGHT = { dpi: 150, rating: 'kivalo', aspectMismatch: false } as const;

beforeAll(async () => {
  t = await testDatabase();
}, 60_000);

afterAll(async () => {
  await t?.dispose();
});

beforeEach(async () => {
  await t.reset();
  const uploads = d1UploadStore(t.db);
  const file = (id: string, fileName: string, sizeBytes: number) => ({
    id,
    r2Key: `feltoltes/${id}`,
    fileName,
    sizeBytes,
    format: 'pdf',
    contentType: 'application/pdf',
    createdAt: '2026-10-09T09:00:00.000Z',
  });
  await uploads.insert(file(A, 'logo.pdf', 1234));
  await uploads.insert(file(B, 'helyszin.jpg', 5678));
});

function order(token: string, extra: Partial<NewOrder> = {}): NewOrder {
  return {
    formToken: token,
    statusToken: `s-${token}`,
    siteOrigin: 'https://stiletdekor.example',
    customer: { name: 'Minta Mária', email: 'maria@example.hu', phone: '+36 70 123 4567', company: 'Minta Kft.', taxNumber: '12345676-1-42' },
    billingAddress: { postalCode: '1061', city: 'Budapest', address: 'Minta utca 1.' },
    shippingMethod: 'telepites',
    shippingAddress: { postalCode: '9021', city: 'Győr', address: 'Minta tér 2.' },
    surveyRequested: true,
    note: 'Hívjanak előtte.',
    price: PRICE,
    items: [
      { config: MOLINO, description: describeConfiguration(MOLINO), price: PRICE.items[0]!, uploadIds: [A], preflight: PREFLIGHT },
      { config: PLAKAT, description: describeConfiguration(PLAKAT), price: PRICE.items[1]!, uploadIds: [] },
    ],
    sitePhotoIds: [B],
    source: '/kosar',
    createdAt: NOW,
    ...extra,
  };
}

describe('d1OrderStore', () => {
  it('saves the order with its items, files and first event, and reads it back by its status token', async () => {
    const store = d1OrderStore(t.db);
    const saved = await store.insert(order('t1'));
    expect(saved).toEqual({ id: expect.any(Number), statusToken: 's-t1', created: true });
    expect(await store.findByStatusToken('s-t1')).toEqual({
      id: saved.id,
      statusToken: 's-t1',
      status: 'beerkezett',
      siteOrigin: 'https://stiletdekor.example',
      customer: { name: 'Minta Mária', email: 'maria@example.hu', phone: '+36 70 123 4567', company: 'Minta Kft.', taxNumber: '12345676-1-42' },
      billingAddress: { postalCode: '1061', city: 'Budapest', address: 'Minta utca 1.' },
      shippingMethod: 'telepites',
      shippingAddress: { postalCode: '9021', city: 'Győr', address: 'Minta tér 2.' },
      surveyRequested: true,
      note: 'Hívjanak előtte.',
      totals: {
        itemsNet: PRICE.itemsNet,
        shippingNet: 0,
        shippingPriceOnRequest: true,
        netTotal: PRICE.netTotal,
        vatTotal: PRICE.vatTotal,
        grossTotal: PRICE.grossTotal,
      },
      items: [
        {
          position: 0,
          productId: 'molino',
          description: describeConfiguration(MOLINO),
          quantity: 2,
          express: false,
          netTotal: PRICE.items[0]!.netTotal,
          vatTotal: PRICE.items[0]!.vatTotal,
          grossTotal: PRICE.items[0]!.grossTotal,
          preflight: PREFLIGHT,
          files: [{ id: A, name: 'logo.pdf', sizeBytes: 1234 }],
        },
        {
          position: 1,
          productId: 'plakat',
          description: describeConfiguration(PLAKAT),
          quantity: 1,
          express: true,
          netTotal: PRICE.items[1]!.netTotal,
          vatTotal: PRICE.items[1]!.vatTotal,
          grossTotal: PRICE.items[1]!.grossTotal,
          files: [],
        },
      ],
      sitePhotos: [{ id: B, name: 'helyszin.jpg', sizeBytes: 5678 }],
      source: '/kosar',
      createdAt: NOW,
    });
    const { results } = await t.db.prepare('SELECT status_from, status_to, actor FROM order_events').all();
    expect(results).toEqual([{ status_from: null, status_to: 'beerkezett', actor: 'vasarlo' }]);
  });

  it('saves a resubmitted form only once', async () => {
    const store = d1OrderStore(t.db);
    const first = await store.insert(order('t1'));
    expect(await store.insert(order('t1', { statusToken: 'masik' }))).toEqual({ id: first.id, statusToken: 's-t1', created: false });
    expect(await store.findByFormToken('t1')).toEqual({ id: first.id, statusToken: 's-t1' });
    expect(await t.db.prepare('SELECT COUNT(*) AS n FROM orders').first('n')).toBe(1);
  });

  it('leaves a file with the order that used it first', async () => {
    const store = d1OrderStore(t.db);
    await store.insert(order('t1'));
    await store.insert(order('t2', { sitePhotoIds: [] }));
    const second = await store.findByStatusToken('s-t2');
    expect(second?.items[0]?.files).toEqual([]);
  });

  it('knows nothing about unknown tokens', async () => {
    const store = d1OrderStore(t.db);
    expect(await store.findByStatusToken('nincs')).toBeNull();
    expect(await store.findByFormToken('nincs')).toBeNull();
  });

  it('queues the workshop e-mail with the whole order', async () => {
    const store = d1OrderStore(t.db);
    const { id } = await store.insert(order('t1'));
    const now = new Date(NOW);
    expect(await store.pendingNotificationIds(now)).toEqual([id]);
    const claimed = await store.claimForNotification(id, now);
    expect(claimed?.items).toHaveLength(2);
    expect(claimed?.sitePhotos).toEqual([{ id: B, name: 'helyszin.jpg', sizeBytes: 5678 }]);
    expect(await store.claimForNotification(id, now)).toBeNull();
    await store.markNotified(id, now);
    expect(await store.pendingNotificationIds(now)).toEqual([]);
  });
});
