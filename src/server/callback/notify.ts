// Sends the workshop's e-mail about a callback request (right after it arrives, and from the cron).
import { formatReference } from '@/domain/reference';
import { deliverPending, type DeliverDeps, notifyOne } from '../notify/deliver';
import type { Mailer } from '../notify/mailer';
import { callbackEmail } from './email';
import type { CallbackStore, StoredCallback } from './store';

export interface NotifyDeps {
  store: CallbackStore;
  mailer: Mailer;
  /** The workshop's address (ORDER_NOTIFY_EMAIL). */
  to: string;
  now: () => Date;
  logError?: (message: string) => void;
}

const delivery = (deps: NotifyDeps): DeliverDeps<StoredCallback> => ({
  ...deps,
  compose: callbackEmail,
  reference: (id) => formatReference('VH', id),
  failure: 'A visszahívás értesítése nem ment ki',
});

export const notifyCallback = (id: number, deps: NotifyDeps) => notifyOne(id, delivery(deps));
export const deliverPendingCallbacks = (deps: NotifyDeps) => deliverPending(delivery(deps));
