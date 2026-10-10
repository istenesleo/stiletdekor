// The uploads' metadata, as an interface: the API uses the D1 version (d1-store.ts), handler tests a fake.

export interface UploadRecord {
  /** Random UUID: the id in the cart, the order and the workshop's download link. */
  id: string;
  r2Key: string;
  /** The customer's file name; metadata only. */
  fileName: string;
  sizeBytes: number;
  /** The detected ArtworkFormat. */
  format: string;
  contentType: string;
  /** ISO timestamp (UTC). */
  createdAt: string;
  orderId: number | null;
  orderItemId: number | null;
}

export type NewUpload = Omit<UploadRecord, 'orderId' | 'orderItemId'>;

export interface UploadStore {
  insert(upload: NewUpload): Promise<void>;
  /** The uploads with these ids that exist, bound to an order or not. */
  findMany(ids: readonly string[]): Promise<UploadRecord[]>;
  /** The upload when an order uses it and that order arrived at or after `since` (ISO). */
  findDownloadable(id: string, since: string): Promise<UploadRecord | null>;
  /** Uploads no order uses, created before `before` (ISO), oldest first. */
  findOrphans(before: string, limit: number): Promise<UploadRecord[]>;
  remove(ids: readonly string[]): Promise<void>;
}
