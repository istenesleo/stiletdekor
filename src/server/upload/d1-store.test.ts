import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { testDatabase } from '../test-d1';
import { d1UploadStore } from './d1-store';
import type { NewUpload } from './store';

let t: Awaited<ReturnType<typeof testDatabase>>;

beforeAll(async () => {
  t = await testDatabase();
}, 60_000);

afterAll(async () => {
  await t?.dispose();
});

beforeEach(async () => {
  await t.reset();
});

const A = '3f8a2b6c-1d4e-4f5a-9b7c-0e1d2c3b4a59';
const B = '9c1d2e3f-4a5b-4c6d-8e7f-a0b1c2d3e4f5';
const C = '0b1c2d3e-4f5a-4b6c-8d7e-9f0a1b2c3d4e';

const upload = (id: string, createdAt: string): NewUpload => ({
  id,
  r2Key: `feltoltes/${id}`,
  fileName: 'logo.pdf',
  sizeBytes: 1234,
  format: 'pdf',
  contentType: 'application/pdf',
  createdAt,
});

/** A bare order row (the order store writes the full one), and `uploadId` bound to it. */
async function orderUsing(uploadId: string, createdAt: string): Promise<number> {
  const order = await t.db
    .prepare(
      'INSERT INTO orders (form_token, status_token, site_origin, customer_name, customer_email, customer_phone, billing_postal_code, ' +
        'billing_city, billing_address, shipping_method, items_net, shipping_net, net_total, vat_total, gross_total, price_json, created_at) ' +
        "VALUES (?, ?, 'https://x.test', 'M', 'm@x.hu', '1', '1061', 'Budapest', 'Minta u. 1.', 'szemelyes', 1, 0, 1, 0, 1, '{}', ?) RETURNING id",
    )
    .bind(`f-${uploadId}`, `s-${uploadId}`, createdAt)
    .first<{ id: number }>();
  await t.db.prepare('UPDATE uploads SET order_id = ? WHERE id = ?').bind(order!.id, uploadId).run();
  return order!.id;
}

describe('d1UploadStore', () => {
  it('saves uploads and finds the existing ones', async () => {
    const store = d1UploadStore(t.db);
    await store.insert(upload(A, '2026-10-09T10:00:00.000Z'));
    await store.insert(upload(B, '2026-10-09T10:01:00.000Z'));
    const found = await store.findMany([A, B, C]);
    expect(found.map((u) => u.id).sort()).toEqual([A, B].sort());
    expect(found.find((u) => u.id === A)).toEqual({ ...upload(A, '2026-10-09T10:00:00.000Z'), orderId: null, orderItemId: null });
    expect(await store.findMany([])).toEqual([]);
  });

  it('gives the workshop a file only while its order is recent enough', async () => {
    const store = d1UploadStore(t.db);
    await store.insert(upload(A, '2026-10-09T10:00:00.000Z'));
    await store.insert(upload(B, '2026-10-09T10:00:00.000Z'));
    const orderId = await orderUsing(A, '2026-10-09T10:05:00.000Z');
    expect(await store.findDownloadable(A, '2026-10-01T00:00:00.000Z')).toMatchObject({ id: A, orderId });
    expect(await store.findDownloadable(A, '2026-10-10T00:00:00.000Z')).toBeNull();
    expect(await store.findDownloadable(B, '2026-10-01T00:00:00.000Z')).toBeNull();
  });

  it('lists and removes the unused old uploads, never a used one', async () => {
    const store = d1UploadStore(t.db);
    await store.insert(upload(A, '2026-10-05T10:00:00.000Z'));
    await store.insert(upload(B, '2026-10-05T11:00:00.000Z'));
    await store.insert(upload(C, '2026-10-09T10:00:00.000Z'));
    await orderUsing(B, '2026-10-05T12:00:00.000Z');
    expect((await store.findOrphans('2026-10-06T10:00:00.000Z', 100)).map((u) => u.id)).toEqual([A]);
    await store.remove([A, B]);
    expect((await store.findMany([A, B, C])).map((u) => u.id).sort()).toEqual([B, C].sort());
  });
});
