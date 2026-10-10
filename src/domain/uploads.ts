// The rules of customer uploads (POST /api/uploads), shared by the browser (limits, messages) and the server
// (docs/superpowers/specs/2026-10-09-webshop-4a-4b-design.md, 6.).
import { ARTWORK_FILE_TYPES } from './artwork/filetypes';
import type { ArtworkFormat } from './artwork/types';

/** Below the Workers request body limit (100 MB). */
export const MAX_UPLOAD_BYTES = 95 * 1024 * 1024;
/** An upload that no order uses is deleted after this many days (the cron). */
export const UPLOAD_ORPHAN_DAYS = 3;
/** How long the workshop's download link works after the order arrived. */
export const UPLOAD_LINK_DAYS = 90;
export const DAY_MS = 24 * 60 * 60_000;
const MAX_FILE_NAME_LENGTH = 200;

export const UPLOAD_ACCEPTED_TEXT = `${ARTWORK_FILE_TYPES.map((type) => type.label).join(', ')} · legfeljebb 95 MB`;
const BY_EMAIL = 'Tegye kosárba fájl nélkül, és a rendelés után küldje el e-mailben, a rendelésszámmal.';
export const UPLOAD_TOO_LARGE_MESSAGE = `A fájl túl nagy, legfeljebb 95 MB lehet. ${BY_EMAIL}`;
export const UPLOAD_TYPE_MESSAGE = `Ezt a fájlt nem tudjuk fogadni. Elfogadott fájlok: ${UPLOAD_ACCEPTED_TEXT}. ${BY_EMAIL}`;
export const UPLOAD_UNAVAILABLE_MESSAGE = `A fájlfeltöltés most nem működik. ${BY_EMAIL}`;
export const UPLOAD_FAILED_MESSAGE = 'A feltöltés megszakadt. Próbálja újra.';

const DOCUMENTS = new Set<ArtworkFormat>(['pdf', 'ai', 'eps']);
const RASTERS = new Set<ArtworkFormat>(['png', 'jpeg', 'tiff', 'psd', 'bmp', 'heic', 'avif', 'webp', 'gif']);

/** Whether content of format `detected` may sit behind an extension of format `expected`: the same, or a sibling. */
export function formatFitsExtension(expected: ArtworkFormat, detected: ArtworkFormat): boolean {
  if (detected === 'unknown') return false;
  if (expected === detected) return true;
  return (DOCUMENTS.has(expected) && DOCUMENTS.has(detected)) || (RASTERS.has(expected) && RASTERS.has(detected));
}

const CONTENT_TYPES: Readonly<Record<ArtworkFormat, string>> = {
  pdf: 'application/pdf',
  ai: 'application/postscript',
  eps: 'application/postscript',
  svg: 'image/svg+xml',
  png: 'image/png',
  jpeg: 'image/jpeg',
  tiff: 'image/tiff',
  psd: 'image/vnd.adobe.photoshop',
  bmp: 'image/bmp',
  heic: 'image/heic',
  avif: 'image/avif',
  webp: 'image/webp',
  gif: 'image/gif',
  cdr: 'application/octet-stream',
  unknown: 'application/octet-stream',
};

export const contentTypeOf = (format: ArtworkFormat): string => CONTENT_TYPES[format];

/** The file name as a header carried it (URI-encoded): no folders, no control characters, at most 200 characters. */
export function cleanFileName(raw: string | null): string | null {
  if (raw === null) return null;
  let name: string;
  try {
    name = decodeURIComponent(raw);
  } catch {
    return null;
  }
  name = (name.split(/[\\/]/).pop() ?? '').replace(/[\u0000-\u001f\u007f]/g, '').trim();
  if (!name) return null;
  if (name.length <= MAX_FILE_NAME_LENGTH) return name;
  const extension = /\.[^.]{1,10}$/.exec(name)?.[0] ?? '';
  return name.slice(0, MAX_FILE_NAME_LENGTH - extension.length) + extension;
}

/** True when an upload made at `uploadedAtIso` is older than UPLOAD_ORPHAN_DAYS (the cron may have deleted it). */
export const isUploadExpired = (uploadedAtIso: string, now: Date): boolean =>
  now.getTime() - Date.parse(uploadedAtIso) > UPLOAD_ORPHAN_DAYS * DAY_MS;
