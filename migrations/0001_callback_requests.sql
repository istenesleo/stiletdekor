-- Callback requests ("Visszahívást kérek"), docs/superpowers/specs/2026-10-08-weboldal-mukodesi-elvek-design.md, 4.
-- The reference the customer sees is "VH-" + the id padded to four digits (src/domain/reference.ts);
-- AUTOINCREMENT keeps ids from ever being reused, so a reference never points at two requests.
CREATE TABLE callback_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  form_token TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  job_type TEXT,
  message TEXT,
  source TEXT,
  created_at TEXT NOT NULL,
  -- The workshop's e-mail: notified_at is set when it went out; until then the cron retries for 24 hours.
  -- notify_last_attempt_at is a 5-minute lease, so two senders never send the same e-mail at once.
  notified_at TEXT,
  notify_attempts INTEGER NOT NULL DEFAULT 0,
  notify_last_attempt_at TEXT,
  notify_last_error TEXT
);

CREATE INDEX callback_requests_pending ON callback_requests (created_at) WHERE notified_at IS NULL;
