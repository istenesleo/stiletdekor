-- Quote requests (the wizard, /ajanlatkeres/[tipus]), docs/superpowers/specs/2026-10-08-weboldal-mukodesi-elvek-design.md, 4.
-- The reference is "AK-" + the id (src/domain/reference.ts). The job type's answers are JSON keyed by the catalog's
-- field ids; emailed_files lists the file fields the customer will send by e-mail (no uploads yet).
CREATE TABLE quote_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  form_token TEXT NOT NULL UNIQUE,
  quote_type TEXT NOT NULL,
  fields_json TEXT NOT NULL,
  emailed_files_json TEXT NOT NULL DEFAULT '[]',
  location TEXT,
  deadline TEXT NOT NULL,
  survey_requested INTEGER NOT NULL DEFAULT 0,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_company TEXT,
  source TEXT,
  created_at TEXT NOT NULL,
  -- The workshop's e-mail, as in callback_requests (src/server/notify/queue.ts).
  notified_at TEXT,
  notify_attempts INTEGER NOT NULL DEFAULT 0,
  notify_last_attempt_at TEXT,
  notify_last_error TEXT
);

CREATE INDEX quote_requests_pending ON quote_requests (created_at) WHERE notified_at IS NULL;
