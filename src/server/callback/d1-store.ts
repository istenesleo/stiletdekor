// The callback requests in D1 (table callback_requests, migrations/0001_callback_requests.sql).
import { isCallbackJobTypeId } from '@/domain/schemas';
import { NOTIFY_LEASE_MS, NOTIFY_WINDOW_MS, type CallbackStore, type StoredCallback } from './store';

interface CallbackRow {
  id: number;
  name: string;
  phone: string;
  job_type: string | null;
  message: string | null;
  source: string | null;
  created_at: string;
}

const COLUMNS = 'id, name, phone, job_type, message, source, created_at';

function toStored(row: CallbackRow): StoredCallback {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    jobType: isCallbackJobTypeId(row.job_type) ? row.job_type : undefined,
    message: row.message ?? undefined,
    source: row.source ?? undefined,
    createdAt: row.created_at,
  };
}

const isoBefore = (now: Date, ms: number) => new Date(now.getTime() - ms).toISOString();

export function d1CallbackStore(db: D1Database): CallbackStore {
  return {
    async insert(request) {
      const inserted = await db
        .prepare(
          'INSERT INTO callback_requests (form_token, name, phone, job_type, message, source, created_at) ' +
            'VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT (form_token) DO NOTHING RETURNING id',
        )
        .bind(
          request.formToken,
          request.name,
          request.phone,
          request.jobType ?? null,
          request.message ?? null,
          request.source ?? null,
          request.createdAt,
        )
        .first<{ id: number }>();
      if (inserted) return inserted.id;
      const existing = await db
        .prepare('SELECT id FROM callback_requests WHERE form_token = ?')
        .bind(request.formToken)
        .first<{ id: number }>();
      if (!existing) throw new Error('The callback request was neither saved nor found.');
      return existing.id;
    },

    async claimForNotification(id, now) {
      const row = await db
        .prepare(
          'UPDATE callback_requests SET notify_attempts = notify_attempts + 1, notify_last_attempt_at = ? ' +
            'WHERE id = ? AND notified_at IS NULL AND (notify_last_attempt_at IS NULL OR notify_last_attempt_at < ?) ' +
            `RETURNING ${COLUMNS}`,
        )
        .bind(now.toISOString(), id, isoBefore(now, NOTIFY_LEASE_MS))
        .first<CallbackRow>();
      return row ? toStored(row) : null;
    },

    async markNotified(id, now) {
      await db
        .prepare('UPDATE callback_requests SET notified_at = ?, notify_last_error = NULL WHERE id = ?')
        .bind(now.toISOString(), id)
        .run();
    },

    async recordNotificationFailure(id, error) {
      await db
        .prepare('UPDATE callback_requests SET notify_last_error = ? WHERE id = ?')
        .bind(error.slice(0, 500), id)
        .run();
    },

    async pendingNotificationIds(now) {
      const { results } = await db
        .prepare('SELECT id FROM callback_requests WHERE notified_at IS NULL AND created_at >= ? ORDER BY created_at, id LIMIT 50')
        .bind(isoBefore(now, NOTIFY_WINDOW_MS))
        .all<{ id: number }>();
      return results.map((row) => row.id);
    },
  };
}
