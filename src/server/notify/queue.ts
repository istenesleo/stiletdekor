// The workshop's notification e-mails as a queue in D1. Every request table has the same notify columns
// (notified_at, notify_attempts, notify_last_attempt_at, notify_last_error); these helpers claim, mark and list
// them. The claim is a 5-minute lease, so the immediate send and the cron never send the same e-mail twice.

export interface NotificationStore<T> {
  /** Takes the request for notifying when its e-mail has not gone out and nobody tried in the last 5 minutes. */
  claimForNotification(id: number, now: Date): Promise<T | null>;
  markNotified(id: number, now: Date): Promise<void>;
  recordNotificationFailure(id: number, error: string): Promise<void>;
  /** Requests still waiting for their e-mail, created in the last 24 hours, oldest first (at most 50). */
  pendingNotificationIds(now: Date): Promise<number[]>;
}

/** How long a claim blocks other senders. */
export const NOTIFY_LEASE_MS = 5 * 60_000;
/** How long the cron keeps retrying a request's e-mail. */
export const NOTIFY_WINDOW_MS = 24 * 60 * 60_000;

const isoBefore = (now: Date, ms: number) => new Date(now.getTime() - ms).toISOString();

/** The queue of one request table. `table` and `columns` are constants of the code, never user input. */
export function d1NotificationQueue<Row, T>(
  db: D1Database,
  table: string,
  columns: string,
  toStored: (row: Row) => T,
): NotificationStore<T> {
  return {
    async claimForNotification(id, now) {
      const row = await db
        .prepare(
          `UPDATE ${table} SET notify_attempts = notify_attempts + 1, notify_last_attempt_at = ? ` +
            'WHERE id = ? AND notified_at IS NULL AND (notify_last_attempt_at IS NULL OR notify_last_attempt_at < ?) ' +
            `RETURNING ${columns}`,
        )
        .bind(now.toISOString(), id, isoBefore(now, NOTIFY_LEASE_MS))
        .first<Row>();
      return row ? toStored(row) : null;
    },
    async markNotified(id, now) {
      await db.prepare(`UPDATE ${table} SET notified_at = ?, notify_last_error = NULL WHERE id = ?`).bind(now.toISOString(), id).run();
    },
    async recordNotificationFailure(id, error) {
      await db.prepare(`UPDATE ${table} SET notify_last_error = ? WHERE id = ?`).bind(error.slice(0, 500), id).run();
    },
    async pendingNotificationIds(now) {
      const { results } = await db
        .prepare(`SELECT id FROM ${table} WHERE notified_at IS NULL AND created_at >= ? ORDER BY created_at, id LIMIT 50`)
        .bind(isoBefore(now, NOTIFY_WINDOW_MS))
        .all<{ id: number }>();
      return results.map((row) => row.id);
    },
  };
}
