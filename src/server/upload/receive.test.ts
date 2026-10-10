import { describe, expect, it, vi } from 'vitest';
import { UPLOAD_TOO_LARGE_MESSAGE, UPLOAD_TYPE_MESSAGE, UPLOAD_UNAVAILABLE_MESSAGE } from '@/domain/uploads';
import { memoryBlobStore } from './memory-blob-store';
import { receiveUpload, type ReceiveUploadDeps } from './receive';
import type { NewUpload } from './store';

const ID = '3f8a2b6c-1d4e-4f5a-9b7c-0e1d2c3b4a59';
const NOW = new Date('2026-10-09T10:00:00.000Z');
const PDF = new TextEncoder().encode('%PDF-1.7\n1 0 obj << >> endobj\n%%EOF');
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]);

const stream = (bytes: Uint8Array<ArrayBuffer>) => new Blob([bytes]).stream();
const input = (name: string | null, bytes: Uint8Array<ArrayBuffer>) => ({
  fileName: name === null ? null : encodeURIComponent(name),
  length: bytes.length,
  body: stream(bytes),
});

function deps(overrides: Partial<ReceiveUploadDeps> = {}) {
  const blobs = memoryBlobStore();
  const saved: NewUpload[] = [];
  const store = { insert: vi.fn(async (u: NewUpload) => void saved.push(u)) };
  const d: ReceiveUploadDeps = { blobs, store, allow: async () => true, now: () => NOW, newId: () => ID, ...overrides };
  return { blobs, saved, deps: d };
}

describe('receiveUpload', () => {
  it('saves a print file and its metadata, and answers with the id', async () => {
    const { blobs, saved, deps: d } = deps();
    const response = await receiveUpload(input('Molinó végleges.pdf', PDF), d);
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ id: ID, name: 'Molinó végleges.pdf', size: PDF.length, format: 'pdf' });
    expect(blobs.files.get(`feltoltes/${ID}`)).toEqual({ bytes: PDF, contentType: 'application/pdf' });
    expect(saved).toEqual([
      {
        id: ID,
        r2Key: `feltoltes/${ID}`,
        fileName: 'Molinó végleges.pdf',
        sizeBytes: PDF.length,
        format: 'pdf',
        contentType: 'application/pdf',
        createdAt: NOW.toISOString(),
      },
    ]);
  });

  it('takes a PNG named .jpg, and keeps the format it found', async () => {
    const response = await receiveUpload(input('foto.jpg', PNG), deps().deps);
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ format: 'png' });
  });

  it('refuses a file whose content does not fit its name, and deletes it', async () => {
    const { blobs, saved, deps: d } = deps();
    const response = await receiveUpload(input('logo.pdf', new TextEncoder().encode('hello')), d);
    expect(response.status).toBe(415);
    expect(await response.json()).toEqual({ error: UPLOAD_TYPE_MESSAGE, emailFallback: true });
    expect(blobs.files.size).toBe(0);
    expect(saved).toEqual([]);
  });

  it('refuses unknown extensions and too large files before reading them', async () => {
    const { blobs, deps: d } = deps();
    expect((await receiveUpload(input('setup.exe', PDF), d)).status).toBe(415);
    const large = await receiveUpload({ fileName: 'nagy.pdf', length: 96 * 1024 * 1024, body: stream(PDF) }, d);
    expect(large.status).toBe(413);
    expect(await large.json()).toEqual({ error: UPLOAD_TOO_LARGE_MESSAGE, emailFallback: true });
    expect(blobs.files.size).toBe(0);
  });

  it('needs a name, a length and a body', async () => {
    const { deps: d } = deps();
    expect((await receiveUpload(input(null, PDF), d)).status).toBe(400);
    expect((await receiveUpload({ fileName: 'a.pdf', length: null, body: stream(PDF) }, d)).status).toBe(411);
    expect((await receiveUpload({ fileName: 'a.pdf', length: 10, body: null }, d)).status).toBe(400);
  });

  it('offers e-mail when there is no file storage, and the phone after too many uploads', async () => {
    const off = await receiveUpload(input('logo.pdf', PDF), deps({ blobs: undefined }).deps);
    expect(off.status).toBe(503);
    expect(await off.json()).toEqual({ error: UPLOAD_UNAVAILABLE_MESSAGE, emailFallback: true });
    expect((await receiveUpload(input('logo.pdf', PDF), deps({ allow: async () => false }).deps)).status).toBe(429);
  });

  it('deletes the file when its metadata cannot be saved', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const failing = {
      insert: vi.fn(async () => {
        throw new Error('D1 down');
      }),
    };
    const { blobs, deps: d } = deps({ store: failing });
    const response = await receiveUpload(input('logo.pdf', PDF), d);
    expect(response.status).toBe(503);
    expect(blobs.files.size).toBe(0);
    error.mockRestore();
  });
});
