// Sends the workshop's e-mail about one request, or retries all that are waiting (the cron). The store's claim
// makes sure the immediate send and the cron never send the same e-mail twice.
import type { Mailer, OutgoingEmail } from './mailer';
import type { NotificationStore } from './queue';

export interface DeliverDeps<T> {
  store: NotificationStore<T>;
  mailer: Mailer;
  /** The workshop's address (ORDER_NOTIFY_EMAIL). */
  to: string;
  now: () => Date;
  /** The e-mail about one request. */
  compose: (request: T, to: string) => OutgoingEmail;
  /** The request's reference for the log, e.g. "VH-0087". */
  reference: (id: number) => string;
  /** Start of the failure line, e.g. "A visszahívás értesítése nem ment ki". */
  failure: string;
  /** Where failures are reported; console.error by default (Cloudflare groups them under Issues). */
  logError?: (message: string) => void;
}

export async function notifyOne<T>(id: number, deps: DeliverDeps<T>): Promise<'sent' | 'skipped' | 'failed'> {
  const request = await deps.store.claimForNotification(id, deps.now());
  if (!request) return 'skipped';
  try {
    await deps.mailer.send(deps.compose(request, deps.to));
    await deps.store.markNotified(id, deps.now());
    return 'sent';
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await deps.store.recordNotificationFailure(id, message);
    (deps.logError ?? ((line: string) => console.error(line)))(`${deps.failure} (${deps.reference(id)}): ${message}`);
    return 'failed';
  }
}

/** The cron's job: retries every request whose e-mail has not gone out, within 24 hours of its arrival. */
export async function deliverPending<T>(deps: DeliverDeps<T>): Promise<{ sent: number; failed: number }> {
  const result = { sent: 0, failed: 0 };
  for (const id of await deps.store.pendingNotificationIds(deps.now())) {
    const outcome = await notifyOne(id, deps);
    if (outcome === 'sent') result.sent += 1;
    if (outcome === 'failed') result.failed += 1;
  }
  return result;
}
