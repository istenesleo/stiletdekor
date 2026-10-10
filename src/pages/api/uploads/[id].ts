// GET /api/uploads/<id>: the workshop's download link (src/server/upload/download.ts).
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { r2BlobStore } from '@/server/upload/blob-store';
import { d1UploadStore } from '@/server/upload/d1-store';
import { downloadUpload } from '@/server/upload/download';

export const GET: APIRoute = ({ params }) =>
  downloadUpload(params.id ?? '', {
    blobs: env.UPLOADS ? r2BlobStore(env.UPLOADS) : undefined,
    store: d1UploadStore(env.DB),
    now: () => new Date(),
  });
