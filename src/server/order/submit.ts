// POST /api/orders: the checkout island's JSON. Trap field, rate limit, the one-time form token, the shared schema,
// the uploads, then the server's own price (priceCart: whatever price the browser sends is ignored) and one
// transaction (docs/superpowers/specs/2026-10-09-webshop-4a-4b-design.md, 7.).
import { ConfigurationError, describeConfiguration, priceCart } from '@/domain/pricing';
import { formatReference } from '@/domain/reference';
import { formSource, OrderRequestSchema } from '@/domain/schemas';
import { HONEYPOT_FIELD, isFormToken, SAVE_FAILED_MESSAGE, TOO_MANY_MESSAGE } from '../forms';
import type { UploadStore } from '../upload/store';
import type { OrderStore } from './store';
import { statusPath } from './token';

export const ORDER_INVALID_MESSAGE = 'Érvénytelen kérés. Töltse újra az oldalt, és próbálja újra.';
export const ORDER_FILE_MISSING_MESSAGE =
  'A tétel egyik fájlja már nem érhető el. Töltse fel újra, vagy küldje el e-mailben a rendelés után.';
export const SITE_PHOTO_MISSING_MESSAGE = 'Az egyik helyszíni fotó már nem érhető el. Töltse fel újra.';

export type OrderResponseBody =
  | { reference: string | null; statusPath: string | null }
  | { errors: Record<string, string> }
  | { error: string };

export interface OrderResult {
  status: 200 | 201 | 400 | 422 | 429 | 500;
  body: OrderResponseBody;
  /** The new order's id: its workshop e-mail goes out after the response. */
  notifyId?: number;
}

export interface SubmitOrderDeps {
  store: Pick<OrderStore, 'insert' | 'findByFormToken'>;
  uploads: Pick<UploadStore, 'findMany'>;
  allow: () => Promise<boolean>;
  now: () => Date;
  newStatusToken: () => string;
  /** Where the order arrived (the request's origin), for the e-mail's links. */
  siteOrigin: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** A schema issue's key the way the checkout names its fields: "customer.email", "items.0.config.widthCm". */
export const issueKey = (path: readonly PropertyKey[]): string => path.map(String).join('.') || 'form';

const failed = (): OrderResult => ({ status: 500, body: { error: SAVE_FAILED_MESSAGE } });

export async function submitOrder(input: unknown, deps: SubmitOrderDeps): Promise<OrderResult> {
  if (!isRecord(input)) return { status: 400, body: { error: ORDER_INVALID_MESSAGE } };
  const trap = input[HONEYPOT_FIELD];
  if (typeof trap === 'string' && trap) return { status: 201, body: { reference: null, statusPath: null } };
  if (!(await deps.allow())) return { status: 429, body: { error: TOO_MANY_MESSAGE } };
  const formToken = input.formToken;
  if (!isFormToken(formToken)) return { status: 400, body: { error: ORDER_INVALID_MESSAGE } };
  const accepted = (id: number, token: string, status: 200 | 201): OrderResult => ({
    status,
    body: { reference: formatReference('R', id), statusPath: statusPath(token) },
  });

  try {
    const existing = await deps.store.findByFormToken(formToken);
    if (existing) return accepted(existing.id, existing.statusToken, 200);
  } catch (error) {
    console.error('A rendelés keresése nem sikerült:', error);
    return failed();
  }

  const parsed = OrderRequestSchema.safeParse(input);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[issueKey(issue.path)] ??= issue.message;
    return { status: 422, body: { errors } };
  }
  const order = parsed.data;

  const ids = [...order.items.flatMap((item) => item.uploadIds), ...order.sitePhotoIds];
  let found: Map<string, { orderId: number | null }>;
  try {
    found = new Map((ids.length > 0 ? await deps.uploads.findMany(ids) : []).map((upload) => [upload.id, upload]));
  } catch (error) {
    console.error('A feltöltések keresése nem sikerült:', error);
    return failed();
  }
  const usable = (id: string) => found.get(id)?.orderId === null;
  const fileErrors: Record<string, string> = {};
  order.items.forEach((item, index) => {
    if (!item.uploadIds.every(usable)) fileErrors[`items.${index}.uploadIds`] = ORDER_FILE_MISSING_MESSAGE;
  });
  if (!order.sitePhotoIds.every(usable)) fileErrors.sitePhotoIds = SITE_PHOTO_MISSING_MESSAGE;
  if (Object.keys(fileErrors).length > 0) return { status: 422, body: { errors: fileErrors } };

  let price: ReturnType<typeof priceCart>;
  try {
    price = priceCart(order.items, order.shippingMethod);
  } catch (error) {
    if (!(error instanceof ConfigurationError)) throw error;
    const errors: Record<string, string> = {};
    for (const issue of error.issues) errors[issueKey(issue.path)] ??= issue.message;
    return { status: 422, body: { errors } };
  }

  const { billingAddress, ...customer } = order.customer;
  try {
    const saved = await deps.store.insert({
      formToken,
      statusToken: deps.newStatusToken(),
      siteOrigin: deps.siteOrigin,
      customer,
      billingAddress,
      shippingMethod: order.shippingMethod,
      shippingAddress: order.shippingAddress,
      surveyRequested: order.surveyRequested,
      note: order.note,
      price,
      items: order.items.map((item, index) => ({
        config: item.config,
        description: describeConfiguration(item.config),
        price: price.items[index]!,
        uploadIds: item.uploadIds,
        preflight: item.preflight,
      })),
      sitePhotoIds: order.sitePhotoIds,
      source: formSource(input.source),
      createdAt: deps.now().toISOString(),
    });
    return saved.created
      ? { ...accepted(saved.id, saved.statusToken, 201), notifyId: saved.id }
      : accepted(saved.id, saved.statusToken, 200);
  } catch (error) {
    console.error('A rendelés mentése nem sikerült:', error);
    return failed();
  }
}
