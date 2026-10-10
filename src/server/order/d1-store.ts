// The webshop orders in D1 (orders, order_items, order_events and uploads; migrations/0003_orders.sql). An order is
// saved in one batch (a D1 transaction): the later statements find the order by its form token, so a second request
// with the same token fails on the unique index and changes nothing.
import { SHIPPING_METHOD_IDS, SHOP_PRODUCT_IDS } from '@/domain/catalog';
import { ORDER_STATUS_IDS } from '@/domain/orders';
import type { PreflightSummary } from '@/domain/schemas';
import { d1NotificationQueue } from '../notify/queue';
import type { NewOrder, OrderFile, OrderStore, StoredOrder } from './store';

interface OrderRow {
  id: number;
  status_token: string;
  status: string;
  site_origin: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_company: string | null;
  customer_tax_number: string | null;
  billing_postal_code: string;
  billing_city: string;
  billing_address: string;
  shipping_method: string;
  shipping_postal_code: string | null;
  shipping_city: string | null;
  shipping_address: string | null;
  survey_requested: number;
  note: string | null;
  items_net: number;
  shipping_net: number;
  shipping_price_on_request: number;
  net_total: number;
  vat_total: number;
  gross_total: number;
  source: string | null;
  created_at: string;
}

interface ItemRow {
  id: number;
  position: number;
  product_id: string;
  description: string;
  quantity: number;
  express: number;
  net_total: number;
  vat_total: number;
  gross_total: number;
  preflight_json: string | null;
}

interface FileRow {
  id: string;
  file_name: string;
  size_bytes: number;
  order_item_id: number | null;
}

const ORDER_COLUMNS =
  'id, status_token, status, site_origin, customer_name, customer_email, customer_phone, customer_company, customer_tax_number, ' +
  'billing_postal_code, billing_city, billing_address, shipping_method, shipping_postal_code, shipping_city, shipping_address, ' +
  'survey_requested, note, items_net, shipping_net, shipping_price_on_request, net_total, vat_total, gross_total, source, created_at';

const marks = (count: number) => Array.from({ length: count }, () => '?').join(', ');
/** The order's id inside the batch, found by its form token (bound as a parameter). */
const ORDER_ID = '(SELECT id FROM orders WHERE form_token = ?)';

const oneOf = <T extends string>(list: readonly T[], value: string, fallback: T): T =>
  (list as readonly string[]).includes(value) ? (value as T) : fallback;

function parseJson<T>(text: string | null): T | undefined {
  if (!text) return undefined;
  try {
    return JSON.parse(text) as T;
  } catch {
    return undefined;
  }
}

async function hydrate(db: D1Database, row: OrderRow): Promise<StoredOrder> {
  const { results: items } = await db
    .prepare(
      'SELECT id, position, product_id, description, quantity, express, net_total, vat_total, gross_total, preflight_json ' +
        'FROM order_items WHERE order_id = ? ORDER BY position',
    )
    .bind(row.id)
    .all<ItemRow>();
  const { results: files } = await db
    .prepare('SELECT id, file_name, size_bytes, order_item_id FROM uploads WHERE order_id = ? ORDER BY created_at, id')
    .bind(row.id)
    .all<FileRow>();
  const toFile = (file: FileRow): OrderFile => ({ id: file.id, name: file.file_name, sizeBytes: file.size_bytes });
  const shippingAddress =
    row.shipping_postal_code && row.shipping_city && row.shipping_address
      ? { postalCode: row.shipping_postal_code, city: row.shipping_city, address: row.shipping_address }
      : undefined;
  return {
    id: row.id,
    statusToken: row.status_token,
    status: oneOf(ORDER_STATUS_IDS, row.status, 'beerkezett'),
    siteOrigin: row.site_origin,
    customer: {
      name: row.customer_name,
      email: row.customer_email,
      phone: row.customer_phone,
      company: row.customer_company ?? undefined,
      taxNumber: row.customer_tax_number ?? undefined,
    },
    billingAddress: { postalCode: row.billing_postal_code, city: row.billing_city, address: row.billing_address },
    shippingMethod: oneOf(SHIPPING_METHOD_IDS, row.shipping_method, 'szemelyes'),
    shippingAddress,
    surveyRequested: row.survey_requested === 1,
    note: row.note ?? undefined,
    totals: {
      itemsNet: row.items_net,
      shippingNet: row.shipping_net,
      shippingPriceOnRequest: row.shipping_price_on_request === 1,
      netTotal: row.net_total,
      vatTotal: row.vat_total,
      grossTotal: row.gross_total,
    },
    items: items.map((item) => ({
      position: item.position,
      productId: oneOf(SHOP_PRODUCT_IDS, item.product_id, 'molino'),
      description: item.description,
      quantity: item.quantity,
      express: item.express === 1,
      netTotal: item.net_total,
      vatTotal: item.vat_total,
      grossTotal: item.gross_total,
      preflight: parseJson<PreflightSummary>(item.preflight_json),
      files: files.filter((file) => file.order_item_id === item.id).map(toFile),
    })),
    sitePhotos: files.filter((file) => file.order_item_id === null).map(toFile),
    source: row.source ?? undefined,
    createdAt: row.created_at,
  };
}

function statements(db: D1Database, o: NewOrder): D1PreparedStatement[] {
  const address = o.shippingAddress;
  const list: D1PreparedStatement[] = [
    db
      .prepare(
        'INSERT INTO orders (form_token, status_token, status, site_origin, customer_name, customer_email, customer_phone, ' +
          'customer_company, customer_tax_number, billing_postal_code, billing_city, billing_address, shipping_method, ' +
          'shipping_postal_code, shipping_city, shipping_address, survey_requested, note, items_net, shipping_net, ' +
          `shipping_price_on_request, net_total, vat_total, gross_total, price_json, source, created_at) VALUES (${marks(27)})`,
      )
      .bind(
        o.formToken,
        o.statusToken,
        'beerkezett',
        o.siteOrigin,
        o.customer.name,
        o.customer.email,
        o.customer.phone,
        o.customer.company ?? null,
        o.customer.taxNumber ?? null,
        o.billingAddress.postalCode,
        o.billingAddress.city,
        o.billingAddress.address,
        o.shippingMethod,
        address?.postalCode ?? null,
        address?.city ?? null,
        address?.address ?? null,
        o.surveyRequested ? 1 : 0,
        o.note ?? null,
        o.price.itemsNet,
        o.price.shipping.net,
        o.price.shipping.priceOnRequest ? 1 : 0,
        o.price.netTotal,
        o.price.vatTotal,
        o.price.grossTotal,
        JSON.stringify(o.price),
        o.source ?? null,
        o.createdAt,
      ),
  ];
  o.items.forEach((item, position) => {
    list.push(
      db
        .prepare(
          'INSERT INTO order_items (order_id, position, product_id, description, config_json, quantity, express, net_total, ' +
            `vat_total, gross_total, price_json, preflight_json) VALUES (${ORDER_ID}, ${marks(11)})`,
        )
        .bind(
          o.formToken,
          position,
          item.config.productId,
          item.description,
          JSON.stringify(item.config),
          item.config.quantity,
          item.config.express ? 1 : 0,
          item.price.netTotal,
          item.price.vatTotal,
          item.price.grossTotal,
          JSON.stringify(item.price),
          item.preflight ? JSON.stringify(item.preflight) : null,
        ),
    );
    if (item.uploadIds.length > 0) {
      list.push(
        db
          .prepare(
            `UPDATE uploads SET order_id = ${ORDER_ID}, order_item_id = (SELECT oi.id FROM order_items oi JOIN orders o ` +
              `ON o.id = oi.order_id WHERE o.form_token = ? AND oi.position = ?) WHERE order_id IS NULL AND id IN (${marks(item.uploadIds.length)})`,
          )
          .bind(o.formToken, o.formToken, position, ...item.uploadIds),
      );
    }
  });
  if (o.sitePhotoIds.length > 0) {
    list.push(
      db
        .prepare(`UPDATE uploads SET order_id = ${ORDER_ID} WHERE order_id IS NULL AND id IN (${marks(o.sitePhotoIds.length)})`)
        .bind(o.formToken, ...o.sitePhotoIds),
    );
  }
  list.push(
    db
      .prepare(`INSERT INTO order_events (order_id, created_at, status_from, status_to, actor) VALUES (${ORDER_ID}, ?, NULL, ?, ?)`)
      .bind(o.formToken, o.createdAt, 'beerkezett', 'vasarlo'),
  );
  return list;
}

export function d1OrderStore(db: D1Database): OrderStore {
  const queue = d1NotificationQueue<OrderRow, OrderRow>(db, 'orders', ORDER_COLUMNS, (row) => row);
  const findByFormToken = async (formToken: string) => {
    const row = await db
      .prepare('SELECT id, status_token FROM orders WHERE form_token = ?')
      .bind(formToken)
      .first<{ id: number; status_token: string }>();
    return row ? { id: row.id, statusToken: row.status_token } : null;
  };
  return {
    async claimForNotification(id, now) {
      const row = await queue.claimForNotification(id, now);
      return row ? hydrate(db, row) : null;
    },
    markNotified: queue.markNotified,
    recordNotificationFailure: queue.recordNotificationFailure,
    pendingNotificationIds: queue.pendingNotificationIds,
    findByFormToken,
    async findByStatusToken(statusToken) {
      const row = await db.prepare(`SELECT ${ORDER_COLUMNS} FROM orders WHERE status_token = ?`).bind(statusToken).first<OrderRow>();
      return row ? hydrate(db, row) : null;
    },
    async insert(o) {
      const existing = await findByFormToken(o.formToken);
      if (existing) return { ...existing, created: false };
      try {
        await db.batch(statements(db, o));
      } catch (error) {
        // A parallel request with the same token won the unique index: answer with its order.
        const winner = await findByFormToken(o.formToken);
        if (winner) return { ...winner, created: false };
        throw error;
      }
      const saved = await findByFormToken(o.formToken);
      if (!saved) throw new Error('The order was neither saved nor found.');
      return { ...saved, created: true };
    },
  };
}
