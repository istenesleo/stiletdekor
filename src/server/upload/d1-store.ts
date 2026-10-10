// The uploads' metadata in D1 (table uploads, migrations/0003_orders.sql).
import type { NewUpload, UploadRecord, UploadStore } from './store';

interface UploadRow {
  id: string;
  r2_key: string;
  file_name: string;
  size_bytes: number;
  format: string;
  content_type: string;
  created_at: string;
  order_id: number | null;
  order_item_id: number | null;
}

const COLUMNS = ['id', 'r2_key', 'file_name', 'size_bytes', 'format', 'content_type', 'created_at', 'order_id', 'order_item_id'];
/** D1 binds at most 100 parameters per statement. */
const CHUNK = 90;

const toRecord = (row: UploadRow): UploadRecord => ({
  id: row.id,
  r2Key: row.r2_key,
  fileName: row.file_name,
  sizeBytes: row.size_bytes,
  format: row.format,
  contentType: row.content_type,
  createdAt: row.created_at,
  orderId: row.order_id,
  orderItemId: row.order_item_id,
});

function chunks<T>(list: readonly T[]): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < list.length; i += CHUNK) result.push(list.slice(i, i + CHUNK));
  return result;
}

const marks = (count: number) => Array.from({ length: count }, () => '?').join(', ');

export function d1UploadStore(db: D1Database): UploadStore {
  return {
    async insert(u: NewUpload) {
      await db
        .prepare(`INSERT INTO uploads (id, r2_key, file_name, size_bytes, format, content_type, created_at) VALUES (${marks(7)})`)
        .bind(u.id, u.r2Key, u.fileName, u.sizeBytes, u.format, u.contentType, u.createdAt)
        .run();
    },
    async findMany(ids) {
      const found: UploadRecord[] = [];
      for (const part of chunks([...new Set(ids)])) {
        const { results } = await db
          .prepare(`SELECT ${COLUMNS.join(', ')} FROM uploads WHERE id IN (${marks(part.length)})`)
          .bind(...part)
          .all<UploadRow>();
        found.push(...results.map(toRecord));
      }
      return found;
    },
    async findDownloadable(id, since) {
      const row = await db
        .prepare(
          `SELECT ${COLUMNS.map((c) => `u.${c}`).join(', ')} FROM uploads u JOIN orders o ON o.id = u.order_id ` +
            'WHERE u.id = ? AND o.created_at >= ?',
        )
        .bind(id, since)
        .first<UploadRow>();
      return row ? toRecord(row) : null;
    },
    async findOrphans(before, limit) {
      const { results } = await db
        .prepare(`SELECT ${COLUMNS.join(', ')} FROM uploads WHERE order_id IS NULL AND created_at < ? ORDER BY created_at, id LIMIT ?`)
        .bind(before, limit)
        .all<UploadRow>();
      return results.map(toRecord);
    },
    async remove(ids) {
      // Only unused uploads: a file an order uses in the meantime stays.
      for (const part of chunks(ids)) {
        await db.prepare(`DELETE FROM uploads WHERE order_id IS NULL AND id IN (${marks(part.length)})`).bind(...part).run();
      }
    },
  };
}
