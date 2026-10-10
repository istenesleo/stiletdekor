// Zod schemas shared by the client (forms, islands) and the server (API routes).
// Every message a customer can see is Hungarian (magázó). The product configuration and cart item schemas live in
// config-schemas.ts (the shop's islands load only those) and are re-exported here.

import { z } from 'zod';
import { QUOTE_TYPE_IDS, SHIPPING_METHOD_IDS, MAX_QUOTE_UPLOADS, getQuoteType, type QuoteFieldDef } from './catalog';
import { CartItemSchema, MAX_ORDER_ITEMS, MAX_UPLOADS_PER_ITEM, UploadIdSchema } from './config-schemas';
import { budapestToday, isValidIsoDate, type IsoDate } from './leadtime';
import { formatNumberHu } from './money';

export {
  CartItemSchema,
  MAX_ORDER_ITEMS,
  MAX_UPLOADS_PER_ITEM,
  PreflightSummarySchema,
  ProductConfigSchema,
  UploadIdSchema,
  type CartItem,
  type PreflightSummary,
  type _ProductConfigSchemaMatchesDomain,
} from './config-schemas';

// ─── Building blocks ─────────────────────────────────────────────────────────────────────────────

/** Trimmed, non-empty string with a length cap. */
const requiredText = (requiredMessage: string, max: number, maxMessage: string, min = 1) =>
  z.string({ error: requiredMessage }).trim().min(min, requiredMessage).max(max, maxMessage);

/** Optional free text: missing, empty or whitespace-only becomes undefined. */
const optionalText = (max: number, maxMessage: string) =>
  z
    .string({ error: 'Érvénytelen szöveg.' })
    .trim()
    .max(max, maxMessage)
    .optional()
    .transform((value) => (value ? value : undefined));

const isoDate = (requiredMessage: string) =>
  z.iso.date({ error: (issue) => (issue.input === undefined ? requiredMessage : 'Érvénytelen dátum.') });



// ─── Customer data ───────────────────────────────────────────────────────────────────────────────

const PHONE_SEPARATORS = /[\s\-()./]/g;

/**
 * Loose phone check: Hungarian numbers with or without +36 / 0036 / 06 / 36 prefix (8–9 digits after it),
 * or a foreign number in international form. Separators (space, -, /, ., parentheses) are ignored.
 */
export function isPlausiblePhone(value: string): boolean {
  const compact = value.replace(PHONE_SEPARATORS, '');
  return /^(?:\+36|0036|06|36)?\d{8,9}$/.test(compact) || /^(?:\+|00)(?!36)\d{7,14}$/.test(compact);
}

const TAX_NUMBER_FORMAT = /^(\d{8})-([1-5])-(\d{2})$/;
const TAX_CHECK_WEIGHTS = [9, 7, 3, 1, 9, 7, 3] as const;

/**
 * Hungarian tax number (adószám) "12345678-1-12": 8-digit base number whose last digit is a
 * check digit (weights 9-7-3-1-9-7-3), VAT code 1–5, two-digit area code.
 */
export function isValidHuTaxNumber(value: string): boolean {
  const match = TAX_NUMBER_FORMAT.exec(value);
  if (!match?.[1]) return false;
  const digits = [...match[1]].map(Number);
  const sum = TAX_CHECK_WEIGHTS.reduce((acc, weight, i) => acc + weight * (digits[i] ?? 0), 0);
  return (10 - (sum % 10)) % 10 === digits[7];
}

/** Accepts "12345678-1-12", "12345678 1 12" or "12345678112"; outputs the dashed form. */
const TaxNumberSchema = z
  .string({ error: 'Érvénytelen adószám.' })
  .trim()
  .optional()
  .transform((value) => {
    if (!value) return undefined;
    const digits = value.replace(/[\s-]/g, '');
    return /^\d{11}$/.test(digits) ? `${digits.slice(0, 8)}-${digits.slice(8, 9)}-${digits.slice(9)}` : value;
  })
  .superRefine((value, ctx) => {
    if (value === undefined) return;
    if (!/^\d{8}-\d-\d{2}$/.test(value)) {
      ctx.addIssue({ code: 'custom', message: 'Az adószám formátuma: 12345678-1-12.' });
    } else if (!isValidHuTaxNumber(value)) {
      ctx.addIssue({ code: 'custom', message: 'Ez az adószám nem érvényes. Kérjük, ellenőrizze.' });
    }
  });

const PersonNameSchema = requiredText('Adja meg a nevét.', 100, 'A név legfeljebb 100 karakter lehet.', 2);

const EmailSchema = z
  .string({ error: 'Adja meg az e-mail-címét.' })
  .trim()
  .min(1, 'Adja meg az e-mail-címét.')
  .max(254, 'Az e-mail-cím túl hosszú.')
  .pipe(z.email({ error: 'Kérjük, érvényes e-mail-címet adjon meg.' }));

const PhoneSchema = z
  .string({ error: 'Adja meg a telefonszámát.' })
  .trim()
  .min(1, 'Adja meg a telefonszámát.')
  .max(30, 'A telefonszám túl hosszú.')
  .refine(isPlausiblePhone, 'Kérjük, érvényes telefonszámot adjon meg, például +36 70 123 4567.');

export const ContactSchema = z.object(
  {
    name: PersonNameSchema,
    email: EmailSchema,
    phone: PhoneSchema,
    company: optionalText(150, 'A cégnév legfeljebb 150 karakter lehet.'),
  },
  { error: 'Adja meg a kapcsolattartó adatait.' },
);

export const AddressSchema = z.object(
  {
    postalCode: z
      .string({ error: 'Adja meg az irányítószámot.' })
      .trim()
      .regex(/^[1-9]\d{3}$/, 'Az irányítószám 4 számjegyből áll.'),
    city: requiredText('Adja meg a települést.', 100, 'A település neve legfeljebb 100 karakter lehet.'),
    address: requiredText('Adja meg az utcát és a házszámot.', 200, 'A cím legfeljebb 200 karakter lehet.'),
  },
  { error: 'Adja meg a címet.' },
);

// ─── Callback request ────────────────────────────────────────────────────────────────────────────
// "Visszahívást kérek": name and phone, optionally the kind of job and one sentence
// (docs/superpowers/specs/2026-10-08-weboldal-mukodesi-elvek-design.md, 4.4).

/** Job types a callback request can name: the quote types, or "not sure yet". */
export const CALLBACK_JOB_TYPE_IDS = [...QUOTE_TYPE_IDS, 'nem-tudom'] as const;
export type CallbackJobTypeId = (typeof CALLBACK_JOB_TYPE_IDS)[number];

export function isCallbackJobTypeId(value: unknown): value is CallbackJobTypeId {
  return (CALLBACK_JOB_TYPE_IDS as readonly unknown[]).includes(value);
}

/** The job type as the form lists it: the quote type's name, or "Még nem tudom". */
export function callbackJobTypeName(id: CallbackJobTypeId): string {
  return id === 'nem-tudom' ? 'Még nem tudom' : getQuoteType(id).name;
}

/** The fields the visitor fills in, in form order. */
export const CALLBACK_FORM_FIELDS = ['name', 'phone', 'jobType', 'message'] as const;
export type CallbackFormField = (typeof CALLBACK_FORM_FIELDS)[number];
/** What the visitor typed, sent back into the form after an error. */
export type CallbackFormValues = Partial<Record<CallbackFormField, string>>;
/** One message per field. */
export type CallbackFormErrors = Partial<Record<CallbackFormField, string>>;

export const MAX_CALLBACK_MESSAGE_LENGTH = 300;
const MAX_SOURCE_LENGTH = 200;
const SOURCE_PATTERN = /^\/[A-Za-z0-9\-/]*(#[A-Za-z0-9-]+)?$/;

/** Where a form was sent from, for measuring: a path of the site with an optional #block id; anything else is dropped. */
export function formSource(value: unknown): string | undefined {
  return typeof value === 'string' && value.length <= MAX_SOURCE_LENGTH && SOURCE_PATTERN.test(value) ? value : undefined;
}

export const CallbackRequestSchema = z.object(
  {
    name: PersonNameSchema,
    phone: PhoneSchema,
    jobType: z
      .union([z.literal(''), z.enum(CALLBACK_JOB_TYPE_IDS)], { error: 'Válasszon a listából.' })
      .optional()
      .transform((value) => value || undefined),
    message: optionalText(MAX_CALLBACK_MESSAGE_LENGTH, `Legfeljebb ${MAX_CALLBACK_MESSAGE_LENGTH} karakter lehet.`),
    source: z.unknown().optional().transform(formSource),
  },
  { error: 'Érvénytelen visszahívás-kérés.' },
);

// ─── Order ───────────────────────────────────────────────────────────────────────────────────────

export const MAX_ORDER_NOTE_LENGTH = 2000;
/** Photos of the site, with installation only (docs/brief.md 4.1). */
export const MAX_SITE_PHOTOS = 10;

/**
 * Sending an order is free of obligation: the workshop checks it and sends a proforma invoice, and
 * paying that invoice is the acceptance (docs/brief.md chapter 10).
 */
export const OrderRequestSchema = z
  .object(
    {
      customer: ContactSchema.extend({
        taxNumber: TaxNumberSchema,
        billingAddress: AddressSchema,
      }).superRefine((customer, ctx) => {
        if (customer.taxNumber && !customer.company) {
          ctx.addIssue({ code: 'custom', path: ['company'], message: 'Adószám megadásakor a cégnevet is adja meg.' });
        }
      }),
      /** Courier delivery or installation address; the billing address is used when omitted. */
      shippingAddress: AddressSchema.optional(),
      shippingMethod: z.enum(SHIPPING_METHOD_IDS, { error: 'Válasszon átvételi módot.' }),
      /** With installation only: the customer asks for an on-site survey before production. */
      surveyRequested: z.boolean({ error: 'Érvénytelen érték.' }).default(false),
      /** With installation only: photos of the site, so the installation can be priced. */
      sitePhotoIds: z
        .array(UploadIdSchema, { error: 'Érvénytelen fájllista.' })
        .max(MAX_SITE_PHOTOS, `Legfeljebb ${MAX_SITE_PHOTOS} helyszíni fotó tölthető fel.`)
        .default([]),
      items: z
        .array(CartItemSchema, { error: 'A kosár üres.' })
        .min(1, 'A kosár üres.')
        .max(MAX_ORDER_ITEMS, `Egy rendelésben legfeljebb ${MAX_ORDER_ITEMS} tétel lehet.`),
      note: optionalText(MAX_ORDER_NOTE_LENGTH, `A megjegyzés legfeljebb ${MAX_ORDER_NOTE_LENGTH} karakter lehet.`),
      acceptTerms: z.literal(true, { error: 'A rendeléshez fogadja el az Általános Szerződési Feltételeket.' }),
    },
    { error: 'Érvénytelen rendelési adatok.' },
  )
  .superRefine((order, ctx) => {
    if (order.surveyRequested && order.shippingMethod !== 'telepites') {
      ctx.addIssue({ code: 'custom', path: ['surveyRequested'], message: 'Helyszíni felmérést telepítéssel együtt kérhet.' });
    }
    if (order.sitePhotoIds.length > 0 && order.shippingMethod !== 'telepites') {
      ctx.addIssue({ code: 'custom', path: ['sitePhotoIds'], message: 'Helyszíni fotót telepítéssel együtt küldhet.' });
    }
  });

// ─── Quote request ───────────────────────────────────────────────────────────────────────────────

export type QuoteFieldValue = string | number | string[] | null;

const QuoteFieldValueSchema = z.union([z.string(), z.number(), z.array(z.string()), z.null()], {
  error: 'Érvénytelen érték.',
});

export interface FieldIssue {
  path: (string | number)[];
  message: string;
}

const isEmptyValue = (value: unknown): boolean =>
  value === undefined || value === null || (typeof value === 'string' && value.trim() === '') || (Array.isArray(value) && value.length === 0);

/** Whether a field of the wizard shows, given the answers so far (its visibleWhen rule). */
export function isQuoteFieldVisible(def: QuoteFieldDef, fields: Readonly<Record<string, unknown>>): boolean {
  if (!def.visibleWhen) return true;
  const controller = fields[def.visibleWhen.field];
  return typeof controller === 'string' && def.visibleWhen.equals.includes(controller);
}

function requiredMessage(def: QuoteFieldDef): string {
  switch (def.type) {
    case 'select':
    case 'multiselect':
      return 'Kérjük, válasszon a lehetőségek közül.';
    case 'file':
      return 'Kérjük, töltsön fel legalább egy fájlt.';
    case 'date':
      return 'Kérjük, adja meg a dátumot.';
    case 'number':
      return 'Kérjük, adjon meg egy számot.';
    default:
      return 'Kérjük, töltse ki ezt a mezőt.';
  }
}

/** Returns an error message for a non-empty value, or null if it is valid. */
function checkFieldValue(def: QuoteFieldDef, value: unknown, today: IsoDate): string | null {
  switch (def.type) {
    case 'text':
    case 'textarea':
      if (typeof value !== 'string') return 'Kérjük, szöveget adjon meg.';
      return value.trim().length > def.maxLength ? `Legfeljebb ${def.maxLength} karakter lehet.` : null;
    case 'number': {
      if (typeof value !== 'number' || !Number.isFinite(value)) return 'Kérjük, számot adjon meg.';
      if (def.integer && !Number.isInteger(value)) return 'Kérjük, egész számot adjon meg.';
      if (value < def.min || value > def.max) {
        const unit = def.unit ? ` ${def.unit}` : '';
        return `Az érték ${formatNumberHu(def.min)} és ${formatNumberHu(def.max)}${unit} között lehet.`;
      }
      return null;
    }
    case 'select':
      return typeof value === 'string' && def.options.some((o) => o.value === value)
        ? null
        : 'Kérjük, a felsorolt lehetőségek közül válasszon.';
    case 'multiselect': {
      if (!Array.isArray(value) || !value.every((v) => typeof v === 'string' && def.options.some((o) => o.value === v))) {
        return 'Kérjük, a felsorolt lehetőségek közül válasszon.';
      }
      return new Set(value).size === value.length ? null : 'Minden lehetőség csak egyszer választható.';
    }
    case 'date':
      if (typeof value !== 'string' || !isValidIsoDate(value)) return 'Érvénytelen dátum.';
      return value < today ? 'A dátum nem lehet a múltban.' : null;
    case 'file':
      if (!Array.isArray(value) || !value.every((v) => UploadIdSchema.safeParse(v).success)) {
        return 'Érvénytelen feltöltés-azonosító.';
      }
      if (value.length > def.maxFiles) return `Legfeljebb ${def.maxFiles} fájl tölthető fel.`;
      return new Set(value).size === value.length ? null : 'Ugyanaz a fájl kétszer szerepel.';
  }
}

/**
 * Validates the type-specific wizard answers against the quote type's field definitions:
 * unknown fields, required fields, value types and ranges, visibility rules and "one of" groups.
 * Usable per wizard step on the client; QuoteRequestSchema runs it on submit.
 */
export function validateQuoteFields(
  quoteTypeId: string,
  fields: Readonly<Record<string, unknown>>,
  { today, emailedFiles = [] }: { today: IsoDate; emailedFiles?: readonly string[] },
): FieldIssue[] {
  const type = getQuoteType(quoteTypeId);
  if (!type) return [{ path: [], message: 'Ismeretlen munkatípus.' }];
  // A file the customer sends by e-mail (no uploads yet) counts as given.
  const emailed = (def: QuoteFieldDef) => def.type === 'file' && emailedFiles.includes(def.id);
  const issues: FieldIssue[] = [];
  const known = new Set(type.fields.map((def) => def.id));
  for (const key of Object.keys(fields)) {
    if (!known.has(key)) issues.push({ path: [key], message: 'Ismeretlen mező.' });
  }
  for (const def of type.fields) {
    if (!isQuoteFieldVisible(def, fields) || emailed(def)) continue;
    const value = fields[def.id];
    if (isEmptyValue(value)) {
      if (def.required) issues.push({ path: [def.id], message: requiredMessage(def) });
      continue;
    }
    const message = checkFieldValue(def, value, today);
    if (message) issues.push({ path: [def.id], message });
  }
  for (const group of type.requireOneOf ?? []) {
    const visible = type.fields.filter((def) => group.fields.includes(def.id) && isQuoteFieldVisible(def, fields));
    if (visible.length > 0 && visible.every((def) => isEmptyValue(fields[def.id]) && !emailed(def))) {
      issues.push({ path: [visible[0]?.id ?? ''], message: group.message });
    }
  }
  return issues;
}

/** Keeps only known, visible, non-empty answers; trims strings. */
export function pruneQuoteFields(
  quoteTypeId: string,
  fields: Readonly<Record<string, QuoteFieldValue>>,
): Record<string, Exclude<QuoteFieldValue, null>> {
  const type = getQuoteType(quoteTypeId);
  const result: Record<string, Exclude<QuoteFieldValue, null>> = {};
  if (!type) return result;
  for (const def of type.fields) {
    const value = fields[def.id];
    if (value === undefined || value === null || isEmptyValue(value) || !isQuoteFieldVisible(def, fields)) continue;
    result[def.id] = typeof value === 'string' ? value.trim() : value;
  }
  return result;
}

export interface QuoteSchemaOptions {
  /** Clock for "not in the past" checks; injectable for tests. */
  now?: () => Date;
}

export function createQuoteRequestSchema({ now = () => new Date() }: QuoteSchemaOptions = {}) {
  return z
    .object(
      {
        quoteType: z.enum(QUOTE_TYPE_IDS, { error: 'Válassza ki a munka típusát.' }),
        fields: z.record(z.string(), QuoteFieldValueSchema, { error: 'Érvénytelen adatok.' }),
        location: optionalText(300, 'A cím legfeljebb 300 karakter lehet.'),
        deadline: isoDate('Adja meg a határidőt.'),
        uploadIds: z
          .array(UploadIdSchema, { error: 'Érvénytelen fájllista.' })
          .max(MAX_QUOTE_UPLOADS, `Legfeljebb ${MAX_QUOTE_UPLOADS} fájl tölthető fel.`)
          .default([]),
        /** File fields the customer will send by e-mail with the reference (no uploads yet, 2026-10-09). */
        emailedFiles: z
          .array(z.string({ error: 'Érvénytelen fájlmező.' }), { error: 'Érvénytelen fájlmező.' })
          .max(MAX_QUOTE_UPLOADS, 'Túl sok fájlmező.')
          .default([]),
        contact: ContactSchema,
        /** No date: the workshop calls back and arranges the survey by phone (decision of 2026-10-05). */
        surveyRequested: z.boolean({ error: 'Érvénytelen érték.' }).default(false),
      },
      { error: 'Érvénytelen ajánlatkérés.' },
    )
    .superRefine((request, ctx) => {
      const today = budapestToday(now());
      const type = getQuoteType(request.quoteType);
      for (const issue of validateQuoteFields(request.quoteType, request.fields, { today, emailedFiles: request.emailedFiles })) {
        ctx.addIssue({ code: 'custom', path: ['fields', ...issue.path], message: issue.message });
      }
      if (!request.location && (type.locationRequired || request.surveyRequested)) {
        const message = type.locationRequired ? 'Adja meg a helyszín címét.' : 'A helyszíni felméréshez adja meg a címet.';
        ctx.addIssue({ code: 'custom', path: ['location'], message });
      }
      if (request.deadline < today) {
        ctx.addIssue({ code: 'custom', path: ['deadline'], message: 'A határidő nem lehet múltbeli dátum.' });
      }
    }, {
      // Also when the contact or the date is wrong, so the form shows every message in one round; but only when the
      // job type and the shape of the answers are right, since the rules depend on them.
      when: (payload) =>
        !payload.issues.some((issue) => ['quoteType', 'fields', 'emailedFiles'].includes(String(issue.path?.[0]))),
    })
    .transform((request) => {
      const type = getQuoteType(request.quoteType);
      return {
        ...request,
        fields: pruneQuoteFields(request.quoteType, request.fields),
        emailedFiles: request.emailedFiles.filter((id) =>
          type.fields.some((def) => def.id === id && def.type === 'file' && isQuoteFieldVisible(def, request.fields)),
        ),
      };
    });
}

export const QuoteRequestSchema = createQuoteRequestSchema();

// ─── Types ───────────────────────────────────────────────────────────────────────────────────────

export type Contact = z.output<typeof ContactSchema>;
export type Address = z.output<typeof AddressSchema>;
export type OrderRequest = z.output<typeof OrderRequestSchema>;
export type OrderRequestInput = z.input<typeof OrderRequestSchema>;
export type QuoteRequest = z.output<typeof QuoteRequestSchema>;
export type QuoteRequestInput = z.input<typeof QuoteRequestSchema>;
export type CallbackRequest = z.output<typeof CallbackRequestSchema>;
