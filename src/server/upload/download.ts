// GET /api/uploads/<id>: the workshop's link to a customer's file. Only files of an order, and only for
// UPLOAD_LINK_DAYS after the order arrived. Always an attachment that cannot run scripts (an SVG could).
import { DAY_MS, UPLOAD_LINK_DAYS } from '@/domain/uploads';
import { isUuid } from '../forms';
import type { BlobStore } from './blob-store';
import type { UploadStore } from './store';

export interface DownloadDeps {
  blobs: BlobStore | undefined;
  store: Pick<UploadStore, 'findDownloadable'>;
  now: () => Date;
}

const text = (status: number, body: string) =>
  new Response(body, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });

/** "attachment" with an ASCII name for old clients and the real one (RFC 6266) for the rest. */
export function contentDisposition(name: string): string {
  const ascii = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7e]/g, '_')
    .replace(/["\\]/g, '_');
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}

export async function downloadUpload(id: string, deps: DownloadDeps): Promise<Response> {
  if (!isUuid(id)) return text(404, 'Nincs ilyen fájl.');
  const since = new Date(deps.now().getTime() - UPLOAD_LINK_DAYS * DAY_MS).toISOString();
  const record = await deps.store.findDownloadable(id, since);
  if (!record) return text(404, 'Nincs ilyen fájl, vagy a link lejárt.');
  if (!deps.blobs) return text(503, 'A fájltár most nem elérhető.');
  const blob = await deps.blobs.get(record.r2Key);
  if (!blob) return text(404, 'A fájl már nincs meg.');
  return new Response(blob.body, {
    status: 200,
    headers: {
      'Content-Type': record.contentType,
      'Content-Length': String(blob.size),
      'Content-Disposition': contentDisposition(record.fileName),
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': 'sandbox',
      'Cache-Control': 'private, no-store',
    },
  });
}
