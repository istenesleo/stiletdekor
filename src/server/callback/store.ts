// Where callback requests are kept, as an interface: the pages use the D1 version (d1-store.ts), the tests a fake.
import type { CallbackJobTypeId } from '@/domain/schemas';

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

export interface CallbackStore {
  /** Saves the request and returns its id; a second call with the same form token saves nothing and returns the first id. */
  insert(request: NewCallback): Promise<number>;
  /** Takes the request for notifying when its e-mail has not gone out and nobody tried in the last 5 minutes; null otherwise. */
  claimForNotification(id: number, now: Date): Promise<StoredCallback | null>;
  markNotified(id: number, now: Date): Promise<void>;
  recordNotificationFailure(id: number, error: string): Promise<void>;
  /** Requests still waiting for their e-mail, created in the last 24 hours, oldest first (at most 50). */
  pendingNotificationIds(now: Date): Promise<number[]>;
}

/** How long a claim blocks other senders. */
export const NOTIFY_LEASE_MS = 5 * 60_000;
/** How long the cron keeps retrying a request's e-mail. */
export const NOTIFY_WINDOW_MS = 24 * 60 * 60_000;
