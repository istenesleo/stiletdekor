// Uploads one file to POST /api/uploads: the file itself as the body, its name in X-File-Name. XMLHttpRequest instead
// of fetch, because only it reports the upload's progress.
import { MAX_UPLOAD_BYTES, UPLOAD_FAILED_MESSAGE, UPLOAD_TOO_LARGE_MESSAGE } from '@/domain/uploads';

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  format: string;
}

export class UploadError extends Error {
  /** The server suggests sending the file by e-mail instead (too large, unknown type, no storage). */
  readonly emailFallback: boolean;

  constructor(message: string, emailFallback: boolean) {
    super(message);
    this.name = 'UploadError';
    this.emailFallback = emailFallback;
  }
}

export function uploadFile(file: File, { onProgress }: { onProgress?: (percent: number) => void } = {}): Promise<UploadedFile> {
  if (file.size > MAX_UPLOAD_BYTES) return Promise.reject(new UploadError(UPLOAD_TOO_LARGE_MESSAGE, true));
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/uploads');
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');
    xhr.setRequestHeader('X-File-Name', encodeURIComponent(file.name));
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      let body: { id?: unknown; name?: unknown; size?: unknown; format?: unknown; error?: unknown; emailFallback?: unknown } = {};
      try {
        body = JSON.parse(xhr.responseText) as typeof body;
      } catch {
        // Not JSON: a generic message below.
      }
      if (xhr.status === 201 && typeof body.id === 'string') {
        resolve({ id: body.id, name: String(body.name ?? file.name), size: Number(body.size ?? file.size), format: String(body.format ?? '') });
      } else {
        reject(new UploadError(typeof body.error === 'string' ? body.error : UPLOAD_FAILED_MESSAGE, body.emailFallback === true));
      }
    };
    xhr.onerror = () => reject(new UploadError(UPLOAD_FAILED_MESSAGE, false));
    xhr.send(file);
  });
}
