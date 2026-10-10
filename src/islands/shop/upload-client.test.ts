/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MAX_UPLOAD_BYTES, UPLOAD_FAILED_MESSAGE, UPLOAD_TOO_LARGE_MESSAGE } from '@/domain/uploads';
import { UploadError, uploadFile } from './upload-client';

class FakeXhr {
  static last: FakeXhr;
  upload: { onprogress: ((event: { lengthComputable: boolean; loaded: number; total: number }) => void) | null } = { onprogress: null };
  status = 0;
  responseText = '';
  method = '';
  url = '';
  headers: Record<string, string> = {};
  body: unknown;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor() {
    FakeXhr.last = this;
  }
  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }
  setRequestHeader(name: string, value: string) {
    this.headers[name] = value;
  }
  send(body: unknown) {
    this.body = body;
  }
  respond(status: number, body: unknown) {
    this.status = status;
    this.responseText = JSON.stringify(body);
    this.onload?.();
  }
}

beforeEach(() => vi.stubGlobal('XMLHttpRequest', FakeXhr));
afterEach(() => vi.unstubAllGlobals());

describe('uploadFile', () => {
  it('sends the file as it is, with its name, and reports the progress', async () => {
    const file = new File(['%PDF-1.7'], 'Molinó.pdf', { type: 'application/pdf' });
    const progress = vi.fn();
    const done = uploadFile(file, { onProgress: progress });
    const xhr = FakeXhr.last;
    expect([xhr.method, xhr.url, xhr.body]).toEqual(['POST', '/api/uploads', file]);
    expect(xhr.headers).toEqual({ 'Content-Type': 'application/octet-stream', 'X-File-Name': encodeURIComponent('Molinó.pdf') });
    xhr.upload.onprogress?.({ lengthComputable: true, loaded: 45, total: 100 });
    xhr.respond(201, { id: 'u1', name: 'Molinó.pdf', size: 8, format: 'pdf' });
    await expect(done).resolves.toEqual({ id: 'u1', name: 'Molinó.pdf', size: 8, format: 'pdf' });
    expect(progress).toHaveBeenCalledWith(45);
  });

  it('passes on the server message and whether e-mail is the way out', async () => {
    const done = uploadFile(new File(['x'], 'a.exe'));
    FakeXhr.last.respond(415, { error: 'Ezt a fájlt nem tudjuk fogadni.', emailFallback: true });
    await expect(done).rejects.toEqual(expect.objectContaining({ message: 'Ezt a fájlt nem tudjuk fogadni.', emailFallback: true }));
  });

  it('says the upload broke on a network error, and refuses too large files before sending', async () => {
    const broken = uploadFile(new File(['x'], 'a.pdf'));
    FakeXhr.last.onerror?.();
    await expect(broken).rejects.toEqual(expect.objectContaining({ message: UPLOAD_FAILED_MESSAGE, emailFallback: false }));
    const large = new File(['x'], 'nagy.pdf');
    Object.defineProperty(large, 'size', { value: MAX_UPLOAD_BYTES + 1 });
    await expect(uploadFile(large)).rejects.toBeInstanceOf(UploadError);
    await expect(uploadFile(large)).rejects.toEqual(expect.objectContaining({ message: UPLOAD_TOO_LARGE_MESSAGE }));
  });
});
