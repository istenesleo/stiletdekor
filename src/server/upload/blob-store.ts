// Where the uploaded files live: R2 in the Worker (r2BlobStore), memory in the tests (memory-blob-store.ts).
// The handlers only use this interface, so they run in Node tests without the Workers runtime.

export interface StoredBlob {
  body: ReadableStream<Uint8Array>;
  size: number;
}

export interface BlobStore {
  /** Saves a stream of exactly `length` bytes (R2 needs the length up front: the request's Content-Length). */
  put(key: string, body: ReadableStream<Uint8Array>, length: number, contentType: string): Promise<void>;
  /** The first `bytes` bytes of a saved file (fewer when it is shorter, none when it is missing). */
  head(key: string, bytes: number): Promise<Uint8Array>;
  get(key: string): Promise<StoredBlob | null>;
  delete(keys: readonly string[]): Promise<void>;
}

export function r2BlobStore(bucket: R2Bucket): BlobStore {
  return {
    async put(key, body, _length, contentType) {
      await bucket.put(key, body, { httpMetadata: { contentType } });
    },
    async head(key, bytes) {
      const object = await bucket.get(key, { range: { offset: 0, length: bytes } });
      return object ? new Uint8Array(await object.arrayBuffer()) : new Uint8Array();
    },
    async get(key) {
      const object = await bucket.get(key);
      return object ? { body: object.body, size: object.size } : null;
    },
    async delete(keys) {
      if (keys.length > 0) await bucket.delete([...keys]);
    },
  };
}
