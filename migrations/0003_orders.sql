-- Webshop orders (docs/superpowers/specs/2026-10-09-webshop-4a-4b-design.md, 8.). The reference is "R-" + the id
-- (src/domain/reference.ts); status_token is the secret of the customer's status page (/rendeles/<token>);
-- site_origin is where the order arrived, so the workshop's e-mail links there even when the cron sends it.
CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  form_token TEXT NOT NULL UNIQUE,
  status_token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'beerkezett',
  site_origin TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_company TEXT,
  customer_tax_number TEXT,
  billing_postal_code TEXT NOT NULL,
  billing_city TEXT NOT NULL,
  billing_address TEXT NOT NULL,
  shipping_method TEXT NOT NULL,
  shipping_postal_code TEXT,
  shipping_city TEXT,
  shipping_address TEXT,
  survey_requested INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  items_net INTEGER NOT NULL,
  shipping_net INTEGER NOT NULL,
  shipping_price_on_request INTEGER NOT NULL DEFAULT 0,
  net_total INTEGER NOT NULL,
  vat_total INTEGER NOT NULL,
  gross_total INTEGER NOT NULL,
  price_json TEXT NOT NULL,
  source TEXT,
  created_at TEXT NOT NULL,
  -- The workshop's e-mail, as in callback_requests (src/server/notify/queue.ts).
  notified_at TEXT,
  notify_attempts INTEGER NOT NULL DEFAULT 0,
  notify_last_attempt_at TEXT,
  notify_last_error TEXT
);

CREATE INDEX orders_pending ON orders (created_at) WHERE notified_at IS NULL;

CREATE TABLE order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders (id),
  position INTEGER NOT NULL,
  product_id TEXT NOT NULL,
  description TEXT NOT NULL,
  config_json TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  express INTEGER NOT NULL,
  net_total INTEGER NOT NULL,
  vat_total INTEGER NOT NULL,
  gross_total INTEGER NOT NULL,
  price_json TEXT NOT NULL,
  -- The browser's preflight (PreflightSummary): informational only.
  preflight_json TEXT,
  UNIQUE (order_id, position)
);

-- Status changes; the workshop UI (4c) shows them as the order's history.
CREATE TABLE order_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders (id),
  created_at TEXT NOT NULL,
  status_from TEXT,
  status_to TEXT NOT NULL,
  actor TEXT NOT NULL,
  note TEXT
);

CREATE INDEX order_events_order ON order_events (order_id, id);

-- Customer uploads in R2 (key r2_key). order_id is empty until an order uses the file; order_item_id is empty for
-- the site photos of an installation. Unused files are deleted after 3 days (src/server/upload/cleanup.ts).
CREATE TABLE uploads (
  id TEXT PRIMARY KEY,
  r2_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  format TEXT NOT NULL,
  content_type TEXT NOT NULL,
  created_at TEXT NOT NULL,
  order_id INTEGER REFERENCES orders (id),
  order_item_id INTEGER REFERENCES order_items (id)
);

CREATE INDEX uploads_orphans ON uploads (created_at) WHERE order_id IS NULL;
CREATE INDEX uploads_order ON uploads (order_id);
