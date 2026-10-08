// Sends the workshop's e-mail about a callback request. Right after the request (waitUntil) and from the cron;
// the store's claim makes sure the two never send the same e-mail twice.
import { formatReference } from '@/domain/reference';
import type { Mailer } from '../notify/mailer';
import { callbackEmail } from './email';
import type { CallbackStore } from './store';

export interface NotifyDeps {
  store: CallbackStore;
  mailer: Mailer;
  /** The workshop's address (ORDER_NOTIFY_EMAIL). */
  to: string;
  now: () => Date;
  /** Where failures are reported; console.error by default (Cloudflare groups them under Issues). */
  logError?: (message: string) => void;
}

export async function notifyCallback(id: number, deps: NotifyDeps): Promise<'sent' | 'skipped' | 'failed'> {
  const request = await deps.store.claimForNotification(id, deps.now());
  if (!request) return 'skipped';
  try {
    await deps.mailer.send(callbackEmail(request, deps.to));
    await deps.store.markNotified(id, deps.now());
    return 'sent';
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await deps.store.recordNotificationFailure(id, message);
    (deps.logError ?? ((line: string) => console.error(line)))(
      `A visszahívás értesítése nem ment ki (${formatReference('VH', id)}): ${message}`,
    );
    return 'failed';
  }
}

/** The cron's job: retries every request whose e-mail has not gone out, within 24 hours of its arrival. */
export async function deliverPendingCallbacks(deps: NotifyDeps): Promise<{ sent: number; failed: number }> {
  const result = { sent: 0, failed: 0 };
  for (const id of await deps.store.pendingNotificationIds(deps.now())) {
    const outcome = await notifyCallback(id, deps);
    if (outcome === 'sent') result.sent += 1;
    if (outcome === 'failed') result.failed += 1;
  }
  return result;
}
