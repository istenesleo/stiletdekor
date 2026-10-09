// Where quote requests are kept, as an interface: the pages use the D1 version (d1-store.ts), the tests a fake.
import type { QuoteTypeId } from '@/domain/catalog';
import type { QuoteFieldValue } from '@/domain/schemas';
import type { NotificationStore } from '../notify/queue';

/** A saved quote request. Its reference is formatReference('AK', id). */
export interface StoredQuote {
  id: number;
  quoteType: QuoteTypeId;
  /** The job type's answers, keyed by the catalog's field ids. */
  fields: Record<string, Exclude<QuoteFieldValue, null>>;
  /** File fields the customer sends by e-mail with the reference. */
  emailedFiles: string[];
  location?: string | undefined;
  deadline: string;
  surveyRequested: boolean;
  contact: { name: string; email: string; phone: string; company?: string | undefined };
  source?: string | undefined;
  /** ISO timestamp (UTC). */
  createdAt: string;
}

export type NewQuote = Omit<StoredQuote, 'id'> & { formToken: string };

export interface QuoteStore extends NotificationStore<StoredQuote> {
  /** Saves the request and returns its id; a second call with the same form token saves nothing and returns the first id. */
  insert(request: NewQuote): Promise<number>;
}
