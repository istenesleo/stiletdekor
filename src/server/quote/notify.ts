// Sends the workshop's e-mail about a quote request (right after it arrives, and from the cron).
import { formatReference } from '@/domain/reference';
import { deliverPending, type DeliverDeps, notifyOne } from '../notify/deliver';
import type { Mailer } from '../notify/mailer';
import { quoteEmail } from './email';
import type { QuoteStore, StoredQuote } from './store';

export interface QuoteNotifyDeps {
  store: QuoteStore;
  mailer: Mailer;
  to: string;
  now: () => Date;
  logError?: (message: string) => void;
}

const delivery = (deps: QuoteNotifyDeps): DeliverDeps<StoredQuote> => ({
  ...deps,
  compose: quoteEmail,
  reference: (id) => formatReference('AK', id),
  failure: 'Az ajánlatkérés értesítése nem ment ki',
});

export const notifyQuote = (id: number, deps: QuoteNotifyDeps) => notifyOne(id, delivery(deps));
export const deliverPendingQuotes = (deps: QuoteNotifyDeps) => deliverPending(delivery(deps));
