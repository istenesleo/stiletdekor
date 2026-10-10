import { describe, expect, it, vi } from 'vitest';
import { contentDisposition, downloadUpload } from './download';
import { memoryBlobStore } from './memory-blob-store';
import type { UploadRecord } from './store';

const ID = '3f8a2b6c-1d4e-4f5a-9b7c-0e1d2c3b4a59';
const NOW = new Date('2026-10-09T10:00:00.000Z');
const RECORD: UploadRecord = {
  id: ID,
  r2Key: `feltoltes/${ID}`,
  fileName: 'Molinó "végleges".svg',
  sizeBytes: 4,
  format: 'svg',
  contentType: 'image/svg+xml',
  createdAt: NOW.toISOString(),
  orderId: 1,
  orderItemId: 1,
};

describe('downloadUpload', () => {
  it('sends an ordered file as an attachment that cannot run scripts', async () => {
    const blobs = memoryBlobStore();
    blobs.files.set(RECORD.r2Key, { bytes: new TextEncoder().encode('<svg'), contentType: 'image/svg+xml' });
    const findDownloadable = vi.fn(async () => RECORD);
    const response = await downloadUpload(ID, { blobs, store: { findDownloadable }, now: () => NOW });
    expect(findDownloadable).toHaveBeenCalledWith(ID, '2026-07-11T10:00:00.000Z');
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('<svg');
    expect(response.headers.get('Content-Type')).toBe('image/svg+xml');
    expect(response.headers.get('Content-Disposition')).toBe(contentDisposition(RECORD.fileName));
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('Content-Security-Policy')).toBe('sandbox');
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  });

  it('knows nothing about unknown, unordered or old files, or malformed ids', async () => {
    const blobs = memoryBlobStore();
    const none = { findDownloadable: async () => null };
    expect((await downloadUpload(ID, { blobs, store: none, now: () => NOW })).status).toBe(404);
    expect((await downloadUpload('../titok', { blobs, store: none, now: () => NOW })).status).toBe(404);
    const missingBytes = { findDownloadable: async () => RECORD };
    expect((await downloadUpload(ID, { blobs, store: missingBytes, now: () => NOW })).status).toBe(404);
  });

  it('names the file for every browser', () => {
    expect(contentDisposition('Molinó "végleges".svg')).toBe(
      `attachment; filename="Molino _vegleges_.svg"; filename*=UTF-8''${encodeURIComponent('Molinó "végleges".svg')}`,
    );
  });
});
