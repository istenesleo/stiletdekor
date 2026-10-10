// The cron's job: deletes the uploads no order used within UPLOAD_ORPHAN_DAYS, from the file storage and from D1.
import { DAY_MS, UPLOAD_ORPHAN_DAYS } from '@/domain/uploads';
import type { BlobStore } from './blob-store';
import type { UploadStore } from './store';

export interface CleanupDeps {
  blobs: BlobStore;
  store: Pick<UploadStore, 'findOrphans' | 'remove'>;
  now: () => Date;
  /** Files per run; the rest waits for the next run. */
  limit?: number;
}

export async function deleteOrphanUploads({ blobs, store, now, limit = 100 }: CleanupDeps): Promise<number> {
  const before = new Date(now().getTime() - UPLOAD_ORPHAN_DAYS * DAY_MS).toISOString();
  const orphans = await store.findOrphans(before, limit);
  if (orphans.length === 0) return 0;
  await blobs.delete(orphans.map((upload) => upload.r2Key));
  await store.remove(orphans.map((upload) => upload.id));
  return orphans.length;
}
