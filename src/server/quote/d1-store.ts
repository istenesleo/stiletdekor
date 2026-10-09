// The quote requests in D1 (table quote_requests, migrations/0002_quote_requests.sql).
import { QUOTE_TYPE_IDS, type QuoteTypeId } from '@/domain/catalog';
import { d1NotificationQueue } from '../notify/queue';
import type { QuoteStore, StoredQuote } from './store';

interface QuoteRow {
  id: number;
  quote_type: string;
  fields_json: string;
  emailed_files_json: string;
  location: string | null;
  deadline: string;
  survey_requested: number;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  contact_company: string | null;
  source: string | null;
  created_at: string;
}

const COLUMNS =
  'id, quote_type, fields_json, emailed_files_json, location, deadline, survey_requested, contact_name, contact_email, contact_phone, contact_company, source, created_at';

function json<T>(text: string, fallback: T): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

const isQuoteTypeId = (value: string): value is QuoteTypeId => (QUOTE_TYPE_IDS as readonly string[]).includes(value);

function toStored(row: QuoteRow): StoredQuote {
  return {
    id: row.id,
    quoteType: isQuoteTypeId(row.quote_type) ? row.quote_type : 'egyeb',
    fields: json(row.fields_json, {}),
    emailedFiles: json(row.emailed_files_json, []),
    location: row.location ?? undefined,
    deadline: row.deadline,
    surveyRequested: row.survey_requested === 1,
    contact: {
      name: row.contact_name,
      email: row.contact_email,
      phone: row.contact_phone,
      company: row.contact_company ?? undefined,
    },
    source: row.source ?? undefined,
    createdAt: row.created_at,
  };
}

export function d1QuoteStore(db: D1Database): QuoteStore {
  return {
    ...d1NotificationQueue(db, 'quote_requests', COLUMNS, toStored),
    async insert(q) {
      const inserted = await db
        .prepare(
          'INSERT INTO quote_requests (form_token, quote_type, fields_json, emailed_files_json, location, deadline, survey_requested, ' +
            'contact_name, contact_email, contact_phone, contact_company, source, created_at) ' +
            'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (form_token) DO NOTHING RETURNING id',
        )
        .bind(
          q.formToken,
          q.quoteType,
          JSON.stringify(q.fields),
          JSON.stringify(q.emailedFiles),
          q.location ?? null,
          q.deadline,
          q.surveyRequested ? 1 : 0,
          q.contact.name,
          q.contact.email,
          q.contact.phone,
          q.contact.company ?? null,
          q.source ?? null,
          q.createdAt,
        )
        .first<{ id: number }>();
      if (inserted) return inserted.id;
      const existing = await db.prepare('SELECT id FROM quote_requests WHERE form_token = ?').bind(q.formToken).first<{ id: number }>();
      if (!existing) throw new Error('The quote request was neither saved nor found.');
      return existing.id;
    },
  };
}
