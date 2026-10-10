import { describe, expect, it, vi } from 'vitest';
import { deleteOrphanUploads } from './cleanup';
import { memoryBlobStore } from './memory-blob-store';
import type { UploadRecord } from './store';

const orphan = (id: string): UploadRecord => ({
  id,
  r2Key: `feltoltes/${id}`,
  fileName: 'a.pdf',
  sizeBytes: 1,
  format: 'pdf',
  contentType: 'application/pdf',
  createdAt: '2026-10-01T00:00:00.000Z',
  orderId: null,
  orderItemId: null,
});

describe('deleteOrphanUploads', () => {
  it('deletes the files no order used for three days, bytes and metadata', async () => {
    const blobs = memoryBlobStore();
    blobs.files.set('feltoltes/a', { bytes: new Uint8Array([1]), contentType: 'application/pdf' });
    blobs.files.set('feltoltes/b', { bytes: new Uint8Array([1]), contentType: 'application/pdf' });
    const findOrphans = vi.fn(async () => [orphan('a')]);
    const remove = vi.fn(async () => {});
    const count = await deleteOrphanUploads({ blobs, store: { findOrphans, remove }, now: () => new Date('2026-10-09T10:00:00.000Z') });
    expect(count).toBe(1);
    expect(findOrphans).toHaveBeenCalledWith('2026-10-06T10:00:00.000Z', 100);
    expect([...blobs.files.keys()]).toEqual(['feltoltes/b']);
    expect(remove).toHaveBeenCalledWith(['a']);
  });

  it('does nothing when there is nothing to delete', async () => {
    const remove = vi.fn(async () => {});
    const store = { findOrphans: async () => [], remove };
    expect(await deleteOrphanUploads({ blobs: memoryBlobStore(), store, now: () => new Date() })).toBe(0);
    expect(remove).not.toHaveBeenCalled();
  });
});
