import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { testDatabase } from '../test-d1';
import { d1CallbackStore } from './d1-store';
import type { NewCallback } from './store';

let t: Awaited<ReturnType<typeof testDatabase>>;
let db: D1Database;

beforeAll(async () => {
  t = await testDatabase();
  db = t.db;
}, 60_000);

afterAll(async () => {
  await t?.dispose();
});

beforeEach(async () => {
  await t.reset();
});

const T0 = new Date('2026-10-08T10:00:00.000Z');
const minutes = (n: number) => new Date(T0.getTime() + n * 60_000);

function request(token: string, extra: Partial<NewCallback> = {}): NewCallback {
  return { name: 'Kiss Péter', phone: '+36 70 123 4567', formToken: token, createdAt: T0.toISOString(), ...extra };
}

describe('d1CallbackStore', () => {
  it('numbers the requests and saves a resubmitted form only once', async () => {
    const store = d1CallbackStore(db);
    const first = await store.insert(request('a'));
    const second = await store.insert(request('b'));
    expect(second).toBe(first + 1);
    expect(await store.insert(request('a', { name: 'Másik Név' }))).toBe(first);
    const { results } = await db.prepare('SELECT name FROM callback_requests ORDER BY id').all<{ name: string }>();
    expect(results.map((row) => row.name)).toEqual(['Kiss Péter', 'Kiss Péter']);
  });

  it('gives a request to one sender at a time, again after the lease, never after it was sent', async () => {
    const store = d1CallbackStore(db);
    const id = await store.insert(request('a', { jobType: 'ceger', message: 'Homlokzati tábla', source: '/visszahivas' }));
    expect(await store.claimForNotification(id, T0)).toEqual({
      id,
      name: 'Kiss Péter',
      phone: '+36 70 123 4567',
      jobType: 'ceger',
      message: 'Homlokzati tábla',
      source: '/visszahivas',
      createdAt: T0.toISOString(),
    });
    expect(await store.claimForNotification(id, minutes(4))).toBeNull();
    expect(await store.claimForNotification(id, minutes(6))).not.toBeNull();
    await store.markNotified(id, minutes(6));
    expect(await store.claimForNotification(id, minutes(20))).toBeNull();
  });

  it('lists the unsent requests of the last 24 hours, oldest first', async () => {
    const store = d1CallbackStore(db);
    const old = await store.insert(request('old', { createdAt: minutes(-25 * 60).toISOString() }));
    const sent = await store.insert(request('sent'));
    const waiting = await store.insert(request('waiting', { createdAt: minutes(1).toISOString() }));
    const earlier = await store.insert(request('earlier', { createdAt: minutes(-60).toISOString() }));
    await store.markNotified(sent, T0);
    const pending = await store.pendingNotificationIds(minutes(2));
    expect(pending).toEqual([earlier, waiting]);
    expect(pending).not.toContain(old);
  });

  it('keeps the last error of a failed e-mail', async () => {
    const store = d1CallbackStore(db);
    const id = await store.insert(request('a'));
    await store.claimForNotification(id, T0);
    await store.recordNotificationFailure(id, 'SMTP 451');
    const row = await db
      .prepare('SELECT notify_attempts, notify_last_error FROM callback_requests WHERE id = ?')
      .bind(id)
      .first<{ notify_attempts: number; notify_last_error: string }>();
    expect(row).toEqual({ notify_attempts: 1, notify_last_error: 'SMTP 451' });
  });
});
