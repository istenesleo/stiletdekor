# Oldal, 1. alprojekt: keret és gyors visszahívás – megvalósítási terv

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Az éles oldal közös kerete (fejléc script nélküli mobilmenüvel, lábléc, mobilos akciósáv, 404) és egy JavaScript nélkül is működő visszahívás-kérés: űrlap, mentés D1-be `VH-0087` hivatkozási számmal, köszönő oldal, e-mail a műhelynek újrapróbálással.

**Architecture:** Az üzleti szabályok tiszta modulokban vannak (`src/domain/reference.ts`, a séma a `src/domain/schemas.ts`-ben), a szerveroldali lépések függőség-befecskendezéssel tesztelhetők (`src/server/callback/*`, `src/server/notify/*`). Az Astro-oldalak csak összekötnek: a `/visszahivas` ugyanazon a címen fogadja a POST-ot, siker esetén 303-mal a köszönő oldalra irányít (Post/Redirect/Get). Az értesítő e-mail a válasz után a háttérben (`waitUntil`) megy ki; ha elakad, egy 15 percenkénti cron 24 órán át újrapróbálja. A Worker belépési pontja saját fájl lesz (`src/worker.ts`), hogy a cron-kezelő mellé kerülhessen.

**Tech Stack:** Astro 7 (SSR, `@astrojs/cloudflare` 14), React 19 (csak szerveroldali renderelés, hidratálás nélkül), Zod 4, Cloudflare D1, Workers Rate Limiting, Cron Triggers, Email Service `send_email` kötés (később), Vitest 5 (`getPlatformProxy` a D1-tesztekhez).

**Spec:** `docs/superpowers/specs/2026-10-08-weboldal-mukodesi-elvek-design.md` (1–4., 6–8. és 11. fejezet)

## Global Constraints

- Minden látogatónak szóló szöveg magyar és magázó, rövid mondatokkal. Időígéret nincs: „Hamarosan visszahívjuk.”
- Nincs kitalált adat; a nyitvatartás helyőrző marad (`src/domain/company.ts`).
- Az űrlap JavaScript nélkül működik: sima HTML `<form method="post">`, a hibákat a szerver írja vissza a beírt adatokkal.
- A tartalmi oldalakra (most: 404, köszönő oldal) nem kerül keretrendszer-JS; a React-komponensek hidratálás nélkül renderelődnek.
- Érintési felület legalább 44×44 px; látható fókuszkeret; a mezők fölött látható címke; a nem kötelező mezők címkéje „(nem kötelező)”.
- Csak tokenekből stílus (`var(--…)`), új szín nincs; minden rózsaszín `var(--color-brand)`.
- A tesztelt modulok nem importálhatják a `cloudflare:workers`-t és az `astro:*` modulokat (Vitest, Node). DOM-teszt: `/** @vitest-environment jsdom */`.
- Hivatkozási szám: `VH-` + legalább 4 számjegyű sorszám (a D1 `id`), például `VH-0087`.
- Beküldési korlát: IP-címenként 60 másodperc alatt legfeljebb 5 beküldés. Értesítés újrapróbálása: 15 percenként, a beküldéstől számított 24 órán át.
- A betűk saját tárhelyre költözése **nem** ebben az alprojektben történik: a betűk a végleges arculati iránytól függnek, ezért az arculati döntés után, a 3. alprojektben (a spec 11. fejezetét ennek megfelelően módosítjuk, 8. feladat).
- Minden feladat végén zöld: `npm test`, `npm run check`; a végén `npm run typecheck` és `npm run build` is.
- Commit: `git -c user.name=Claude -c user.email=noreply@anthropic.com commit …`, az üzenet végén `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Ág: `oldal-1` (a `main`-ből). Push nincs.

## Fájlszerkezet

| Fájl | Felelősség |
|---|---|
| `src/domain/reference.ts` (+ teszt) | `VH-0087` formázása és ellenőrzése |
| `src/domain/schemas.ts` (+ teszt) | `CallbackRequestSchema`, a visszahívás mezői és munkatípusai, `formSource` |
| `migrations/0001_callback_requests.sql` | A `callback_requests` tábla |
| `src/server/callback/store.ts` | A tároló interfésze és típusai |
| `src/server/callback/d1-store.ts` (+ teszt) | A tároló D1-es megvalósítása |
| `src/server/notify/mailer.ts` (+ teszt) | Levélküldő interfész: napló, `send_email` kötés |
| `src/server/callback/email.ts` (+ teszt) | A műhelynek szóló levél összeállítása |
| `src/server/callback/notify.ts` (+ teszt) | Egy kérés értesítése, a függőben lévők újrapróbálása |
| `src/server/callback/submit.ts` (+ teszt) | Egy beküldés feldolgozása (csapda, korlát, ellenőrzés, mentés) |
| `src/ui/CallbackForm/` (+ teszt, előnézet) | A visszahívó űrlap |
| `src/ui/ActionBar/` (+ teszt, előnézet) | Mobilos akciósáv |
| `src/ui/SiteHeader/` (módosul) | Mobilmenü a böngésző `popover` paneljével |
| `src/ui/navigation.ts` (módosul) | `WEBSHOP_HREF`, `CALLBACK_HREF`, visszahívás a láblécben |
| `src/site/analytics.ts` (+ teszt) | Cloudflare Web Analytics jeladó, ha van token |
| `src/layouts/Base.astro`, `src/layouts/Page.astro` | Dokumentumváz; oldalkeret fejléccel, lábléccel, akciósávval |
| `src/pages/visszahivas/index.astro`, `src/pages/visszahivas/koszonjuk.astro`, `src/pages/404.astro` | Az oldalak |
| `src/worker.ts` | Worker-belépés: Astro + cron |
| `wrangler.jsonc`, `src/env.d.ts`, `.dev.vars.example` | Korlát-kötés, cron, új változók |
| `README.md`, `docs/architecture.md`, a spec | Dokumentáció |

---

### Task 0: Ág

- [ ] **Step 1: Ág a `main`-ből**

```bash
cd /f/OneDrive/StiletDekor && git switch main && git switch -c oldal-1 && git status --short
```

Expected: `Switched to a new branch 'oldal-1'`; a státuszban legfeljebb ` M .design-sync/NOTES.md` és a követetlen „Arculati látványtervek.html” (egyiket sem commitoljuk ebben a tervben).

---

### Task 1: Hivatkozási szám és a visszahívás sémája

**Files:**
- Create: `src/domain/reference.ts`, `src/domain/reference.test.ts`
- Modify: `src/domain/schemas.ts` (importok; új blokk az `AddressSchema` után), `src/domain/schemas.test.ts` (import és új `describe`)

**Interfaces:**
- Produces: `formatReference(prefix: ReferencePrefix, id: number): string`, `parseReference(value: unknown, prefix: ReferencePrefix): string | null`, `type ReferencePrefix = 'AK' | 'VH'`; a `schemas.ts`-ből: `CALLBACK_JOB_TYPE_IDS`, `type CallbackJobTypeId`, `callbackJobTypeName(id: CallbackJobTypeId): string`, `isCallbackJobTypeId(value: unknown): value is CallbackJobTypeId`, `CALLBACK_FORM_FIELDS = ['name','phone','jobType','message']`, `type CallbackFormField`, `type CallbackFormValues = Partial<Record<CallbackFormField, string>>`, `type CallbackFormErrors` (ugyanaz), `MAX_CALLBACK_MESSAGE_LENGTH = 300`, `formSource(value: unknown): string | undefined`, `CallbackRequestSchema`, `type CallbackRequest`.

- [ ] **Step 1: A hivatkozási szám tesztje**

`src/domain/reference.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { formatReference, parseReference } from './reference';

describe('formatReference', () => {
  it('pads the id to four digits and keeps longer ids whole', () => {
    expect(formatReference('VH', 87)).toBe('VH-0087');
    expect(formatReference('AK', 142)).toBe('AK-0142');
    expect(formatReference('AK', 12345)).toBe('AK-12345');
  });

  it('rejects ids that cannot come from the database', () => {
    for (const id of [0, -1, 1.5, Number.NaN]) expect(() => formatReference('VH', id)).toThrow(RangeError);
  });
});

describe('parseReference', () => {
  it('accepts its own prefix, trims, and normalizes the padding', () => {
    expect(parseReference('VH-0087', 'VH')).toBe('VH-0087');
    expect(parseReference(' VH-00087 ', 'VH')).toBe('VH-0087');
    expect(parseReference('VH-12345', 'VH')).toBe('VH-12345');
  });

  it('rejects other prefixes, zero, short numbers and non-strings', () => {
    for (const value of ['AK-0087', 'VH-0000', 'VH-87', 'vh-0087', 'VH-0087x', '', null, 87]) {
      expect(parseReference(value, 'VH')).toBeNull();
    }
  });
});
```

- [ ] **Step 2: Futtatás, bukik**

Run: `npx vitest run src/domain/reference.test.ts`
Expected: FAIL (`Failed to resolve import "./reference"`).

- [ ] **Step 3: Megvalósítás**

`src/domain/reference.ts`:

```ts
// Short reference numbers the customer can read out on the phone: "AK-0142" (quote request), "VH-0087"
// (callback request). The number is the row's id in its own D1 table, padded to at least four digits
// (docs/superpowers/specs/2026-10-08-weboldal-mukodesi-elvek-design.md, 4.2).

export type ReferencePrefix = 'AK' | 'VH';

const MIN_DIGITS = 4;

/** "VH-0087" from the prefix "VH" and the id 87. */
export function formatReference(prefix: ReferencePrefix, id: number): string {
  if (!Number.isSafeInteger(id) || id < 1) throw new RangeError(`Invalid reference id: ${id}`);
  return `${prefix}-${String(id).padStart(MIN_DIGITS, '0')}`;
}

/** The reference in `value` when it is one of `prefix` (normalized, "VH-0087"), otherwise null. */
export function parseReference(value: unknown, prefix: ReferencePrefix): string | null {
  if (typeof value !== 'string') return null;
  const match = new RegExp(`^${prefix}-(\\d{${MIN_DIGITS},9})$`).exec(value.trim());
  if (!match?.[1]) return null;
  const id = Number(match[1]);
  return id >= 1 ? formatReference(prefix, id) : null;
}
```

- [ ] **Step 4: Futtatás, zöld**

Run: `npx vitest run src/domain/reference.test.ts`
Expected: PASS (4 teszt).

- [ ] **Step 5: A séma tesztje**

`src/domain/schemas.test.ts`: az import-listába (a `./schemas` blokkba) kerül `CallbackRequestSchema, callbackJobTypeName, formSource,`; a fájl végére:

```ts
describe('CallbackRequestSchema', () => {
  it('keeps the name and phone, and drops empty optional fields', () => {
    expect(
      CallbackRequestSchema.parse({ name: ' Kiss Péter ', phone: '06 70 123 4567', jobType: '', message: '  ', source: '/visszahivas' }),
    ).toEqual({ name: 'Kiss Péter', phone: '06 70 123 4567', source: '/visszahivas' });
  });

  it('accepts a quote type or "nem-tudom" as the job type', () => {
    const base = { name: 'Kiss Péter', phone: '+36 70 123 4567' };
    expect(CallbackRequestSchema.parse({ ...base, jobType: 'autofoliazas' }).jobType).toBe('autofoliazas');
    expect(CallbackRequestSchema.parse({ ...base, jobType: 'nem-tudom' }).jobType).toBe('nem-tudom');
  });

  it('says in Hungarian what is missing or wrong', () => {
    expect(issuesOf(CallbackRequestSchema, { name: '', phone: '123', jobType: 'urhajo', message: 'x'.repeat(301) })).toEqual([
      ['name', 'Adja meg a nevét.'],
      ['phone', 'Kérjük, érvényes telefonszámot adjon meg, például +36 70 123 4567.'],
      ['jobType', 'Válasszon a listából.'],
      ['message', 'Legfeljebb 300 karakter lehet.'],
    ]);
  });

  it('drops a source that is not a path of the site', () => {
    const base = { name: 'Kiss Péter', phone: '+36701234567' };
    for (const source of ['https://example.com', '//example.com', 'javascript:alert(1)', '/a b', 42]) {
      expect(CallbackRequestSchema.parse({ ...base, source }).source).toBeUndefined();
    }
    expect(CallbackRequestSchema.parse({ ...base, source: '/kapcsolat#visszahivas' }).source).toBe('/kapcsolat#visszahivas');
  });
});

describe('callback job types', () => {
  it('names the quote types as the catalog does, and the unsure answer in the first person', () => {
    expect(callbackJobTypeName('ceger')).toBe('Cégér, reklámtábla');
    expect(callbackJobTypeName('nem-tudom')).toBe('Még nem tudom');
  });

  it('accepts only paths of the site as a form source', () => {
    expect(formSource('/visszahivas')).toBe('/visszahivas');
    expect(formSource(`/${'a'.repeat(200)}`)).toBeUndefined();
  });
});
```

- [ ] **Step 6: Futtatás, bukik**

Run: `npx vitest run src/domain/schemas.test.ts`
Expected: FAIL (`CallbackRequestSchema` nincs exportálva / undefined).

- [ ] **Step 7: Megvalósítás**

`src/domain/schemas.ts` (a szükséges `QUOTE_TYPE_IDS` és `getQuoteType` már importálva van): az `AddressSchema` blokk után, a `// ─── Order ───` előtt:

```ts
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
    source: z.unknown().transform(formSource),
  },
  { error: 'Érvénytelen visszahívás-kérés.' },
);
```

A fájl végén, a típusok között: `export type CallbackRequest = z.output<typeof CallbackRequestSchema>;`

- [ ] **Step 8: Futtatás, zöld**

Run: `npx vitest run src/domain`
Expected: PASS (minden domain-teszt). Ha a `toEqual` az első tesztben a `jobType`/`message` `undefined` kulcsai miatt bukna: a `toEqual` figyelmen kívül hagyja az `undefined` értékű kulcsokat, tehát nem bukhat; ha mégis, a várt objektumba kerüljön `jobType: undefined, message: undefined`.

- [ ] **Step 9: Commit**

```bash
git add src/domain/reference.ts src/domain/reference.test.ts src/domain/schemas.ts src/domain/schemas.test.ts
git -c user.name=Claude -c user.email=noreply@anthropic.com commit -m "Add the callback request schema and phone-friendly reference numbers" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: A tábla és a D1-tároló

**Files:**
- Create: `migrations/0001_callback_requests.sql`, `src/server/callback/store.ts`, `src/server/callback/d1-store.ts`, `src/server/callback/d1-store.test.ts`

**Interfaces:**
- Consumes: `CallbackRequest`, `CallbackJobTypeId`, `isCallbackJobTypeId` (1. feladat).
- Produces:
  - `interface StoredCallback { id: number; name: string; phone: string; jobType?: CallbackJobTypeId; message?: string; source?: string; createdAt: string }`
  - `interface NewCallback extends CallbackRequest { formToken: string; createdAt: string }`
  - `interface CallbackStore { insert(r: NewCallback): Promise<number>; claimForNotification(id: number, now: Date): Promise<StoredCallback | null>; markNotified(id: number, now: Date): Promise<void>; recordNotificationFailure(id: number, error: string): Promise<void>; pendingNotificationIds(now: Date): Promise<number[]> }`
  - `NOTIFY_LEASE_MS = 300_000`, `NOTIFY_WINDOW_MS = 86_400_000`
  - `d1CallbackStore(db: D1Database): CallbackStore`

- [ ] **Step 1: A migráció**

`migrations/0001_callback_requests.sql`:

```sql
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
```

- [ ] **Step 2: A tároló interfésze**

`src/server/callback/store.ts`:

```ts
// Where callback requests are kept, as an interface: the pages use the D1 version (d1-store.ts), the tests a fake.
import type { CallbackJobTypeId, CallbackRequest } from '@/domain/schemas';

/** A saved callback request. Its reference is formatReference('VH', id). */
export interface StoredCallback {
  id: number;
  name: string;
  phone: string;
  jobType?: CallbackJobTypeId;
  message?: string;
  source?: string;
  /** ISO timestamp (UTC). */
  createdAt: string;
}

/** A request to save: the checked form plus its one-time token and the time it arrived. */
export interface NewCallback extends CallbackRequest {
  formToken: string;
  createdAt: string;
}

export interface CallbackStore {
  /** Saves the request and returns its id; a second call with the same form token saves nothing and returns the first id. */
  insert(request: NewCallback): Promise<number>;
  /** Takes the request for notifying when its e-mail has not gone out and nobody tried in the last 5 minutes; null otherwise. */
  claimForNotification(id: number, now: Date): Promise<StoredCallback | null>;
  markNotified(id: number, now: Date): Promise<void>;
  recordNotificationFailure(id: number, error: string): Promise<void>;
  /** Requests still waiting for their e-mail, created in the last 24 hours, oldest first (at most 50). */
  pendingNotificationIds(now: Date): Promise<number[]>;
}

/** How long a claim blocks other senders. */
export const NOTIFY_LEASE_MS = 5 * 60_000;
/** How long the cron keeps retrying a request's e-mail. */
export const NOTIFY_WINDOW_MS = 24 * 60 * 60_000;
```

- [ ] **Step 3: A D1-tároló tesztje**

`src/server/callback/d1-store.test.ts`:

```ts
// Runs against a real, in-memory D1 (wrangler's getPlatformProxy reads wrangler.jsonc and starts a local runtime).
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { getPlatformProxy } from 'wrangler';
import { d1CallbackStore } from './d1-store';
import type { NewCallback } from './store';

const MIGRATION = readFileSync(new URL('../../../migrations/0001_callback_requests.sql', import.meta.url), 'utf8');
const STATEMENTS = MIGRATION.replace(/--[^\n]*/g, '')
  .split(';')
  .map((statement) => statement.trim())
  .filter(Boolean);

let proxy: Awaited<ReturnType<typeof getPlatformProxy<Env>>>;
let db: D1Database;

beforeAll(async () => {
  proxy = await getPlatformProxy<Env>({ persist: false });
  db = proxy.env.DB;
}, 60_000);

afterAll(async () => {
  await proxy?.dispose();
});

beforeEach(async () => {
  await db.prepare('DROP TABLE IF EXISTS callback_requests').run();
  await db.batch(STATEMENTS.map((statement) => db.prepare(statement)));
});

const T0 = new Date('2026-10-08T10:00:00.000Z');
const minutes = (n: number) => new Date(T0.getTime() + n * 60_000);

function request(token: string, extra: Partial<NewCallback> = {}): NewCallback {
  return { name: 'Kiss Péter', phone: '+36 70 123 4567', formToken: token, createdAt: T0.toISOString(), ...extra };
}

describe('d1CallbackStore', () => {
  it('numbers the requests and saves a resubmitted form only once', async () => {
    const store = d1CallbackStore(db);
    const first = await store.insert(request('a'));
    const second = await store.insert(request('b'));
    expect(second).toBe(first + 1);
    expect(await store.insert(request('a', { name: 'Másik Név' }))).toBe(first);
    const { results } = await db.prepare('SELECT name FROM callback_requests ORDER BY id').all<{ name: string }>();
    expect(results.map((row) => row.name)).toEqual(['Kiss Péter', 'Kiss Péter']);
  });

  it('gives a request to one sender at a time, again after the lease, never after it was sent', async () => {
    const store = d1CallbackStore(db);
    const id = await store.insert(request('a', { jobType: 'ceger', message: 'Homlokzati tábla', source: '/visszahivas' }));
    expect(await store.claimForNotification(id, T0)).toEqual({
      id,
      name: 'Kiss Péter',
      phone: '+36 70 123 4567',
      jobType: 'ceger',
      message: 'Homlokzati tábla',
      source: '/visszahivas',
      createdAt: T0.toISOString(),
    });
    expect(await store.claimForNotification(id, minutes(4))).toBeNull();
    expect(await store.claimForNotification(id, minutes(6))).not.toBeNull();
    await store.markNotified(id, minutes(6));
    expect(await store.claimForNotification(id, minutes(20))).toBeNull();
  });

  it('lists the unsent requests of the last 24 hours, oldest first', async () => {
    const store = d1CallbackStore(db);
    const old = await store.insert(request('old', { createdAt: minutes(-25 * 60).toISOString() }));
    const sent = await store.insert(request('sent'));
    const waiting = await store.insert(request('waiting', { createdAt: minutes(1).toISOString() }));
    const earlier = await store.insert(request('earlier', { createdAt: minutes(-60).toISOString() }));
    await store.markNotified(sent, T0);
    const pending = await store.pendingNotificationIds(minutes(2));
    expect(pending).toEqual([earlier, waiting]);
    expect(pending).not.toContain(old);
  });

  it('keeps the last error of a failed e-mail', async () => {
    const store = d1CallbackStore(db);
    const id = await store.insert(request('a'));
    await store.claimForNotification(id, T0);
    await store.recordNotificationFailure(id, 'SMTP 451');
    const row = await db
      .prepare('SELECT notify_attempts, notify_last_error FROM callback_requests WHERE id = ?')
      .bind(id)
      .first<{ notify_attempts: number; notify_last_error: string }>();
    expect(row).toEqual({ notify_attempts: 1, notify_last_error: 'SMTP 451' });
  });
});
```

- [ ] **Step 4: Futtatás, bukik**

Run: `npx vitest run src/server/callback/d1-store.test.ts`
Expected: FAIL (`Failed to resolve import "./d1-store"`).

- [ ] **Step 5: Megvalósítás**

`src/server/callback/d1-store.ts`:

```ts
// The callback requests in D1 (table callback_requests, migrations/0001_callback_requests.sql).
import { isCallbackJobTypeId } from '@/domain/schemas';
import { NOTIFY_LEASE_MS, NOTIFY_WINDOW_MS, type CallbackStore, type StoredCallback } from './store';

interface CallbackRow {
  id: number;
  name: string;
  phone: string;
  job_type: string | null;
  message: string | null;
  source: string | null;
  created_at: string;
}

const COLUMNS = 'id, name, phone, job_type, message, source, created_at';

function toStored(row: CallbackRow): StoredCallback {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    jobType: isCallbackJobTypeId(row.job_type) ? row.job_type : undefined,
    message: row.message ?? undefined,
    source: row.source ?? undefined,
    createdAt: row.created_at,
  };
}

const isoBefore = (now: Date, ms: number) => new Date(now.getTime() - ms).toISOString();

export function d1CallbackStore(db: D1Database): CallbackStore {
  return {
    async insert(request) {
      const inserted = await db
        .prepare(
          'INSERT INTO callback_requests (form_token, name, phone, job_type, message, source, created_at) ' +
            'VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT (form_token) DO NOTHING RETURNING id',
        )
        .bind(
          request.formToken,
          request.name,
          request.phone,
          request.jobType ?? null,
          request.message ?? null,
          request.source ?? null,
          request.createdAt,
        )
        .first<{ id: number }>();
      if (inserted) return inserted.id;
      const existing = await db
        .prepare('SELECT id FROM callback_requests WHERE form_token = ?')
        .bind(request.formToken)
        .first<{ id: number }>();
      if (!existing) throw new Error('The callback request was neither saved nor found.');
      return existing.id;
    },

    async claimForNotification(id, now) {
      const row = await db
        .prepare(
          'UPDATE callback_requests SET notify_attempts = notify_attempts + 1, notify_last_attempt_at = ? ' +
            'WHERE id = ? AND notified_at IS NULL AND (notify_last_attempt_at IS NULL OR notify_last_attempt_at < ?) ' +
            `RETURNING ${COLUMNS}`,
        )
        .bind(now.toISOString(), id, isoBefore(now, NOTIFY_LEASE_MS))
        .first<CallbackRow>();
      return row ? toStored(row) : null;
    },

    async markNotified(id, now) {
      await db
        .prepare('UPDATE callback_requests SET notified_at = ?, notify_last_error = NULL WHERE id = ?')
        .bind(now.toISOString(), id)
        .run();
    },

    async recordNotificationFailure(id, error) {
      await db
        .prepare('UPDATE callback_requests SET notify_last_error = ? WHERE id = ?')
        .bind(error.slice(0, 500), id)
        .run();
    },

    async pendingNotificationIds(now) {
      const { results } = await db
        .prepare('SELECT id FROM callback_requests WHERE notified_at IS NULL AND created_at >= ? ORDER BY created_at, id LIMIT 50')
        .bind(isoBefore(now, NOTIFY_WINDOW_MS))
        .all<{ id: number }>();
      return results.map((row) => row.id);
    },
  };
}
```

A sorrend az időrend (`ORDER BY created_at`), ezért a 3. teszt az `earlier` (−60 perc) kérést várja a `waiting` (+1 perc) előtt.

- [ ] **Step 6: Futtatás, zöld**

Run: `npx vitest run src/server/callback/d1-store.test.ts`
Expected: PASS (4 teszt), az első futás a helyi runtime indulása miatt néhány másodperc.

- [ ] **Step 7: Helyi adatbázis**

Run: `npm run db:migrate:local`
Expected: `0001_callback_requests.sql ✅`.

- [ ] **Step 8: Commit**

```bash
git add migrations/0001_callback_requests.sql src/server/callback/store.ts src/server/callback/d1-store.ts src/server/callback/d1-store.test.ts
git -c user.name=Claude -c user.email=noreply@anthropic.com commit -m "Store callback requests in D1, once per form, with a lease for sending" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Értesítés a műhelynek

**Files:**
- Create: `src/server/notify/mailer.ts`, `src/server/notify/mailer.test.ts`, `src/server/callback/email.ts`, `src/server/callback/email.test.ts`, `src/server/callback/notify.ts`, `src/server/callback/notify.test.ts`

**Interfaces:**
- Consumes: `StoredCallback`, `CallbackStore` (2. feladat), `formatReference`, `callbackJobTypeName` (1. feladat), `BUSINESS_TIME_ZONE` (`src/domain/catalog.ts`).
- Produces:
  - `interface OutgoingEmail { to: string; subject: string; text: string; html: string; replyTo?: string }`, `interface Mailer { send(email: OutgoingEmail): Promise<void> }`, `logMailer(log?: (line: string) => void): Mailer`, `bindingMailer(binding: Pick<SendEmail, 'send'>, from: string): Mailer`, `mailerFor(env: { EMAIL?: Pick<SendEmail, 'send'>; NOTIFY_FROM_EMAIL?: string }): Mailer`
  - `callbackEmail(request: StoredCallback, to: string): OutgoingEmail`, `budapestDateTime(iso: string): string`
  - `interface NotifyDeps { store: CallbackStore; mailer: Mailer; to: string; now: () => Date; logError?: (message: string) => void }`, `notifyCallback(id: number, deps: NotifyDeps): Promise<'sent' | 'skipped' | 'failed'>`, `deliverPendingCallbacks(deps: NotifyDeps): Promise<{ sent: number; failed: number }>`

- [ ] **Step 1: A levélküldők tesztje**

`src/server/notify/mailer.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { bindingMailer, logMailer, mailerFor, type OutgoingEmail } from './mailer';

const EMAIL: OutgoingEmail = { to: 'muhely@example.com', subject: '[VH-0001] Visszahívás – Kiss Péter', text: 'Szöveg', html: '<p>Szöveg</p>' };

describe('mailers', () => {
  it('writes the e-mail to the log when there is no sending binding', async () => {
    const log = vi.fn();
    await logMailer(log).send(EMAIL);
    expect(log).toHaveBeenCalledWith('[értesítés → muhely@example.com] [VH-0001] Visszahívás – Kiss Péter\nSzöveg');
  });

  it('sends through the binding from the site address, with the reply-to when given', async () => {
    const send = vi.fn().mockResolvedValue({ messageId: 'x' });
    await bindingMailer({ send }, 'ertesito@stiletdekor.hu').send({ ...EMAIL, replyTo: 'ugyfel@example.com' });
    expect(send).toHaveBeenCalledWith({
      from: { email: 'ertesito@stiletdekor.hu', name: 'Stilet Dekor weboldal' },
      to: 'muhely@example.com',
      subject: EMAIL.subject,
      text: 'Szöveg',
      html: '<p>Szöveg</p>',
      replyTo: 'ugyfel@example.com',
    });
  });

  it('uses the binding only when both it and the sender address are configured', async () => {
    const send = vi.fn().mockResolvedValue({ messageId: 'x' });
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    await mailerFor({ EMAIL: { send }, NOTIFY_FROM_EMAIL: '' }).send(EMAIL);
    expect(send).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledOnce();
    await mailerFor({ EMAIL: { send }, NOTIFY_FROM_EMAIL: 'ertesito@stiletdekor.hu' }).send(EMAIL);
    expect(send).toHaveBeenCalledOnce();
    info.mockRestore();
  });
});
```

- [ ] **Step 2: A levél tesztje**

`src/server/callback/email.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { budapestDateTime, callbackEmail } from './email';

describe('budapestDateTime', () => {
  it('shows the time in Budapest, summer and winter', () => {
    expect(budapestDateTime('2026-10-08T12:05:00.000Z')).toBe('2026. 10. 08. 14:05');
    expect(budapestDateTime('2026-12-01T07:30:00.000Z')).toBe('2026. 12. 01. 08:30');
  });
});

describe('callbackEmail', () => {
  const request = {
    id: 87,
    name: 'Kiss Péter',
    phone: '06 70 123 4567',
    jobType: 'autofoliazas' as const,
    message: 'A kisbuszunkra kellene <felirat>.',
    source: '/visszahivas',
    createdAt: '2026-10-08T12:05:00.000Z',
  };

  it('puts the reference, the job and the name in the subject', () => {
    expect(callbackEmail(request, 'muhely@example.com')).toMatchObject({
      to: 'muhely@example.com',
      subject: '[VH-0087] Visszahívás – Kiss Péter',
    });
  });

  it('lists every given answer in the text', () => {
    expect(callbackEmail(request, 'm@example.com').text).toBe(
      [
        'Visszahívást kértek a weboldalon.',
        '',
        'Hivatkozási szám: VH-0087',
        'Név: Kiss Péter',
        'Telefon: 06 70 123 4567',
        'Munka típusa: Autófóliázás, flotta-dekor',
        'Röviden: A kisbuszunkra kellene <felirat>.',
        'Honnan: /visszahivas',
        'Beérkezett: 2026. 10. 08. 14:05',
      ].join('\n'),
    );
  });

  it('leaves out the unanswered fields, makes the phone clickable and escapes the HTML', () => {
    const { text, html } = callbackEmail({ ...request, jobType: undefined, message: undefined, source: undefined }, 'm@example.com');
    expect(text).not.toContain('Munka típusa');
    expect(text).not.toContain('Röviden');
    expect(html).toContain('<a href="tel:06701234567">06 70 123 4567</a>');
    expect(callbackEmail(request, 'm@example.com').html).toContain('A kisbuszunkra kellene &lt;felirat&gt;.');
  });

  it('keeps the subject on one line whatever the name holds', () => {
    expect(callbackEmail({ ...request, name: 'Kiss\r\nBcc: x@example.com' }, 'm@example.com').subject).toBe(
      '[VH-0087] Visszahívás – Kiss Bcc: x@example.com',
    );
  });
});
```

- [ ] **Step 3: Az értesítés tesztje**

`src/server/callback/notify.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import type { Mailer, OutgoingEmail } from '../notify/mailer';
import { deliverPendingCallbacks, notifyCallback } from './notify';
import type { CallbackStore, StoredCallback } from './store';

const NOW = new Date('2026-10-08T12:05:00.000Z');

function fakeStore(requests: StoredCallback[]) {
  const claimed = new Set<number>();
  const sent = new Set<number>();
  const failures: [number, string][] = [];
  const store: CallbackStore = {
    insert: vi.fn(),
    async claimForNotification(id) {
      if (claimed.has(id) || sent.has(id)) return null;
      claimed.add(id);
      return requests.find((r) => r.id === id) ?? null;
    },
    async markNotified(id) {
      sent.add(id);
    },
    async recordNotificationFailure(id, error) {
      failures.push([id, error]);
    },
    async pendingNotificationIds() {
      return requests.map((r) => r.id).filter((id) => !sent.has(id));
    },
  };
  return { store, sent, failures };
}

const request = (id: number): StoredCallback => ({ id, name: 'Kiss Péter', phone: '+36 70 123 4567', createdAt: NOW.toISOString() });

describe('notifyCallback', () => {
  it('sends the e-mail once and marks the request sent', async () => {
    const { store, sent } = fakeStore([request(1)]);
    const outbox: OutgoingEmail[] = [];
    const mailer: Mailer = { send: async (email) => void outbox.push(email) };
    const deps = { store, mailer, to: 'muhely@example.com', now: () => NOW };
    expect(await notifyCallback(1, deps)).toBe('sent');
    expect(await notifyCallback(1, deps)).toBe('skipped');
    expect(outbox.map((email) => email.subject)).toEqual(['[VH-0001] Visszahívás – Kiss Péter']);
    expect(sent.has(1)).toBe(true);
  });

  it('records a failed send and logs it as an error', async () => {
    const { store, sent, failures } = fakeStore([request(2)]);
    const logError = vi.fn();
    const mailer: Mailer = { send: async () => Promise.reject(new Error('quota')) };
    expect(await notifyCallback(2, { store, mailer, to: 'm@example.com', now: () => NOW, logError })).toBe('failed');
    expect(sent.has(2)).toBe(false);
    expect(failures).toEqual([[2, 'quota']]);
    expect(logError).toHaveBeenCalledWith('A visszahívás értesítése nem ment ki (VH-0002): quota');
  });
});

describe('deliverPendingCallbacks', () => {
  it('tries every waiting request and counts the results', async () => {
    const { store } = fakeStore([request(1), request(2), request(3)]);
    const mailer: Mailer = {
      send: async (email) => {
        if (email.subject.startsWith('[VH-0002]')) throw new Error('down');
      },
    };
    const result = await deliverPendingCallbacks({ store, mailer, to: 'm@example.com', now: () => NOW, logError: () => {} });
    expect(result).toEqual({ sent: 2, failed: 1 });
  });
});
```

- [ ] **Step 4: Futtatás, bukik**

Run: `npx vitest run src/server/notify src/server/callback/email.test.ts src/server/callback/notify.test.ts`
Expected: FAIL (a modulok még nem léteznek).

- [ ] **Step 5: A levélküldők**

`src/server/notify/mailer.ts`:

```ts
// How the site's e-mails leave: through the Workers send_email binding (Cloudflare Email Service) once the
// stiletdekor.hu domain is on Cloudflare, and into the log until then (README, "Értesítő e-mailek").

/** An e-mail to the workshop. */
export interface OutgoingEmail {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}

export interface Mailer {
  send(email: OutgoingEmail): Promise<void>;
}

/** Writes the e-mail to the log instead of sending it: local development, and deployments without the binding. */
export function logMailer(log: (line: string) => void = (line) => console.info(line)): Mailer {
  return {
    async send(email) {
      log(`[értesítés → ${email.to}] ${email.subject}\n${email.text}`);
    },
  };
}

/** Sends through the send_email binding; `from` must be an address on a domain onboarded to Email Service. */
export function bindingMailer(binding: Pick<SendEmail, 'send'>, from: string): Mailer {
  return {
    async send(email) {
      await binding.send({
        from: { email: from, name: 'Stilet Dekor weboldal' },
        to: email.to,
        subject: email.subject,
        text: email.text,
        html: email.html,
        ...(email.replyTo ? { replyTo: email.replyTo } : {}),
      });
    },
  };
}

/** The mailer this deployment can use: the binding when it and the sender address are configured, else the log. */
export function mailerFor(env: { EMAIL?: Pick<SendEmail, 'send'>; NOTIFY_FROM_EMAIL?: string }): Mailer {
  return env.EMAIL && env.NOTIFY_FROM_EMAIL ? bindingMailer(env.EMAIL, env.NOTIFY_FROM_EMAIL) : logMailer();
}
```

- [ ] **Step 6: A levél összeállítása**

`src/server/callback/email.ts`:

```ts
// The workshop's e-mail about a callback request: everything needed to call back, the phone number clickable.
import { BUSINESS_TIME_ZONE } from '@/domain/catalog';
import { formatReference } from '@/domain/reference';
import { callbackJobTypeName } from '@/domain/schemas';
import type { OutgoingEmail } from '../notify/mailer';
import type { StoredCallback } from './store';

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

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const oneLine = (value: string) => value.replace(/\s+/g, ' ').trim();

export function callbackEmail(request: StoredCallback, to: string): OutgoingEmail {
  const reference = formatReference('VH', request.id);
  const rows: [label: string, value: string][] = [
    ['Hivatkozási szám', reference],
    ['Név', request.name],
    ['Telefon', request.phone],
  ];
  if (request.jobType) rows.push(['Munka típusa', callbackJobTypeName(request.jobType)]);
  if (request.message) rows.push(['Röviden', request.message]);
  if (request.source) rows.push(['Honnan', request.source]);
  rows.push(['Beérkezett', budapestDateTime(request.createdAt)]);

  const telHref = `tel:${request.phone.replace(/[\s\-()./]/g, '')}`;
  const cell = (label: string, value: string) =>
    label === 'Telefon' ? `<a href="${escapeHtml(telHref)}">${escapeHtml(value)}</a>` : escapeHtml(value);
  const html =
    '<p>Visszahívást kértek a weboldalon.</p><table>' +
    rows
      .map(([label, value]) => `<tr><th align="left" style="padding:4px 12px 4px 0">${escapeHtml(label)}</th><td>${cell(label, value)}</td></tr>`)
      .join('') +
    '</table>';

  return {
    to,
    subject: oneLine(`[${reference}] Visszahívás – ${request.name}`),
    text: ['Visszahívást kértek a weboldalon.', '', ...rows.map(([label, value]) => `${label}: ${value}`)].join('\n'),
    html,
  };
}
```

- [ ] **Step 7: Az értesítés**

`src/server/callback/notify.ts`:

```ts
// Sends the workshop's e-mail about a callback request. Right after the request (waitUntil) and from the cron;
// the store's claim makes sure the two never send the same e-mail twice.
import { formatReference } from '@/domain/reference';
import type { Mailer } from '../notify/mailer';
import { callbackEmail } from './email';
import type { CallbackStore } from './store';

export interface NotifyDeps {
  store: CallbackStore;
  mailer: Mailer;
  /** The workshop's address (ORDER_NOTIFY_EMAIL). */
  to: string;
  now: () => Date;
  /** Where failures are reported; console.error by default (Cloudflare groups them under Issues). */
  logError?: (message: string) => void;
}

export async function notifyCallback(id: number, deps: NotifyDeps): Promise<'sent' | 'skipped' | 'failed'> {
  const request = await deps.store.claimForNotification(id, deps.now());
  if (!request) return 'skipped';
  try {
    await deps.mailer.send(callbackEmail(request, deps.to));
    await deps.store.markNotified(id, deps.now());
    return 'sent';
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await deps.store.recordNotificationFailure(id, message);
    (deps.logError ?? ((line: string) => console.error(line)))(
      `A visszahívás értesítése nem ment ki (${formatReference('VH', id)}): ${message}`,
    );
    return 'failed';
  }
}

/** The cron's job: retries every request whose e-mail has not gone out, within 24 hours of its arrival. */
export async function deliverPendingCallbacks(deps: NotifyDeps): Promise<{ sent: number; failed: number }> {
  const result = { sent: 0, failed: 0 };
  for (const id of await deps.store.pendingNotificationIds(deps.now())) {
    const outcome = await notifyCallback(id, deps);
    if (outcome === 'sent') result.sent += 1;
    if (outcome === 'failed') result.failed += 1;
  }
  return result;
}
```

- [ ] **Step 8: Futtatás, zöld**

Run: `npx vitest run src/server`
Expected: PASS. Ha a `SendEmail` típus nem ismert a tesztben: a `worker-configuration.d.ts` a `tsconfig` része, a Vitest típust nem ellenőriz; a `npm run check` igen – ott kell zöldnek lennie.

- [ ] **Step 9: Commit**

```bash
git add src/server/notify src/server/callback/email.ts src/server/callback/email.test.ts src/server/callback/notify.ts src/server/callback/notify.test.ts
git -c user.name=Claude -c user.email=noreply@anthropic.com commit -m "E-mail the workshop about each callback request, retrying until it goes out" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Egy beküldés feldolgozása

**Files:**
- Create: `src/server/callback/submit.ts`, `src/server/callback/submit.test.ts`

**Interfaces:**
- Consumes: `CallbackRequestSchema`, `CALLBACK_FORM_FIELDS`, `CallbackFormValues`, `CallbackFormErrors`, `formSource` (1.), `formatReference` (1.), `CallbackStore` (2.), `COMPANY` (`src/domain/company.ts`).
- Produces:
  - `HONEYPOT_FIELD = 'honlap'`, `THANKS_PATH = '/visszahivas/koszonjuk'`
  - `type AcceptedCallback = { kind: 'accepted'; location: string; id: number | null }`
  - `type RejectedCallback = { kind: 'rejected'; status: 400 | 429 | 503; values: CallbackFormValues; errors: CallbackFormErrors; formError?: string; token: string; source?: string }`
  - `type CallbackSubmission = AcceptedCallback | RejectedCallback`
  - `interface SubmitDeps { store: CallbackStore; allow: () => Promise<boolean>; now: () => Date; newToken: () => string }`
  - `submitCallback(form: FormData, deps: SubmitDeps): Promise<CallbackSubmission>`
  - `limiterAllows(limiter: Pick<RateLimit, 'limit'> | undefined, key: string): Promise<boolean>`

- [ ] **Step 1: Teszt**

`src/server/callback/submit.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import type { CallbackStore, NewCallback } from './store';
import { limiterAllows, submitCallback, type SubmitDeps } from './submit';

const TOKEN = '3f8a2b6c-1d4e-4f5a-9b7c-0e1d2c3b4a59';
const NEW_TOKEN = '9c1d2e3f-4a5b-4c6d-8e7f-a0b1c2d3e4f5';
const NOW = new Date('2026-10-08T12:05:00.000Z');

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

function deps(overrides: Partial<SubmitDeps> = {}) {
  const saved: NewCallback[] = [];
  const store = {
    insert: vi.fn(async (request: NewCallback) => {
      saved.push(request);
      return 87;
    }),
  } as unknown as CallbackStore;
  return { saved, deps: { store, allow: async () => true, now: () => NOW, newToken: () => NEW_TOKEN, ...overrides } };
}

const VALID = { name: 'Kiss Péter', phone: '06 70 123 4567', jobType: 'ceger', message: '', source: '/visszahivas', token: TOKEN };

describe('submitCallback', () => {
  it('saves a valid request and sends the visitor to the thank-you page with the reference', async () => {
    const { saved, deps: d } = deps();
    expect(await submitCallback(form(VALID), d)).toEqual({ kind: 'accepted', location: '/visszahivas/koszonjuk?szam=VH-0087', id: 87 });
    expect(saved).toEqual([
      { name: 'Kiss Péter', phone: '06 70 123 4567', jobType: 'ceger', source: '/visszahivas', formToken: TOKEN, createdAt: NOW.toISOString() },
    ]);
  });

  it('gives a missing or forged token a fresh one', async () => {
    const { saved, deps: d } = deps();
    await submitCallback(form({ ...VALID, token: 'nem-uuid' }), d);
    expect(saved[0]?.formToken).toBe(NEW_TOKEN);
  });

  it('pretends to accept a filled trap field, and saves nothing', async () => {
    const { saved, deps: d } = deps();
    expect(await submitCallback(form({ ...VALID, honlap: 'http://spam.example' }), d)).toEqual({
      kind: 'accepted',
      location: '/visszahivas/koszonjuk',
      id: null,
    });
    expect(saved).toEqual([]);
  });

  it('sends the form back with the messages and what was typed', async () => {
    const { saved, deps: d } = deps();
    const result = await submitCallback(form({ ...VALID, name: '', phone: '123' }), d);
    expect(result).toEqual({
      kind: 'rejected',
      status: 400,
      values: { name: '', phone: '123', jobType: 'ceger', message: '' },
      errors: { name: 'Adja meg a nevét.', phone: 'Kérjük, érvényes telefonszámot adjon meg, például +36 70 123 4567.' },
      token: TOKEN,
      source: '/visszahivas',
    });
    expect(saved).toEqual([]);
  });

  it('refuses politely when too many requests come from one address', async () => {
    const { saved, deps: d } = deps({ allow: async () => false });
    const result = await submitCallback(form(VALID), d);
    expect(result).toMatchObject({ kind: 'rejected', status: 429, errors: {} });
    expect(result.kind === 'rejected' && result.formError).toContain('+36 70 538 5030');
    expect(saved).toEqual([]);
  });

  it('keeps what was typed and offers the phone when saving fails', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const store = { insert: vi.fn().mockRejectedValue(new Error('D1 down')) } as unknown as CallbackStore;
    const result = await submitCallback(form(VALID), { ...deps().deps, store });
    expect(result).toMatchObject({ kind: 'rejected', status: 503, values: { name: 'Kiss Péter' }, token: TOKEN });
    expect(result.kind === 'rejected' && result.formError).toBe(
      'Most nem sikerült elküldeni. Kérjük, próbálja újra, vagy hívjon: +36 70 538 5030.',
    );
    expect(error).toHaveBeenCalledOnce();
    error.mockRestore();
  });
});

describe('limiterAllows', () => {
  it('follows the limiter, and lets the request through when there is none or it fails', async () => {
    expect(await limiterAllows({ limit: async () => ({ success: false }) }, '1.2.3.4')).toBe(false);
    expect(await limiterAllows({ limit: async () => ({ success: true }) }, '1.2.3.4')).toBe(true);
    expect(await limiterAllows(undefined, '1.2.3.4')).toBe(true);
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await limiterAllows({ limit: async () => Promise.reject(new Error('x')) }, '1.2.3.4')).toBe(true);
    error.mockRestore();
  });
});
```

- [ ] **Step 2: Futtatás, bukik**

Run: `npx vitest run src/server/callback/submit.test.ts`
Expected: FAIL (`Failed to resolve import "./submit"`).

- [ ] **Step 3: Megvalósítás**

`src/server/callback/submit.ts`:

```ts
// One POST of the callback form: trap field, rate limit, the shared schema, saving. Works for plain HTML forms:
// on success the page redirects (Post/Redirect/Get), otherwise it renders the form again with this result.
import { COMPANY } from '@/domain/company';
import { formatReference } from '@/domain/reference';
import {
  CALLBACK_FORM_FIELDS,
  CallbackRequestSchema,
  type CallbackFormErrors,
  type CallbackFormValues,
  formSource,
} from '@/domain/schemas';
import type { CallbackStore } from './store';

/** A field people never see; bots fill it in. */
export const HONEYPOT_FIELD = 'honlap';
export const THANKS_PATH = '/visszahivas/koszonjuk';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TOO_MANY = `Túl sok kérés érkezett erről a címről. Kérjük, próbálja újra egy perc múlva, vagy hívjon: ${COMPANY.phone.display}.`;
const SAVE_FAILED = `Most nem sikerült elküldeni. Kérjük, próbálja újra, vagy hívjon: ${COMPANY.phone.display}.`;

export type AcceptedCallback = { kind: 'accepted'; location: string; id: number | null };
export type RejectedCallback = {
  kind: 'rejected';
  status: 400 | 429 | 503;
  values: CallbackFormValues;
  errors: CallbackFormErrors;
  formError?: string;
  token: string;
  source?: string;
};
export type CallbackSubmission = AcceptedCallback | RejectedCallback;

export interface SubmitDeps {
  store: CallbackStore;
  /** False when this visitor sent too many requests (the rate limiter). */
  allow: () => Promise<boolean>;
  now: () => Date;
  newToken: () => string;
}

export async function submitCallback(form: FormData, deps: SubmitDeps): Promise<CallbackSubmission> {
  const text = (key: string) => {
    const value = form.get(key);
    return typeof value === 'string' ? value : undefined;
  };
  const values: CallbackFormValues = Object.fromEntries(CALLBACK_FORM_FIELDS.map((field) => [field, text(field) ?? '']));
  const tokenInput = text('token');
  const token = tokenInput && UUID.test(tokenInput) ? tokenInput : deps.newToken();
  const source = formSource(text('source'));
  const rejected = (status: RejectedCallback['status'], errors: CallbackFormErrors, formError?: string): RejectedCallback => ({
    kind: 'rejected',
    status,
    values,
    errors,
    ...(formError ? { formError } : {}),
    token,
    ...(source ? { source } : {}),
  });

  if (text(HONEYPOT_FIELD)) return { kind: 'accepted', location: THANKS_PATH, id: null };
  if (!(await deps.allow())) return rejected(429, {}, TOO_MANY);

  const parsed = CallbackRequestSchema.safeParse({ ...values, source });
  if (!parsed.success) {
    const errors: CallbackFormErrors = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === 'string' && (CALLBACK_FORM_FIELDS as readonly string[]).includes(field)) {
        errors[field as keyof CallbackFormErrors] ??= issue.message;
      }
    }
    return rejected(400, errors);
  }

  let id: number;
  try {
    id = await deps.store.insert({ ...parsed.data, formToken: token, createdAt: deps.now().toISOString() });
  } catch (error) {
    console.error('A visszahívás-kérés mentése nem sikerült:', error);
    return rejected(503, {}, SAVE_FAILED);
  }
  return { kind: 'accepted', location: `${THANKS_PATH}?szam=${formatReference('VH', id)}`, id };
}

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

Megjegyzés: az 1. teszt `saved` elvárása nem tartalmaz `message` kulcsot; a séma az üres üzenetet `undefined`-dá alakítja, a `toEqual` az `undefined` kulcsot figyelmen kívül hagyja.

- [ ] **Step 4: Futtatás, zöld**

Run: `npx vitest run src/server/callback/submit.test.ts`
Expected: PASS (7 teszt).

- [ ] **Step 5: Commit**

```bash
git add src/server/callback/submit.ts src/server/callback/submit.test.ts
git -c user.name=Claude -c user.email=noreply@anthropic.com commit -m "Handle a callback form post: trap field, rate limit, schema, saving" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: A visszahívó űrlap komponense

**Files:**
- Create: `src/ui/CallbackForm/CallbackForm.tsx`, `src/ui/CallbackForm/CallbackForm.css`, `src/ui/CallbackForm/CallbackForm.test.tsx`, `.design-sync/previews/CallbackForm.tsx`
- Modify: `src/ui/index.ts` (export), `src/ui/navigation.ts` (`CALLBACK_HREF`)

**Interfaces:**
- Consumes: `CALLBACK_JOB_TYPE_IDS`, `callbackJobTypeName`, `CALLBACK_FORM_FIELDS`, `CallbackFormValues`, `CallbackFormErrors`, `MAX_CALLBACK_MESSAGE_LENGTH` (1.); `HONEYPOT_FIELD` értéke `'honlap'` (a UI nem importál a `src/server`-ből, ezért a komponensben is `'honlap'` áll, a teszt ellenőrzi az egyezést).
- Produces: `CallbackForm(props: CallbackFormProps)`, `CALLBACK_HREF = '/visszahivas'`.

- [ ] **Step 1: Teszt**

`src/ui/CallbackForm/CallbackForm.test.tsx`:

```tsx
/** @vitest-environment jsdom */
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { QUOTE_TYPES } from '@/domain/catalog';
import { HONEYPOT_FIELD } from '@/server/callback/submit';
import { CallbackForm } from './CallbackForm';

const TOKEN = '3f8a2b6c-1d4e-4f5a-9b7c-0e1d2c3b4a59';

describe('CallbackForm', () => {
  it('posts to /visszahivas with the token, the source, and the four fields', () => {
    const { container } = render(<CallbackForm token={TOKEN} source="/kapcsolat#visszahivas" />);
    const form = container.querySelector('form')!;
    expect(form.getAttribute('method')).toBe('post');
    expect(form.getAttribute('action')).toBe('/visszahivas');
    expect(container.querySelector<HTMLInputElement>('input[name="token"]')!.value).toBe(TOKEN);
    expect(container.querySelector<HTMLInputElement>('input[name="source"]')!.value).toBe('/kapcsolat#visszahivas');
    const name = screen.getByLabelText(/^Név/) as HTMLInputElement;
    expect(name.required).toBe(true);
    expect(name.getAttribute('autocomplete')).toBe('name');
    const phone = screen.getByLabelText(/^Telefonszám/) as HTMLInputElement;
    expect([phone.type, phone.getAttribute('autocomplete'), phone.getAttribute('inputmode'), String(phone.required)]).toEqual([
      'tel',
      'tel',
      'tel',
      'true',
    ]);
    expect(screen.getByLabelText('Munka típusa (nem kötelező)').tagName).toBe('SELECT');
    expect((screen.getByLabelText('Röviden, miről van szó (nem kötelező)') as HTMLInputElement).maxLength).toBe(300);
    expect(screen.getByRole('button', { name: 'Visszahívást kérek' }).getAttribute('type')).toBe('submit');
    expect(screen.getByRole('link', { name: 'Adatkezelési tájékoztató' }).getAttribute('href')).toBe('/adatkezeles');
  });

  it('offers every quote type and "Még nem tudom"', () => {
    render(<CallbackForm token={TOKEN} />);
    const options = within(screen.getByLabelText('Munka típusa (nem kötelező)')).getAllByRole('option');
    expect(options.map((o) => o.textContent)).toEqual(['Válasszon, ha tudja', ...QUOTE_TYPES.map((t) => t.name), 'Még nem tudom']);
  });

  it('has a trap field that people never reach', () => {
    const { container } = render(<CallbackForm token={TOKEN} />);
    const trap = container.querySelector<HTMLInputElement>(`input[name="${HONEYPOT_FIELD}"]`)!;
    expect(trap.tabIndex).toBe(-1);
    expect(trap.getAttribute('autocomplete')).toBe('off');
    expect(trap.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('shows what was typed, the messages, and a summary that links to the fields', () => {
    render(
      <CallbackForm
        token={TOKEN}
        values={{ name: '', phone: '123', jobType: 'ceger', message: 'Tábla' }}
        errors={{ name: 'Adja meg a nevét.', phone: 'Kérjük, érvényes telefonszámot adjon meg.' }}
      />,
    );
    const summary = screen.getByRole('alert');
    expect(within(summary).getAllByRole('link').map((a) => [a.textContent, a.getAttribute('href')])).toEqual([
      ['Adja meg a nevét.', '#vh-name'],
      ['Kérjük, érvényes telefonszámot adjon meg.', '#vh-phone'],
    ]);
    expect((screen.getByLabelText(/^Telefonszám/) as HTMLInputElement).value).toBe('123');
    expect(screen.getByLabelText(/^Telefonszám/).getAttribute('aria-invalid')).toBe('true');
    expect((screen.getByLabelText('Munka típusa (nem kötelező)') as HTMLSelectElement).value).toBe('ceger');
  });

  it('shows a message about the whole form, and keeps two forms on a page apart', () => {
    const { container } = render(<CallbackForm token={TOKEN} idPrefix="kapcsolat" formError="Most nem sikerült elküldeni." />);
    expect(within(screen.getByRole('alert')).getByText('Most nem sikerült elküldeni.')).toBeTruthy();
    expect(container.querySelector('#kapcsolat-name')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Futtatás, bukik**

Run: `npx vitest run src/ui/CallbackForm`
Expected: FAIL (`Failed to resolve import "./CallbackForm"`).

- [ ] **Step 3: Megvalósítás**

`src/ui/navigation.ts`: a `QUOTE_HREF` alá:

```ts
/** The quick callback form. */
export const CALLBACK_HREF = '/visszahivas';
```

`src/ui/CallbackForm/CallbackForm.tsx`:

```tsx
import type { FormHTMLAttributes } from 'react';
import {
  CALLBACK_FORM_FIELDS,
  CALLBACK_JOB_TYPE_IDS,
  type CallbackFormErrors,
  type CallbackFormValues,
  callbackJobTypeName,
  MAX_CALLBACK_MESSAGE_LENGTH,
} from '@/domain/schemas';
import '../base.css';
import { Button } from '../Button/Button';
import { cx } from '../cx';
import { describedBy, Field } from '../Field/Field';
import { CALLBACK_HREF } from '../navigation';
import { Notice } from '../Notice/Notice';
import { TextField } from '../TextField/TextField';
import './CallbackForm.css';

export interface CallbackFormProps extends Omit<FormHTMLAttributes<HTMLFormElement>, 'children' | 'method'> {
  /** One-time token (a UUID) that makes a second submit of the same form harmless. */
  token: string;
  /** Where the form was placed, for measuring, e.g. "/kapcsolat#visszahivas". */
  source?: string;
  /** What the visitor typed, after an error. */
  values?: CallbackFormValues;
  /** One message per field. */
  errors?: CallbackFormErrors;
  /** A message about the whole form, e.g. that it could not be saved. */
  formError?: string;
  /** Prefix of the field ids ("vh" by default), so two forms can share a page. */
  idPrefix?: string;
}

const LABELS: Record<(typeof CALLBACK_FORM_FIELDS)[number], string> = {
  name: 'Név',
  phone: 'Telefonszám',
  jobType: 'Munka típusa (nem kötelező)',
  message: 'Röviden, miről van szó (nem kötelező)',
};

/**
 * Short callback request form: name and phone, optionally the kind of job and one sentence.
 * A plain HTML form that works without JavaScript; posts to /visszahivas, which redirects to the thank-you page.
 * @category forms
 */
export function CallbackForm({
  token,
  source,
  values = {},
  errors = {},
  formError,
  idPrefix = 'vh',
  action = CALLBACK_HREF,
  className,
  ...rest
}: CallbackFormProps) {
  const id = (field: string) => `${idPrefix}-${field}`;
  const fieldErrors = CALLBACK_FORM_FIELDS.filter((field) => errors[field]);
  const jobTypeIds = { id: id('jobType'), helpId: `${id('jobType')}-help`, errorId: `${id('jobType')}-error` };
  return (
    <form className={cx('sd-callback', className)} method="post" action={action} {...rest}>
      {(formError || fieldErrors.length > 0) && (
        <Notice className="sd-callback__summary" tone="error" live="assertive" title={formError ?? 'Kérjük, javítsa a következőket:'} tabIndex={-1} autoFocus>
          {fieldErrors.length > 0 && (
            <ul>
              {fieldErrors.map((field) => (
                <li key={field}>
                  <a href={`#${id(field)}`}>{errors[field]}</a>
                </li>
              ))}
            </ul>
          )}
        </Notice>
      )}
      <input type="hidden" name="token" value={token} />
      {source && <input type="hidden" name="source" value={source} />}
      <TextField
        id={id('name')}
        name="name"
        label={LABELS.name}
        required
        autoComplete="name"
        maxLength={100}
        defaultValue={values.name}
        error={errors.name}
      />
      <TextField
        id={id('phone')}
        name="phone"
        label={LABELS.phone}
        type="tel"
        inputMode="tel"
        required
        autoComplete="tel"
        maxLength={30}
        defaultValue={values.phone}
        error={errors.phone}
        help="Erre a számra hívjuk vissza."
      />
      <Field label={LABELS.jobType} htmlFor={jobTypeIds.id} error={errors.jobType} ids={jobTypeIds}>
        <select
          id={jobTypeIds.id}
          name="jobType"
          className="sd-input sd-callback__select"
          defaultValue={values.jobType ?? ''}
          aria-invalid={errors.jobType ? true : undefined}
          aria-describedby={describedBy(jobTypeIds, undefined, errors.jobType)}
        >
          <option value="">Válasszon, ha tudja</option>
          {CALLBACK_JOB_TYPE_IDS.map((jobType) => (
            <option key={jobType} value={jobType}>
              {callbackJobTypeName(jobType)}
            </option>
          ))}
        </select>
      </Field>
      <TextField
        id={id('message')}
        name="message"
        label={LABELS.message}
        maxLength={MAX_CALLBACK_MESSAGE_LENGTH}
        defaultValue={values.message}
        error={errors.message}
      />
      <div className="sd-callback__trap" aria-hidden="true">
        <label htmlFor={id('honlap')}>Ezt a mezőt hagyja üresen</label>
        <input id={id('honlap')} name="honlap" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="sd-callback__send">
        <Button type="submit">Visszahívást kérek</Button>
        <p className="sd-callback__privacy">
          Az adatait csak a visszahíváshoz használjuk. <a href="/adatkezeles">Adatkezelési tájékoztató</a>
        </p>
      </div>
    </form>
  );
}
```

`src/ui/CallbackForm/CallbackForm.css`:

```css
.sd-callback {
  display: grid;
  gap: var(--space-5);
  max-width: 36rem;
}
.sd-callback__summary ul {
  margin: var(--space-2) 0 0;
  padding-inline-start: var(--space-5);
}
.sd-callback__summary a {
  color: inherit;
  text-decoration: underline;
}
.sd-callback__select {
  appearance: auto;
}
/* The trap field: out of sight and out of the tab order, but in the HTML for bots. */
.sd-callback__trap {
  position: absolute;
  left: -10000px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}
.sd-callback__send {
  display: grid;
  justify-items: start;
  gap: var(--space-3);
}
.sd-callback__privacy {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}
.sd-callback__privacy a {
  color: var(--color-text);
}
.sd-callback__privacy a:focus-visible,
.sd-callback__summary a:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}
```

`src/ui/index.ts`: a `ButtonLink` export után, ábécérendben:

```ts
export { CallbackForm } from './CallbackForm/CallbackForm';
export type { CallbackFormProps } from './CallbackForm/CallbackForm';
```

`.design-sync/previews/CallbackForm.tsx`:

```tsx
import { CallbackForm } from '@stiletdekor/ui';

export const Empty = () => <CallbackForm token="3f8a2b6c-1d4e-4f5a-9b7c-0e1d2c3b4a59" source="/visszahivas" />;

export const WithErrors = () => (
  <CallbackForm
    token="3f8a2b6c-1d4e-4f5a-9b7c-0e1d2c3b4a59"
    values={{ name: '', phone: '123', jobType: 'ceger', message: 'Homlokzati tábla világítással' }}
    errors={{ name: 'Adja meg a nevét.', phone: 'Kérjük, érvényes telefonszámot adjon meg, például +36 70 123 4567.' }}
  />
);
```

- [ ] **Step 4: Futtatás, zöld**

Run: `npx vitest run src/ui/CallbackForm && npm run check`
Expected: PASS; `astro check` 0 hiba. Ha a `Notice` nem ad tovább `tabIndex`/`autoFocus`-t: a `NoticeProps` a `HTMLAttributes<HTMLDivElement>`-ből jön, tehát továbbadja.

- [ ] **Step 5: Commit**

```bash
git add src/ui/CallbackForm src/ui/index.ts src/ui/navigation.ts .design-sync/previews/CallbackForm.tsx
git -c user.name=Claude -c user.email=noreply@anthropic.com commit -m "Add the callback form: four fields, a trap field, a linked error summary" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Fejléc script nélküli mobilmenüvel, mobilos akciósáv

**Files:**
- Modify: `src/ui/SiteHeader/SiteHeader.tsx`, `src/ui/SiteHeader/SiteHeader.css`, `src/ui/SiteHeader/SiteHeader.test.tsx`, `src/ui/navigation.ts`, `src/ui/index.ts`
- Create: `src/ui/ActionBar/ActionBar.tsx`, `src/ui/ActionBar/ActionBar.css`, `src/ui/ActionBar/ActionBar.test.tsx`, `.design-sync/previews/ActionBar.tsx`

**Interfaces:**
- Consumes: `COMPANY` (`src/domain/company.ts`), `QUOTE_HREF`, `CALLBACK_HREF` (5.), `ButtonLink`, `Icon`.
- Produces: `ActionBar(props: ActionBarProps)` (`phone?`, `quoteHref?`, `fixed?: boolean` = true); `WEBSHOP_HREF = '/#webshop'`; a `SiteHeader` props-a változatlan (a `defaultMenuOpen` megmarad az előnézetekhez).

- [ ] **Step 1: A fejléc tesztjeinek cseréje**

`src/ui/SiteHeader/SiteHeader.test.tsx`: az utolsó két `it` (`toggles the mobile menu…`, `closes the mobile menu when an item is chosen`) helyére:

```tsx
  it('opens the mobile menu as a popover, without any script', () => {
    const { container } = render(<SiteHeader />);
    const button = screen.getByRole('button', { name: 'Menü' });
    const panel = container.querySelector<HTMLElement>(`#${button.getAttribute('popovertarget')}`)!;
    expect(panel.getAttribute('popover')).toBe('auto');
    // A closed popover is hidden from the accessibility tree, hence `hidden: true`.
    expect(within(panel).getByRole('link', { name: 'Referenciák', hidden: true })).toBeTruthy();
    expect(within(panel).getByRole('link', { name: 'Ajánlatkérés', hidden: true }).getAttribute('href')).toBe('/#ajanlat');
  });

  it('closes the popover when an item is chosen, where scripts run', () => {
    const { container } = render(<SiteHeader />);
    const panel = container.querySelector<HTMLElement & { hidePopover: () => void }>('.sd-header__panel')!;
    panel.hidePopover = vi.fn();
    fireEvent.click(within(panel).getByRole('link', { name: 'Kapcsolat', hidden: true }));
    expect(panel.hidePopover).toHaveBeenCalledOnce();
  });

  it('shows the menu open, as a plain panel, in previews', () => {
    const { container } = render(<SiteHeader defaultMenuOpen sticky={false} skipTo={null} />);
    const panel = container.querySelector<HTMLElement>('.sd-header__panel')!;
    expect(panel.hasAttribute('popover')).toBe(false);
    expect(screen.getByRole('banner').classList.contains('sd-header--menu-open')).toBe(true);
    expect(screen.queryByRole('link', { name: 'Ugrás a tartalomra' })).toBeNull();
    expect(screen.getByRole('banner').classList.contains('sd-header--sticky')).toBe(false);
  });
```

- [ ] **Step 2: Az akciósáv tesztje**

`src/ui/ActionBar/ActionBar.test.tsx`:

```tsx
/** @vitest-environment jsdom */
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ActionBar } from './ActionBar';

describe('ActionBar', () => {
  it('offers a call and the quote request', () => {
    render(<ActionBar />);
    const bar = screen.getByRole('navigation', { name: 'Gyors elérés' });
    const [call, quote] = within(bar).getAllByRole('link');
    expect(call!.getAttribute('href')).toBe('tel:+36705385030');
    expect(call!.getAttribute('aria-label')).toBe('Hívás: +36 70 538 5030');
    expect(call!.textContent).toBe('Hívás');
    expect(quote!.textContent).toBe('Ajánlatkérés');
    expect(quote!.getAttribute('href')).toBe('/#ajanlat');
    expect(bar.classList.contains('sd-actionbar--inline')).toBe(false);
  });

  it('can sit in the flow instead of the bottom of the screen (previews)', () => {
    render(<ActionBar fixed={false} quoteHref="/ajanlatkeres" />);
    const bar = screen.getByRole('navigation', { name: 'Gyors elérés' });
    expect(bar.classList.contains('sd-actionbar--inline')).toBe(true);
    expect(within(bar).getByRole('link', { name: 'Ajánlatkérés' }).getAttribute('href')).toBe('/ajanlatkeres');
  });
});
```

- [ ] **Step 3: Futtatás, bukik**

Run: `npx vitest run src/ui/SiteHeader src/ui/ActionBar`
Expected: FAIL (a fejlécnek nincs `popovertarget`-je; az `ActionBar` nem létezik).

- [ ] **Step 4: A fejléc**

`src/ui/SiteHeader/SiteHeader.tsx`: az import sor `import { type HTMLAttributes, type KeyboardEvent, useId, useRef, useState } from 'react';` helyére `import { type HTMLAttributes, type MouseEvent, useId } from 'react';`. A JSDoc második mondata: `When the header is narrower than 1040 px, the menu, the phone number and the "Ajánlatkérés" button move into a panel opened by the menu button: a native popover, so it works without JavaScript (Escape and a click outside close it).` A függvénytörzs a `const panelId` sortól a végéig:

```tsx
  const panelId = `sd-menu${useId().replace(/:/g, '')}`;
  // Where scripts run, choosing an item closes the popover (a link to a section of the same page would leave it open).
  const closeMenu = (event: MouseEvent<HTMLElement>) => {
    const panel = event.currentTarget.closest<HTMLElement & { hidePopover?: () => void }>('[popover]');
    panel?.hidePopover?.();
  };
  return (
    <header
      className={cx('sd-header', sticky && 'sd-header--sticky', defaultMenuOpen && 'sd-header--menu-open', className)}
      {...rest}
    >
      {skipTo && (
        <a className="sd-header__skip" href={skipTo}>
          Ugrás a tartalomra
        </a>
      )}
      <div className="sd-header__bar">
        <Wordmark href={homeHref} />
        <nav className="sd-header__nav" aria-label="Főmenü">
          <ul>
            {links.map((link) => (
              <li key={link.href}>
                <NavLink href={link.href} current={link.href === currentHref}>
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        {phone && (
          <a className="sd-header__phone" href={phone.href}>
            <Icon name="phone" />
            {phone.display}
          </a>
        )}
        <ButtonLink className="sd-header__cta" href={quoteHref} size="sm">
          Ajánlatkérés
        </ButtonLink>
        {onCartClick && (
          <IconButton icon="cart" label={`Kosár megnyitása, ${cartCount} tétel`} count={cartCount} aria-haspopup="dialog" onClick={onCartClick} />
        )}
        <button type="button" className="sd-iconbtn sd-header__menubtn" aria-label="Menü" popoverTarget={panelId}>
          <Icon name="menu" className="sd-header__open" />
          <Icon name="close" className="sd-header__close" />
        </button>
      </div>
      <div className="sd-header__panel" id={panelId} popover={defaultMenuOpen ? undefined : 'auto'}>
        <nav aria-label="Főmenü">
          <ul>
            {links.map((link) => (
              <li key={link.href}>
                <a
                  className="sd-header__panellink"
                  href={link.href}
                  aria-current={link.href === currentHref ? 'page' : undefined}
                  onClick={closeMenu}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="sd-header__panelfoot">
          {phone && (
            <a className="sd-header__panelphone" href={phone.href}>
              <Icon name="phone" />
              {phone.display}
            </a>
          )}
          <ButtonLink href={quoteHref} onClick={closeMenu}>
            Ajánlatkérés
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
```

A destrukturálásból kikerül az `onKeyDown` (a `...rest` viszi tovább). A `defaultMenuOpen` JSDoc-ja: `Shows the menu open as a plain panel (previews); a real page opens it with the menu button.`

`src/ui/SiteHeader/SiteHeader.css`: a `.sd-header__panel[hidden] { display: none; }` szabály helyére:

```css
/* On a page the panel is a popover: it opens in the top layer, right under the header bar. */
.sd-header__panel[popover] {
  position: fixed;
  inset: var(--layout-header-height) 0 auto;
  width: auto;
  height: auto;
  margin: 0;
  border: 0;
  border-bottom: 1px solid var(--color-line);
  color: var(--color-text);
}
.sd-header__panel[popover]:not(:popover-open) {
  display: none;
}
/* The menu button shows a cross while the menu is open. */
.sd-header:not(.sd-header--menu-open):not(:has(.sd-header__panel:popover-open)) .sd-header__close,
.sd-header--menu-open .sd-header__open,
.sd-header:has(.sd-header__panel:popover-open) .sd-header__open {
  display: none;
}
```

- [ ] **Step 5: Az akciósáv**

`src/ui/navigation.ts`: a `MAIN_NAV` elé `export const WEBSHOP_HREF = '/#webshop';`, és a `MAIN_NAV`-ban meg a `FOOTER_COLUMNS` „Rendelés” oszlopában a `'/#webshop'` helyére `WEBSHOP_HREF`; a „Rendelés” oszlop `Egyedi ajánlat` sora után: `{ href: CALLBACK_HREF, label: 'Visszahívást kérek' },` (a `CALLBACK_HREF` deklarációja kerüljön a `FOOTER_COLUMNS` elé).

`src/ui/ActionBar/ActionBar.tsx`:

```tsx
import type { HTMLAttributes } from 'react';
import { COMPANY } from '@/domain/company';
import '../base.css';
import { ButtonLink } from '../ButtonLink/ButtonLink';
import { cx } from '../cx';
import { QUOTE_HREF } from '../navigation';
import './ActionBar.css';

export interface ActionBarProps extends HTMLAttributes<HTMLElement> {
  /** The number to call, the workshop's by default. */
  phone?: { display: string; href: string };
  /** Target of "Ajánlatkérés", the quote wizard by default. */
  quoteHref?: string;
  /** Fixed to the bottom of narrow screens (default). Off: in the flow at any width (previews). */
  fixed?: boolean;
}

/**
 * Bar at the bottom of narrow screens with the two quickest actions: call the workshop, ask for a quote.
 * Shown below 720 px. Leave it out on form pages and in the checkout, so it never covers a field.
 * @category content
 */
export function ActionBar({ phone = COMPANY.phone, quoteHref = QUOTE_HREF, fixed = true, className, ...rest }: ActionBarProps) {
  return (
    <nav className={cx('sd-actionbar', !fixed && 'sd-actionbar--inline', className)} aria-label="Gyors elérés" {...rest}>
      <ButtonLink href={phone.href} variant="secondary" icon="phone" block aria-label={`Hívás: ${phone.display}`}>
        Hívás
      </ButtonLink>
      <ButtonLink href={quoteHref} block>
        Ajánlatkérés
      </ButtonLink>
    </nav>
  );
}
```

`src/ui/ActionBar/ActionBar.css`:

```css
.sd-actionbar {
  display: none;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-top: 1px solid var(--color-line);
  background: color-mix(in oklab, var(--color-bg) 92%, transparent);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
}
.sd-actionbar--inline {
  display: grid;
}
@media (max-width: 719.98px) {
  .sd-actionbar:not(.sd-actionbar--inline) {
    position: fixed;
    inset-inline: 0;
    bottom: 0;
    z-index: 30;
    display: grid;
    padding-bottom: calc(var(--space-2) + env(safe-area-inset-bottom));
  }
  /* Room at the end of the page, so the bar never covers the last lines. */
  body:has(> .sd-actionbar:not(.sd-actionbar--inline)) {
    padding-bottom: calc(44px + 2 * var(--space-2) + env(safe-area-inset-bottom));
  }
}
```

`src/ui/index.ts`: ábécérendben, az első export elé: `export { ActionBar } from './ActionBar/ActionBar';` és `export type { ActionBarProps } from './ActionBar/ActionBar';`.

`.design-sync/previews/ActionBar.tsx`:

```tsx
import { ActionBar } from '@stiletdekor/ui';

export const Default = () => <ActionBar fixed={false} />;
```

- [ ] **Step 6: Futtatás, zöld**

Run: `npx vitest run src/ui && npm run check`
Expected: PASS; `astro check` 0 hiba. Ha a TypeScript nem ismeri a `popoverTarget`/`popover` propot: a `@types/react` 19 ismeri; ha mégsem, a `node_modules/@types/react/index.d.ts`-ben keress rá (`popoverTarget`), és jelezd, ne kerüld meg `any`-vel. Ha a `SiteFooter` tesztje a „Rendelés” oszlop linkjeit pontosan felsorolja, egészítsd ki a „Visszahívást kérek” sorral.

- [ ] **Step 7: Commit**

```bash
git add src/ui/SiteHeader src/ui/ActionBar src/ui/navigation.ts src/ui/index.ts src/ui/SiteFooter .design-sync/previews/ActionBar.tsx
git -c user.name=Claude -c user.email=noreply@anthropic.com commit -m "Open the mobile menu as a native popover and add the mobile action bar" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Oldalkeret, oldalak, Worker-belépés, beállítások

**Files:**
- Create: `src/site/analytics.ts`, `src/site/analytics.test.ts`, `src/layouts/Page.astro`, `src/pages/visszahivas/index.astro`, `src/pages/visszahivas/koszonjuk.astro`, `src/pages/404.astro`, `src/worker.ts`
- Modify: `src/layouts/Base.astro`, `src/env.d.ts`, `wrangler.jsonc`, `.dev.vars.example`

**Interfaces:**
- Consumes: minden korábbi feladat; `waitUntil`, `env` (`cloudflare:workers`); `handle` (`@astrojs/cloudflare/handler`).
- Produces: `analyticsBeacon(token: string | undefined): { src: string; config: string } | null`; a `Page` layout (`title`, `description`, `currentHref?`, `actionBar?: boolean = true`, `theme?`); az `Env` új mezői: `CALLBACK_LIMITER: RateLimit`, `EMAIL?: SendEmail`, `NOTIFY_FROM_EMAIL: string`, `CF_BEACON_TOKEN: string`.

- [ ] **Step 1: A jeladó tesztje**

`src/site/analytics.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { analyticsBeacon } from './analytics';

describe('analyticsBeacon', () => {
  it('loads the Cloudflare Web Analytics beacon only when the deployment has a token', () => {
    expect(analyticsBeacon(undefined)).toBeNull();
    expect(analyticsBeacon('  ')).toBeNull();
    expect(analyticsBeacon('abc123')).toEqual({
      src: 'https://static.cloudflareinsights.com/beacon.min.js',
      config: '{"token":"abc123"}',
    });
  });
});
```

- [ ] **Step 2: Futtatás, bukik**

Run: `npx vitest run src/site/analytics.test.ts`
Expected: FAIL (`Failed to resolve import "./analytics"`).

- [ ] **Step 3: A jeladó és a Base**

`src/site/analytics.ts`:

```ts
// Cookie-free measuring with Cloudflare Web Analytics: no cookie, no personal data, so no cookie banner
// (docs/superpowers/specs/2026-10-08-weboldal-mukodesi-elvek-design.md, 7.). The token comes from the dashboard
// (Analytics & Logs → Web Analytics → Add a site) into the CF_BEACON_TOKEN var; without it nothing loads.

export function analyticsBeacon(token: string | undefined): { src: string; config: string } | null {
  const trimmed = token?.trim();
  if (!trimmed) return null;
  return { src: 'https://static.cloudflareinsights.com/beacon.min.js', config: JSON.stringify({ token: trimmed }) };
}
```

`src/layouts/Base.astro`: a frontmatterbe `import { analyticsBeacon } from '@/site/analytics';` és `const beacon = analyticsBeacon(env.CF_BEACON_TOKEN);`; a `<body>`-ban a `<slot />` után:

```astro
    {beacon && <script is:inline defer src={beacon.src} data-cf-beacon={beacon.config}></script>}
```

- [ ] **Step 4: Futtatás, zöld**

Run: `npx vitest run src/site/analytics.test.ts`
Expected: PASS.

- [ ] **Step 5: Env és wrangler**

`src/env.d.ts`, az `ALLOWED_ORIGINS` után:

```ts
    /** Rate limiter of the callback form: at most 5 posts per visitor per minute (wrangler.jsonc "ratelimits"). */
    CALLBACK_LIMITER: RateLimit;
    /**
     * Email Service send binding for the workshop's notifications. Not bound yet: it needs the stiletdekor.hu
     * domain on Cloudflare (README, "Értesítő e-mailek"). Until then the e-mails go to the log.
     */
    EMAIL?: SendEmail;
    /** Sender address of the notifications, on the onboarded domain (e.g. ertesito@stiletdekor.hu); empty until then. */
    NOTIFY_FROM_EMAIL: string;
    /** Cloudflare Web Analytics site token; empty: no beacon. */
    CF_BEACON_TOKEN: string;
```

`wrangler.jsonc`:
1. `"main": "@astrojs/cloudflare/entrypoints/server"` → `"main": "./src/worker.ts"`, a felette lévő komment: `// Worker entry: Astro answers requests (src/worker.ts), the cron retries the workshop's notifications.`
2. A top-level `"vars"` elé:

```jsonc
  // Callback form: at most 5 posts per visitor (IP) per minute. Not inherited: repeated in every environment.
  "ratelimits": [{ "name": "CALLBACK_LIMITER", "namespace_id": "1001", "simple": { "limit": 5, "period": 60 } }],
  // Retries the workshop's notification e-mails every 15 minutes (src/server/callback/notify.ts).
  "triggers": { "crons": ["*/15 * * * *"] },
```

3. Minden `"vars"` blokkba (top-level, `previews`, `env.galeria`, `env.production`) az `ALLOWED_ORIGINS` után: `"NOTIFY_FROM_EMAIL": "",` és `"CF_BEACON_TOKEN": ""` (vesszőkkel helyesen).
4. A `previews`, `env.galeria` és `env.production` blokkba ugyanez a `"ratelimits"` sor (ha a wrangler a `previews` blokkban nem fogadja el, ott maradjon ki, és a README említse); az `env.galeria`-ba `"triggers": { "crons": [] },` (a két dev oldal egy adatbázison osztozik, elég, ha az A oldal cronja fut), az `env.production`-be `"triggers": { "crons": ["*/15 * * * *"] },`.

`.dev.vars.example` végére:

```
# Sender address of the notification e-mails; empty: they go to the log (README, "Értesítő e-mailek").
# NOTIFY_FROM_EMAIL=ertesito@stiletdekor.hu
# Cloudflare Web Analytics site token; empty: no beacon.
# CF_BEACON_TOKEN=
```

- [ ] **Step 6: A Worker-belépés**

`src/worker.ts`:

```ts
// The Worker's entry: Astro answers every request; the cron retries the workshop's notification e-mails.
// (wrangler.jsonc "main"; the build's prerender worker keeps the adapter's own entry.)
import { handle } from '@astrojs/cloudflare/handler';
import { d1CallbackStore } from './server/callback/d1-store';
import { deliverPendingCallbacks } from './server/callback/notify';
import { mailerFor } from './server/notify/mailer';

export default {
  fetch: handle,
  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(
      deliverPendingCallbacks({
        store: d1CallbackStore(env.DB),
        mailer: mailerFor(env),
        to: env.ORDER_NOTIFY_EMAIL,
        now: () => new Date(),
      }).then((result) => {
        if (result.sent || result.failed) console.info('Értesítések újrapróbálva:', result);
      }),
    );
  },
} satisfies ExportedHandler<Env>;
```

- [ ] **Step 7: Az oldalkeret**

`src/layouts/Page.astro`:

```astro
---
// A page of the site: header, main content, footer and, on narrow screens, the action bar.
import { ActionBar } from '@/ui/ActionBar/ActionBar';
import { SiteFooter } from '@/ui/SiteFooter/SiteFooter';
import { SiteHeader } from '@/ui/SiteHeader/SiteHeader';
import type { SiteThemeId } from '@/site/themes';
import Base from './Base.astro';

interface Props {
  title: string;
  description: string;
  /** href of the menu item to mark as current. */
  currentHref?: string;
  /** The mobile action bar; off on form pages and in the checkout. */
  actionBar?: boolean;
  theme?: SiteThemeId;
}

const { title, description, currentHref, actionBar = true, theme } = Astro.props;
---

<Base title={title} description={description} theme={theme}>
  <SiteHeader currentHref={currentHref} />
  <main id="tartalom" tabindex="-1">
    <slot />
  </main>
  <SiteFooter />
  {actionBar && <ActionBar />}
</Base>

<style>
  main:focus {
    outline: none;
  }
</style>
```

- [ ] **Step 8: A visszahívás oldala**

`src/pages/visszahivas/index.astro`:

```astro
---
// The callback form. GET shows it with a fresh token; POST saves the request and redirects to the thank-you page
// (303), or shows the form again with the messages (docs/superpowers/specs/2026-10-08-weboldal-mukodesi-elvek-design.md, 4.).
import { env, waitUntil } from 'cloudflare:workers';
import { COMPANY } from '@/domain/company';
import Page from '@/layouts/Page.astro';
import { d1CallbackStore } from '@/server/callback/d1-store';
import { notifyCallback } from '@/server/callback/notify';
import { limiterAllows, type RejectedCallback, submitCallback } from '@/server/callback/submit';
import { mailerFor } from '@/server/notify/mailer';
import { CallbackForm } from '@/ui/CallbackForm/CallbackForm';

const SOURCE = '/visszahivas';
let rejected: RejectedCallback | null = null;

if (Astro.request.method === 'POST') {
  const store = d1CallbackStore(env.DB);
  const now = () => new Date();
  const result = await submitCallback(await Astro.request.formData(), {
    store,
    now,
    newToken: () => crypto.randomUUID(),
    allow: () => limiterAllows(env.CALLBACK_LIMITER, Astro.clientAddress),
  });
  if (result.kind === 'accepted') {
    if (result.id !== null) {
      waitUntil(
        notifyCallback(result.id, { store, mailer: mailerFor(env), to: env.ORDER_NOTIFY_EMAIL, now }).catch((error) =>
          console.error('A visszahívás értesítése hibával leállt:', error),
        ),
      );
    }
    return Astro.redirect(result.location, 303);
  }
  rejected = result;
  Astro.response.status = result.status;
}

const title = rejected ? 'Hiba a beküldésben – Visszahívás – Stilet Dekor' : 'Visszahívást kérek – Stilet Dekor';
---

<Page
  title={title}
  description="Adja meg a nevét és a telefonszámát, és a Stilet Dekor műhelye visszahívja."
  actionBar={false}
>
  <section class="vh">
    <h1>Visszahívást kér?</h1>
    <p class="vh__lead">
      Adja meg a nevét és a telefonszámát, és hamarosan visszahívjuk. Ha inkább most beszélne:
      <a href={COMPANY.phone.href}>{COMPANY.phone.display}</a>.
    </p>
    <CallbackForm
      token={rejected?.token ?? crypto.randomUUID()}
      source={rejected?.source ?? SOURCE}
      values={rejected?.values}
      errors={rejected?.errors}
      formError={rejected?.formError}
    />
  </section>
</Page>

<style>
  .vh {
    max-width: 40rem;
    margin: 0 auto;
    padding: var(--space-8) var(--layout-gutter) var(--space-10);
  }
  h1 {
    margin: 0 0 var(--space-3);
    font-family: var(--font-display);
    font-size: var(--text-3xl);
    font-variation-settings: var(--font-variation-display);
    font-weight: var(--weight-display);
    line-height: var(--leading-snug);
  }
  .vh__lead {
    margin: 0 0 var(--space-6);
    color: var(--color-text-muted);
  }
  .vh__lead a {
    color: var(--color-text);
    white-space: nowrap;
  }
</style>
```

Ha valamelyik token (`--space-10`, `--text-3xl`) nem létezik a `src/styles/tokens.css`-ben, a legközelebbi létezőt használd (`grep -n "\-\-space-\|\-\-text-" src/styles/tokens.css`).

- [ ] **Step 9: A köszönő oldal és a 404**

`src/pages/visszahivas/koszonjuk.astro`:

```astro
---
// After a callback request: the reference (when the address carries a valid one) and what happens next.
import { COMPANY } from '@/domain/company';
import { parseReference } from '@/domain/reference';
import Page from '@/layouts/Page.astro';
import { ButtonLink } from '@/ui/ButtonLink/ButtonLink';
import { SuccessPanel } from '@/ui/SuccessPanel/SuccessPanel';

const reference = parseReference(Astro.url.searchParams.get('szam'), 'VH') ?? undefined;
---

<Page title="Megkaptuk – Visszahívás – Stilet Dekor" description="Megkaptuk a visszahívás-kérését.">
  <section class="vh">
    <SuccessPanel
      title="Megkaptuk a visszahívás-kérését"
      reference={reference}
      referenceLabel="Hivatkozási szám"
      nextSteps={[
        'Megkaptuk a kérését.',
        'Hamarosan visszahívjuk a megadott telefonszámon.',
        'Ha kell, egyeztetjük a helyszíni felmérést, utána elküldjük az árajánlatot.',
      ]}
      note={`Sürgős? Hívjon minket: ${COMPANY.phone.display}`}
    >
      <ButtonLink href="/" variant="secondary">Vissza a kezdőlapra</ButtonLink>
    </SuccessPanel>
  </section>
</Page>

<style>
  .vh {
    max-width: 40rem;
    margin: 0 auto;
    padding: var(--space-8) var(--layout-gutter) var(--space-10);
  }
</style>
```

`src/pages/404.astro`:

```astro
---
// Shown for every address the site does not have. Prerendered: no code runs for it.
export const prerender = true;

import { COMPANY } from '@/domain/company';
import Page from '@/layouts/Page.astro';
import { ButtonLink } from '@/ui/ButtonLink/ButtonLink';
import { CALLBACK_HREF, QUOTE_HREF, WEBSHOP_HREF } from '@/ui/navigation';
---

<Page title="Az oldal nem található – Stilet Dekor" description="Ez az oldal nem található. Innen továbbjut.">
  <section class="nf">
    <h1>Ez az oldal nem található</h1>
    <p>Lehet, hogy elírás van a címben, vagy az oldal megszűnt. Innen biztosan továbbjut:</p>
    <ul class="nf__ways">
      <li><ButtonLink href={QUOTE_HREF}>Ajánlatkérés</ButtonLink></li>
      <li><ButtonLink href={WEBSHOP_HREF} variant="secondary">Webshop</ButtonLink></li>
      <li><ButtonLink href={COMPANY.phone.href} variant="secondary" icon="phone">{COMPANY.phone.display}</ButtonLink></li>
    </ul>
    <p>Vagy <a href={CALLBACK_HREF}>kérjen visszahívást</a>, és mi keressük.</p>
  </section>
</Page>

<style>
  .nf {
    max-width: 40rem;
    margin: 0 auto;
    padding: var(--space-8) var(--layout-gutter) var(--space-10);
  }
  h1 {
    margin: 0 0 var(--space-3);
    font-family: var(--font-display);
    font-size: var(--text-3xl);
    font-variation-settings: var(--font-variation-display);
    font-weight: var(--weight-display);
    line-height: var(--leading-snug);
  }
  .nf__ways {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
    margin: var(--space-5) 0;
    padding: 0;
    list-style: none;
  }
  .nf a:not([class]) {
    color: var(--color-text);
  }
</style>
```

- [ ] **Step 10: Ellenőrzés és commit**

Run: `npm test && npm run check && npm run typecheck && npm run build`
Expected: minden zöld; a buildben megjelenik a `404.html` (előre generált) és a Worker a `src/worker.ts`-ből épül. Ha a build a `main` miatt hibázik, olvasd el a hibát; a `@astrojs/cloudflare` a `wrangler.jsonc` `main`-jét használja (`dist/wrangler.js`: `config.main ?? …`), a `handle` a `@astrojs/cloudflare/handler` exportja.

```bash
git add src/site/analytics.ts src/site/analytics.test.ts src/layouts src/pages/visszahivas src/pages/404.astro src/worker.ts src/env.d.ts wrangler.jsonc .dev.vars.example
git -c user.name=Claude -c user.email=noreply@anthropic.com commit -m "Add the callback page, its thank-you page, the 404 and the page frame" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Kipróbálás és dokumentáció

**Files:**
- Modify: `README.md` (új alszakasz a „Cloudflare” alatt), `docs/architecture.md`, `docs/superpowers/specs/2026-10-08-weboldal-mukodesi-elvek-design.md` (11. fejezet)

- [ ] **Step 1: Helyi kipróbálás**

```bash
npm run db:migrate:local
npm run dev -- --port 4321
```

A böngészőben (beépített böngésző, `http://localhost:4321`):
1. `/visszahivas`: az űrlap látszik, a forrásban nincs `<script type="module">` (`curl -s http://localhost:4321/visszahivas | grep -c 'type="module"'` → 0).
2. Üres beküldés: a böngésző a kötelező mezőknél megállít. A natív ellenőrzést megkerülve (`curl -s -X POST -H "Origin: http://localhost:4321" -d "name=&phone=123&token=x" http://localhost:4321/visszahivas -o /dev/null -w "%{http_code}"`) → `400`, a válaszban a „Kérjük, javítsa a következőket:” összesítő.
3. Helyes beküldés a böngészőben (név, telefon, munkatípus) → átirányítás a `/visszahivas/koszonjuk?szam=VH-0001` címre; a dev szerver naplójában `[értesítés → stiletdekor@gmail.com] [VH-0001] Visszahívás – …`.
4. A sor a helyi D1-ben: `npx wrangler d1 execute DB --local --command "SELECT id, name, job_type, source, notified_at FROM callback_requests"` → egy sor, `notified_at` kitöltve.
5. Hatszor gyorsan egymás után beküldve (curl-lel) a hatodik `429`.
6. `/nincs-ilyen-oldal` → 404-es oldal a három úttal.
7. 390 px széles nézetben (`resize_window` mobile) a `/nincs-ilyen-oldal` alján látszik az akciósáv (Hívás · Ajánlatkérés), a `/visszahivas`-on nem; a menügomb megnyitja a panelt, az Escape bezárja.
8. A cron helyben: `curl "http://localhost:4321/cdn-cgi/handler/scheduled"` → a napló nem jelez hibát.

Ha bármelyik lépés nem a várt eredményt adja: `superpowers:systematic-debugging`, javítás tesztmódosítással együtt, aztán újra a lépés.

- [ ] **Step 2: README**

`README.md`, a „### Erőforrások” alszakasz után új alszakasz:

```markdown
### Visszahívás és értesítő e-mailek

- **Tábla:** `migrations/0001_callback_requests.sql`. Helyben `npm run db:migrate:local`; a dev adatbázisba
  push előtt `npx wrangler d1 migrations apply DB --remote` (élesben `--env production` is).
- **Beküldési korlát:** `CALLBACK_LIMITER` (60 másodpercenként 5 beküldés IP-címenként), minden környezetben.
- **Értesítő e-mailek:** amíg nincs `EMAIL` kötés, a levelek a Worker naplójába mennek, és a kérés
  „elküldöttnek” számít. Valódi küldéshez a `stiletdekor.hu` domainnek a Cloudflare-en kell lennie (most a
  register.it névszerverein van, a levelezés a webnode-on; az MX rekordokat költözéskor át kell venni):
  1. a domain felvétele a Cloudflare-be és a névszerverek átállítása a register.it-nél;
  2. Email Service → Email Routing → Destination addresses: a `stiletdekor@gmail.com` felvétele és megerősítése;
  3. a `wrangler.jsonc`-be minden környezetben
     `"send_email": [{ "name": "EMAIL", "destination_address": "stiletdekor@gmail.com" }]`, a `NOTIFY_FROM_EMAIL`
     változóba a feladó (például `ertesito@stiletdekor.hu`).
  A megerősített címre küldés minden csomagban ingyenes.
- **Újrapróbálás:** a cron (`*/15 * * * *`, csak az A dev oldalon és élesben) 24 órán át újraküldi az el nem
  ment értesítéseket; a hibák a Cloudflare naplójában (Issues) látszanak.
- **Mérés:** Web Analytics token a `CF_BEACON_TOKEN` változóba (Analytics & Logs → Web Analytics). Heti
  visszahívások forrás szerint:
  `npx wrangler d1 execute DB --remote --command "SELECT strftime('%Y-%W', created_at) AS het, COALESCE(source, '–') AS forras, COUNT(*) AS db FROM callback_requests GROUP BY het, forras ORDER BY het DESC"`
```

- [ ] **Step 3: Architektúra és spec**

`docs/architecture.md`: a könyvtárszerkezetben a `server/` sor után: `  worker.ts        # a Worker belépési pontja: Astro + cron (értesítések újrapróbálása)`; az API-táblázat alá egy mondat: „A visszahívás (`/visszahivas`) nem API-végpont: az oldal maga fogadja a POST-ot (sima HTML űrlap, JavaScript nélkül is), és 303-mal a köszönő oldalra irányít.”

A spec 11. fejezetének táblázatában az 1. sor „Tartalom” cellájából kikerül a „saját tárhelyes betűk”, a 3. sorba bekerül: „a választott arculati irány betűi saját tárhelyről”. A táblázat alá egy sor: „A betűk a végleges arculati iránytól függnek, ezért a döntés után költöznek saját tárhelyre (2026-10-08).”

- [ ] **Step 4: Teljes ellenőrzés és commit**

Run: `npm test && npm run check && npm run typecheck && npm run build`
Expected: minden zöld.

```bash
git add README.md docs/architecture.md docs/superpowers/specs/2026-10-08-weboldal-mukodesi-elvek-design.md
git -c user.name=Claude -c user.email=noreply@anthropic.com commit -m "Document the callback flow, its e-mails and the fonts' new place in the plan" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
