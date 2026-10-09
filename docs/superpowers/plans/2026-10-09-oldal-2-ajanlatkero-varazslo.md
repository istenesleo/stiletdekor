# Oldal, 2. alprojekt: ajánlatkérő varázsló – megvalósítási terv

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Az ajánlatkérés útja: `/ajanlatkeres` (munkatípus-választó és visszahívás), `/ajanlatkeres/[tipus]` (a varázsló a kilenc típusra, JavaScript nélkül egy hosszú űrlap, JavaScripttel lépésenként), mentés D1-be `AK-0001` hivatkozási számmal, köszönő oldal, e-mail a műhelynek újrapróbálással. Fájlfeltöltés még nincs: a fájlmezők helyén „e-mailben küldöm” jelölő áll (döntés, 2026-10-09).

**Architecture:** A típusok kérdései a katalógusból jönnek (`QUOTE_TYPES`), az ellenőrzés a meglévő `QuoteRequestSchema` (kiegészítve az e-mailben küldött fájlokkal). A szerveroldali lépések az 1. alprojekt mintáját követik, de a közös részek kiemelve: értesítési sor (`src/server/notify/queue.ts`, `deliver.ts`), e-mail-formázás (`notify/format.ts`), űrlap-segédek (`server/forms.ts`). A varázsló egy React-komponens (`src/ui/QuoteForm`), amit az oldal szigetként (`client:load`) renderel: a szerver kész HTML-űrlapot küld, a hidratálás után a sziget lépésekre bontja, elrejti a nem releváns mezőket, és vázlatot ment.

**Tech Stack:** Astro 7 SSR, React 19 (sziget), Zod 4, Cloudflare D1, Workers Rate Limiting, Vitest (`getPlatformProxy`, jsdom).

**Spec:** `docs/superpowers/specs/2026-10-08-weboldal-mukodesi-elvek-design.md` (3.1, 4., 4.5, 11. fejezet)

## Global Constraints

- Magyar, magázó szöveg; időígéret nincs; nincs kitalált adat (nincs „3 perc”).
- JavaScript nélkül működik: a varázsló sima `<form method="post">`, minden lépés egyszerre látszik; a hibákat a szerver írja vissza a beírt adatokkal.
- Űrlapmezők nevei: a típus válaszai `f_<mezőazonosító>`; a fájlmező jelölője `f_<mezőazonosító>__email`; közös mezők: `location`, `deadline`, `name`, `email`, `phone`, `company`, `surveyRequested`; rejtett: `token`, `source`, csapda: `honlap`.
- Hivatkozási szám: `AK-` + legalább 4 számjegy (a D1 `id`).
- Beküldési korlát: közös `FORM_LIMITER` kötés (60 s alatt 5), kulcs: `visszahivas:<ip>` illetve `ajanlat:<ip>`.
- A sziget JavaScriptje legfeljebb ~70 KB (gzip) az oldalon.
- Csak tokenekből stílus; érintési felület ≥ 44 px; látható fókusz; a nem kötelező mezők címkéje „(nem kötelező)”.
- A tesztelt modulok nem importálnak `cloudflare:workers`-t; DOM-teszt `/** @vitest-environment jsdom */`.
- Minden feladat végén zöld `npm test` és `npm run check`; a végén `npm run typecheck`, `npm run build`.
- Commit: `git -c user.name=Claude -c user.email=noreply@anthropic.com commit …`, `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Ág: `oldal-2` a `main`-ből. Push csak kérésre.

## Fájlszerkezet

| Fájl | Felelősség |
|---|---|
| `src/domain/schemas.ts` (+ teszt) | `emailedFiles` a sémában és az ellenőrzésben; `isQuoteFieldVisible` export |
| `src/domain/quote-form.ts` | Az űrlap mezőnevei, közös a UI és a szerver között |
| `src/server/forms.ts` | Csapdamező, token, korlátozó, közös üzenetek |
| `src/server/notify/queue.ts`, `deliver.ts`, `format.ts` | Értesítési sor D1-ben, kiküldés, e-mail-formázás (a visszahívás is erre épül át) |
| `src/server/test-d1.ts` | Teszt-segéd: memóriabeli D1 minden migrációval |
| `migrations/0002_quote_requests.sql` | A `quote_requests` tábla |
| `src/server/quote/{store,d1-store,form,submit,email,notify}.ts` (+ tesztek) | Az ajánlatkérés szerveroldala |
| `src/ui/JobTypePicker` (módosul) | Link-mód (`hrefFor`) a `/ajanlatkeres` oldalhoz |
| `src/ui/QuoteForm/` (+ teszt, előnézet) | A varázsló űrlapja, lépésekkel |
| `src/islands/QuoteWizard.tsx` (+ teszt) | A sziget: lépések, feltételes mezők, vázlat |
| `src/pages/ajanlatkeres/{index,[tipus],koszonjuk}.astro` | Az oldalak |
| `src/ui/navigation.ts`, `src/worker.ts`, `wrangler.jsonc`, `src/env.d.ts` | `QUOTE_HREF`, cron, `FORM_LIMITER` |

---

### Task 0: Ág

- [ ] **Step 1**

```bash
cd /f/OneDrive/StiletDekor && git switch main && git switch -c oldal-2 && git status --short
```

Expected: `Switched to a new branch 'oldal-2'`, tiszta munkafa.

---

### Task 1: E-mailben küldött fájlok a sémában

**Files:** Modify `src/domain/schemas.ts`, `src/domain/schemas.test.ts`; Create `src/domain/quote-form.ts`

**Interfaces:**
- Produces: `isQuoteFieldVisible(def: QuoteFieldDef, fields: Readonly<Record<string, unknown>>): boolean`; `validateQuoteFields(id, fields, { today, emailedFiles? })`; `QuoteRequestSchema` kimenete kap egy `emailedFiles: string[]` mezőt (csak a típus látható fájlmezői). `quote-form.ts`: `QUOTE_FIELD_PREFIX = 'f_'`, `EMAILED_SUFFIX = '__email'`, `quoteFieldName(id)`, `type QuoteFormValues = Readonly<Record<string, string | readonly string[]>>`, `type QuoteFormErrors = Readonly<Record<string, string>>`.

- [ ] **Step 1: Teszt** – a `schemas.test.ts` importjába `getQuoteType` (a `./catalog`-ból) és `isQuoteFieldVisible` (a `./schemas`-ból); a fájl végére:

```ts
describe('files sent by e-mail', () => {
  const today = '2026-10-05';
  const betuk = { betumagassagCm: 40, anyag: 'plexi', vilagitas: 'nincs' };

  it('count as given for a "one of" group, so a logo can come by e-mail instead of the text', () => {
    expect(validateQuoteFields('betuk', betuk, { today })).toEqual([
      { path: ['feliratSzoveg'], message: 'Adja meg a felirat szövegét, vagy töltse fel a logót.' },
    ]);
    expect(validateQuoteFields('betuk', betuk, { today, emailedFiles: ['logo'] })).toEqual([]);
  });

  it('are kept only for the visible file fields of the job type', () => {
    const schema = createQuoteRequestSchema({ now: () => new Date('2026-10-05T10:00:00+02:00') });
    const base = {
      location: 'Budapest, Minta utca 1.',
      deadline: '2026-11-15',
      contact: { name: 'Minta Mária', email: 'maria@example.hu', phone: '06 30 123 4567' },
    };
    const parsed = schema.parse({
      ...base,
      quoteType: 'autofoliazas',
      fields: { jarmuTipus: 'Ford Transit', darabszam: 2, terjedelem: 'felirat', grafika: 'tervezes' },
      emailedFiles: ['jarmuFotok', 'grafikaFajlok', 'terjedelem'],
    });
    expect(parsed.emailedFiles).toEqual(['jarmuFotok']);
    expect(schema.parse({ ...base, quoteType: 'egyeb', fields: { leiras: 'Ajtófelirat.' } }).emailedFiles).toEqual([]);
  });

  it('lets the wizard ask whether a field shows', () => {
    const def = getQuoteType('autofoliazas').fields.find((f) => f.id === 'grafikaFajlok')!;
    expect(isQuoteFieldVisible(def, { grafika: 'van' })).toBe(true);
    expect(isQuoteFieldVisible(def, { grafika: 'tervezes' })).toBe(false);
  });
});
```

- [ ] **Step 2: Bukik** – `npx vitest run src/domain/schemas.test.ts` → FAIL (`isQuoteFieldVisible` nincs exportálva).

- [ ] **Step 3: Megvalósítás** – `src/domain/schemas.ts`:
  1. `function isFieldVisible(def: QuoteFieldDef, fields: Readonly<Record<string, unknown>>): boolean {` → `/** Whether a field of the wizard shows, given the answers so far (its visibleWhen rule). */\nexport function isQuoteFieldVisible(def: QuoteFieldDef, fields: Readonly<Record<string, unknown>>): boolean {`, és a fájlban minden `isFieldVisible(` → `isQuoteFieldVisible(`.
  2. A `validateQuoteFields` szignatúrája és törzse:

```ts
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
```

  3. A `createQuoteRequestSchema` objektumába az `uploadIds` után:

```ts
        /** File fields the customer will send by e-mail with the reference (no uploads yet, 2026-10-09). */
        emailedFiles: z
          .array(z.string({ error: 'Érvénytelen fájlmező.' }), { error: 'Érvénytelen fájlmező.' })
          .max(MAX_QUOTE_UPLOADS, 'Túl sok fájlmező.')
          .default([]),
```

  a `superRefine`-ban: `validateQuoteFields(request.quoteType, request.fields, { today, emailedFiles: request.emailedFiles })`; a `.transform` helyére:

```ts
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
```

  `src/domain/quote-form.ts`:

```ts
// Names of the quote form's fields, shared by the form (src/ui/QuoteForm) and the server that reads it
// (src/server/quote/form.ts). The job type's answers carry a prefix, so they never clash with the common fields.

export const QUOTE_FIELD_PREFIX = 'f_';
/** A file field's "I send it by e-mail" checkbox: the field's name plus this suffix. */
export const EMAILED_SUFFIX = '__email';

/** The form field name of a job type's answer, e.g. "f_jarmuTipus". */
export const quoteFieldName = (fieldId: string): string => QUOTE_FIELD_PREFIX + fieldId;

/** What the visitor typed, by form field name (a multiselect has several values). */
export type QuoteFormValues = Readonly<Record<string, string | readonly string[]>>;
/** One message per form field name. */
export type QuoteFormErrors = Readonly<Record<string, string>>;
```

- [ ] **Step 4: Zöld** – `npx vitest run src/domain` → PASS.
- [ ] **Step 5: Commit** – `git add src/domain && git commit -m "Let a quote's files come by e-mail until uploads exist"` (+ attribúció).

---

### Task 2: Közös értesítési sor és űrlap-segédek; a visszahívás átállítása

**Files:** Create `src/server/notify/queue.ts`, `src/server/notify/deliver.ts`, `src/server/notify/format.ts`, `src/server/forms.ts`, `src/server/test-d1.ts`; Modify `src/server/callback/{store,d1-store,email,notify,submit}.ts`, `src/server/callback/d1-store.test.ts`, `src/pages/visszahivas/index.astro`, `src/env.d.ts`, `wrangler.jsonc`, `README.md`

**Interfaces:**
- Produces: `NotificationStore<T>`, `NOTIFY_LEASE_MS`, `NOTIFY_WINDOW_MS`, `d1NotificationQueue<Row, T>(db, table, columns, toStored): NotificationStore<T>`; `DeliverDeps<T>`, `notifyOne<T>(id, deps)`, `deliverPending<T>(deps)`; `budapestDateTime(iso)`, `huDate(iso)`, `escapeHtml`, `oneLine`, `telHref(phone)`, `emailBody(intro, rows, links?)`; `HONEYPOT_FIELD`, `isFormToken(value)`, `TOO_MANY_MESSAGE`, `SAVE_FAILED_MESSAGE`, `limiterAllows(limiter, key)`; `testDatabase(): Promise<{ db; reset(); dispose() }>`. A visszahívás exportjai változatlanok (`notifyCallback`, `deliverPendingCallbacks`, `callbackEmail`, `budapestDateTime`, `submitCallback`, `HONEYPOT_FIELD`, `limiterAllows`).

- [ ] **Step 1: Közös modulok**

`src/server/notify/queue.ts`:

```ts
// The workshop's notification e-mails as a queue in D1. Every request table has the same notify columns
// (notified_at, notify_attempts, notify_last_attempt_at, notify_last_error); these helpers claim, mark and list
// them. The claim is a 5-minute lease, so the immediate send and the cron never send the same e-mail twice.

export interface NotificationStore<T> {
  /** Takes the request for notifying when its e-mail has not gone out and nobody tried in the last 5 minutes. */
  claimForNotification(id: number, now: Date): Promise<T | null>;
  markNotified(id: number, now: Date): Promise<void>;
  recordNotificationFailure(id: number, error: string): Promise<void>;
  /** Requests still waiting for their e-mail, created in the last 24 hours, oldest first (at most 50). */
  pendingNotificationIds(now: Date): Promise<number[]>;
}

/** How long a claim blocks other senders. */
export const NOTIFY_LEASE_MS = 5 * 60_000;
/** How long the cron keeps retrying a request's e-mail. */
export const NOTIFY_WINDOW_MS = 24 * 60 * 60_000;

const isoBefore = (now: Date, ms: number) => new Date(now.getTime() - ms).toISOString();

/** The queue of one request table. `table` and `columns` are constants of the code, never user input. */
export function d1NotificationQueue<Row, T>(
  db: D1Database,
  table: string,
  columns: string,
  toStored: (row: Row) => T,
): NotificationStore<T> {
  return {
    async claimForNotification(id, now) {
      const row = await db
        .prepare(
          `UPDATE ${table} SET notify_attempts = notify_attempts + 1, notify_last_attempt_at = ? ` +
            'WHERE id = ? AND notified_at IS NULL AND (notify_last_attempt_at IS NULL OR notify_last_attempt_at < ?) ' +
            `RETURNING ${columns}`,
        )
        .bind(now.toISOString(), id, isoBefore(now, NOTIFY_LEASE_MS))
        .first<Row>();
      return row ? toStored(row) : null;
    },
    async markNotified(id, now) {
      await db.prepare(`UPDATE ${table} SET notified_at = ?, notify_last_error = NULL WHERE id = ?`).bind(now.toISOString(), id).run();
    },
    async recordNotificationFailure(id, error) {
      await db.prepare(`UPDATE ${table} SET notify_last_error = ? WHERE id = ?`).bind(error.slice(0, 500), id).run();
    },
    async pendingNotificationIds(now) {
      const { results } = await db
        .prepare(`SELECT id FROM ${table} WHERE notified_at IS NULL AND created_at >= ? ORDER BY created_at, id LIMIT 50`)
        .bind(isoBefore(now, NOTIFY_WINDOW_MS))
        .all<{ id: number }>();
      return results.map((row) => row.id);
    },
  };
}
```

`src/server/notify/deliver.ts`:

```ts
// Sends the workshop's e-mail about one request, or retries all that are waiting (the cron). The store's claim
// makes sure the immediate send and the cron never send the same e-mail twice.
import type { Mailer, OutgoingEmail } from './mailer';
import type { NotificationStore } from './queue';

export interface DeliverDeps<T> {
  store: NotificationStore<T>;
  mailer: Mailer;
  /** The workshop's address (ORDER_NOTIFY_EMAIL). */
  to: string;
  now: () => Date;
  /** The e-mail about one request. */
  compose: (request: T, to: string) => OutgoingEmail;
  /** The request's reference for the log, e.g. "VH-0087". */
  reference: (id: number) => string;
  /** Start of the failure line, e.g. "A visszahívás értesítése nem ment ki". */
  failure: string;
  /** Where failures are reported; console.error by default (Cloudflare groups them under Issues). */
  logError?: (message: string) => void;
}

export async function notifyOne<T>(id: number, deps: DeliverDeps<T>): Promise<'sent' | 'skipped' | 'failed'> {
  const request = await deps.store.claimForNotification(id, deps.now());
  if (!request) return 'skipped';
  try {
    await deps.mailer.send(deps.compose(request, deps.to));
    await deps.store.markNotified(id, deps.now());
    return 'sent';
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await deps.store.recordNotificationFailure(id, message);
    (deps.logError ?? ((line: string) => console.error(line)))(`${deps.failure} (${deps.reference(id)}): ${message}`);
    return 'failed';
  }
}

/** The cron's job: retries every request whose e-mail has not gone out, within 24 hours of its arrival. */
export async function deliverPending<T>(deps: DeliverDeps<T>): Promise<{ sent: number; failed: number }> {
  const result = { sent: 0, failed: 0 };
  for (const id of await deps.store.pendingNotificationIds(deps.now())) {
    const outcome = await notifyOne(id, deps);
    if (outcome === 'sent') result.sent += 1;
    if (outcome === 'failed') result.failed += 1;
  }
  return result;
}
```

`src/server/notify/format.ts`:

```ts
// Shared by the notification e-mails: Budapest times, Hungarian dates, HTML escaping, the plain and HTML body.
import { BUSINESS_TIME_ZONE } from '@/domain/catalog';

const PARTS = new Intl.DateTimeFormat('en-GB', {
  timeZone: BUSINESS_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** "2026. 10. 08. 14:05": the moment in Budapest, written the Hungarian way. */
export function budapestDateTime(iso: string): string {
  const part = Object.fromEntries(PARTS.formatToParts(new Date(iso)).map((p) => [p.type, p.value]));
  return `${part.year}. ${part.month}. ${part.day}. ${part.hour}:${part.minute}`;
}

/** "2026-11-15" → "2026. 11. 15."; anything else stays as it is. */
export function huDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return match ? `${match[1]}. ${match[2]}. ${match[3]}.` : iso;
}

export const escapeHtml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const oneLine = (value: string): string => value.replace(/\s+/g, ' ').trim();

/** A tel: link for a phone number as typed. */
export const telHref = (phone: string): string => `tel:${phone.replace(/[\s\-()./]/g, '')}`;

/** The plain-text and HTML body of a notification: an intro and label–value rows; `links` turns a row into a link. */
export function emailBody(
  intro: string,
  rows: readonly (readonly [string, string])[],
  links: Readonly<Record<string, string>> = {},
): { text: string; html: string } {
  const cell = (label: string, value: string) => {
    const href = links[label];
    return href ? `<a href="${escapeHtml(href)}">${escapeHtml(value)}</a>` : escapeHtml(value);
  };
  return {
    text: [intro, '', ...rows.map(([label, value]) => `${label}: ${value}`)].join('\n'),
    html:
      `<p>${escapeHtml(intro)}</p><table>` +
      rows.map(([label, value]) => `<tr><th align="left" style="padding:4px 12px 4px 0">${escapeHtml(label)}</th><td>${cell(label, value)}</td></tr>`).join('') +
      '</table>',
  };
}
```

`src/server/forms.ts`:

```ts
// What the site's forms share on the server: the trap field, the form token, the rate limiter, and the two
// messages that offer the phone instead.
import { COMPANY } from '@/domain/company';

/** A field people never see; bots fill it in. */
export const HONEYPOT_FIELD = 'honlap';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A one-time form token (a UUID) as the form sent it. */
export const isFormToken = (value: unknown): value is string => typeof value === 'string' && UUID.test(value);

export const TOO_MANY_MESSAGE = `Túl sok kérés érkezett erről a címről. Kérjük, próbálja újra egy perc múlva, vagy hívjon: ${COMPANY.phone.display}.`;
export const SAVE_FAILED_MESSAGE = `Most nem sikerült elküldeni. Kérjük, próbálja újra, vagy hívjon: ${COMPANY.phone.display}.`;

/** Asks the rate limiter about this visitor; lets the request through when there is no limiter or it fails. */
export async function limiterAllows(limiter: Pick<RateLimit, 'limit'> | undefined, key: string): Promise<boolean> {
  if (!limiter) return true;
  try {
    return (await limiter.limit({ key })).success;
  } catch (error) {
    console.error('A beküldési korlát nem elérhető:', error);
    return true;
  }
}
```

`src/server/test-d1.ts`:

```ts
// A real, in-memory D1 for the store tests: wrangler's getPlatformProxy reads wrangler.jsonc and starts a local
// runtime; reset() drops every table and applies all migrations in migrations/, in order. Tests only.
import { readdirSync, readFileSync } from 'node:fs';
import { getPlatformProxy } from 'wrangler';

const MIGRATIONS = 'migrations';

function statements(): string[] {
  return readdirSync(MIGRATIONS)
    .filter((file) => file.endsWith('.sql'))
    .sort()
    .flatMap((file) =>
      readFileSync(`${MIGRATIONS}/${file}`, 'utf8')
        .replace(/--[^\n]*/g, '')
        .split(';')
        .map((statement) => statement.trim())
        .filter(Boolean),
    );
}

export async function testDatabase() {
  const proxy = await getPlatformProxy<Env>({ persist: false });
  const db = proxy.env.DB;
  return {
    db,
    async reset() {
      const { results } = await db
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
        .all<{ name: string }>();
      for (const { name } of results.filter((t) => !t.name.startsWith('_cf_'))) {
        await db.prepare(`DROP TABLE IF EXISTS "${name}"`).run();
      }
      await db.batch(statements().map((statement) => db.prepare(statement)));
    },
    dispose: () => proxy.dispose(),
  };
}
```

- [ ] **Step 2: A visszahívás átállítása**

`src/server/callback/store.ts`: törlődik a két konstans (`NOTIFY_LEASE_MS`, `NOTIFY_WINDOW_MS`) és a négy sor-metódus; helyettük:

```ts
import type { NotificationStore } from '../notify/queue';
…
export interface CallbackStore extends NotificationStore<StoredCallback> {
  /** Saves the request and returns its id; a second call with the same form token saves nothing and returns the first id. */
  insert(request: NewCallback): Promise<number>;
}
```

`src/server/callback/d1-store.ts`: az `isoBefore` és a négy metódus helyett `...d1NotificationQueue(db, 'callback_requests', COLUMNS, toStored),` az objektum elején (`import { d1NotificationQueue } from '../notify/queue';`), az `insert` marad.

`src/server/callback/email.ts`:

```ts
// The workshop's e-mail about a callback request: everything needed to call back, the phone number clickable.
import { formatReference } from '@/domain/reference';
import { callbackJobTypeName } from '@/domain/schemas';
import { emailBody, oneLine, telHref } from '../notify/format';
import type { OutgoingEmail } from '../notify/mailer';
import type { StoredCallback } from './store';

export { budapestDateTime } from '../notify/format';
import { budapestDateTime } from '../notify/format';

export function callbackEmail(request: StoredCallback, to: string): OutgoingEmail {
  const reference = formatReference('VH', request.id);
  const rows: [string, string][] = [
    ['Hivatkozási szám', reference],
    ['Név', request.name],
    ['Telefon', request.phone],
  ];
  if (request.jobType) rows.push(['Munka típusa', callbackJobTypeName(request.jobType)]);
  if (request.message) rows.push(['Röviden', request.message]);
  if (request.source) rows.push(['Honnan', request.source]);
  rows.push(['Beérkezett', budapestDateTime(request.createdAt)]);
  const { text, html } = emailBody('Visszahívást kértek a weboldalon.', rows, { Telefon: telHref(request.phone) });
  return { to, subject: oneLine(`[${reference}] Visszahívás – ${request.name}`), text, html };
}
```

`src/server/callback/notify.ts`:

```ts
// Sends the workshop's e-mail about a callback request (right after it arrives, and from the cron).
import { formatReference } from '@/domain/reference';
import { deliverPending, type DeliverDeps, notifyOne } from '../notify/deliver';
import type { Mailer } from '../notify/mailer';
import { callbackEmail } from './email';
import type { CallbackStore, StoredCallback } from './store';

export interface NotifyDeps {
  store: CallbackStore;
  mailer: Mailer;
  /** The workshop's address (ORDER_NOTIFY_EMAIL). */
  to: string;
  now: () => Date;
  logError?: (message: string) => void;
}

const delivery = (deps: NotifyDeps): DeliverDeps<StoredCallback> => ({
  ...deps,
  compose: callbackEmail,
  reference: (id) => formatReference('VH', id),
  failure: 'A visszahívás értesítése nem ment ki',
});

export const notifyCallback = (id: number, deps: NotifyDeps) => notifyOne(id, delivery(deps));
export const deliverPendingCallbacks = (deps: NotifyDeps) => deliverPending(delivery(deps));
```

`src/server/callback/submit.ts`: a `UUID`, `TOO_MANY`, `SAVE_FAILED`, a `HONEYPOT_FIELD` és a `limiterAllows` definíciója helyett import a `../forms`-ból (`HONEYPOT_FIELD, isFormToken, SAVE_FAILED_MESSAGE, TOO_MANY_MESSAGE`), `export { HONEYPOT_FIELD, limiterAllows } from '../forms';` (a meglévő importok miatt); a token: `const token = isFormToken(tokenInput) ? tokenInput : deps.newToken();`; az üzenetek: `TOO_MANY_MESSAGE`, `SAVE_FAILED_MESSAGE`.

`src/server/callback/d1-store.test.ts`: a fájl eleje (a `MIGRATION`/`STATEMENTS`/`getPlatformProxy` rész) helyett:

```ts
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { testDatabase } from '../test-d1';
import { d1CallbackStore } from './d1-store';
import type { NewCallback } from './store';

let t: Awaited<ReturnType<typeof testDatabase>>;
let db: D1Database;

beforeAll(async () => {
  t = await testDatabase();
  db = t.db;
}, 60_000);

afterAll(async () => {
  await t?.dispose();
});

beforeEach(async () => {
  await t.reset();
});
```

(a tesztek többi része változatlan).

- [ ] **Step 3: `FORM_LIMITER`** – `src/env.d.ts`: `CALLBACK_LIMITER: RateLimit;` → `FORM_LIMITER: RateLimit;`, a komment: `/** Rate limiter of the site's forms: at most 5 posts per visitor and form per minute (key "visszahivas:<ip>", "ajanlat:<ip>"). */`. `wrangler.jsonc`: minden `"name": "CALLBACK_LIMITER"` → `"name": "FORM_LIMITER"`, a komment: `// The site's forms: at most 5 posts per visitor (IP) and form per minute. Not inherited: repeated in every environment.`. `src/pages/visszahivas/index.astro`: `import { limiterAllows, type RejectedCallback, submitCallback } from '@/server/callback/submit';` → `import { type RejectedCallback, submitCallback } from '@/server/callback/submit';` és `import { limiterAllows } from '@/server/forms';`; `limiterAllows(env.CALLBACK_LIMITER, Astro.clientAddress)` → `limiterAllows(env.FORM_LIMITER, \`visszahivas:${Astro.clientAddress}\`)`. `README.md`: `CALLBACK_LIMITER` → `FORM_LIMITER`, a mondat: „60 másodpercenként 5 beküldés IP-címenként és űrlaponként”.

- [ ] **Step 4: Zöld** – `npm test && npm run check` → minden zöld (a visszahívás tesztjei változatlanul átmennek).
- [ ] **Step 5: Commit** – `git add -A src/server src/pages/visszahivas src/env.d.ts wrangler.jsonc README.md && git commit -m "Share the notification queue and form helpers between the site's forms"`.

---

### Task 3: Az ajánlatkérések táblája és tárolója

**Files:** Create `migrations/0002_quote_requests.sql`, `src/server/quote/store.ts`, `src/server/quote/d1-store.ts`, `src/server/quote/d1-store.test.ts`

**Interfaces:**
- Produces: `StoredQuote { id; quoteType: QuoteTypeId; fields: Record<string, Exclude<QuoteFieldValue, null>>; emailedFiles: string[]; location?: string; deadline: string; surveyRequested: boolean; contact: { name; email; phone; company? }; source?: string; createdAt: string }`, `NewQuote = Omit<StoredQuote, 'id'> & { formToken: string }`, `QuoteStore extends NotificationStore<StoredQuote> { insert(q: NewQuote): Promise<number> }`, `d1QuoteStore(db): QuoteStore`.

- [ ] **Step 1: Migráció** – `migrations/0002_quote_requests.sql`:

```sql
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
```

- [ ] **Step 2: Teszt** – `src/server/quote/d1-store.test.ts`:

```ts
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { testDatabase } from '../test-d1';
import { d1QuoteStore } from './d1-store';
import type { NewQuote } from './store';

let t: Awaited<ReturnType<typeof testDatabase>>;

beforeAll(async () => {
  t = await testDatabase();
}, 60_000);

afterAll(async () => {
  await t?.dispose();
});

beforeEach(async () => {
  await t.reset();
});

const T0 = new Date('2026-10-09T10:00:00.000Z');

function quote(token: string, extra: Partial<NewQuote> = {}): NewQuote {
  return {
    formToken: token,
    quoteType: 'betuk',
    fields: { feliratSzoveg: 'Pékség', betumagassagCm: 40, anyag: 'plexi', vilagitas: 'hatvilagitas' },
    emailedFiles: ['logo'],
    location: 'Budapest, Minta utca 1.',
    deadline: '2026-11-15',
    surveyRequested: true,
    contact: { name: 'Minta Mária', email: 'maria@example.hu', phone: '06 30 123 4567' },
    source: '/ajanlatkeres/betuk',
    createdAt: T0.toISOString(),
    ...extra,
  };
}

describe('d1QuoteStore', () => {
  it('numbers the requests and saves a resubmitted form only once', async () => {
    const store = d1QuoteStore(t.db);
    const first = await store.insert(quote('a'));
    expect(await store.insert(quote('b'))).toBe(first + 1);
    expect(await store.insert(quote('a', { deadline: '2026-12-01' }))).toBe(first);
  });

  it('reads a request back whole, with its answers and the files that come by e-mail', async () => {
    const store = d1QuoteStore(t.db);
    const { formToken: _token, ...rest } = quote('a', { contact: { name: 'Minta Mária', email: 'maria@example.hu', phone: '06 30 123 4567', company: 'Minta Kft.' } });
    const id = await store.insert(quote('a', { contact: rest.contact }));
    expect(await store.claimForNotification(id, T0)).toEqual({ id, ...rest });
  });

  it('keeps an optional address and company empty, and the survey as no', async () => {
    const store = d1QuoteStore(t.db);
    const id = await store.insert(
      quote('a', { quoteType: 'egyeb', fields: { leiras: 'Ajtófelirat' }, emailedFiles: [], location: undefined, surveyRequested: false, source: undefined }),
    );
    const stored = await store.claimForNotification(id, T0);
    expect(stored).toMatchObject({ quoteType: 'egyeb', surveyRequested: false, emailedFiles: [] });
    expect(stored?.location).toBeUndefined();
    expect(stored?.contact.company).toBeUndefined();
  });

  it('lists the requests whose e-mail has not gone out', async () => {
    const store = d1QuoteStore(t.db);
    const sent = await store.insert(quote('a'));
    const waiting = await store.insert(quote('b'));
    await store.markNotified(sent, T0);
    expect(await store.pendingNotificationIds(T0)).toEqual([waiting]);
  });
});
```

- [ ] **Step 3: Bukik** – `npx vitest run src/server/quote` → FAIL (nincs `./d1-store`).

- [ ] **Step 4: Megvalósítás**

`src/server/quote/store.ts`:

```ts
// Where quote requests are kept, as an interface: the pages use the D1 version (d1-store.ts), the tests a fake.
import type { QuoteTypeId } from '@/domain/catalog';
import type { QuoteFieldValue } from '@/domain/schemas';
import type { NotificationStore } from '../notify/queue';

/** A saved quote request. Its reference is formatReference('AK', id). */
export interface StoredQuote {
  id: number;
  quoteType: QuoteTypeId;
  /** The job type's answers, keyed by the catalog's field ids. */
  fields: Record<string, Exclude<QuoteFieldValue, null>>;
  /** File fields the customer sends by e-mail with the reference. */
  emailedFiles: string[];
  location?: string | undefined;
  deadline: string;
  surveyRequested: boolean;
  contact: { name: string; email: string; phone: string; company?: string | undefined };
  source?: string | undefined;
  /** ISO timestamp (UTC). */
  createdAt: string;
}

export type NewQuote = Omit<StoredQuote, 'id'> & { formToken: string };

export interface QuoteStore extends NotificationStore<StoredQuote> {
  /** Saves the request and returns its id; a second call with the same form token saves nothing and returns the first id. */
  insert(request: NewQuote): Promise<number>;
}
```

`src/server/quote/d1-store.ts`:

```ts
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
```

- [ ] **Step 5: Zöld, helyi adatbázis, commit** – `npx vitest run src/server` → PASS; `npm run db:migrate:local` → `0002_quote_requests.sql ✅`; `git add migrations/0002_quote_requests.sql src/server/quote && git commit -m "Store quote requests in D1, once per form"`.

---

### Task 4: Az ajánlatkérés beolvasása, mentése, e-mailje

**Files:** Create `src/server/quote/form.ts`, `submit.ts`, `email.ts`, `notify.ts` és tesztjeik (`form.test.ts`, `submit.test.ts`, `email.test.ts`); Modify `src/worker.ts`

**Interfaces:**
- Produces: `parseNumberHu(text): number | string | null`; `parseQuoteForm(quoteType, form): { request; values: Record<string, string | string[]> }`; `QUOTE_THANKS_PATH = '/ajanlatkeres/koszonjuk'`; `formFieldOf(path): string`; `type RejectedQuote`; `submitQuote(quoteType, form, deps): Promise<AcceptedQuote | RejectedQuote>`; `quoteEmail(q, to): OutgoingEmail`; `notifyQuote(id, deps)`, `deliverPendingQuotes(deps)`.

- [ ] **Step 1: Tesztek**

`src/server/quote/form.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { parseNumberHu, parseQuoteForm } from './form';

function form(entries: [string, string][]): FormData {
  const data = new FormData();
  for (const [key, value] of entries) data.append(key, value);
  return data;
}

describe('parseNumberHu', () => {
  it('reads a decimal comma or point, and leaves an unreadable text as text', () => {
    expect(parseNumberHu('12,5')).toBe(12.5);
    expect(parseNumberHu(' 1 200 ')).toBe(1200);
    expect(parseNumberHu('3.75')).toBe(3.75);
    expect(parseNumberHu('')).toBeNull();
    expect(parseNumberHu('kb. 12')).toBe('kb. 12');
  });
});

describe('parseQuoteForm', () => {
  it('turns the posted fields into the shape of the quote schema, and keeps what was typed', () => {
    const { request, values } = parseQuoteForm(
      'kirakat',
      form([
        ['f_feluletM2', '12,5'],
        ['f_meretek', ''],
        ['f_foliaTipus', 'dekor'],
        ['f_foliaTipus', 'one-way-vision'],
        ['f_kirakatFotok__email', 'on'],
        ['location', 'Budapest, Minta utca 1.'],
        ['deadline', ''],
        ['name', 'Minta Mária'],
        ['email', 'maria@example.hu'],
        ['phone', '06 30 123 4567'],
        ['company', ''],
        ['surveyRequested', 'on'],
        ['source', '/ajanlatkeres/kirakat'],
      ]),
    );
    expect(request).toEqual({
      quoteType: 'kirakat',
      fields: { feluletM2: 12.5, meretek: '', foliaTipus: ['dekor', 'one-way-vision'] },
      emailedFiles: ['kirakatFotok'],
      location: 'Budapest, Minta utca 1.',
      deadline: undefined,
      surveyRequested: true,
      contact: { name: 'Minta Mária', email: 'maria@example.hu', phone: '06 30 123 4567', company: '' },
      source: '/ajanlatkeres/kirakat',
    });
    expect(values).toMatchObject({ f_feluletM2: '12,5', f_foliaTipus: ['dekor', 'one-way-vision'], f_kirakatFotok__email: 'on', surveyRequested: 'on' });
  });

  it('drops a source that is not a path of the site', () => {
    expect(parseQuoteForm('egyeb', form([['source', 'https://example.com']])).request.source).toBeUndefined();
  });
});
```

`src/server/quote/submit.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import type { NewQuote, QuoteStore } from './store';
import { formFieldOf, submitQuote, type SubmitQuoteDeps } from './submit';

const TOKEN = '3f8a2b6c-1d4e-4f5a-9b7c-0e1d2c3b4a59';
const NOW = new Date('2026-10-09T10:00:00+02:00');

function form(entries: [string, string][]): FormData {
  const data = new FormData();
  for (const [key, value] of entries) data.append(key, value);
  return data;
}

const VALID: [string, string][] = [
  ['f_betumagassagCm', '40'],
  ['f_anyag', 'plexi'],
  ['f_vilagitas', 'nincs'],
  ['f_logo__email', 'on'],
  ['location', 'Budapest, Minta utca 1.'],
  ['deadline', '2026-11-15'],
  ['name', 'Minta Mária'],
  ['email', 'maria@example.hu'],
  ['phone', '06 30 123 4567'],
  ['source', '/ajanlatkeres/betuk'],
  ['token', TOKEN],
];

function deps(overrides: Partial<SubmitQuoteDeps> = {}) {
  const saved: NewQuote[] = [];
  const store = { insert: vi.fn(async (q: NewQuote) => (saved.push(q), 142)) } as unknown as QuoteStore;
  return { saved, deps: { store, allow: async () => true, now: () => NOW, newToken: () => 'uj-token', ...overrides } };
}

describe('submitQuote', () => {
  it('saves a valid request and sends the visitor on with the reference, noting the files to e-mail', async () => {
    const { saved, deps: d } = deps();
    expect(await submitQuote('betuk', form(VALID), d)).toEqual({
      kind: 'accepted',
      location: '/ajanlatkeres/koszonjuk?szam=AK-0142&fajl=1',
      id: 142,
    });
    expect(saved[0]).toMatchObject({
      formToken: TOKEN,
      quoteType: 'betuk',
      fields: { betumagassagCm: 40, anyag: 'plexi', vilagitas: 'nincs' },
      emailedFiles: ['logo'],
      surveyRequested: false,
      contact: { name: 'Minta Mária', email: 'maria@example.hu', phone: '06 30 123 4567' },
      source: '/ajanlatkeres/betuk',
      createdAt: NOW.toISOString(),
    });
  });

  it('sends the form back with one message per field, named as the form names them', async () => {
    const { saved, deps: d } = deps();
    const entries = VALID.filter(([k]) => !['f_logo__email', 'email', 'deadline'].includes(k));
    const result = await submitQuote('betuk', form(entries), d);
    expect(result).toMatchObject({
      kind: 'rejected',
      status: 400,
      errors: {
        f_feliratSzoveg: 'Adja meg a felirat szövegét, vagy töltse fel a logót.',
        deadline: 'Adja meg a határidőt.',
        email: 'Adja meg az e-mail-címét.',
      },
      token: TOKEN,
      source: '/ajanlatkeres/betuk',
    });
    expect(result.kind === 'rejected' && result.values).toMatchObject({ f_betumagassagCm: '40', name: 'Minta Mária' });
    expect(saved).toEqual([]);
  });

  it('pretends to accept a filled trap field, refuses too many posts, and offers the phone when saving fails', async () => {
    expect(await submitQuote('betuk', form([...VALID, ['honlap', 'x']]), deps().deps)).toEqual({
      kind: 'accepted',
      location: '/ajanlatkeres/koszonjuk',
      id: null,
    });
    expect(await submitQuote('betuk', form(VALID), deps({ allow: async () => false }).deps)).toMatchObject({ status: 429 });
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const store = { insert: vi.fn().mockRejectedValue(new Error('D1')) } as unknown as QuoteStore;
    expect(await submitQuote('betuk', form(VALID), { ...deps().deps, store })).toMatchObject({ status: 503 });
    error.mockRestore();
  });
});

describe('formFieldOf', () => {
  it('names the form field of a schema issue', () => {
    expect(formFieldOf(['fields', 'anyag'])).toBe('f_anyag');
    expect(formFieldOf(['contact', 'phone'])).toBe('phone');
    expect(formFieldOf(['deadline'])).toBe('deadline');
    expect(formFieldOf([])).toBe('form');
  });
});
```

`src/server/quote/email.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { quoteEmail } from './email';
import type { StoredQuote } from './store';

const QUOTE: StoredQuote = {
  id: 142,
  quoteType: 'kirakat',
  fields: { feluletM2: 12.5, foliaTipus: ['dekor', 'one-way-vision'] },
  emailedFiles: ['kirakatFotok'],
  location: 'Budapest, Minta utca 1.',
  deadline: '2026-11-15',
  surveyRequested: true,
  contact: { name: 'Minta Mária', email: 'maria@example.hu', phone: '06 30 123 4567', company: 'Minta Kft.' },
  source: '/ajanlatkeres/kirakat',
  createdAt: '2026-10-09T08:00:00.000Z',
};

describe('quoteEmail', () => {
  it('names the reference, the job and the customer in the subject, and answers to the customer', () => {
    expect(quoteEmail(QUOTE, 'muhely@example.com')).toMatchObject({
      to: 'muhely@example.com',
      subject: '[AK-0142] Ajánlatkérés – Kirakat- és üvegfóliázás – Minta Mária',
      replyTo: 'maria@example.hu',
    });
  });

  it('writes the answers as the form asked them, with units and option names', () => {
    const lines = quoteEmail(QUOTE, 'm@example.com').text.split('\n');
    expect(lines.slice(0, 2)).toEqual(['Ajánlatkérés érkezett a weboldalon.', '']);
    expect(lines).toContain('Munka: Kirakat- és üvegfóliázás');
    expect(lines).toContain('Hivatkozási szám: AK-0142');
    expect(lines).toContain('Felület: 12,5 m²');
    expect(lines).toContain('Fólia típusa: Dekor, One way vision');
    expect(lines).toContain('E-mailben küldi: Fotó a kirakatról');
    expect(lines).toContain('Helyszín: Budapest, Minta utca 1.');
    expect(lines).toContain('Határidő: 2026. 11. 15.');
    expect(lines).toContain('Helyszíni felmérés: kéri');
    expect(lines).toContain('Cég: Minta Kft.');
    expect(lines).toContain('Beérkezett: 2026. 10. 09. 10:00');
  });

  it('links the phone and the e-mail address', () => {
    const { html } = quoteEmail(QUOTE, 'm@example.com');
    expect(html).toContain('<a href="tel:06301234567">06 30 123 4567</a>');
    expect(html).toContain('<a href="mailto:maria@example.hu">maria@example.hu</a>');
  });
});
```

- [ ] **Step 2: Bukik** – `npx vitest run src/server/quote` → FAIL.

- [ ] **Step 3: Megvalósítás**

`src/server/quote/form.ts`:

```ts
// The quote form as the browser posts it (also without JavaScript): FormData into the input of
// QuoteRequestSchema, keeping what the visitor typed for the form to show again after an error.
import { getQuoteType, type QuoteTypeId } from '@/domain/catalog';
import { EMAILED_SUFFIX, quoteFieldName } from '@/domain/quote-form';
import { formSource, type QuoteFieldValue } from '@/domain/schemas';

/** "12,5", "12.5" or "1 200" → a number; an unreadable text stays text, so the schema says it is not a number. */
export function parseNumberHu(text: string): number | string | null {
  const compact = text.replace(/\s/g, '');
  if (!compact) return null;
  return /^-?\d+([.,]\d+)?$/.test(compact) ? Number(compact.replace(',', '.')) : text.trim();
}

export interface QuoteRequestInput {
  quoteType: QuoteTypeId;
  fields: Record<string, QuoteFieldValue>;
  emailedFiles: string[];
  location: string;
  deadline: string | undefined;
  surveyRequested: boolean;
  contact: { name: string; email: string; phone: string; company: string };
  source: string | undefined;
}

export function parseQuoteForm(
  quoteType: QuoteTypeId,
  form: FormData,
): { request: QuoteRequestInput; values: Record<string, string | string[]> } {
  const type = getQuoteType(quoteType);
  const text = (name: string) => {
    const value = form.get(name);
    return typeof value === 'string' ? value : '';
  };
  const values: Record<string, string | string[]> = {};
  const fields: Record<string, QuoteFieldValue> = {};
  const emailedFiles: string[] = [];
  for (const def of type.fields) {
    const name = quoteFieldName(def.id);
    if (def.type === 'file') {
      if (text(name + EMAILED_SUFFIX)) {
        emailedFiles.push(def.id);
        values[name + EMAILED_SUFFIX] = 'on';
      }
      continue;
    }
    if (def.type === 'multiselect') {
      const chosen = form.getAll(name).filter((v): v is string => typeof v === 'string');
      values[name] = chosen;
      fields[def.id] = chosen;
      continue;
    }
    const raw = text(name);
    values[name] = raw;
    fields[def.id] = def.type === 'number' ? parseNumberHu(raw) : raw;
  }
  for (const name of ['location', 'deadline', 'name', 'email', 'phone', 'company']) values[name] = text(name);
  const surveyRequested = Boolean(text('surveyRequested'));
  if (surveyRequested) values.surveyRequested = 'on';
  return {
    request: {
      quoteType,
      fields,
      emailedFiles,
      location: text('location'),
      deadline: text('deadline') || undefined,
      surveyRequested,
      contact: { name: text('name'), email: text('email'), phone: text('phone'), company: text('company') },
      source: formSource(text('source')),
    },
    values,
  };
}
```

`src/server/quote/submit.ts`:

```ts
// One POST of the quote wizard: trap field, rate limit, the shared schema, saving. A plain HTML form works: on
// success the page redirects (Post/Redirect/Get), otherwise it renders the form again with this result.
import type { QuoteTypeId } from '@/domain/catalog';
import { type QuoteFormErrors, type QuoteFormValues, quoteFieldName } from '@/domain/quote-form';
import { formatReference } from '@/domain/reference';
import { createQuoteRequestSchema } from '@/domain/schemas';
import { HONEYPOT_FIELD, isFormToken, SAVE_FAILED_MESSAGE, TOO_MANY_MESSAGE } from '../forms';
import { parseQuoteForm } from './form';
import type { QuoteStore } from './store';

export const QUOTE_THANKS_PATH = '/ajanlatkeres/koszonjuk';

export type AcceptedQuote = { kind: 'accepted'; location: string; id: number | null };
export type RejectedQuote = {
  kind: 'rejected';
  status: 400 | 429 | 503;
  values: QuoteFormValues;
  errors: QuoteFormErrors;
  formError?: string;
  token: string;
  source?: string;
};

export interface SubmitQuoteDeps {
  store: QuoteStore;
  /** False when this visitor sent too many requests (the rate limiter). */
  allow: () => Promise<boolean>;
  now: () => Date;
  newToken: () => string;
}

/** The form field a schema issue belongs to: fields.x → f_x, contact.x → x, the rest by its first key. */
export function formFieldOf(path: readonly PropertyKey[]): string {
  const [head, second] = path;
  if (head === 'fields' && typeof second === 'string') return quoteFieldName(second);
  if (head === 'contact' && typeof second === 'string') return second;
  return typeof head === 'string' ? head : 'form';
}

export async function submitQuote(
  quoteType: QuoteTypeId,
  form: FormData,
  deps: SubmitQuoteDeps,
): Promise<AcceptedQuote | RejectedQuote> {
  const tokenInput = form.get('token');
  const token = isFormToken(tokenInput) ? tokenInput : deps.newToken();
  const { request, values } = parseQuoteForm(quoteType, form);
  const rejected = (status: RejectedQuote['status'], errors: QuoteFormErrors, formError?: string): RejectedQuote => ({
    kind: 'rejected',
    status,
    values,
    errors,
    ...(formError ? { formError } : {}),
    token,
    ...(request.source ? { source: request.source } : {}),
  });

  const trap = form.get(HONEYPOT_FIELD);
  if (typeof trap === 'string' && trap) return { kind: 'accepted', location: QUOTE_THANKS_PATH, id: null };
  if (!(await deps.allow())) return rejected(429, {}, TOO_MANY_MESSAGE);

  const parsed = createQuoteRequestSchema({ now: deps.now }).safeParse({ ...request, uploadIds: [] });
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[formFieldOf(issue.path)] ??= issue.message;
    return rejected(400, errors);
  }

  const q = parsed.data;
  let id: number;
  try {
    id = await deps.store.insert({
      formToken: token,
      quoteType: q.quoteType,
      fields: q.fields,
      emailedFiles: q.emailedFiles,
      location: q.location,
      deadline: q.deadline,
      surveyRequested: q.surveyRequested,
      contact: q.contact,
      source: request.source,
      createdAt: deps.now().toISOString(),
    });
  } catch (error) {
    console.error('Az ajánlatkérés mentése nem sikerült:', error);
    return rejected(503, {}, SAVE_FAILED_MESSAGE);
  }
  const files = q.emailedFiles.length > 0 ? '&fajl=1' : '';
  return { kind: 'accepted', location: `${QUOTE_THANKS_PATH}?szam=${formatReference('AK', id)}${files}`, id };
}
```

`src/server/quote/email.ts`:

```ts
// The workshop's e-mail about a quote request: the answers as the form asked them, the customer's contacts
// clickable, and replies going straight to the customer.
import { getQuoteType, type QuoteFieldDef } from '@/domain/catalog';
import { formatNumberHu } from '@/domain/money';
import { formatReference } from '@/domain/reference';
import { budapestDateTime, emailBody, huDate, oneLine, telHref } from '../notify/format';
import type { OutgoingEmail } from '../notify/mailer';
import type { StoredQuote } from './store';

function answerText(def: QuoteFieldDef, value: string | number | string[]): string {
  const label = (v: string) => ('options' in def ? (def.options.find((o) => o.value === v)?.label ?? v) : v);
  switch (def.type) {
    case 'select':
      return label(String(value));
    case 'multiselect':
      return (Array.isArray(value) ? value : [String(value)]).map(label).join(', ');
    case 'number':
      return typeof value === 'number' ? `${formatNumberHu(value)}${def.unit ? ` ${def.unit}` : ''}` : String(value);
    case 'date':
      return huDate(String(value));
    default:
      return Array.isArray(value) ? value.join(', ') : String(value);
  }
}

export function quoteEmail(q: StoredQuote, to: string): OutgoingEmail {
  const type = getQuoteType(q.quoteType);
  const reference = formatReference('AK', q.id);
  const rows: [string, string][] = [
    ['Hivatkozási szám', reference],
    ['Munka', type.name],
  ];
  for (const def of type.fields) {
    const value = q.fields[def.id];
    if (value !== undefined && def.type !== 'file') rows.push([def.label, answerText(def, value)]);
  }
  const emailed = type.fields.filter((def) => q.emailedFiles.includes(def.id)).map((def) => def.label);
  if (emailed.length) rows.push(['E-mailben küldi', emailed.join(', ')]);
  if (q.location) rows.push([type.locationLabel ?? 'Helyszín', q.location]);
  rows.push(['Határidő', huDate(q.deadline)], ['Helyszíni felmérés', q.surveyRequested ? 'kéri' : 'nem kéri']);
  rows.push(['Név', q.contact.name], ['Telefon', q.contact.phone], ['E-mail', q.contact.email]);
  if (q.contact.company) rows.push(['Cég', q.contact.company]);
  if (q.source) rows.push(['Honnan', q.source]);
  rows.push(['Beérkezett', budapestDateTime(q.createdAt)]);
  const { text, html } = emailBody('Ajánlatkérés érkezett a weboldalon.', rows, {
    Telefon: telHref(q.contact.phone),
    'E-mail': `mailto:${q.contact.email}`,
  });
  return {
    to,
    subject: oneLine(`[${reference}] Ajánlatkérés – ${type.name} – ${q.contact.name}`),
    text,
    html,
    replyTo: q.contact.email,
  };
}
```

`src/server/quote/notify.ts`:

```ts
// Sends the workshop's e-mail about a quote request (right after it arrives, and from the cron).
import { formatReference } from '@/domain/reference';
import { deliverPending, type DeliverDeps, notifyOne } from '../notify/deliver';
import type { Mailer } from '../notify/mailer';
import { quoteEmail } from './email';
import type { QuoteStore, StoredQuote } from './store';

export interface QuoteNotifyDeps {
  store: QuoteStore;
  mailer: Mailer;
  to: string;
  now: () => Date;
  logError?: (message: string) => void;
}

const delivery = (deps: QuoteNotifyDeps): DeliverDeps<StoredQuote> => ({
  ...deps,
  compose: quoteEmail,
  reference: (id) => formatReference('AK', id),
  failure: 'Az ajánlatkérés értesítése nem ment ki',
});

export const notifyQuote = (id: number, deps: QuoteNotifyDeps) => notifyOne(id, delivery(deps));
export const deliverPendingQuotes = (deps: QuoteNotifyDeps) => deliverPending(delivery(deps));
```

`src/worker.ts` – a `scheduled` törzse:

```ts
    const common = { mailer: mailerFor(env), to: env.ORDER_NOTIFY_EMAIL, now: () => new Date() };
    ctx.waitUntil(
      Promise.all([
        deliverPendingCallbacks({ store: d1CallbackStore(env.DB), ...common }),
        deliverPendingQuotes({ store: d1QuoteStore(env.DB), ...common }),
      ]).then(([visszahivas, ajanlat]) => {
        if (visszahivas.sent || visszahivas.failed || ajanlat.sent || ajanlat.failed) {
          console.info('Értesítések újrapróbálva:', { visszahivas, ajanlat });
        }
      }),
    );
```

(importok: `import { d1QuoteStore } from './server/quote/d1-store';`, `import { deliverPendingQuotes } from './server/quote/notify';`).

- [ ] **Step 4: Zöld és commit** – `npx vitest run src/server && npm run check` → PASS; `git add src/server/quote src/worker.ts && git commit -m "Read, save and e-mail quote requests"`.

---

### Task 5: Munkatípus-linkek és a varázsló űrlapja

**Files:** Modify `src/ui/JobTypePicker/JobTypePicker.tsx`, `.css`, `.test.tsx`; Create `src/ui/QuoteForm/QuoteForm.tsx`, `QuoteForm.css`, `QuoteForm.test.tsx`, `.design-sync/previews/QuoteForm.tsx`; Modify `src/ui/index.ts`

**Interfaces:**
- Produces: `JobTypePicker` új, nem kötelező propjai: `hrefFor?: (id: string) => string` (link-mód), `onChange?` (link-módban nem kell). `QuoteForm(props: QuoteFormProps)`, `QUOTE_STEPS = ['Részletek', 'Helyszín és határidő', 'Kapcsolat']`, `quoteFieldDomId(fieldName): string`.

- [ ] **Step 1: Tesztek**

`src/ui/JobTypePicker/JobTypePicker.test.tsx` végére:

```tsx
  it('links each type to its own page instead of a radio group, so it works without JavaScript', () => {
    render(<JobTypePicker types={TYPES} hrefFor={(id) => `/ajanlatkeres/${id}`} />);
    expect(screen.queryAllByRole('radio')).toEqual([]);
    const link = screen.getByRole('link', { name: /Kirakat- és üvegfóliázás/ });
    expect(link.getAttribute('href')).toBe('/ajanlatkeres/kirakat');
    expect(screen.getAllByRole('link')).toHaveLength(TYPES.length);
  });
```

(a záró `});` elé, a `describe` belsejébe).

`src/ui/QuoteForm/QuoteForm.test.tsx`:

```tsx
/** @vitest-environment jsdom */
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { getQuoteType } from '@/domain/catalog';
import { QuoteForm } from './QuoteForm';

const TOKEN = '3f8a2b6c-1d4e-4f5a-9b7c-0e1d2c3b4a59';
const TODAY = '2026-10-09';

describe('QuoteForm', () => {
  it('is one plain form with the three steps, all showing without JavaScript', () => {
    const { container } = render(<QuoteForm type={getQuoteType('betuk')} token={TOKEN} today={TODAY} />);
    const form = container.querySelector('form')!;
    expect([form.getAttribute('method'), form.getAttribute('action')]).toEqual(['post', null]);
    const steps = [...container.querySelectorAll('fieldset[data-step]')];
    expect(steps.map((s) => s.querySelector('legend')?.textContent)).toEqual(['1. Részletek', '2. Helyszín és határidő', '3. Kapcsolat']);
    expect(steps.every((s) => !s.hasAttribute('hidden'))).toBe(true);
    expect(container.querySelector<HTMLInputElement>('input[name="token"]')!.value).toBe(TOKEN);
    expect(screen.getByRole('button', { name: 'Ajánlatkérés elküldése' })).toBeTruthy();
  });

  it('asks the job type questions with fitting controls', () => {
    const { container } = render(<QuoteForm type={getQuoteType('betuk')} token={TOKEN} today={TODAY} />);
    expect(container.querySelector('input[name="f_feliratSzoveg"]')?.getAttribute('type')).toBe('text');
    expect(container.querySelector('input[name="f_betumagassagCm"]')?.getAttribute('inputmode')).toBe('decimal');
    const anyag = [...container.querySelectorAll<HTMLInputElement>('input[name="f_anyag"]')];
    expect(anyag.map((r) => r.type)).toEqual(['radio', 'radio', 'radio', 'radio']);
    expect(anyag.every((r) => r.required)).toBe(true);
    expect(container.querySelector('input[name="f_logo__email"]')?.getAttribute('type')).toBe('checkbox');
    const deadline = container.querySelector<HTMLInputElement>('input[name="deadline"]')!;
    expect([deadline.type, deadline.min, String(deadline.required)]).toEqual(['date', TODAY, 'true']);
    expect(container.querySelector<HTMLInputElement>('input[name="location"]')!.required).toBe(true);
  });

  it('uses a list for many options, checkboxes for several answers, and no required address where work is not on site', () => {
    const ceger = render(<QuoteForm type={getQuoteType('ceger')} token={TOKEN} today={TODAY} />).container;
    expect(ceger.querySelector('select[name="f_rogzitesiFelulet"]')).not.toBeNull();
    const kirakat = render(<QuoteForm type={getQuoteType('kirakat')} token={TOKEN} today={TODAY} />).container;
    expect([...kirakat.querySelectorAll<HTMLInputElement>('input[name="f_foliaTipus"]')].map((c) => c.type)).toEqual([
      'checkbox',
      'checkbox',
      'checkbox',
      'checkbox',
    ]);
    const harom = render(<QuoteForm type={getQuoteType('3d-nyomtatas')} token={TOKEN} today={TODAY} />).container;
    expect(harom.querySelector<HTMLInputElement>('input[name="location"]')!.required).toBe(false);
  });

  it('shows a conditional field with its condition without answers, and hides it when the answers say so', () => {
    const type = getQuoteType('autofoliazas');
    const { container, rerender } = render(<QuoteForm type={type} token={TOKEN} today={TODAY} />);
    const wrap = () => container.querySelector('[data-field="grafikaFajlok"]')!;
    expect(wrap().hasAttribute('hidden')).toBe(false);
    expect(wrap().textContent).toContain('Csak akkor');
    rerender(<QuoteForm type={type} token={TOKEN} today={TODAY} answers={{ grafika: 'tervezes' }} />);
    expect(wrap().hasAttribute('hidden')).toBe(true);
    rerender(<QuoteForm type={type} token={TOKEN} today={TODAY} answers={{ grafika: 'van' }} />);
    expect(wrap().hasAttribute('hidden')).toBe(false);
    expect(wrap().textContent).not.toContain('Csak akkor');
  });

  it('shows what was typed, the messages and a summary that links to the fields', () => {
    render(
      <QuoteForm
        type={getQuoteType('betuk')}
        token={TOKEN}
        today={TODAY}
        values={{ f_betumagassagCm: '40', f_anyag: 'alu', name: 'Minta Mária' }}
        errors={{ f_feliratSzoveg: 'Adja meg a felirat szövegét, vagy töltse fel a logót.', email: 'Adja meg az e-mail-címét.' }}
      />,
    );
    const summary = screen.getByRole('alert');
    expect(within(summary).getAllByRole('link').map((a) => a.getAttribute('href'))).toEqual(['#ak-feliratSzoveg', '#ak-email']);
    expect(screen.getByDisplayValue('40').getAttribute('name')).toBe('f_betumagassagCm');
    expect(document.querySelector<HTMLInputElement>('input[name="f_anyag"][value="alu"]')!.checked).toBe(true);
    expect(document.getElementById('ak-email')?.getAttribute('aria-invalid')).toBe('true');
  });

  it('shows one step at a time in wizard mode, the send button only on the last', () => {
    const type = getQuoteType('egyeb');
    const { container, rerender } = render(<QuoteForm type={type} token={TOKEN} today={TODAY} step={0} navigation={<button type="button">Tovább</button>} />);
    const hidden = () => [...container.querySelectorAll('fieldset[data-step]')].map((s) => s.hasAttribute('hidden'));
    expect(hidden()).toEqual([false, true, true]);
    expect(screen.queryByRole('button', { name: 'Ajánlatkérés elküldése' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Tovább' })).toBeTruthy();
    rerender(<QuoteForm type={type} token={TOKEN} today={TODAY} step={2} navigation={<button type="button">Vissza</button>} />);
    expect(hidden()).toEqual([true, true, false]);
    expect(screen.getByRole('button', { name: 'Ajánlatkérés elküldése' })).toBeTruthy();
  });
});
```

- [ ] **Step 2: Bukik** – `npx vitest run src/ui/QuoteForm src/ui/JobTypePicker` → FAIL.

- [ ] **Step 3: JobTypePicker** – a props interfészben `onChange: (id: string) => void;` → `onChange?: (id: string) => void;` és új prop:

```ts
  /** Link mode: every type is a link to this address (the quote page of the type), not a radio. Works without JavaScript. */
  hrefFor?: (id: string) => string;
```

a JSDoc első mondata után: `With hrefFor, the cards are links (the /ajanlatkeres page).`; a destrukturálásba `hrefFor,`; a kártya:

```tsx
        {types.map((t) => {
          const id = `${group}-${t.id}`;
          const content = (
            <>
              <svg className="sd-job__pict" viewBox="0 0 48 36" aria-hidden="true" dangerouslySetInnerHTML={{ __html: pictogramFor(t.id) }} />
              <span className="sd-job__name">{t.name}</span>{' '}
              {t.hint && <span className="sd-job__hint">{t.hint}</span>}
            </>
          );
          return (
            <div key={t.id}>
              {hrefFor ? (
                <a className="sd-job sd-job--link" href={hrefFor(t.id)}>
                  {content}
                </a>
              ) : (
                <>
                  <input type="radio" className="sd-vh" id={id} name={group} value={t.id} checked={t.id === value} onChange={() => onChange?.(t.id)} />
                  <label className="sd-job" htmlFor={id}>
                    {content}
                  </label>
                </>
              )}
            </div>
          );
        })}
```

`JobTypePicker.css` végére:

```css
.sd-job--link {
  color: inherit;
  text-decoration: none;
}
.sd-job--link:hover .sd-job__pict,
.sd-job--link:focus-visible .sd-job__pict {
  color: var(--color-brand);
}
.sd-job--link:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}
```

- [ ] **Step 4: QuoteForm**

`src/ui/QuoteForm/QuoteForm.tsx`:

```tsx
import type { FormHTMLAttributes, ReactNode, Ref } from 'react';
import type { QuoteFieldDef, QuoteType } from '@/domain/catalog';
import { COMPANY } from '@/domain/company';
import { EMAILED_SUFFIX, type QuoteFormErrors, type QuoteFormValues, quoteFieldName } from '@/domain/quote-form';
import { isQuoteFieldVisible } from '@/domain/schemas';
import '../base.css';
import { Button } from '../Button/Button';
import { Checkbox } from '../Checkbox/Checkbox';
import { cx } from '../cx';
import { describedBy, Field } from '../Field/Field';
import { Notice } from '../Notice/Notice';
import '../SegmentedChoice/SegmentedChoice.css';
import { TextField } from '../TextField/TextField';
import { UnitField } from '../UnitField/UnitField';
import './QuoteForm.css';

/** The wizard's steps, in order. */
export const QUOTE_STEPS = ['Részletek', 'Helyszín és határidő', 'Kapcsolat'] as const;

const COMMON_LABELS: Readonly<Record<string, string>> = {
  location: 'Helyszín',
  deadline: 'Határidő',
  name: 'Név',
  email: 'E-mail',
  phone: 'Telefonszám',
  company: 'Cégnév',
};

/** The id of a form field's control, for labels and the error summary: "f_anyag" → "ak-anyag", "email" → "ak-email". */
export const quoteFieldDomId = (fieldName: string): string => `ak-${fieldName.replace(/^f_/, '')}`;

export interface QuoteFormProps extends Omit<FormHTMLAttributes<HTMLFormElement>, 'children' | 'method'> {
  /** The job type, from the catalog (QUOTE_TYPES): its questions make the first step. */
  type: QuoteType;
  /** One-time token (a UUID) that makes a second submit of the same form harmless. */
  token: string;
  /** Where the form was placed, for measuring, e.g. "/ajanlatkeres/ceger". */
  source?: string;
  /** What the visitor typed, by form field name, after an error. */
  values?: QuoteFormValues;
  /** One message per form field name. */
  errors?: QuoteFormErrors;
  /** A message about the whole form, e.g. that it could not be saved. */
  formError?: string;
  /** Today in Budapest (YYYY-MM-DD): the earliest date the date fields offer. */
  today: string;
  /** Wizard mode (the island): show only this step. Without it every step shows (no JavaScript). */
  step?: number | null;
  /** The answers so far (the island): fields whose condition is not met are hidden. Without it they show with their condition. */
  answers?: Readonly<Record<string, unknown>>;
  /** The island's Back and Next buttons, shown in wizard mode. */
  navigation?: ReactNode;
  ref?: Ref<HTMLFormElement>;
}

const textOf = (values: QuoteFormValues, name: string): string | undefined => {
  const value = values[name];
  return typeof value === 'string' ? value : undefined;
};
const listOf = (values: QuoteFormValues, name: string): readonly string[] => {
  const value = values[name];
  return Array.isArray(value) ? value : typeof value === 'string' ? [value] : [];
};

function conditionHint(type: QuoteType, def: QuoteFieldDef): string | undefined {
  if (!def.visibleWhen) return undefined;
  const controller = type.fields.find((f) => f.id === def.visibleWhen?.field);
  if (!controller) return undefined;
  const labels = def.visibleWhen.equals.map((v) => ('options' in controller ? controller.options.find((o) => o.value === v)?.label : v) ?? v);
  return `Csak akkor töltse ki, ha erre: „${controller.label}” a válasza: ${labels.join(' vagy ')}.`;
}

function TypeField({ type, def, values, errors, today, answers }: {
  type: QuoteType;
  def: QuoteFieldDef;
  values: QuoteFormValues;
  errors: QuoteFormErrors;
  today: string;
  answers?: Readonly<Record<string, unknown>>;
}) {
  const name = quoteFieldName(def.id);
  const id = quoteFieldDomId(name);
  const error = errors[name];
  const label = def.required || def.type === 'file' ? def.label : `${def.label} (nem kötelező)`;
  const visible = answers ? isQuoteFieldVisible(def, answers) : true;
  const hint = answers ? undefined : conditionHint(type, def);
  const help = [def.help, hint].filter(Boolean).join(' ') || undefined;
  let control: ReactNode;
  switch (def.type) {
    case 'text':
    case 'textarea':
      control = (
        <TextField
          id={id}
          name={name}
          label={label}
          required={def.required}
          maxLength={def.maxLength}
          placeholder={def.placeholder}
          multiline={def.type === 'textarea'}
          defaultValue={textOf(values, name)}
          help={help}
          error={error}
        />
      );
      break;
    case 'number':
      control = def.unit ? (
        <UnitField id={id} name={name} label={label} unit={def.unit} required={def.required} defaultValue={textOf(values, name)} help={help} error={error} />
      ) : (
        <TextField id={id} name={name} label={label} inputMode="decimal" required={def.required} defaultValue={textOf(values, name)} help={help} error={error} />
      );
      break;
    case 'date':
      control = <TextField id={id} name={name} label={label} type="date" min={today} required={def.required} defaultValue={textOf(values, name)} help={help} error={error} />;
      break;
    case 'select':
      if (def.options.length <= 4) {
        control = (
          <fieldset className="sd-seg sd-quote__choice" id={id} aria-describedby={error ? `${id}-error` : undefined}>
            <legend className="sd-seg__legend">
              {label}
              {def.required && <span className="sd-field__req" aria-hidden="true">*</span>}
            </legend>
            {help && <p className="sd-field__help">{help}</p>}
            <div className="sd-seg__wrap">
              <div className="sd-seg__list">
                {def.options.map((o) => (
                  <div className="sd-seg__item" key={o.value}>
                    <input
                      type="radio"
                      className="sd-vh"
                      id={`${id}-${o.value}`}
                      name={name}
                      value={o.value}
                      required={def.required}
                      defaultChecked={textOf(values, name) === o.value}
                      aria-invalid={error ? true : undefined}
                    />
                    <label className="sd-seg__opt" htmlFor={`${id}-${o.value}`}>
                      <span className="sd-seg__label">{o.label}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
            {error && <p className="sd-field__error" id={`${id}-error`}>{error}</p>}
          </fieldset>
        );
      } else {
        const ids = { id, helpId: `${id}-help`, errorId: `${id}-error` };
        control = (
          <Field label={label} htmlFor={id} help={help} error={error} required={def.required} ids={ids}>
            <select
              id={id}
              name={name}
              className="sd-input sd-quote__select"
              required={def.required}
              defaultValue={textOf(values, name) ?? ''}
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy(ids, help, error)}
            >
              <option value="">Válasszon</option>
              {def.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
        );
      }
      break;
    case 'multiselect':
      control = (
        <fieldset className="sd-quote__multi" id={id} data-required={def.required ? 'true' : undefined}>
          <legend className="sd-field__label">
            {label}
            {def.required && <span className="sd-field__req" aria-hidden="true">*</span>}
          </legend>
          {help && <p className="sd-field__help">{help}</p>}
          {def.options.map((o) => (
            <Checkbox key={o.value} id={`${id}-${o.value}`} name={name} value={o.value} label={o.label} defaultChecked={listOf(values, name).includes(o.value)} />
          ))}
          {error && <p className="sd-field__error" id={`${id}-error`}>{error}</p>}
        </fieldset>
      );
      break;
    case 'file':
      control = (
        <Checkbox
          id={id}
          name={name + EMAILED_SUFFIX}
          label={`${def.label}: e-mailben küldöm`}
          description={`A beküldés után a hivatkozási számmal a ${COMPANY.email} címre. ${hint ?? ''}`.trim()}
          defaultChecked={textOf(values, name + EMAILED_SUFFIX) === 'on'}
          error={error}
        />
      );
      break;
  }
  return (
    <div className="sd-quote__field" data-field={def.id} hidden={!visible}>
      {control}
    </div>
  );
}

/**
 * The quote wizard's form for one job type: its questions, the place and the deadline, then the contact details.
 * A plain HTML form that works without JavaScript (all steps at once); the quote page's island turns it into steps.
 * @category quote
 */
export function QuoteForm({
  type,
  token,
  source,
  values = {},
  errors = {},
  formError,
  today,
  step = null,
  answers,
  navigation,
  ref,
  className,
  ...rest
}: QuoteFormProps) {
  const wizard = step !== null;
  const last = QUOTE_STEPS.length - 1;
  const summary = Object.entries(errors);
  const stepAttrs = (index: number) => ({ 'data-step': String(index), hidden: wizard && step !== index });
  const legend = (index: number) => (
    <legend className="sd-quote__legend" tabIndex={-1}>
      {index + 1}. {QUOTE_STEPS[index]}
    </legend>
  );
  const fieldLabel = (name: string) => COMMON_LABELS[name] ?? type.fields.find((f) => quoteFieldName(f.id) === name)?.label ?? name;
  return (
    <form ref={ref} className={cx('sd-quote', className)} method="post" {...rest}>
      {(formError || summary.length > 0) && (
        <Notice className="sd-quote__summary" tone="error" live="assertive" title={formError ?? 'Kérjük, javítsa a következőket:'} tabIndex={-1} autoFocus>
          {summary.length > 0 && (
            <ul>
              {summary.map(([name, message]) => (
                <li key={name}>
                  <a href={`#${quoteFieldDomId(name)}`}>{message}</a>
                  <span className="sd-vh"> ({fieldLabel(name)})</span>
                </li>
              ))}
            </ul>
          )}
        </Notice>
      )}
      <input type="hidden" name="token" value={token} />
      {source && <input type="hidden" name="source" value={source} />}

      <fieldset className="sd-quote__step" {...stepAttrs(0)}>
        {legend(0)}
        {type.requireOneOf?.map((group) => (
          <p className="sd-quote__note" key={group.fields.join()}>
            {group.message}
          </p>
        ))}
        {type.fields.map((def) => (
          <TypeField key={def.id} type={type} def={def} values={values} errors={errors} today={today} answers={answers} />
        ))}
      </fieldset>

      <fieldset className="sd-quote__step" {...stepAttrs(1)}>
        {legend(1)}
        <TextField
          id={quoteFieldDomId('location')}
          name="location"
          label={type.locationRequired ? (type.locationLabel ?? 'A munka helyszíne') : `${type.locationLabel ?? 'Helyszín'} (nem kötelező)`}
          required={type.locationRequired}
          autoComplete="street-address"
          maxLength={300}
          defaultValue={textOf(values, 'location')}
          help="Cím, ahol a munka készül, illetve ahol felszereljük."
          error={errors.location}
        />
        <TextField
          id={quoteFieldDomId('deadline')}
          name="deadline"
          label="Mikorra van szüksége rá?"
          type="date"
          min={today}
          required
          defaultValue={textOf(values, 'deadline')}
          help="Ha nincs pontos határidő, a legkésőbbi napot adja meg."
          error={errors.deadline}
        />
      </fieldset>

      <fieldset className="sd-quote__step" {...stepAttrs(2)}>
        {legend(2)}
        <TextField id={quoteFieldDomId('name')} name="name" label="Név" required autoComplete="name" maxLength={100} defaultValue={textOf(values, 'name')} error={errors.name} />
        <TextField id={quoteFieldDomId('email')} name="email" label="E-mail" type="email" required autoComplete="email" maxLength={254} defaultValue={textOf(values, 'email')} help="Ide küldjük az árajánlatot." error={errors.email} />
        <TextField id={quoteFieldDomId('phone')} name="phone" label="Telefonszám" type="tel" inputMode="tel" required autoComplete="tel" maxLength={30} defaultValue={textOf(values, 'phone')} help="Ezen hívjuk vissza." error={errors.phone} />
        <TextField id={quoteFieldDomId('company')} name="company" label="Cégnév (nem kötelező)" autoComplete="organization" maxLength={150} defaultValue={textOf(values, 'company')} error={errors.company} />
        <Checkbox
          id={quoteFieldDomId('surveyRequested')}
          name="surveyRequested"
          label="Helyszíni felmérést kérek"
          description="Az időpontot telefonon egyeztetjük."
          defaultChecked={textOf(values, 'surveyRequested') === 'on'}
          error={errors.surveyRequested}
        />
      </fieldset>

      <div className="sd-quote__trap" aria-hidden="true">
        <label htmlFor="ak-honlap">Ezt a mezőt hagyja üresen</label>
        <input id="ak-honlap" name="honlap" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {wizard && <div className="sd-quote__nav">{navigation}</div>}
      {(!wizard || step === last) && (
        <div className="sd-quote__send">
          <Button type="submit">Ajánlatkérés elküldése</Button>
          <p className="sd-quote__privacy">
            A beküldés nem jár kötelezettséggel. Az adatait csak az ajánlathoz használjuk.{' '}
            <a href="/adatkezeles">Adatkezelési tájékoztató</a>
          </p>
        </div>
      )}
    </form>
  );
}
```

`src/ui/QuoteForm/QuoteForm.css`:

```css
.sd-quote {
  display: grid;
  gap: var(--space-6);
  max-width: 44rem;
}
.sd-quote__step {
  display: grid;
  gap: var(--space-5);
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}
.sd-quote__step[hidden],
.sd-quote__field[hidden] {
  display: none;
}
.sd-quote__legend {
  margin-bottom: var(--space-2);
  padding: 0;
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-variation-settings: var(--font-variation-display);
  font-weight: var(--weight-display);
  line-height: var(--leading-snug);
}
.sd-quote__legend:focus {
  outline: none;
}
.sd-quote__note {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}
.sd-quote__choice .sd-field__help,
.sd-quote__multi .sd-field__help {
  margin: 0 0 var(--space-3);
}
.sd-quote__multi {
  display: grid;
  gap: var(--space-2);
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}
.sd-quote__select {
  appearance: auto;
}
.sd-quote__summary ul {
  margin: var(--space-2) 0 0;
  padding-inline-start: var(--space-5);
}
.sd-quote__summary a {
  color: inherit;
  text-decoration: underline;
}
.sd-quote__trap {
  position: absolute;
  left: -10000px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}
.sd-quote__nav,
.sd-quote__send {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
}
.sd-quote__send {
  flex-direction: column;
  align-items: flex-start;
}
.sd-quote__privacy {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}
.sd-quote__privacy a {
  color: var(--color-text);
}
.sd-quote a:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}
```

`src/ui/index.ts`: ábécérendben a `PriceBreakdown` export után (vagy a megfelelő helyre): `export { QUOTE_STEPS, QuoteForm, quoteFieldDomId } from './QuoteForm/QuoteForm';` és `export type { QuoteFormProps } from './QuoteForm/QuoteForm';`.

`.design-sync/previews/QuoteForm.tsx`:

```tsx
import { QuoteForm } from '@stiletdekor/ui';

const BETUK = {
  id: 'betuk',
  name: 'Világító és plasztik betűk, logók',
  description: 'Világító vagy plasztik betűk, logók homlokzatra, beltérbe.',
  locationRequired: true,
  fields: [
    { id: 'feliratSzoveg', label: 'A felirat szövege', type: 'text', required: false, maxLength: 200 },
    { id: 'logo', label: 'Logó', type: 'file', required: false, accept: ['.pdf', '.svg'], maxFiles: 10 },
    { id: 'betumagassagCm', label: 'Betűmagasság', type: 'number', required: true, unit: 'cm', min: 1, max: 500, integer: false },
    {
      id: 'anyag',
      label: 'Anyag',
      type: 'select',
      required: true,
      options: [
        { value: 'plexi', label: 'Plexi' },
        { value: 'alu', label: 'Alumínium' },
        { value: 'pvc', label: 'PVC' },
        { value: 'javaslat', label: 'Kérem a javaslatukat' },
      ],
    },
  ],
  requireOneOf: [{ fields: ['feliratSzoveg', 'logo'], message: 'Adja meg a felirat szövegét, vagy töltse fel a logót.' }],
} as const;

export const AllSteps = () => <QuoteForm type={BETUK} token="3f8a2b6c-1d4e-4f5a-9b7c-0e1d2c3b4a59" today="2026-10-09" />;

export const WizardStep = () => <QuoteForm type={BETUK} token="3f8a2b6c-1d4e-4f5a-9b7c-0e1d2c3b4a59" today="2026-10-09" step={0} answers={{}} />;
```

- [ ] **Step 5: Zöld és commit** – `npx vitest run src/ui && npm run check` → PASS (ha a jsdom a `hidden` attribútumot a `fieldset`-en nem tükrözi, a tesztek attribútumot néznek, nem stílust). `git add src/ui .design-sync/previews/QuoteForm.tsx && git commit -m "Add the quote form and link mode for the job type picker"`.

---

### Task 6: A varázsló szigete

> **Megvalósításkor módosítva (2026-10-09):** a React-sziget a mérés szerint 113 KB (gzip) JavaScriptet tett az oldalra, a keret ~70 KB. Helyette a `QuoteForm` mindig a teljes, szerveroldali űrlapot adja rejtett lépésjelzővel, gombokkal és `data-` jelölésekkel, a lépésekre bontást pedig egy keretrendszer nélküli szkript végzi (`src/scripts/quote-wizard.ts`, tesztje `quote-wizard.test.tsx`; 1,3 KB gzip). A `QuoteForm` `step`/`answers`/`navigation` propjai így megszűntek. Az alábbi szigetkód csak a döntés nyomaként maradt itt.

**Files:** Create `src/islands/QuoteWizard.tsx`, `src/islands/QuoteWizard.test.tsx`

**Interfaces:**
- Consumes: `QuoteForm`, `QuoteFormProps`, `QUOTE_STEPS`, `Stepper`, `Button`, `Notice`, `validateQuoteFields`, `quoteFieldName`, `EMAILED_SUFFIX`.
- Produces: `export default function QuoteWizard(props: Omit<QuoteFormProps, 'step' | 'answers' | 'navigation' | 'ref'>)`.

- [ ] **Step 1: Teszt** – `src/islands/QuoteWizard.test.tsx`:

```tsx
/** @vitest-environment jsdom */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { getQuoteType } from '@/domain/catalog';
import QuoteWizard from './QuoteWizard';

const TOKEN = '3f8a2b6c-1d4e-4f5a-9b7c-0e1d2c3b4a59';
const TODAY = '2026-10-09';
const steps = (c: HTMLElement) => [...c.querySelectorAll('fieldset[data-step]')].map((s) => s.hasAttribute('hidden'));

beforeEach(() => sessionStorage.clear());

describe('QuoteWizard', () => {
  it('turns the form into steps, and moves on only when the step is filled in', async () => {
    const { container } = render(<QuoteWizard type={getQuoteType('egyeb')} token={TOKEN} today={TODAY} />);
    expect(steps(container)).toEqual([false, true, true]);
    expect(screen.getByText(/1\. lépés a 3-ból/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Tovább' }));
    expect(steps(container)).toEqual([false, true, true]);
    fireEvent.change(container.querySelector('textarea[name="f_leiras"]')!, { target: { value: 'Ajtófelirat a műhelyre.' } });
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Tovább' })));
    expect(steps(container)).toEqual([true, false, true]);
    fireEvent.click(screen.getByRole('button', { name: 'Vissza' }));
    expect(steps(container)).toEqual([false, true, true]);
  });

  it('applies the job type rules before moving on: a "one of" group', async () => {
    const { container } = render(<QuoteWizard type={getQuoteType('betuk')} token={TOKEN} today={TODAY} />);
    fireEvent.change(container.querySelector('input[name="f_betumagassagCm"]')!, { target: { value: '40' } });
    fireEvent.click(container.querySelector('input[name="f_anyag"][value="plexi"]')!);
    fireEvent.click(container.querySelector('input[name="f_vilagitas"][value="nincs"]')!);
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Tovább' })));
    expect(screen.getByRole('alert').textContent).toContain('Adja meg a felirat szövegét, vagy töltse fel a logót.');
    expect(steps(container)).toEqual([false, true, true]);
    fireEvent.click(container.querySelector('input[name="f_logo__email"]')!);
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Tovább' })));
    expect(steps(container)).toEqual([true, false, true]);
  });

  it('shows a conditional field only when its answer is chosen', () => {
    const { container } = render(<QuoteWizard type={getQuoteType('autofoliazas')} token={TOKEN} today={TODAY} />);
    const wrap = () => container.querySelector('[data-field="grafikaFajlok"]')!;
    expect(wrap().hasAttribute('hidden')).toBe(true);
    fireEvent.click(container.querySelector('input[name="f_grafika"][value="van"]')!);
    expect(wrap().hasAttribute('hidden')).toBe(false);
  });

  it('keeps a draft in the browser, and shows every step at once after a server error', () => {
    const type = getQuoteType('egyeb');
    const first = render(<QuoteWizard type={type} token={TOKEN} today={TODAY} />);
    fireEvent.change(first.container.querySelector('textarea[name="f_leiras"]')!, { target: { value: 'Vázlat' } });
    first.unmount();
    const again = render(<QuoteWizard type={type} token={TOKEN} today={TODAY} />);
    expect(again.container.querySelector<HTMLTextAreaElement>('textarea[name="f_leiras"]')!.value).toBe('Vázlat');
    again.unmount();
    const withError = render(<QuoteWizard type={type} token={TOKEN} today={TODAY} errors={{ email: 'Adja meg az e-mail-címét.' }} />);
    expect(steps(withError.container)).toEqual([false, false, false]);
    expect(screen.queryByText(/lépés a 3-ból/)).toBeNull();
  });
});
```

- [ ] **Step 2: Bukik** – `npx vitest run src/islands/QuoteWizard.test.tsx` → FAIL.

- [ ] **Step 3: Megvalósítás** – `src/islands/QuoteWizard.tsx`:

```tsx
// The quote page's island: the server sends the whole form (it works without JavaScript); after hydration this
// shows one step at a time, checks each step before moving on (the browser's own checks plus the job type's
// rules), hides the fields whose condition is not met, and keeps a draft in the browser until the form is sent.
import { useEffect, useRef, useState } from 'react';
import { EMAILED_SUFFIX, quoteFieldName } from '@/domain/quote-form';
import { validateQuoteFields } from '@/domain/schemas';
import { Button } from '@/ui/Button/Button';
import { Notice } from '@/ui/Notice/Notice';
import { QUOTE_STEPS, QuoteForm, quoteFieldDomId, type QuoteFormProps } from '@/ui/QuoteForm/QuoteForm';
import { Stepper } from '@/ui/Stepper/Stepper';

type WizardProps = Omit<QuoteFormProps, 'step' | 'answers' | 'navigation' | 'ref'>;

const NOT_SAVED = new Set(['token', 'honlap', 'source']);

function readAnswers(form: HTMLFormElement, type: WizardProps['type']): { answers: Record<string, unknown>; emailed: string[] } {
  const data = new FormData(form);
  const answers: Record<string, unknown> = {};
  const emailed: string[] = [];
  for (const def of type.fields) {
    const name = quoteFieldName(def.id);
    if (def.type === 'file') {
      if (data.get(name + EMAILED_SUFFIX)) emailed.push(def.id);
    } else if (def.type === 'multiselect') {
      answers[def.id] = data.getAll(name);
    } else {
      const raw = data.get(name);
      const text = typeof raw === 'string' ? raw.trim() : '';
      answers[def.id] = def.type === 'number' && text ? Number(text.replace(/\s/g, '').replace(',', '.')) : text;
    }
  }
  return { answers, emailed };
}

function saveDraft(form: HTMLFormElement, key: string) {
  try {
    const entries = [...new FormData(form)].filter(([name, value]) => !NOT_SAVED.has(name) && typeof value === 'string');
    sessionStorage.setItem(key, JSON.stringify(entries));
  } catch {
    // Works without storage too.
  }
}

function restoreDraft(form: HTMLFormElement, key: string) {
  try {
    const entries = JSON.parse(sessionStorage.getItem(key) ?? '[]') as [string, string][];
    for (const [name, value] of entries) {
      for (const el of form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(`[name="${CSS.escape(name)}"]`)) {
        if (el instanceof HTMLInputElement && (el.type === 'radio' || el.type === 'checkbox')) {
          if (el.value === value || (el.type === 'checkbox' && value === 'on' && el.value === 'on')) el.checked = true;
        } else {
          el.value = value;
        }
      }
    }
  } catch {
    // Works without storage too.
  }
}

export default function QuoteWizard(props: WizardProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const draftKey = `stilet-ajanlat-${props.type.id}`;
  const serverAnswered = Boolean(props.formError) || Object.keys(props.errors ?? {}).length > 0 || Object.keys(props.values ?? {}).length > 0;
  const [wizard, setWizard] = useState(false);
  const [step, setStep] = useState(0);
  const [reached, setReached] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown> | undefined>(undefined);
  const [stepError, setStepError] = useState<string | null>(null);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    if (!serverAnswered) restoreDraft(form, draftKey);
    setAnswers(readAnswers(form, props.type).answers);
    if (!serverAnswered) setWizard(true);
  }, []);

  useEffect(() => {
    if (wizard) formRef.current?.querySelector<HTMLElement>(`[data-step="${step}"] legend`)?.focus();
  }, [step]);

  const onChange = () => {
    const form = formRef.current;
    if (!form) return;
    setAnswers(readAnswers(form, props.type).answers);
    setStepError(null);
    saveDraft(form, draftKey);
  };

  const stepIsValid = (): boolean => {
    const form = formRef.current;
    const fieldset = form?.querySelector<HTMLFieldSetElement>(`[data-step="${step}"]`);
    if (!form || !fieldset) return true;
    const controls = [...fieldset.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input, textarea, select')].filter(
      (el) => !el.closest('[hidden]'),
    );
    const invalid = controls.find((el) => !el.checkValidity());
    if (invalid) {
      invalid.reportValidity();
      return false;
    }
    if (step === 0) {
      const { answers: now, emailed } = readAnswers(form, props.type);
      const [issue] = validateQuoteFields(props.type.id, now, { today: props.today, emailedFiles: emailed });
      if (issue) {
        setStepError(issue.message);
        const target = typeof issue.path[0] === 'string' ? form.querySelector<HTMLElement>(`#${quoteFieldDomId(quoteFieldName(issue.path[0]))}`) : null;
        target?.focus();
        return false;
      }
    }
    return true;
  };

  const next = () => {
    if (!stepIsValid()) return;
    const to = Math.min(step + 1, QUOTE_STEPS.length - 1);
    setStep(to);
    setReached((r) => Math.max(r, to));
    setStepError(null);
  };

  const navigation = (
    <>
      {stepError && (
        <Notice tone="error" live="assertive" className="sd-quote__steperror">
          {stepError}
        </Notice>
      )}
      {step > 0 && (
        <Button type="button" variant="secondary" onClick={() => setStep(step - 1)}>
          Vissza
        </Button>
      )}
      {step < QUOTE_STEPS.length - 1 && (
        <Button type="button" onClick={next}>
          Tovább
        </Button>
      )}
    </>
  );

  return (
    <div className="sd-wizard">
      {wizard && <Stepper steps={QUOTE_STEPS} current={step} reached={reached} onStepClick={setStep} />}
      <QuoteForm
        {...props}
        ref={formRef}
        step={wizard ? step : null}
        answers={answers}
        navigation={navigation}
        onChange={onChange}
        onInput={onChange}
        onSubmit={() => {
          try {
            sessionStorage.removeItem(draftKey);
          } catch {
            // Works without storage too.
          }
        }}
      />
    </div>
  );
}
```

A `QuoteForm` a `{...rest}`-tel továbbadja a form `onChange`/`onInput`/`onSubmit` propját (a `FormHTMLAttributes`-ből jön), a `ref` (React 19: sima prop) a `<form>`-ra kerül.

- [ ] **Step 4: Zöld és commit** – `npx vitest run src/islands src/ui/QuoteForm && npm run check` → PASS. `git add src/islands/QuoteWizard.tsx src/islands/QuoteWizard.test.tsx src/ui/QuoteForm && git commit -m "Turn the quote form into steps where scripts run"`.

---

### Task 7: Az oldalak és a navigáció

**Files:** Create `src/pages/ajanlatkeres/index.astro`, `src/pages/ajanlatkeres/[tipus].astro`, `src/pages/ajanlatkeres/koszonjuk.astro`; Modify `src/ui/navigation.ts`, `src/ui/SiteHeader/SiteHeader.test.tsx`, `src/ui/ActionBar/ActionBar.test.tsx`

- [ ] **Step 1: Navigáció** – `src/ui/navigation.ts`: `export const QUOTE_HREF = '/#ajanlat';` → `export const QUOTE_HREF = '/ajanlatkeres';`. A két tesztben `'/#ajanlat'` → `'/ajanlatkeres'`.

- [ ] **Step 2: `/ajanlatkeres`** – `src/pages/ajanlatkeres/index.astro`:

```astro
---
// The start of the quote path: the nine job types as links (each opens its own wizard), and the quick callback
// for those who would rather talk (docs/superpowers/specs/2026-10-08-weboldal-mukodesi-elvek-design.md, 3.1).
import { QUOTE_TYPES } from '@/domain/catalog';
import { COMPANY } from '@/domain/company';
import Page from '@/layouts/Page.astro';
import { CallbackForm } from '@/ui/CallbackForm/CallbackForm';
import { JobTypePicker } from '@/ui/JobTypePicker/JobTypePicker';

const types = QUOTE_TYPES.map((t) => ({ id: t.id, name: t.name, hint: t.description }));
---

<Page
  title="Ajánlatkérés – Stilet Dekor"
  description="Kérjen árajánlatot fóliázásra, cégérre, világító betűkre, rendezvénydíszletre vagy egyedi munkára."
  currentHref="/ajanlatkeres"
  actionBar={false}
>
  <section class="ak">
    <h1>Ajánlatkérés</h1>
    <p class="ak__lead">
      Válassza ki, milyen munkáról van szó. A következő oldalon csak azt kérdezzük, ami az árajánlathoz kell; ha kéri,
      kimegyünk és felmérjük a helyszínt.
    </p>
    <JobTypePicker types={types} hrefFor={(id: string) => `/ajanlatkeres/${id}`} legend="Milyen munkáról van szó?" />

    <section class="ak__vh" id="visszahivas" aria-labelledby="vh-cim">
      <h2 id="vh-cim">Inkább beszélne róla?</h2>
      <p>
        Adja meg a nevét és a telefonszámát, és hamarosan visszahívjuk. Vagy hívjon:{' '}
        <a href={COMPANY.phone.href}>{COMPANY.phone.display}</a>.
      </p>
      <CallbackForm token={crypto.randomUUID()} source="/ajanlatkeres#visszahivas" />
    </section>
  </section>
</Page>

<style>
  .ak {
    max-width: 64rem;
    margin: 0 auto;
    padding: var(--space-8) var(--layout-gutter) var(--space-9);
  }
  h1 {
    margin: 0 0 var(--space-3);
    font-family: var(--font-display);
    font-size: var(--text-2xl);
    font-variation-settings: var(--font-variation-display);
    font-weight: var(--weight-display);
    line-height: var(--leading-snug);
  }
  .ak__lead {
    max-width: 44rem;
    margin: 0 0 var(--space-6);
    color: var(--color-text-muted);
  }
  .ak__vh {
    margin-top: var(--space-8);
    padding-top: var(--space-6);
    border-top: 1px solid var(--color-line);
  }
  .ak__vh h2 {
    margin: 0 0 var(--space-2);
    font-family: var(--font-display);
    font-size: var(--text-xl);
    font-variation-settings: var(--font-variation-display);
    font-weight: var(--weight-display);
  }
  .ak__vh p {
    margin: 0 0 var(--space-5);
    color: var(--color-text-muted);
  }
  .ak__vh a {
    color: var(--color-text);
    white-space: nowrap;
  }
</style>
```

- [ ] **Step 3: `/ajanlatkeres/[tipus]`** – `src/pages/ajanlatkeres/[tipus].astro`:

```astro
---
// The wizard of one job type. GET shows the whole form (the island turns it into steps); POST saves the request
// and redirects to the thank-you page (303), or shows the form again with the messages.
import { env, waitUntil } from 'cloudflare:workers';
import { getQuoteType } from '@/domain/catalog';
import { COMPANY } from '@/domain/company';
import { budapestToday } from '@/domain/leadtime';
import QuoteWizard from '@/islands/QuoteWizard';
import Page from '@/layouts/Page.astro';
import { limiterAllows } from '@/server/forms';
import { mailerFor } from '@/server/notify/mailer';
import { d1QuoteStore } from '@/server/quote/d1-store';
import { notifyQuote } from '@/server/quote/notify';
import { type RejectedQuote, submitQuote } from '@/server/quote/submit';

const type = getQuoteType(Astro.params.tipus ?? '');
if (!type) return Astro.rewrite('/404');
const quoteType = type.id as Parameters<typeof submitQuote>[0];

let rejected: RejectedQuote | null = null;
if (Astro.request.method === 'POST') {
  const store = d1QuoteStore(env.DB);
  const now = () => new Date();
  const result = await submitQuote(quoteType, await Astro.request.formData(), {
    store,
    now,
    newToken: () => crypto.randomUUID(),
    allow: () => limiterAllows(env.FORM_LIMITER, `ajanlat:${Astro.clientAddress}`),
  });
  if (result.kind === 'accepted') {
    if (result.id !== null) {
      waitUntil(
        notifyQuote(result.id, { store, mailer: mailerFor(env), to: env.ORDER_NOTIFY_EMAIL, now }).catch((error) =>
          console.error('Az ajánlatkérés értesítése hibával leállt:', error),
        ),
      );
    }
    return Astro.redirect(result.location, 303);
  }
  rejected = result;
  Astro.response.status = result.status;
}

const source = `/ajanlatkeres/${type.id}`;
const title = rejected ? `Hiba a beküldésben – ${type.name} – Stilet Dekor` : `${type.name}: ajánlatkérés – Stilet Dekor`;
---

<Page title={title} description={`${type.name}: kérjen árajánlatot a Stilet Dekortól. ${type.description}`} currentHref="/ajanlatkeres" actionBar={false}>
  <section class="ak">
    <p class="ak__back"><a href="/ajanlatkeres">← Másik munkatípus</a></p>
    <h1>{type.name}</h1>
    <p class="ak__lead">{type.description}</p>
    <QuoteWizard
      client:load
      type={type}
      token={rejected?.token ?? crypto.randomUUID()}
      source={rejected?.source ?? source}
      values={rejected?.values}
      errors={rejected?.errors}
      formError={rejected?.formError}
      today={budapestToday(new Date())}
    />
    <p class="ak__vh">
      Inkább beszélne róla? <a href="/visszahivas">Kérjen visszahívást</a>, vagy hívjon:{' '}
      <a href={COMPANY.phone.href}>{COMPANY.phone.display}</a>.
    </p>
  </section>
</Page>

<style>
  .ak {
    max-width: 48rem;
    margin: 0 auto;
    padding: var(--space-7) var(--layout-gutter) var(--space-9);
  }
  .ak__back {
    margin: 0 0 var(--space-4);
  }
  .ak__back a,
  .ak__vh a {
    color: var(--color-text);
  }
  h1 {
    margin: 0 0 var(--space-2);
    font-family: var(--font-display);
    font-size: var(--text-2xl);
    font-variation-settings: var(--font-variation-display);
    font-weight: var(--weight-display);
    line-height: var(--leading-snug);
  }
  .ak__lead {
    margin: 0 0 var(--space-6);
    color: var(--color-text-muted);
  }
  .ak__vh {
    margin: var(--space-8) 0 0;
    padding-top: var(--space-5);
    border-top: 1px solid var(--color-line);
    color: var(--color-text-muted);
  }
  .ak :global(.sd-wizard) {
    display: grid;
    gap: var(--space-6);
  }
</style>
```

- [ ] **Step 4: Köszönő oldal** – `src/pages/ajanlatkeres/koszonjuk.astro`:

```astro
---
// After a quote request: the reference, what happens next, and, when files were marked, where to send them.
import { COMPANY } from '@/domain/company';
import { parseReference } from '@/domain/reference';
import Page from '@/layouts/Page.astro';
import { ButtonLink } from '@/ui/ButtonLink/ButtonLink';
import { Notice } from '@/ui/Notice/Notice';
import { SuccessPanel } from '@/ui/SuccessPanel/SuccessPanel';

const reference = parseReference(Astro.url.searchParams.get('szam'), 'AK') ?? undefined;
const files = Astro.url.searchParams.get('fajl') === '1';
const mailto = `mailto:${COMPANY.email}${reference ? `?subject=${encodeURIComponent(reference)}` : ''}`;
---

<Page title="Megkaptuk – Ajánlatkérés – Stilet Dekor" description="Megkaptuk az ajánlatkérését.">
  <section class="ak">
    <SuccessPanel
      title="Megkaptuk az ajánlatkérését"
      reference={reference}
      referenceLabel="Hivatkozási szám"
      nextSteps={[
        'Átnézzük, amit megadott.',
        'Hamarosan felvesszük Önnel a kapcsolatot, és ha kell, egyeztetjük a helyszíni felmérést.',
        'E-mailben elküldjük az árajánlatot.',
      ]}
    >
      {
        files && (
          <Notice title="A fájlokat e-mailben várjuk">
            Küldje el őket a <a href={mailto}>{COMPANY.email}</a> címre, a levél tárgyában a hivatkozási számmal
            {reference ? ` (${reference})` : ''}.
          </Notice>
        )
      }
      <Fragment slot="note">Sürgős? Hívjon minket: <a href={COMPANY.phone.href}>{COMPANY.phone.display}</a></Fragment>
      <Fragment slot="actions"><ButtonLink href="/" variant="secondary">Vissza a kezdőlapra</ButtonLink></Fragment>
    </SuccessPanel>
  </section>
</Page>

<style>
  .ak {
    max-width: 40rem;
    margin: 0 auto;
    padding: var(--space-8) var(--layout-gutter) var(--space-9);
  }
</style>
```

- [ ] **Step 5: Ellenőrzés és commit** – `npm test && npm run check && npm run typecheck && npm run build` → zöld; a build kimenetében a `QuoteWizard` és a React gzip mérete együtt ≤ ~70 KB (`ls dist/client/_astro` és `gzip -c <fájl> | wc -c`). `git add src/pages/ajanlatkeres src/ui/navigation.ts src/ui/SiteHeader src/ui/ActionBar && git commit -m "Add the quote pages: job types, the wizard and the thank-you page"`.

---

### Task 8: Kipróbálás és dokumentáció

- [ ] **Step 1: Helyben** – `npm run db:migrate:local`, `npm run dev -- --port 4321`, a beépített böngészőben:
  1. `/ajanlatkeres`: 9 link, alatta a visszahívó űrlap; mobilon nincs akciósáv.
  2. `/ajanlatkeres/betuk` JavaScripttel: „1. lépés a 3-ból”, a „Tovább” kitöltés nélkül nem lép; a logónál az e-mailes jelölővel átlép; a 3. lépésen beküldve → `/ajanlatkeres/koszonjuk?szam=AK-0001&fajl=1`, a fájlos tájékoztatóval; a dev naplóban `[értesítés → …] [AK-0001] Ajánlatkérés – Világító és plasztik betűk, logók – …`.
  3. Ugyanez szkript nélkül: `curl` POST hiányos adatokkal → 400 és összesítő; teljes adatokkal → 303.
  4. `/ajanlatkeres/autofoliazas`: a „Meglévő grafika” csak az „Igen, feltöltöm” után jelenik meg.
  5. `/ajanlatkeres/nincs-ilyen` → 404.
  6. A fejléc és a lábléc „Ajánlatkérés” linkje a `/ajanlatkeres`-re visz.
- [ ] **Step 2: Dokumentáció** – `README.md` „Visszahívás és értesítő e-mailek” alszakasz címe: „Visszahívás, ajánlatkérés és értesítő e-mailek”; új sorok: a `migrations/0002_quote_requests.sql`, és a heti ajánlatkérések lekérdezése:
  `npx wrangler d1 execute DB --remote --command "SELECT strftime('%Y-%W', created_at) AS het, quote_type, COUNT(*) AS db FROM quote_requests GROUP BY het, quote_type ORDER BY het DESC"`.
- [ ] **Step 3: Végső ellenőrzés és commit** – `npm test && npm run check && npm run typecheck && npm run build`; `git add README.md && git commit -m "Document the quote requests"`.
