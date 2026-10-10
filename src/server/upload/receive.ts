// POST /api/uploads: one file as the request body, its name in X-File-Name. Checks the limiter, the size and the
// extension first, writes the stream straight to the file storage (nothing is held in memory), then reads back the
// first 4 KB to check that the content is what the name says; a misfit is deleted
// (docs/superpowers/specs/2026-10-09-webshop-4a-4b-design.md, 6.).
import { detectArtworkFormat } from '@/domain/artwork/detect';
import { artworkFileTypeOf } from '@/domain/artwork/filetypes';
import {
  cleanFileName,
  contentTypeOf,
  formatFitsExtension,
  MAX_UPLOAD_BYTES,
  UPLOAD_TOO_LARGE_MESSAGE,
  UPLOAD_TYPE_MESSAGE,
  UPLOAD_UNAVAILABLE_MESSAGE,
} from '@/domain/uploads';
import { jsonResponse } from '../api';
import { TOO_MANY_MESSAGE } from '../forms';
import type { BlobStore } from './blob-store';
import type { UploadStore } from './store';

const HEAD_BYTES = 4096;

export interface ReceiveUploadDeps {
  /** Missing when R2 is not bound: the customer is offered e-mail instead. */
  blobs: BlobStore | undefined;
  store: Pick<UploadStore, 'insert'>;
  allow: () => Promise<boolean>;
  now: () => Date;
  newId: () => string;
}

export interface UploadInput {
  /** The X-File-Name header (URI-encoded). */
  fileName: string | null;
  /** The Content-Length header. */
  length: number | null;
  body: ReadableStream<Uint8Array> | null;
}

const refuse = (status: number, error: string, emailFallback = false) =>
  jsonResponse(status, emailFallback ? { error, emailFallback: true } : { error });

export async function receiveUpload(input: UploadInput, deps: ReceiveUploadDeps): Promise<Response> {
  if (!(await deps.allow())) return refuse(429, TOO_MANY_MESSAGE);
  if (!deps.blobs) return refuse(503, UPLOAD_UNAVAILABLE_MESSAGE, true);
  const name = cleanFileName(input.fileName);
  if (!name) return refuse(400, 'Hiányzik a fájl neve.');
  if (input.length === null || !Number.isSafeInteger(input.length) || input.length <= 0) {
    return refuse(411, 'Hiányzik a fájl mérete.');
  }
  if (input.length > MAX_UPLOAD_BYTES) return refuse(413, UPLOAD_TOO_LARGE_MESSAGE, true);
  const fileType = artworkFileTypeOf(name);
  if (!fileType) return refuse(415, UPLOAD_TYPE_MESSAGE, true);
  if (!input.body) return refuse(400, 'Hiányzik a fájl.');

  const id = deps.newId();
  const key = `feltoltes/${id}`;
  try {
    await deps.blobs.put(key, input.body, input.length, contentTypeOf(fileType.format));
  } catch (error) {
    console.error('A feltöltés mentése nem sikerült:', error);
    return refuse(503, UPLOAD_UNAVAILABLE_MESSAGE, true);
  }
  const format = detectArtworkFormat(await deps.blobs.head(key, HEAD_BYTES), name);
  if (!formatFitsExtension(fileType.format, format)) {
    await deps.blobs.delete([key]);
    return refuse(415, UPLOAD_TYPE_MESSAGE, true);
  }
  try {
    // The detected format's type: a PNG named .jpg downloads as image/png.
    await deps.store.insert({
      id,
      r2Key: key,
      fileName: name,
      sizeBytes: input.length,
      format,
      contentType: contentTypeOf(format),
      createdAt: deps.now().toISOString(),
    });
  } catch (error) {
    console.error('A feltöltés adatai nem menthetők:', error);
    await deps.blobs.delete([key]);
    return refuse(503, UPLOAD_UNAVAILABLE_MESSAGE, true);
  }
  return jsonResponse(201, { id, name, size: input.length, format });
}
