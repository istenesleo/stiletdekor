// POST /api/uploads (src/server/upload/receive.ts).
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { FORBIDDEN_MESSAGE, jsonResponse, originAllowed } from '@/server/api';
import { limiterAllows } from '@/server/forms';
import { r2BlobStore } from '@/server/upload/blob-store';
import { d1UploadStore } from '@/server/upload/d1-store';
import { receiveUpload } from '@/server/upload/receive';

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!originAllowed(request, env.ALLOWED_ORIGINS)) return jsonResponse(403, { error: FORBIDDEN_MESSAGE });
  const length = request.headers.get('Content-Length');
  return receiveUpload(
    { fileName: request.headers.get('X-File-Name'), length: length === null ? null : Number(length), body: request.body },
    {
      blobs: env.UPLOADS ? r2BlobStore(env.UPLOADS) : undefined,
      store: d1UploadStore(env.DB),
      allow: () => limiterAllows(env.UPLOAD_LIMITER, `feltoltes:${clientAddress}`),
      now: () => new Date(),
      newId: () => crypto.randomUUID(),
    },
  );
};
