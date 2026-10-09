// The callback requests in D1 (table callback_requests, migrations/0001_callback_requests.sql).
import { isCallbackJobTypeId } from '@/domain/schemas';
import { d1NotificationQueue } from '../notify/queue';
import type { CallbackStore, StoredCallback } from './store';

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

export function d1CallbackStore(db: D1Database): CallbackStore {
  return {
    ...d1NotificationQueue(db, 'callback_requests', COLUMNS, toStored),
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
  };
}
