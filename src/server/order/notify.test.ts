import { describe, expect, it, vi } from 'vitest';
import type { OutgoingEmail } from '../notify/mailer';
import { notifyOrder } from './notify';
import type { OrderStore } from './store';
import { ORDER } from './test-order';

describe('notifyOrder', () => {
  it('sends the workshop the order e-mail once, and marks it sent', async () => {
    const sent: OutgoingEmail[] = [];
    const store = {
      claimForNotification: vi.fn(async () => ORDER),
      markNotified: vi.fn(async () => {}),
      recordNotificationFailure: vi.fn(async () => {}),
      pendingNotificationIds: vi.fn(async () => []),
    } as unknown as OrderStore;
    const mailer = { send: vi.fn(async (email: OutgoingEmail) => void sent.push(email)) };
    expect(await notifyOrder(7, { store, mailer, to: 'muhely@example.hu', now: () => new Date() })).toBe('sent');
    expect(sent[0]?.subject).toMatch(/^\[R-0007\] Rendelés ellenőrzésre/);
    expect(store.markNotified).toHaveBeenCalledOnce();
  });
});
