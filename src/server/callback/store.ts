// Where callback requests are kept, as an interface: the pages use the D1 version (d1-store.ts), the tests a fake.
import type { CallbackJobTypeId } from '@/domain/schemas';
import type { NotificationStore } from '../notify/queue';

/** A saved callback request. Its reference is formatReference('VH', id). */
export interface StoredCallback {
  id: number;
  name: string;
  phone: string;
  jobType?: CallbackJobTypeId;
  message?: string;
  source?: string;
  /** ISO timestamp (UTC). */
  createdAt: string;
}

/** A request to save: the checked form (a CallbackRequest fits) plus its one-time token and the time it arrived. */
export interface NewCallback {
  name: string;
  phone: string;
  jobType?: CallbackJobTypeId | undefined;
  message?: string | undefined;
  source?: string | undefined;
  formToken: string;
  createdAt: string;
}

export interface CallbackStore extends NotificationStore<StoredCallback> {
  /** Saves the request and returns its id; a second call with the same form token saves nothing and returns the first id. */
  insert(request: NewCallback): Promise<number>;
}
