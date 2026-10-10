// Sends the workshop's e-mail about an order (right after it arrives, and from the cron).
import { formatReference } from '@/domain/reference';
import { deliverPending, type DeliverDeps, notifyOne } from '../notify/deliver';
import type { Mailer } from '../notify/mailer';
import type { NotificationStore } from '../notify/queue';
import { orderEmail } from './email';
import type { StoredOrder } from './store';

export interface OrderNotifyDeps {
  store: NotificationStore<StoredOrder>;
  mailer: Mailer;
  to: string;
  now: () => Date;
  logError?: (message: string) => void;
}

const delivery = (deps: OrderNotifyDeps): DeliverDeps<StoredOrder> => ({
  ...deps,
  compose: orderEmail,
  reference: (id) => formatReference('R', id),
  failure: 'A rendelés értesítése nem ment ki',
});

export const notifyOrder = (id: number, deps: OrderNotifyDeps) => notifyOne(id, delivery(deps));
export const deliverPendingOrders = (deps: OrderNotifyDeps) => deliverPending(delivery(deps));
