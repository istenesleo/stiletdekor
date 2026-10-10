// The cart as the browser keeps it (localStorage, CART_STORAGE_KEY): the configuration, the uploaded files and the
// browser's preflight per item. No prices (they are always calculated from the configuration) and no personal data
// (docs/superpowers/specs/2026-10-09-webshop-4a-4b-design.md, 4.).
import { z } from 'zod';
import { MAX_ORDER_ITEMS, MAX_UPLOADS_PER_ITEM, PreflightSummarySchema, ProductConfigSchema, UploadIdSchema } from './config-schemas';
import { isUploadExpired } from './uploads';

const CartFileSchema = z.object({
  uploadId: UploadIdSchema,
  name: z.string().min(1).max(200),
  size: z.number().int().min(0),
  uploadedAt: z.iso.datetime(),
});

const CartEntrySchema = z.object({
  key: z.string().min(1).max(64),
  config: ProductConfigSchema,
  files: z.array(CartFileSchema).max(MAX_UPLOADS_PER_ITEM),
  preflight: PreflightSummarySchema.optional(),
  addedAt: z.iso.datetime(),
});

export type CartFile = z.output<typeof CartFileSchema>;
export type CartEntry = z.output<typeof CartEntrySchema>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** The stored cart's valid items; `dropped` counts the ones that are no longer valid (the cart says so). */
export function parseStoredCart(raw: string | null): { entries: CartEntry[]; dropped: number } {
  const empty = { entries: [], dropped: 0 };
  if (!raw) return empty;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return empty;
  }
  if (!isRecord(data) || data.v !== 1 || !Array.isArray(data.items)) return empty;
  const entries: CartEntry[] = [];
  let dropped = Math.max(0, data.items.length - MAX_ORDER_ITEMS);
  for (const item of data.items.slice(0, MAX_ORDER_ITEMS)) {
    const parsed = CartEntrySchema.safeParse(item);
    if (parsed.success) entries.push(parsed.data);
    else dropped += 1;
  }
  return { entries, dropped };
}

export const serializeCart = (entries: readonly CartEntry[]): string => JSON.stringify({ v: 1, items: entries });

/** The entry's files older than UPLOAD_ORPHAN_DAYS: the server may have deleted them. */
export const expiredFiles = (entry: CartEntry, now: Date): CartFile[] =>
  entry.files.filter((file) => isUploadExpired(file.uploadedAt, now));

/** The items of POST /api/orders. */
export const toOrderItems = (entries: readonly CartEntry[]) =>
  entries.map((entry) => ({
    config: entry.config,
    uploadIds: entry.files.map((file) => file.uploadId),
    ...(entry.preflight ? { preflight: entry.preflight } : {}),
  }));
