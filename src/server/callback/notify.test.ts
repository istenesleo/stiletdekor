import { describe, expect, it, vi } from 'vitest';
import type { Mailer, OutgoingEmail } from '../notify/mailer';
import { deliverPendingCallbacks, notifyCallback } from './notify';
import type { CallbackStore, StoredCallback } from './store';

const NOW = new Date('2026-10-08T12:05:00.000Z');

function fakeStore(requests: StoredCallback[]) {
  const claimed = new Set<number>();
  const sent = new Set<number>();
  const failures: [number, string][] = [];
  const store: CallbackStore = {
    insert: vi.fn(),
    async claimForNotification(id) {
      if (claimed.has(id) || sent.has(id)) return null;
      claimed.add(id);
      return requests.find((r) => r.id === id) ?? null;
    },
    async markNotified(id) {
      sent.add(id);
    },
    async recordNotificationFailure(id, error) {
      failures.push([id, error]);
    },
    async pendingNotificationIds() {
      return requests.map((r) => r.id).filter((id) => !sent.has(id));
    },
  };
  return { store, sent, failures };
}

const request = (id: number): StoredCallback => ({ id, name: 'Kiss Péter', phone: '+36 70 123 4567', createdAt: NOW.toISOString() });

describe('notifyCallback', () => {
  it('sends the e-mail once and marks the request sent', async () => {
    const { store, sent } = fakeStore([request(1)]);
    const outbox: OutgoingEmail[] = [];
    const mailer: Mailer = { send: async (email) => void outbox.push(email) };
    const deps = { store, mailer, to: 'muhely@example.com', now: () => NOW };
    expect(await notifyCallback(1, deps)).toBe('sent');
    expect(await notifyCallback(1, deps)).toBe('skipped');
    expect(outbox.map((email) => email.subject)).toEqual(['[VH-0001] Visszahívás – Kiss Péter']);
    expect(sent.has(1)).toBe(true);
  });

  it('records a failed send and logs it as an error', async () => {
    const { store, sent, failures } = fakeStore([request(2)]);
    const logError = vi.fn();
    const mailer: Mailer = { send: async () => Promise.reject(new Error('quota')) };
    expect(await notifyCallback(2, { store, mailer, to: 'm@example.com', now: () => NOW, logError })).toBe('failed');
    expect(sent.has(2)).toBe(false);
    expect(failures).toEqual([[2, 'quota']]);
    expect(logError).toHaveBeenCalledWith('A visszahívás értesítése nem ment ki (VH-0002): quota');
  });
});

describe('deliverPendingCallbacks', () => {
  it('tries every waiting request and counts the results', async () => {
    const { store } = fakeStore([request(1), request(2), request(3)]);
    const mailer: Mailer = {
      send: async (email) => {
        if (email.subject.startsWith('[VH-0002]')) throw new Error('down');
      },
    };
    const result = await deliverPendingCallbacks({ store, mailer, to: 'm@example.com', now: () => NOW, logError: () => {} });
    expect(result).toEqual({ sent: 2, failed: 1 });
  });
});
