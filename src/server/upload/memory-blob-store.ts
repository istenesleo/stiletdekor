// A BlobStore in memory, for the tests. Like R2, it refuses a stream whose length differs from the one given.
import type { BlobStore } from './blob-store';

export function memoryBlobStore(): BlobStore & { files: Map<string, { bytes: Uint8Array; contentType: string }> } {
  const files = new Map<string, { bytes: Uint8Array; contentType: string }>();
  return {
    files,
    async put(key, body, length, contentType) {
      const bytes = new Uint8Array(await new Response(body).arrayBuffer());
      if (bytes.length !== length) throw new Error(`Length mismatch: ${bytes.length} instead of ${length}`);
      files.set(key, { bytes, contentType });
    },
    async head(key, bytes) {
      return files.get(key)?.bytes.slice(0, bytes) ?? new Uint8Array();
    },
    async get(key) {
      const file = files.get(key);
      return file ? { body: new Blob([file.bytes]).stream(), size: file.bytes.length } : null;
    },
    async delete(keys) {
      for (const key of keys) files.delete(key);
    },
  };
}
