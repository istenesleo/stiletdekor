# Webshop, 1. kör (4a + 4b): termékoldalak, kosár, pénztár – megvalósítási terv

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Működő webshop a dev oldalon: `/webshop` és a 6 termékoldal konfigurátorral, kosár a böngészőben, egyoldalas pénztár, fájlfeltöltés R2-be, `POST /api/orders` szerveroldali újraárazással és `R-0001` rendelésszámmal, e-mail a műhelynek újrapróbálással, állapotoldal titkos linken.

**Architecture:** A domainkód (`src/domain`) adja az árazást, a sémákat és az új szabályokat (kosártároló, feltöltés). A szerver az eddigi mintát követi: tároló-interfész + D1-megvalósítás (`src/server/upload`, `src/server/order`), tiszta, tesztelhető kezelőfüggvények, és vékony Astro API-útvonalak (`src/pages/api`). A böngészőoldal három React-sziget (`client:only="react"`) közös modulokkal (`src/islands/shop`): konfigurátor, kosár, pénztár. A tartalmi oldalakra csak a kosár darabszámát kiíró ~1 KB-os script kerül.

**Tech Stack:** Astro 7 (előre generált oldalak + Worker), React 19, Zod 4, Cloudflare D1, R2, Workers Rate Limiting, Vitest (`getPlatformProxy`, jsdom), pdf-lib (a fájlelemző, csak fájlválasztáskor).

**Spec:** `docs/superpowers/specs/2026-10-09-webshop-4a-4b-design.md` (és a keret: `docs/superpowers/specs/2026-10-08-weboldal-mukodesi-elvek-design.md`)

## Global Constraints

- Magyar, magázó szöveg; nincs kitalált adat és időígéret. A kötelező szövegek a domainből jönnek: `ORDER_SUBMIT_LABEL` („Rendelés elküldése ellenőrzésre”), `ORDER_NO_OBLIGATION_NOTICE`, `FINAL_PRICE_NOTICE`.
- A felületen minden ár bruttó; a nettó és az ÁFA kis sorban. Ár és összeg a szerveren számolódik (`priceCart`), a böngésző árat nem küld.
- Rendelésszám: `R-` + legalább 4 számjegy (`formatReference('R', id)`).
- Feltöltés: legfeljebb 95 MB (`MAX_UPLOAD_BYTES`), tételenként legfeljebb 10 fájl, helyszíni fotó legfeljebb 10; a gazdátlan fájl 3 nap után törlődik; a letöltő link 90 napig él.
- Beküldési korlát: `FORM_LIMITER` (60 s alatt 5), kulcs `rendeles:<ip>`; `UPLOAD_LIMITER` (60 s alatt 20), kulcs `feltoltes:<ip>`.
- Minden `/api/*` POST maga ellenőrzi az `Origin` fejlécet (`originAllowed`, az oldal saját címe + `ALLOWED_ORIGINS`).
- Az állapotoldal: `noindex`, `Cache-Control: private, no-store`, `Referrer-Policy: no-referrer`, nincs mérő jeladó, nincs személyes adat.
- Sebesség: a termék-, kosár- és pénztároldal legfeljebb ~130 KB JavaScript (gzip); a többi előre generált oldal legfeljebb 5 KB. A fájlelemző (`@/domain/artwork/analyze`, pdf-lib) csak dinamikus `import()`-tal tölthető be; statikusan sehol nem importálható a szigetekből (ezért a szigetek az `@/domain/artwork` indexet sem importálják, csak az almodulokat).
- Csak tokenekből stílus; érintési felület ≥ 44 px; látható fókusz; a nem kötelező mezők címkéje „(nem kötelező)”.
- A tesztelt modulok nem importálnak `cloudflare:workers`-t; DOM-teszt `/** @vitest-environment jsdom */`.
- E-mail-teszt: a napló és az egységtesztek. Valódi levélhez a műhely címe `leonardistenes@gmail.com` (`.dev.vars`), máshová nem küldünk.
- Minden feladat végén zöld `npm test` és `npm run check`; a végén `npm run typecheck` és `npm run build`.
- Commit: `git -c user.name=Claude -c user.email=noreply@anthropic.com commit …`, a végén `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Ág: `webshop-1` a `main`-ből. Push csak kérésre.

## Fájlszerkezet

| Fájl | Felelősség |
|---|---|
| `src/domain/reference.ts` | Az `R` előtag |
| `src/domain/money.ts` | `parseNumberHu` és `formatFileSize` ide költözik (a böngésző és a szerver is használja) |
| `src/domain/schemas.ts` | `sitePhotoIds` a rendelésben |
| `src/domain/orders.ts` | `orderNextStep`: az állapotoldal „mi jön most” szövege |
| `src/domain/uploads.ts` | A feltöltés szabályai és üzenetei, közösen a böngészőnek és a szervernek |
| `src/domain/cart-count.ts` | A kosár helye és darabszáma, import nélkül (a fejléc scriptje használja) |
| `src/domain/cart.ts` | A kosártároló formátuma, ellenőrzése, a rendelés tételei |
| `migrations/0003_orders.sql` | `orders`, `order_items`, `order_events`, `uploads` |
| `src/server/test-d1.ts` | A táblák törlése fordított sorrendben (idegen kulcsok) |
| `src/server/api.ts` | `originAllowed`, `jsonResponse`, `FORBIDDEN_MESSAGE` |
| `src/server/forms.ts` | `isUuid` |
| `src/server/upload/{blob-store,memory-blob-store,store,d1-store,receive,download,cleanup}.ts` | A feltöltések: fájltár (R2 / memória), metaadatok, a két végpont logikája, a gazdátlan fájlok törlése |
| `src/server/order/{token,store,d1-store,submit,email,notify}.ts`, `test-order.ts` | A rendelések: állapottoken, tároló, beküldés, a műhely levele, értesítés; a tesztek mintarendelése |
| `src/pages/api/uploads/index.ts`, `src/pages/api/uploads/[id].ts`, `src/pages/api/orders.ts` | Az API-útvonalak |
| `src/pages/rendeles/[token].astro` | Állapotoldal |
| `src/layouts/Base.astro`, `src/layouts/Page.astro` | `analytics` és `noindex` kapcsoló; a fejléc kosárlinkje és a darabszám scriptje |
| `src/ui/navigation.ts`, `src/ui/SiteHeader/*` | `WEBSHOP_HREF = '/webshop'`; kosárlink (`cartHref`) |
| `src/scripts/cart-badge.ts` | A fejléc darabszáma |
| `src/site/shop-ui.ts` | Katalógusból a csempék és az ártáblázat adatai |
| `src/pages/webshop/index.astro`, `src/pages/webshop/[termek].astro`, `src/pages/kosar.astro`, `src/pages/penztar.astro` | Az oldalak (előre generálva) |
| `src/islands/shop/{draft,artwork-size,price-rows}.ts` | A konfigurátor tiszta logikája |
| `src/islands/shop/{cart-store,upload-client,useArtworkFiles,useDebounced}.ts` | Böngészős segédek: kosár, feltöltés, fájlok állapota, késleltetett felolvasás |
| `src/islands/shop/{ProductOptions,ArtworkField,CartLines,CartDrawer,Configurator,CartPage,Checkout}.tsx`, `checkout-form.ts`, `shop.css` | A szigetek |
| `scripts/check-bundles.mjs` | A build utáni csomagméret-ellenőrzés |
| `src/worker.ts`, `wrangler.jsonc`, `src/env.d.ts` | Cron, `UPLOAD_LIMITER`, `UPLOADS` |
| `README.md`, `docs/architecture.md` | Dokumentáció |

---

### Task 0: Ág és az R2 állapota

- [ ] **Step 1: Ág**

```bash
cd /f/OneDrive/StiletDekor && git switch main && git switch -c webshop-1 && git status --short
```

Expected: `Switched to a new branch 'webshop-1'`, tiszta munkafa.

- [ ] **Step 2: Be van-e kapcsolva az R2**

A Cloudflare MCP `r2_buckets_list` hívásával. Ha `403 … code 10042` („Please enable R2”), az R2 még nincs bekapcsolva: a 15. feladat 1. lépése akkor kimarad, és a dev oldalakon a feltöltés az 503-as (e-mailes) ágat mutatja. Ha lista jön, jegyezd fel: a 15. feladat 1. lépése lefut.

---

### Task 1: Domain: rendelésszám, számformázás, helyszíni fotók, állapotszövegek, feltöltési szabályok

**Files:**
- Modify: `src/domain/reference.ts`, `src/domain/reference.test.ts`
- Modify: `src/domain/money.ts`, `src/domain/money.test.ts`, `src/server/quote/form.ts`, `src/ui/FileList/FileList.tsx`
- Modify: `src/domain/schemas.ts`, `src/domain/schemas.test.ts`
- Modify: `src/domain/orders.ts`, `src/domain/orders.test.ts`
- Create: `src/domain/uploads.ts`, `src/domain/uploads.test.ts`

**Interfaces:**
- Produces:
  - `type ReferencePrefix = 'AK' | 'VH' | 'R'`
  - `parseNumberHu(text: string): number | string | null` és `formatFileSize(bytes: number): string` a `@/domain/money`-ból
  - `MAX_SITE_PHOTOS = 10`; `OrderRequestSchema` kimenete `sitePhotoIds: string[]` mezővel
  - `ORDER_NEXT_STEPS: Record<OrderStatus, string>`, `orderNextStep(status: OrderStatus, shippingMethod: ShippingMethodId): string`
  - `@/domain/uploads`: `MAX_UPLOAD_BYTES`, `UPLOAD_ORPHAN_DAYS = 3`, `UPLOAD_LINK_DAYS = 90`, `DAY_MS`, `UPLOAD_ACCEPTED_TEXT`, `UPLOAD_TOO_LARGE_MESSAGE`, `UPLOAD_TYPE_MESSAGE`, `UPLOAD_UNAVAILABLE_MESSAGE`, `UPLOAD_FAILED_MESSAGE`, `formatFitsExtension(expected, detected): boolean`, `contentTypeOf(format): string`, `cleanFileName(raw: string | null): string | null`, `isUploadExpired(uploadedAtIso: string, now: Date): boolean`

- [ ] **Step 1: A tesztek**

`src/domain/reference.test.ts` végére, a meglévő `describe` blokkon belül:

```ts
  it('numbers webshop orders with R', () => {
    expect(formatReference('R', 7)).toBe('R-0007');
    expect(parseReference(' R-0012 ', 'R')).toBe('R-0012');
    expect(parseReference('AK-0012', 'R')).toBeNull();
  });
```

`src/domain/money.test.ts` végére (az importba: `formatFileSize`, `parseNumberHu`):

```ts
describe('parseNumberHu', () => {
  it('reads Hungarian and English decimals and grouped thousands', () => {
    expect(parseNumberHu('12,5')).toBe(12.5);
    expect(parseNumberHu(' 1 200 ')).toBe(1200);
    expect(parseNumberHu('3.75')).toBe(3.75);
    expect(parseNumberHu('')).toBeNull();
    expect(parseNumberHu('kb. 12')).toBe('kb. 12');
  });
});

describe('formatFileSize', () => {
  it('writes decimal kB and MB', () => {
    expect(formatFileSize(2_400_000)).toBe('2,4\u00a0MB');
    expect(formatFileSize(830_000)).toBe('830\u00a0kB');
    expect(formatFileSize(10)).toBe('1\u00a0kB');
  });
});
```

`src/domain/schemas.test.ts`, az `OrderRequestSchema` blokkba:

```ts
  it('takes site photos with installation only', () => {
    const parsed = OrderRequestSchema.parse({ ...order, shippingMethod: 'telepites', sitePhotoIds: [UUID_B] });
    expect(parsed.sitePhotoIds).toEqual([UUID_B]);
    expect(OrderRequestSchema.parse(order).sitePhotoIds).toEqual([]);
    expect(issuesOf(OrderRequestSchema, { ...order, sitePhotoIds: [UUID_B] })).toEqual([
      ['sitePhotoIds', 'Helyszíni fotót telepítéssel együtt küldhet.'],
    ]);
    expect(issuesOf(OrderRequestSchema, { ...order, shippingMethod: 'telepites', sitePhotoIds: Array(11).fill(UUID_B) })).toEqual([
      ['sitePhotoIds', 'Legfeljebb 10 helyszíni fotó tölthető fel.'],
    ]);
  });
```

`src/domain/orders.test.ts` végére (az importba: `ORDER_NEXT_STEPS`, `ORDER_STATUS_IDS`, `orderNextStep`):

```ts
describe('orderNextStep', () => {
  it('has a text for every status, and the ready text depends on the handover', () => {
    for (const status of ORDER_STATUS_IDS) expect(ORDER_NEXT_STEPS[status].length).toBeGreaterThan(10);
    expect(orderNextStep('beerkezett', 'futar')).toContain('díjbekérő');
    expect(orderNextStep('elkeszult', 'szemelyes')).toBe('Elkészült, átveheti a műhelyben.');
    expect(orderNextStep('elkeszult', 'telepites')).toBe('Elkészült, egyeztetjük a telepítés időpontját.');
  });
});
```

Új fájl: `src/domain/uploads.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { cleanFileName, contentTypeOf, formatFitsExtension, isUploadExpired, MAX_UPLOAD_BYTES } from './uploads';

describe('upload rules', () => {
  it('allows 95 MB', () => {
    expect(MAX_UPLOAD_BYTES).toBe(95 * 1024 * 1024);
  });

  it('accepts the same format or a sibling behind an extension', () => {
    expect(formatFitsExtension('pdf', 'pdf')).toBe(true);
    expect(formatFitsExtension('ai', 'pdf')).toBe(true);
    expect(formatFitsExtension('eps', 'ai')).toBe(true);
    expect(formatFitsExtension('jpeg', 'png')).toBe(true);
    expect(formatFitsExtension('svg', 'pdf')).toBe(false);
    expect(formatFitsExtension('pdf', 'png')).toBe(false);
    expect(formatFitsExtension('pdf', 'unknown')).toBe(false);
  });

  it('names the content type of a format', () => {
    expect(contentTypeOf('pdf')).toBe('application/pdf');
    expect(contentTypeOf('svg')).toBe('image/svg+xml');
    expect(contentTypeOf('cdr')).toBe('application/octet-stream');
  });

  it('cleans the file name a header carried', () => {
    expect(cleanFileName(encodeURIComponent('Molinó végleges.pdf'))).toBe('Molinó végleges.pdf');
    expect(cleanFileName(encodeURIComponent('C:\\Users\\x\\logo.ai'))).toBe('logo.ai');
    expect(cleanFileName(encodeURIComponent('a\u0000b.png'))).toBe('ab.png');
    expect(cleanFileName('%E0%A4%A')).toBeNull();
    expect(cleanFileName(null)).toBeNull();
    expect(cleanFileName('  ')).toBeNull();
    const long = cleanFileName(encodeURIComponent(`${'x'.repeat(300)}.pdf`));
    expect(long).toHaveLength(200);
    expect(long?.endsWith('.pdf')).toBe(true);
  });

  it('expires a file after three days', () => {
    const now = new Date('2026-10-12T12:00:00Z');
    expect(isUploadExpired('2026-10-09T12:00:01Z', now)).toBe(false);
    expect(isUploadExpired('2026-10-09T11:59:59Z', now)).toBe(true);
  });
});
```

- [ ] **Step 2: Futtasd, hogy lásd elbukni**

Run: `npx vitest run src/domain`
Expected: FAIL (`formatReference('R', …)` típushiba nélkül is fut, de a `parseNumberHu`, `formatFileSize`, `orderNextStep`, `./uploads` nem létezik; a `sitePhotoIds` hiányzik).

- [ ] **Step 3: A megvalósítás**

`src/domain/reference.ts`: a fejléc-megjegyzés bővül, és:

```ts
// Short reference numbers the customer can read out on the phone: "AK-0142" (quote request), "VH-0087"
// (callback request), "R-0001" (webshop order). The number is the row's id in its own D1 table, padded to at
// least four digits (docs/superpowers/specs/2026-10-08-weboldal-mukodesi-elvek-design.md, 4.2).

export type ReferencePrefix = 'AK' | 'VH' | 'R';
```

`src/domain/money.ts` végére (a `formatFileSize` a `src/ui/FileList/FileList.tsx`-ből költözik, a `parseNumberHu` a `src/server/quote/form.ts`-ből):

```ts
/** "12,5", "12.5" or "1 200" → a number; an unreadable text stays text, so a schema can say it is not a number. */
export function parseNumberHu(text: string): number | string | null {
  const compact = text.replace(/\s/g, '');
  if (!compact) return null;
  return /^-?\d+([.,]\d+)?$/.test(compact) ? Number(compact.replace(',', '.')) : text.trim();
}

/** "2,4 MB", "830 kB" (decimal units, like most operating systems). */
export function formatFileSize(bytes: number): string {
  return bytes >= 1_000_000
    ? `${formatNumberHu(bytes / 1_000_000, 1)}\u00a0MB`
    : `${formatNumberHu(Math.max(1, bytes / 1000), 0)}\u00a0kB`;
}
```

`src/server/quote/form.ts`: a `parseNumberHu` függvény törlődik, helyette az import után:

```ts
import { parseNumberHu } from '@/domain/money';

export { parseNumberHu };
```

`src/ui/FileList/FileList.tsx`: a `formatFileSize` függvény törlődik, a meglévő `import { formatNumberHu } from '@/domain/money';` sor helyett `import { formatFileSize } from '@/domain/money';` áll (a `formatNumberHu` csak a törölt függvényben kellett), és az importok után:

```ts
export { formatFileSize };
```

`src/domain/schemas.ts`, a `MAX_ORDER_NOTE_LENGTH` sor után:

```ts
/** Photos of the site, with installation only (docs/brief.md 4.1). */
export const MAX_SITE_PHOTOS = 10;
```

az `OrderRequestSchema` objektumában a `surveyRequested` után:

```ts
      /** With installation only: photos of the site, so the installation can be priced. */
      sitePhotoIds: z
        .array(UploadIdSchema, { error: 'Érvénytelen fájllista.' })
        .max(MAX_SITE_PHOTOS, `Legfeljebb ${MAX_SITE_PHOTOS} helyszíni fotó tölthető fel.`)
        .default([]),
```

és a `superRefine` végére:

```ts
    if (order.sitePhotoIds.length > 0 && order.shippingMethod !== 'telepites') {
      ctx.addIssue({ code: 'custom', path: ['sitePhotoIds'], message: 'Helyszíni fotót telepítéssel együtt küldhet.' });
    }
```

`src/domain/orders.ts`, a `READY_MESSAGES` után:

```ts
/** What happens next, on the order's status page (/rendeles/[token]); "elkészült" comes from READY_MESSAGES. */
export const ORDER_NEXT_STEPS: Readonly<Record<OrderStatus, string>> = {
  beerkezett:
    'Ellenőrizzük a fájlt, az anyagot és a határidőt, majd e-mailben visszaigazoljuk a végleges árat és küldjük a díjbekérőt. Fizetni csak a díjbekérő alapján kell.',
  modositas: 'E-mailben megírtuk, mit kell módosítani. Ha megkaptuk a javítást, újra ellenőrizzük a rendelést.',
  visszaigazolva: 'E-mailben elküldtük a végleges árat és a díjbekérőt. A gyártás a befizetés beérkezése után indul.',
  gyartas: 'A befizetés megérkezett, a rendelés gyártás alatt van.',
  elkeszult: 'Elkészült.',
  teljesitve: 'A rendelést teljesítettük. Köszönjük, hogy minket választott.',
  elutasitva: 'Ezt a rendelést nem tudtuk vállalni. Az okát e-mailben megírtuk.',
  lemondva: 'A rendelést lemondták.',
  lejart: 'A díjbekérő nem érkezett be a határidőig, ezért a rendelést lezártuk. Ha mégis kéri, írjon vagy hívjon minket.',
};

/** The status page's "what happens next" line for an order handed over by `shippingMethod`. */
export const orderNextStep = (status: OrderStatus, shippingMethod: ShippingMethodId): string =>
  status === 'elkeszult' ? READY_MESSAGES[shippingMethod] : ORDER_NEXT_STEPS[status];
```

Új fájl: `src/domain/uploads.ts`

```ts
// The rules of customer uploads (POST /api/uploads), shared by the browser (limits, messages) and the server
// (docs/superpowers/specs/2026-10-09-webshop-4a-4b-design.md, 6.).
import { ARTWORK_FILE_TYPES } from './artwork/filetypes';
import type { ArtworkFormat } from './artwork/types';

/** Below the Workers request body limit (100 MB). */
export const MAX_UPLOAD_BYTES = 95 * 1024 * 1024;
/** An upload that no order uses is deleted after this many days (the cron). */
export const UPLOAD_ORPHAN_DAYS = 3;
/** How long the workshop's download link works after the order arrived. */
export const UPLOAD_LINK_DAYS = 90;
export const DAY_MS = 24 * 60 * 60_000;
const MAX_FILE_NAME_LENGTH = 200;

export const UPLOAD_ACCEPTED_TEXT = `${ARTWORK_FILE_TYPES.map((type) => type.label).join(', ')} · legfeljebb 95 MB`;
const BY_EMAIL = 'Tegye kosárba fájl nélkül, és a rendelés után küldje el e-mailben, a rendelésszámmal.';
export const UPLOAD_TOO_LARGE_MESSAGE = `A fájl túl nagy, legfeljebb 95 MB lehet. ${BY_EMAIL}`;
export const UPLOAD_TYPE_MESSAGE = `Ezt a fájlt nem tudjuk fogadni. Elfogadott fájlok: ${UPLOAD_ACCEPTED_TEXT}. ${BY_EMAIL}`;
export const UPLOAD_UNAVAILABLE_MESSAGE = `A fájlfeltöltés most nem működik. ${BY_EMAIL}`;
export const UPLOAD_FAILED_MESSAGE = 'A feltöltés megszakadt. Próbálja újra.';

const DOCUMENTS = new Set<ArtworkFormat>(['pdf', 'ai', 'eps']);
const RASTERS = new Set<ArtworkFormat>(['png', 'jpeg', 'tiff', 'psd', 'bmp', 'heic', 'avif', 'webp', 'gif']);

/** Whether content of format `detected` may sit behind an extension of format `expected`: the same, or a sibling. */
export function formatFitsExtension(expected: ArtworkFormat, detected: ArtworkFormat): boolean {
  if (detected === 'unknown') return false;
  if (expected === detected) return true;
  return (DOCUMENTS.has(expected) && DOCUMENTS.has(detected)) || (RASTERS.has(expected) && RASTERS.has(detected));
}

const CONTENT_TYPES: Readonly<Record<ArtworkFormat, string>> = {
  pdf: 'application/pdf',
  ai: 'application/postscript',
  eps: 'application/postscript',
  svg: 'image/svg+xml',
  png: 'image/png',
  jpeg: 'image/jpeg',
  tiff: 'image/tiff',
  psd: 'image/vnd.adobe.photoshop',
  bmp: 'image/bmp',
  heic: 'image/heic',
  avif: 'image/avif',
  webp: 'image/webp',
  gif: 'image/gif',
  cdr: 'application/octet-stream',
  unknown: 'application/octet-stream',
};

export const contentTypeOf = (format: ArtworkFormat): string => CONTENT_TYPES[format];

/** The file name as a header carried it (URI-encoded): no folders, no control characters, at most 200 characters. */
export function cleanFileName(raw: string | null): string | null {
  if (raw === null) return null;
  let name: string;
  try {
    name = decodeURIComponent(raw);
  } catch {
    return null;
  }
  name = (name.split(/[\\/]/).pop() ?? '').replace(/[\u0000-\u001f\u007f]/g, '').trim();
  if (!name) return null;
  if (name.length <= MAX_FILE_NAME_LENGTH) return name;
  const extension = /\.[^.]{1,10}$/.exec(name)?.[0] ?? '';
  return name.slice(0, MAX_FILE_NAME_LENGTH - extension.length) + extension;
}

/** True when an upload made at `uploadedAtIso` is older than UPLOAD_ORPHAN_DAYS (the cron may have deleted it). */
export const isUploadExpired = (uploadedAtIso: string, now: Date): boolean =>
  now.getTime() - Date.parse(uploadedAtIso) > UPLOAD_ORPHAN_DAYS * DAY_MS;
```

- [ ] **Step 4: Futtasd újra**

Run: `npx vitest run src/domain src/server/quote src/ui/FileList`
Expected: PASS.

- [ ] **Step 5: Ellenőrzés és commit**

Run: `npm test && npm run check`
Expected: minden zöld.

```bash
git add src/domain src/server/quote/form.ts src/ui/FileList/FileList.tsx
git -c user.name=Claude -c user.email=noreply@anthropic.com commit -q -F - <<'EOF'
Add the order reference, site photos, status texts and upload rules

R- references for webshop orders, sitePhotoIds on the order (installation
only), the status page's next-step texts, and the shared upload limits and
messages. parseNumberHu and formatFileSize move to the domain so the browser
and the server can both use them.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 2: A kosár a böngészőben (formátum és darabszám)

**Files:**
- Create: `src/domain/cart-count.ts`, `src/domain/cart.ts`, `src/domain/cart.test.ts`

**Interfaces:**
- Consumes: `CartItemSchema`-hoz hasonló darabok a `@/domain/schemas`-ból (`ProductConfigSchema`, `PreflightSummarySchema`, `UploadIdSchema`, `MAX_UPLOADS_PER_ITEM`, `MAX_ORDER_ITEMS`); `isUploadExpired` (Task 1).
- Produces:
  - `@/domain/cart-count`: `CART_STORAGE_KEY = 'stilet-kosar'`, `CART_CHANGED_EVENT = 'stilet-kosar'`, `cartItemCount(raw: string | null): number`
  - `@/domain/cart`: `type CartFile = { uploadId: string; name: string; size: number; uploadedAt: string }`, `type CartEntry = { key: string; config: ProductConfig; files: CartFile[]; preflight?: PreflightSummary | undefined; addedAt: string }`, `parseStoredCart(raw: string | null): { entries: CartEntry[]; dropped: number }`, `serializeCart(entries: readonly CartEntry[]): string`, `expiredFiles(entry: CartEntry, now: Date): CartFile[]`, `toOrderItems(entries: readonly CartEntry[]): { config: ProductConfig; uploadIds: string[]; preflight?: PreflightSummary }[]`

- [ ] **Step 1: A teszt**

Új fájl: `src/domain/cart.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { expiredFiles, parseStoredCart, serializeCart, toOrderItems, type CartEntry } from './cart';
import { cartItemCount } from './cart-count';

const FILE = { uploadId: '3f8a2b6c-1d4e-4f5a-9b7c-0e1d2c3b4a59', name: 'logo.pdf', size: 2_400_000, uploadedAt: '2026-10-09T10:00:00.000Z' };
const ENTRY: CartEntry = {
  key: 'a1',
  config: { productId: 'molino', materialId: 'standard', edgeFinishId: 'szeges-ringli', widthCm: 200, heightCm: 100, quantity: 2, express: false },
  files: [FILE],
  preflight: { dpi: 150, rating: 'kivalo', aspectMismatch: false },
  addedAt: '2026-10-09T10:01:00.000Z',
};

describe('the stored cart', () => {
  it('reads back what it wrote', () => {
    expect(parseStoredCart(serializeCart([ENTRY]))).toEqual({ entries: [ENTRY], dropped: 0 });
  });

  it('is empty when missing, broken or of another version', () => {
    for (const raw of [null, '', '{', '{"v":2,"items":[]}', '[]']) expect(parseStoredCart(raw)).toEqual({ entries: [], dropped: 0 });
  });

  it('drops the items that are no longer valid and counts them', () => {
    const broken = { ...ENTRY, key: 'b2', config: { ...ENTRY.config, widthCm: 9000 } };
    const raw = JSON.stringify({ v: 1, items: [ENTRY, broken, { nonsense: true }] });
    expect(parseStoredCart(raw)).toEqual({ entries: [ENTRY], dropped: 2 });
  });

  it('finds the files the cron may have deleted', () => {
    expect(expiredFiles(ENTRY, new Date('2026-10-11T10:00:00Z'))).toEqual([]);
    expect(expiredFiles(ENTRY, new Date('2026-10-12T10:00:01Z'))).toEqual([FILE]);
  });

  it('turns the entries into the order items', () => {
    expect(toOrderItems([ENTRY, { ...ENTRY, key: 'c3', files: [], preflight: undefined }])).toEqual([
      { config: ENTRY.config, uploadIds: [FILE.uploadId], preflight: ENTRY.preflight },
      { config: ENTRY.config, uploadIds: [] },
    ]);
  });

  it('counts the items for the header without checking them', () => {
    expect(cartItemCount(serializeCart([ENTRY, ENTRY]))).toBe(2);
    expect(cartItemCount(null)).toBe(0);
    expect(cartItemCount('{')).toBe(0);
    expect(cartItemCount('{"v":2,"items":[1]}')).toBe(0);
  });
});
```

- [ ] **Step 2: Futtasd, hogy lásd elbukni**

Run: `npx vitest run src/domain/cart.test.ts`
Expected: FAIL (`Cannot find module './cart'`).

- [ ] **Step 3: A megvalósítás**

Új fájl: `src/domain/cart-count.ts`

```ts
// Where the cart lives in the browser, and its item count without the cart's schema: the header's small script
// (src/scripts/cart-badge.ts) reads it on every page, so this file imports nothing.

export const CART_STORAGE_KEY = 'stilet-kosar';
/** Fired on window after this tab changed the cart; the storage event only reaches the other tabs. */
export const CART_CHANGED_EVENT = 'stilet-kosar';

/** Number of items (lines) in the stored cart; 0 when it is missing or not a cart of this version. */
export function cartItemCount(raw: string | null): number {
  if (!raw) return 0;
  try {
    const data = JSON.parse(raw) as { v?: unknown; items?: unknown } | null;
    return data?.v === 1 && Array.isArray(data.items) ? data.items.length : 0;
  } catch {
    return 0;
  }
}
```

Új fájl: `src/domain/cart.ts`

```ts
// The cart as the browser keeps it (localStorage, CART_STORAGE_KEY): the configuration, the uploaded files and the
// browser's preflight per item. No prices (they are always calculated from the configuration) and no personal data
// (docs/superpowers/specs/2026-10-09-webshop-4a-4b-design.md, 4.).
import { z } from 'zod';
import { MAX_ORDER_ITEMS, MAX_UPLOADS_PER_ITEM, PreflightSummarySchema, ProductConfigSchema, UploadIdSchema } from './schemas';
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
```

- [ ] **Step 4: Futtasd újra**

Run: `npx vitest run src/domain/cart.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/cart.ts src/domain/cart-count.ts src/domain/cart.test.ts
git -c user.name=Claude -c user.email=noreply@anthropic.com commit -q -F - <<'EOF'
Keep the cart in the browser: its format, check and item count

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---
### Task 3: A rendelések táblái és a feltöltések tárolója

**Files:**
- Create: `migrations/0003_orders.sql`
- Modify: `src/server/test-d1.ts`
- Create: `src/server/upload/blob-store.ts`, `src/server/upload/memory-blob-store.ts`, `src/server/upload/store.ts`, `src/server/upload/d1-store.ts`, `src/server/upload/d1-store.test.ts`

**Interfaces:**
- Produces:
  - `interface BlobStore { put(key, body: ReadableStream<Uint8Array>, length: number, contentType: string): Promise<void>; head(key, bytes: number): Promise<Uint8Array>; get(key): Promise<{ body: ReadableStream<Uint8Array>; size: number } | null>; delete(keys: readonly string[]): Promise<void> }`
  - `r2BlobStore(bucket: R2Bucket): BlobStore`; `memoryBlobStore(): BlobStore & { files: Map<string, { bytes: Uint8Array; contentType: string }> }` (csak tesztekhez)
  - `interface UploadRecord { id; r2Key; fileName; sizeBytes; format; contentType; createdAt; orderId: number | null; orderItemId: number | null }`, `type NewUpload = Omit<UploadRecord, 'orderId' | 'orderItemId'>`
  - `interface UploadStore { insert(u: NewUpload): Promise<void>; findMany(ids: readonly string[]): Promise<UploadRecord[]>; findDownloadable(id: string, since: string): Promise<UploadRecord | null>; findOrphans(before: string, limit: number): Promise<UploadRecord[]>; remove(ids: readonly string[]): Promise<void> }`, `d1UploadStore(db: D1Database): UploadStore`

- [ ] **Step 1: A migráció**

Új fájl: `migrations/0003_orders.sql`

```sql
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
```

- [ ] **Step 2: A teszt-adatbázis törlése idegen kulcsokkal**

A D1 betartatja az idegen kulcsokat, ezért a szülőtábla (`orders`) nem dobható el a gyerekei előtt. `src/server/test-d1.ts`, a `reset()` ciklusa:

```ts
      // Children first: D1 enforces foreign keys, and the tables are listed in the order they were created.
      for (const { name } of results.filter((t) => !t.name.startsWith('_cf_')).reverse()) {
        await db.prepare(`DROP TABLE IF EXISTS "${name}"`).run();
      }
```

- [ ] **Step 3: A fájltár és a tároló felülete**

Új fájl: `src/server/upload/blob-store.ts`

```ts
// Where the uploaded files live: R2 in the Worker (r2BlobStore), memory in the tests (memory-blob-store.ts).
// The handlers only use this interface, so they run in Node tests without the Workers runtime.

export interface StoredBlob {
  body: ReadableStream<Uint8Array>;
  size: number;
}

export interface BlobStore {
  /** Saves a stream of exactly `length` bytes (R2 needs the length up front: the request's Content-Length). */
  put(key: string, body: ReadableStream<Uint8Array>, length: number, contentType: string): Promise<void>;
  /** The first `bytes` bytes of a saved file (fewer when it is shorter, none when it is missing). */
  head(key: string, bytes: number): Promise<Uint8Array>;
  get(key: string): Promise<StoredBlob | null>;
  delete(keys: readonly string[]): Promise<void>;
}

export function r2BlobStore(bucket: R2Bucket): BlobStore {
  return {
    async put(key, body, _length, contentType) {
      await bucket.put(key, body, { httpMetadata: { contentType } });
    },
    async head(key, bytes) {
      const object = await bucket.get(key, { range: { offset: 0, length: bytes } });
      return object ? new Uint8Array(await object.arrayBuffer()) : new Uint8Array();
    },
    async get(key) {
      const object = await bucket.get(key);
      return object ? { body: object.body, size: object.size } : null;
    },
    async delete(keys) {
      if (keys.length > 0) await bucket.delete([...keys]);
    },
  };
}
```

Új fájl: `src/server/upload/memory-blob-store.ts`

```ts
// A BlobStore in memory, for the tests. Like R2, it refuses a stream whose length differs from the one given.
import type { BlobStore } from './blob-store';

export function memoryBlobStore(): BlobStore & { files: Map<string, { bytes: Uint8Array; contentType: string }> } {
  const files = new Map<string, { bytes: Uint8Array; contentType: string }>();
  return {
    files,
    async put(key, body, length, contentType) {
      const bytes = new Uint8Array(await new Response(body).arrayBuffer());
      if (bytes.length !== length) throw new Error(`Length mismatch: ${bytes.length} instead of ${length}`);
      files.set(key, { bytes, contentType });
    },
    async head(key, bytes) {
      return files.get(key)?.bytes.slice(0, bytes) ?? new Uint8Array();
    },
    async get(key) {
      const file = files.get(key);
      return file ? { body: new Blob([file.bytes]).stream(), size: file.bytes.length } : null;
    },
    async delete(keys) {
      for (const key of keys) files.delete(key);
    },
  };
}
```

Új fájl: `src/server/upload/store.ts`

```ts
// The uploads' metadata, as an interface: the API uses the D1 version (d1-store.ts), handler tests a fake.

export interface UploadRecord {
  /** Random UUID: the id in the cart, the order and the workshop's download link. */
  id: string;
  r2Key: string;
  /** The customer's file name; metadata only. */
  fileName: string;
  sizeBytes: number;
  /** The detected ArtworkFormat. */
  format: string;
  contentType: string;
  /** ISO timestamp (UTC). */
  createdAt: string;
  orderId: number | null;
  orderItemId: number | null;
}

export type NewUpload = Omit<UploadRecord, 'orderId' | 'orderItemId'>;

export interface UploadStore {
  insert(upload: NewUpload): Promise<void>;
  /** The uploads with these ids that exist, bound to an order or not. */
  findMany(ids: readonly string[]): Promise<UploadRecord[]>;
  /** The upload when an order uses it and that order arrived at or after `since` (ISO). */
  findDownloadable(id: string, since: string): Promise<UploadRecord | null>;
  /** Uploads no order uses, created before `before` (ISO), oldest first. */
  findOrphans(before: string, limit: number): Promise<UploadRecord[]>;
  remove(ids: readonly string[]): Promise<void>;
}
```

- [ ] **Step 4: A D1-tároló tesztje**

Új fájl: `src/server/upload/d1-store.test.ts`

```ts
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { testDatabase } from '../test-d1';
import { d1UploadStore } from './d1-store';
import type { NewUpload } from './store';

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

const A = '3f8a2b6c-1d4e-4f5a-9b7c-0e1d2c3b4a59';
const B = '9c1d2e3f-4a5b-4c6d-8e7f-a0b1c2d3e4f5';
const C = '0b1c2d3e-4f5a-4b6c-8d7e-9f0a1b2c3d4e';

const upload = (id: string, createdAt: string): NewUpload => ({
  id,
  r2Key: `feltoltes/${id}`,
  fileName: 'logo.pdf',
  sizeBytes: 1234,
  format: 'pdf',
  contentType: 'application/pdf',
  createdAt,
});

/** A bare order row (the order store writes the full one, Task 5), and `uploadId` bound to it. */
async function orderUsing(uploadId: string, createdAt: string): Promise<number> {
  const order = await t.db
    .prepare(
      'INSERT INTO orders (form_token, status_token, site_origin, customer_name, customer_email, customer_phone, billing_postal_code, ' +
        'billing_city, billing_address, shipping_method, items_net, shipping_net, net_total, vat_total, gross_total, price_json, created_at) ' +
        "VALUES (?, ?, 'https://x.test', 'M', 'm@x.hu', '1', '1061', 'Budapest', 'Minta u. 1.', 'szemelyes', 1, 0, 1, 0, 1, '{}', ?) RETURNING id",
    )
    .bind(`f-${uploadId}`, `s-${uploadId}`, createdAt)
    .first<{ id: number }>();
  await t.db.prepare('UPDATE uploads SET order_id = ? WHERE id = ?').bind(order!.id, uploadId).run();
  return order!.id;
}

describe('d1UploadStore', () => {
  it('saves uploads and finds the existing ones', async () => {
    const store = d1UploadStore(t.db);
    await store.insert(upload(A, '2026-10-09T10:00:00.000Z'));
    await store.insert(upload(B, '2026-10-09T10:01:00.000Z'));
    const found = await store.findMany([A, B, C]);
    expect(found.map((u) => u.id).sort()).toEqual([A, B].sort());
    expect(found.find((u) => u.id === A)).toEqual({ ...upload(A, '2026-10-09T10:00:00.000Z'), orderId: null, orderItemId: null });
    expect(await store.findMany([])).toEqual([]);
  });

  it('gives the workshop a file only while its order is recent enough', async () => {
    const store = d1UploadStore(t.db);
    await store.insert(upload(A, '2026-10-09T10:00:00.000Z'));
    await store.insert(upload(B, '2026-10-09T10:00:00.000Z'));
    const orderId = await orderUsing(A, '2026-10-09T10:05:00.000Z');
    expect(await store.findDownloadable(A, '2026-10-01T00:00:00.000Z')).toMatchObject({ id: A, orderId });
    expect(await store.findDownloadable(A, '2026-10-10T00:00:00.000Z')).toBeNull();
    expect(await store.findDownloadable(B, '2026-10-01T00:00:00.000Z')).toBeNull();
  });

  it('lists and removes the unused old uploads, never a used one', async () => {
    const store = d1UploadStore(t.db);
    await store.insert(upload(A, '2026-10-05T10:00:00.000Z'));
    await store.insert(upload(B, '2026-10-05T11:00:00.000Z'));
    await store.insert(upload(C, '2026-10-09T10:00:00.000Z'));
    await orderUsing(B, '2026-10-05T12:00:00.000Z');
    expect((await store.findOrphans('2026-10-06T10:00:00.000Z', 100)).map((u) => u.id)).toEqual([A]);
    await store.remove([A, B]);
    expect((await store.findMany([A, B, C])).map((u) => u.id).sort()).toEqual([B, C].sort());
  });
});
```

- [ ] **Step 5: Futtasd, hogy lásd elbukni**

Run: `npx vitest run src/server/upload`
Expected: FAIL (`Cannot find module './d1-store'`).

- [ ] **Step 6: A D1-tároló**

Új fájl: `src/server/upload/d1-store.ts`

```ts
// The uploads' metadata in D1 (table uploads, migrations/0003_orders.sql).
import type { NewUpload, UploadRecord, UploadStore } from './store';

interface UploadRow {
  id: string;
  r2_key: string;
  file_name: string;
  size_bytes: number;
  format: string;
  content_type: string;
  created_at: string;
  order_id: number | null;
  order_item_id: number | null;
}

const COLUMNS = ['id', 'r2_key', 'file_name', 'size_bytes', 'format', 'content_type', 'created_at', 'order_id', 'order_item_id'];
/** D1 binds at most 100 parameters per statement. */
const CHUNK = 90;

const toRecord = (row: UploadRow): UploadRecord => ({
  id: row.id,
  r2Key: row.r2_key,
  fileName: row.file_name,
  sizeBytes: row.size_bytes,
  format: row.format,
  contentType: row.content_type,
  createdAt: row.created_at,
  orderId: row.order_id,
  orderItemId: row.order_item_id,
});

function chunks<T>(list: readonly T[]): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < list.length; i += CHUNK) result.push(list.slice(i, i + CHUNK));
  return result;
}

const marks = (count: number) => Array.from({ length: count }, () => '?').join(', ');

export function d1UploadStore(db: D1Database): UploadStore {
  return {
    async insert(u: NewUpload) {
      await db
        .prepare(`INSERT INTO uploads (id, r2_key, file_name, size_bytes, format, content_type, created_at) VALUES (${marks(7)})`)
        .bind(u.id, u.r2Key, u.fileName, u.sizeBytes, u.format, u.contentType, u.createdAt)
        .run();
    },
    async findMany(ids) {
      const found: UploadRecord[] = [];
      for (const part of chunks([...new Set(ids)])) {
        const { results } = await db
          .prepare(`SELECT ${COLUMNS.join(', ')} FROM uploads WHERE id IN (${marks(part.length)})`)
          .bind(...part)
          .all<UploadRow>();
        found.push(...results.map(toRecord));
      }
      return found;
    },
    async findDownloadable(id, since) {
      const row = await db
        .prepare(
          `SELECT ${COLUMNS.map((c) => `u.${c}`).join(', ')} FROM uploads u JOIN orders o ON o.id = u.order_id ` +
            'WHERE u.id = ? AND o.created_at >= ?',
        )
        .bind(id, since)
        .first<UploadRow>();
      return row ? toRecord(row) : null;
    },
    async findOrphans(before, limit) {
      const { results } = await db
        .prepare(`SELECT ${COLUMNS.join(', ')} FROM uploads WHERE order_id IS NULL AND created_at < ? ORDER BY created_at, id LIMIT ?`)
        .bind(before, limit)
        .all<UploadRow>();
      return results.map(toRecord);
    },
    async remove(ids) {
      // Only unused uploads: a file an order uses in the meantime stays.
      for (const part of chunks(ids)) {
        await db.prepare(`DELETE FROM uploads WHERE order_id IS NULL AND id IN (${marks(part.length)})`).bind(...part).run();
      }
    },
  };
}
```

- [ ] **Step 7: Futtasd újra, aztán az egészet**

Run: `npx vitest run src/server/upload && npm test && npm run check`
Expected: PASS (a régi D1-tesztek is, a fordított törléssel).

- [ ] **Step 8: Helyi migráció és commit**

Run: `npm run db:migrate:local`
Expected: a `0003_orders.sql` lefut.

```bash
git add migrations/0003_orders.sql src/server/test-d1.ts src/server/upload
git -c user.name=Claude -c user.email=noreply@anthropic.com commit -q -F - <<'EOF'
Add the order tables and the uploads' store

Migration 0003 creates orders, order_items, order_events and uploads. Uploads
keep their metadata in D1 and their bytes behind a small BlobStore interface:
R2 in the Worker, memory in the tests.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 4: A feltöltés végpontjai

**Files:**
- Create: `src/server/api.ts`, `src/server/api.test.ts`
- Modify: `src/server/forms.ts`
- Create: `src/server/upload/receive.ts`, `src/server/upload/receive.test.ts`, `src/server/upload/download.ts`, `src/server/upload/download.test.ts`, `src/server/upload/cleanup.ts`, `src/server/upload/cleanup.test.ts`
- Create: `src/pages/api/uploads/index.ts`, `src/pages/api/uploads/[id].ts`
- Modify: `wrangler.jsonc`, `src/env.d.ts`

**Interfaces:**
- Consumes: Task 1 `@/domain/uploads`; Task 3 `BlobStore`, `UploadStore`, `memoryBlobStore`, `r2BlobStore`, `d1UploadStore`.
- Produces:
  - `@/server/api`: `originAllowed(request: Request, extraOrigins: string): boolean`, `jsonResponse(status: number, body: unknown): Response`, `FORBIDDEN_MESSAGE`
  - `@/server/forms`: `isUuid(value: unknown): value is string`
  - `receiveUpload(input: { fileName: string | null; length: number | null; body: ReadableStream<Uint8Array> | null }, deps: ReceiveUploadDeps): Promise<Response>`; a válasz `201 { id, name, size, format }`, hibánál `{ error: string; emailFallback?: true }`
  - `downloadUpload(id: string, deps: { blobs: BlobStore | undefined; store: Pick<UploadStore, 'findDownloadable'>; now: () => Date }): Promise<Response>`, `contentDisposition(name: string): string`
  - `deleteOrphanUploads(deps: { blobs: BlobStore; store: Pick<UploadStore, 'findOrphans' | 'remove'>; now: () => Date; limit?: number }): Promise<number>`
  - `env.UPLOAD_LIMITER: RateLimit`

- [ ] **Step 1: Az API-segédek tesztje**

Új fájl: `src/server/api.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { jsonResponse, originAllowed } from './api';

const post = (origin?: string) =>
  new Request('https://stiletdekor.example/api/orders', { method: 'POST', headers: origin ? { Origin: origin } : {} });

describe('originAllowed', () => {
  it('lets the site itself and the extra origins in', () => {
    expect(originAllowed(post('https://stiletdekor.example'), '')).toBe(true);
    expect(originAllowed(post('http://localhost:4321'), 'http://localhost:4321, https://x.test')).toBe(true);
  });

  it('refuses other sites and a missing Origin', () => {
    expect(originAllowed(post('https://evil.example'), 'http://localhost:4321')).toBe(false);
    expect(originAllowed(post(), '')).toBe(false);
  });
});

describe('jsonResponse', () => {
  it('sends JSON that is never cached', async () => {
    const response = jsonResponse(422, { errors: { a: 'b' } });
    expect(response.status).toBe(422);
    expect(response.headers.get('Content-Type')).toBe('application/json; charset=utf-8');
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(await response.json()).toEqual({ errors: { a: 'b' } });
  });
});
```

- [ ] **Step 2: A feltöltés fogadásának tesztje**

Új fájl: `src/server/upload/receive.test.ts`

```ts
import { describe, expect, it, vi } from 'vitest';
import { UPLOAD_TOO_LARGE_MESSAGE, UPLOAD_TYPE_MESSAGE, UPLOAD_UNAVAILABLE_MESSAGE } from '@/domain/uploads';
import { memoryBlobStore } from './memory-blob-store';
import { receiveUpload, type ReceiveUploadDeps } from './receive';
import type { NewUpload } from './store';

const ID = '3f8a2b6c-1d4e-4f5a-9b7c-0e1d2c3b4a59';
const NOW = new Date('2026-10-09T10:00:00.000Z');
const PDF = new TextEncoder().encode('%PDF-1.7\n1 0 obj << >> endobj\n%%EOF');
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]);

const stream = (bytes: Uint8Array) => new Blob([bytes]).stream();
const input = (name: string | null, bytes: Uint8Array) => ({
  fileName: name === null ? null : encodeURIComponent(name),
  length: bytes.length,
  body: stream(bytes),
});

function deps(overrides: Partial<ReceiveUploadDeps> = {}) {
  const blobs = memoryBlobStore();
  const saved: NewUpload[] = [];
  const store = { insert: vi.fn(async (u: NewUpload) => void saved.push(u)) };
  const d: ReceiveUploadDeps = { blobs, store, allow: async () => true, now: () => NOW, newId: () => ID, ...overrides };
  return { blobs, saved, deps: d };
}

describe('receiveUpload', () => {
  it('saves a print file and its metadata, and answers with the id', async () => {
    const { blobs, saved, deps: d } = deps();
    const response = await receiveUpload(input('Molinó végleges.pdf', PDF), d);
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ id: ID, name: 'Molinó végleges.pdf', size: PDF.length, format: 'pdf' });
    expect(blobs.files.get(`feltoltes/${ID}`)).toEqual({ bytes: PDF, contentType: 'application/pdf' });
    expect(saved).toEqual([
      {
        id: ID,
        r2Key: `feltoltes/${ID}`,
        fileName: 'Molinó végleges.pdf',
        sizeBytes: PDF.length,
        format: 'pdf',
        contentType: 'application/pdf',
        createdAt: NOW.toISOString(),
      },
    ]);
  });

  it('takes a PNG named .jpg, and keeps the format it found', async () => {
    const response = await receiveUpload(input('foto.jpg', PNG), deps().deps);
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ format: 'png' });
  });

  it('refuses a file whose content does not fit its name, and deletes it', async () => {
    const { blobs, saved, deps: d } = deps();
    const response = await receiveUpload(input('logo.pdf', new TextEncoder().encode('hello')), d);
    expect(response.status).toBe(415);
    expect(await response.json()).toEqual({ error: UPLOAD_TYPE_MESSAGE, emailFallback: true });
    expect(blobs.files.size).toBe(0);
    expect(saved).toEqual([]);
  });

  it('refuses unknown extensions and too large files before reading them', async () => {
    const { blobs, deps: d } = deps();
    expect((await receiveUpload(input('setup.exe', PDF), d)).status).toBe(415);
    const large = await receiveUpload({ fileName: 'nagy.pdf', length: 96 * 1024 * 1024, body: stream(PDF) }, d);
    expect(large.status).toBe(413);
    expect(await large.json()).toEqual({ error: UPLOAD_TOO_LARGE_MESSAGE, emailFallback: true });
    expect(blobs.files.size).toBe(0);
  });

  it('needs a name, a length and a body', async () => {
    const { deps: d } = deps();
    expect((await receiveUpload(input(null, PDF), d)).status).toBe(400);
    expect((await receiveUpload({ fileName: 'a.pdf', length: null, body: stream(PDF) }, d)).status).toBe(411);
    expect((await receiveUpload({ fileName: 'a.pdf', length: 10, body: null }, d)).status).toBe(400);
  });

  it('offers e-mail when there is no file storage, and the phone after too many uploads', async () => {
    const off = await receiveUpload(input('logo.pdf', PDF), deps({ blobs: undefined }).deps);
    expect(off.status).toBe(503);
    expect(await off.json()).toEqual({ error: UPLOAD_UNAVAILABLE_MESSAGE, emailFallback: true });
    expect((await receiveUpload(input('logo.pdf', PDF), deps({ allow: async () => false }).deps)).status).toBe(429);
  });

  it('deletes the file when its metadata cannot be saved', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const failing = {
      insert: vi.fn(async () => {
        throw new Error('D1 down');
      }),
    };
    const { blobs, deps: d } = deps({ store: failing });
    const response = await receiveUpload(input('logo.pdf', PDF), d);
    expect(response.status).toBe(503);
    expect(blobs.files.size).toBe(0);
    error.mockRestore();
  });
});
```

(A `deps({ store: failing })` a saját `blobs`-ával tér vissza, mert a `blobs` nincs felülírva.)

- [ ] **Step 3: A letöltés és a takarítás tesztje**

Új fájl: `src/server/upload/download.test.ts`

```ts
import { describe, expect, it, vi } from 'vitest';
import { contentDisposition, downloadUpload } from './download';
import { memoryBlobStore } from './memory-blob-store';
import type { UploadRecord } from './store';

const ID = '3f8a2b6c-1d4e-4f5a-9b7c-0e1d2c3b4a59';
const NOW = new Date('2026-10-09T10:00:00.000Z');
const RECORD: UploadRecord = {
  id: ID,
  r2Key: `feltoltes/${ID}`,
  fileName: 'Molinó "végleges".svg',
  sizeBytes: 4,
  format: 'svg',
  contentType: 'image/svg+xml',
  createdAt: NOW.toISOString(),
  orderId: 1,
  orderItemId: 1,
};

describe('downloadUpload', () => {
  it('sends an ordered file as an attachment that cannot run scripts', async () => {
    const blobs = memoryBlobStore();
    blobs.files.set(RECORD.r2Key, { bytes: new TextEncoder().encode('<svg'), contentType: 'image/svg+xml' });
    const findDownloadable = vi.fn(async () => RECORD);
    const response = await downloadUpload(ID, { blobs, store: { findDownloadable }, now: () => NOW });
    expect(findDownloadable).toHaveBeenCalledWith(ID, '2026-07-11T10:00:00.000Z');
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('<svg');
    expect(response.headers.get('Content-Type')).toBe('image/svg+xml');
    expect(response.headers.get('Content-Disposition')).toBe(contentDisposition(RECORD.fileName));
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('Content-Security-Policy')).toBe('sandbox');
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  });

  it('knows nothing about unknown, unordered or old files, or malformed ids', async () => {
    const blobs = memoryBlobStore();
    const none = { findDownloadable: async () => null };
    expect((await downloadUpload(ID, { blobs, store: none, now: () => NOW })).status).toBe(404);
    expect((await downloadUpload('../titok', { blobs, store: none, now: () => NOW })).status).toBe(404);
    const missingBytes = { findDownloadable: async () => RECORD };
    expect((await downloadUpload(ID, { blobs, store: missingBytes, now: () => NOW })).status).toBe(404);
  });

  it('names the file for every browser', () => {
    expect(contentDisposition('Molinó "végleges".svg')).toBe(
      `attachment; filename="Molino _vegleges_.svg"; filename*=UTF-8''${encodeURIComponent('Molinó "végleges".svg')}`,
    );
  });
});
```

Új fájl: `src/server/upload/cleanup.test.ts`

```ts
import { describe, expect, it, vi } from 'vitest';
import { deleteOrphanUploads } from './cleanup';
import { memoryBlobStore } from './memory-blob-store';
import type { UploadRecord } from './store';

const orphan = (id: string): UploadRecord => ({
  id,
  r2Key: `feltoltes/${id}`,
  fileName: 'a.pdf',
  sizeBytes: 1,
  format: 'pdf',
  contentType: 'application/pdf',
  createdAt: '2026-10-01T00:00:00.000Z',
  orderId: null,
  orderItemId: null,
});

describe('deleteOrphanUploads', () => {
  it('deletes the files no order used for three days, bytes and metadata', async () => {
    const blobs = memoryBlobStore();
    blobs.files.set('feltoltes/a', { bytes: new Uint8Array([1]), contentType: 'application/pdf' });
    blobs.files.set('feltoltes/b', { bytes: new Uint8Array([1]), contentType: 'application/pdf' });
    const findOrphans = vi.fn(async () => [orphan('a')]);
    const remove = vi.fn(async () => {});
    const count = await deleteOrphanUploads({ blobs, store: { findOrphans, remove }, now: () => new Date('2026-10-09T10:00:00.000Z') });
    expect(count).toBe(1);
    expect(findOrphans).toHaveBeenCalledWith('2026-10-06T10:00:00.000Z', 100);
    expect([...blobs.files.keys()]).toEqual(['feltoltes/b']);
    expect(remove).toHaveBeenCalledWith(['a']);
  });

  it('does nothing when there is nothing to delete', async () => {
    const remove = vi.fn(async () => {});
    const store = { findOrphans: async () => [], remove };
    expect(await deleteOrphanUploads({ blobs: memoryBlobStore(), store, now: () => new Date() })).toBe(0);
    expect(remove).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 4: Futtasd, hogy lásd elbukni**

Run: `npx vitest run src/server/api.test.ts src/server/upload`
Expected: FAIL (hiányzó modulok).

- [ ] **Step 5: A megvalósítás**

`src/server/forms.ts`, az `isFormToken` sora helyett:

```ts
/** A UUID as text (upload ids, form tokens). */
export const isUuid = (value: unknown): value is string => typeof value === 'string' && UUID.test(value);

/** A one-time form token (a UUID) as the form sent it. */
export const isFormToken = isUuid;
```

Új fájl: `src/server/api.ts`

```ts
// What the JSON endpoints under /api share: the origin check and the response. Astro's checkOrigin only looks at
// form posts, not at JSON or raw file uploads, so every /api POST checks the Origin header itself.

export const FORBIDDEN_MESSAGE = 'Ezt a kérést nem fogadjuk el. Töltse újra az oldalt, és próbálja újra.';

/** Whether a POST comes from the site itself or one of the comma-separated extra origins. Browsers send Origin on every POST. */
export function originAllowed(request: Request, extraOrigins: string): boolean {
  const origin = request.headers.get('Origin');
  if (!origin) return false;
  if (origin === new URL(request.url).origin) return true;
  return extraOrigins
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .includes(origin);
}

export const jsonResponse = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
```

Új fájl: `src/server/upload/receive.ts`

```ts
// POST /api/uploads: one file as the request body, its name in X-File-Name. Checks the limiter, the size and the
// extension first, writes the stream straight to the file storage (nothing is held in memory), then reads back the
// first 4 KB to check that the content is what the name says; a misfit is deleted
// (docs/superpowers/specs/2026-10-09-webshop-4a-4b-design.md, 6.).
import { detectArtworkFormat } from '@/domain/artwork/detect';
import { artworkFileTypeOf } from '@/domain/artwork/filetypes';
import {
  cleanFileName,
  contentTypeOf,
  formatFitsExtension,
  MAX_UPLOAD_BYTES,
  UPLOAD_TOO_LARGE_MESSAGE,
  UPLOAD_TYPE_MESSAGE,
  UPLOAD_UNAVAILABLE_MESSAGE,
} from '@/domain/uploads';
import { jsonResponse } from '../api';
import { TOO_MANY_MESSAGE } from '../forms';
import type { BlobStore } from './blob-store';
import type { UploadStore } from './store';

const HEAD_BYTES = 4096;

export interface ReceiveUploadDeps {
  /** Missing when R2 is not bound: the customer is offered e-mail instead. */
  blobs: BlobStore | undefined;
  store: Pick<UploadStore, 'insert'>;
  allow: () => Promise<boolean>;
  now: () => Date;
  newId: () => string;
}

export interface UploadInput {
  /** The X-File-Name header (URI-encoded). */
  fileName: string | null;
  /** The Content-Length header. */
  length: number | null;
  body: ReadableStream<Uint8Array> | null;
}

const refuse = (status: number, error: string, emailFallback = false) =>
  jsonResponse(status, emailFallback ? { error, emailFallback: true } : { error });

export async function receiveUpload(input: UploadInput, deps: ReceiveUploadDeps): Promise<Response> {
  if (!(await deps.allow())) return refuse(429, TOO_MANY_MESSAGE);
  if (!deps.blobs) return refuse(503, UPLOAD_UNAVAILABLE_MESSAGE, true);
  const name = cleanFileName(input.fileName);
  if (!name) return refuse(400, 'Hiányzik a fájl neve.');
  if (input.length === null || !Number.isSafeInteger(input.length) || input.length <= 0) {
    return refuse(411, 'Hiányzik a fájl mérete.');
  }
  if (input.length > MAX_UPLOAD_BYTES) return refuse(413, UPLOAD_TOO_LARGE_MESSAGE, true);
  const fileType = artworkFileTypeOf(name);
  if (!fileType) return refuse(415, UPLOAD_TYPE_MESSAGE, true);
  if (!input.body) return refuse(400, 'Hiányzik a fájl.');

  const id = deps.newId();
  const key = `feltoltes/${id}`;
  const contentType = contentTypeOf(fileType.format);
  try {
    await deps.blobs.put(key, input.body, input.length, contentType);
  } catch (error) {
    console.error('A feltöltés mentése nem sikerült:', error);
    return refuse(503, UPLOAD_UNAVAILABLE_MESSAGE, true);
  }
  const format = detectArtworkFormat(await deps.blobs.head(key, HEAD_BYTES), name);
  if (!formatFitsExtension(fileType.format, format)) {
    await deps.blobs.delete([key]);
    return refuse(415, UPLOAD_TYPE_MESSAGE, true);
  }
  try {
    await deps.store.insert({
      id,
      r2Key: key,
      fileName: name,
      sizeBytes: input.length,
      format,
      contentType: contentTypeOf(format),
      createdAt: deps.now().toISOString(),
    });
  } catch (error) {
    console.error('A feltöltés adatai nem menthetők:', error);
    await deps.blobs.delete([key]);
    return refuse(503, UPLOAD_UNAVAILABLE_MESSAGE, true);
  }
  return jsonResponse(201, { id, name, size: input.length, format });
}
```

(A D1-be a felismert formátum tartalomtípusa kerül, így egy `.jpg` nevű PNG letöltéskor `image/png`; az R2-objektumé a kiterjesztés szerinti marad, de a letöltés a D1-ből veszi.)

Új fájl: `src/server/upload/download.ts`

```ts
// GET /api/uploads/<id>: the workshop's link to a customer's file. Only files of an order, and only for
// UPLOAD_LINK_DAYS after the order arrived. Always an attachment that cannot run scripts (an SVG could).
import { DAY_MS, UPLOAD_LINK_DAYS } from '@/domain/uploads';
import { isUuid } from '../forms';
import type { BlobStore } from './blob-store';
import type { UploadStore } from './store';

export interface DownloadDeps {
  blobs: BlobStore | undefined;
  store: Pick<UploadStore, 'findDownloadable'>;
  now: () => Date;
}

const text = (status: number, body: string) =>
  new Response(body, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });

/** "attachment" with an ASCII name for old clients and the real one (RFC 6266) for the rest. */
export function contentDisposition(name: string): string {
  const ascii = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7e]/g, '_')
    .replace(/["\\]/g, '_');
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}

export async function downloadUpload(id: string, deps: DownloadDeps): Promise<Response> {
  if (!isUuid(id)) return text(404, 'Nincs ilyen fájl.');
  const since = new Date(deps.now().getTime() - UPLOAD_LINK_DAYS * DAY_MS).toISOString();
  const record = await deps.store.findDownloadable(id, since);
  if (!record) return text(404, 'Nincs ilyen fájl, vagy a link lejárt.');
  if (!deps.blobs) return text(503, 'A fájltár most nem elérhető.');
  const blob = await deps.blobs.get(record.r2Key);
  if (!blob) return text(404, 'A fájl már nincs meg.');
  return new Response(blob.body, {
    status: 200,
    headers: {
      'Content-Type': record.contentType,
      'Content-Length': String(blob.size),
      'Content-Disposition': contentDisposition(record.fileName),
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': 'sandbox',
      'Cache-Control': 'private, no-store',
    },
  });
}
```

Új fájl: `src/server/upload/cleanup.ts`

```ts
// The cron's job: deletes the uploads no order used within UPLOAD_ORPHAN_DAYS, from the file storage and from D1.
import { DAY_MS, UPLOAD_ORPHAN_DAYS } from '@/domain/uploads';
import type { BlobStore } from './blob-store';
import type { UploadStore } from './store';

export interface CleanupDeps {
  blobs: BlobStore;
  store: Pick<UploadStore, 'findOrphans' | 'remove'>;
  now: () => Date;
  /** Files per run; the rest waits for the next run. */
  limit?: number;
}

export async function deleteOrphanUploads({ blobs, store, now, limit = 100 }: CleanupDeps): Promise<number> {
  const before = new Date(now().getTime() - UPLOAD_ORPHAN_DAYS * DAY_MS).toISOString();
  const orphans = await store.findOrphans(before, limit);
  if (orphans.length === 0) return 0;
  await blobs.delete(orphans.map((upload) => upload.r2Key));
  await store.remove(orphans.map((upload) => upload.id));
  return orphans.length;
}
```

- [ ] **Step 6: Futtasd újra**

Run: `npx vitest run src/server`
Expected: PASS.

- [ ] **Step 7: Az útvonalak és a beállítások**

Új fájl: `src/pages/api/uploads/index.ts`

```ts
// POST /api/uploads (src/server/upload/receive.ts).
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { FORBIDDEN_MESSAGE, jsonResponse, originAllowed } from '@/server/api';
import { limiterAllows } from '@/server/forms';
import { r2BlobStore } from '@/server/upload/blob-store';
import { d1UploadStore } from '@/server/upload/d1-store';
import { receiveUpload } from '@/server/upload/receive';

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!originAllowed(request, env.ALLOWED_ORIGINS)) return jsonResponse(403, { error: FORBIDDEN_MESSAGE });
  const length = request.headers.get('Content-Length');
  return receiveUpload(
    { fileName: request.headers.get('X-File-Name'), length: length === null ? null : Number(length), body: request.body },
    {
      blobs: env.UPLOADS ? r2BlobStore(env.UPLOADS) : undefined,
      store: d1UploadStore(env.DB),
      allow: () => limiterAllows(env.UPLOAD_LIMITER, `feltoltes:${clientAddress}`),
      now: () => new Date(),
      newId: () => crypto.randomUUID(),
    },
  );
};
```

Új fájl: `src/pages/api/uploads/[id].ts`

```ts
// GET /api/uploads/<id>: the workshop's download link (src/server/upload/download.ts).
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { r2BlobStore } from '@/server/upload/blob-store';
import { d1UploadStore } from '@/server/upload/d1-store';
import { downloadUpload } from '@/server/upload/download';

export const GET: APIRoute = ({ params }) =>
  downloadUpload(params.id ?? '', {
    blobs: env.UPLOADS ? r2BlobStore(env.UPLOADS) : undefined,
    store: d1UploadStore(env.DB),
    now: () => new Date(),
  });
```

`wrangler.jsonc`: minden `ratelimits` tömb (a felső szinten, a `previews`-ban, az `env.galeria`-ban és az `env.production`-ben) így néz ki:

```jsonc
  "ratelimits": [
    { "name": "FORM_LIMITER", "namespace_id": "1001", "simple": { "limit": 5, "period": 60 } },
    // File uploads: at most 20 files per visitor (IP) and minute (src/server/upload/receive.ts).
    { "name": "UPLOAD_LIMITER", "namespace_id": "1002", "simple": { "limit": 20, "period": 60 } }
  ],
```

`src/env.d.ts`, a `FORM_LIMITER` után:

```ts
    /** Rate limiter of file uploads: at most 20 per visitor and minute (key "feltoltes:<ip>"). */
    UPLOAD_LIMITER: RateLimit;
```

és a `FORM_LIMITER` megjegyzésében a kulcsok: `"visszahivas:<ip>", "ajanlat:<ip>", "rendeles:<ip>"`.

- [ ] **Step 8: Ellenőrzés és commit**

Run: `npm test && npm run check && npm run typecheck`
Expected: minden zöld.

```bash
git add src/server/api.ts src/server/api.test.ts src/server/forms.ts src/server/upload src/pages/api/uploads wrangler.jsonc src/env.d.ts
git -c user.name=Claude -c user.email=noreply@anthropic.com commit -q -F - <<'EOF'
Accept uploads, serve them to the workshop, and delete unused ones

POST /api/uploads writes the file straight to R2 and checks its first bytes
against its name; GET /api/uploads/<id> serves ordered files as sandboxed
attachments for 90 days. Every /api POST checks the Origin header itself.
A new UPLOAD_LIMITER allows 20 uploads per visitor and minute.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 5: A rendelések tárolója

**Files:**
- Create: `src/server/order/token.ts`, `src/server/order/token.test.ts`, `src/server/order/store.ts`, `src/server/order/d1-store.ts`, `src/server/order/d1-store.test.ts`

**Interfaces:**
- Consumes: Task 3 táblák és `d1UploadStore`; `d1NotificationQueue` (`src/server/notify/queue.ts`); `priceCart`, `describeConfiguration` (`@/domain/pricing`).
- Produces:
  - `newStatusToken(): string` (22 karakter, base64url), `isStatusToken(value: unknown): value is string`, `statusPath(token: string): string` → `/rendeles/<token>`
  - `OrderAddress`, `OrderCustomer`, `OrderFile { id; name; sizeBytes }`, `StoredOrderItem`, `OrderTotals`, `StoredOrder`, `NewOrderItem`, `NewOrder`, `SavedOrder { id; statusToken; created }`
  - `interface OrderStore extends NotificationStore<StoredOrder> { insert(order: NewOrder): Promise<SavedOrder>; findByFormToken(formToken: string): Promise<{ id: number; statusToken: string } | null>; findByStatusToken(statusToken: string): Promise<StoredOrder | null> }`, `d1OrderStore(db: D1Database): OrderStore`

- [ ] **Step 1: A token tesztje**

Új fájl: `src/server/order/token.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { isStatusToken, newStatusToken, statusPath } from './token';

describe('status tokens', () => {
  it('are 128 random bits in 22 URL-safe characters', () => {
    const tokens = new Set(Array.from({ length: 50 }, newStatusToken));
    expect(tokens.size).toBe(50);
    for (const token of tokens) expect(isStatusToken(token)).toBe(true);
  });

  it('refuses anything else, and builds the status path', () => {
    for (const value of ['', 'abc', 'x'.repeat(23), 'aaaaaaaaaaaaaaaaaaaa+/', null, 42]) expect(isStatusToken(value)).toBe(false);
    expect(statusPath('AbCdEfGhIjKlMnOpQrStUv')).toBe('/rendeles/AbCdEfGhIjKlMnOpQrStUv');
  });
});
```

- [ ] **Step 2: A D1-tároló tesztje**

Új fájl: `src/server/order/d1-store.test.ts`

```ts
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { describeConfiguration, priceCart, type ProductConfig } from '@/domain/pricing';
import { testDatabase } from '../test-d1';
import { d1UploadStore } from '../upload/d1-store';
import { d1OrderStore } from './d1-store';
import type { NewOrder } from './store';

let t: Awaited<ReturnType<typeof testDatabase>>;

beforeAll(async () => {
  t = await testDatabase();
}, 60_000);

afterAll(async () => {
  await t?.dispose();
});

beforeEach(async () => {
  await t.reset();
  const uploads = d1UploadStore(t.db);
  const file = (id: string, fileName: string, sizeBytes: number) => ({
    id,
    r2Key: `feltoltes/${id}`,
    fileName,
    sizeBytes,
    format: 'pdf',
    contentType: 'application/pdf',
    createdAt: '2026-10-09T09:00:00.000Z',
  });
  await uploads.insert(file(A, 'logo.pdf', 1234));
  await uploads.insert(file(B, 'helyszin.jpg', 5678));
});

const A = '3f8a2b6c-1d4e-4f5a-9b7c-0e1d2c3b4a59';
const B = '9c1d2e3f-4a5b-4c6d-8e7f-a0b1c2d3e4f5';
const NOW = '2026-10-09T10:00:00.000Z';
const MOLINO: ProductConfig = { productId: 'molino', materialId: 'standard', edgeFinishId: 'szeges-ringli', widthCm: 200, heightCm: 100, quantity: 2, express: false };
const PLAKAT: ProductConfig = { productId: 'plakat', formatId: 'a2', paperFinish: 'matt', orientation: 'allo', quantity: 1, express: true };
const PRICE = priceCart([{ config: MOLINO }, { config: PLAKAT }], 'telepites');
const PREFLIGHT = { dpi: 150, rating: 'kivalo', aspectMismatch: false } as const;

function order(token: string, extra: Partial<NewOrder> = {}): NewOrder {
  return {
    formToken: token,
    statusToken: `s-${token}`,
    siteOrigin: 'https://stiletdekor.example',
    customer: { name: 'Minta Mária', email: 'maria@example.hu', phone: '+36 70 123 4567', company: 'Minta Kft.', taxNumber: '12345676-1-42' },
    billingAddress: { postalCode: '1061', city: 'Budapest', address: 'Minta utca 1.' },
    shippingMethod: 'telepites',
    shippingAddress: { postalCode: '9021', city: 'Győr', address: 'Minta tér 2.' },
    surveyRequested: true,
    note: 'Hívjanak előtte.',
    price: PRICE,
    items: [
      { config: MOLINO, description: describeConfiguration(MOLINO), price: PRICE.items[0]!, uploadIds: [A], preflight: PREFLIGHT },
      { config: PLAKAT, description: describeConfiguration(PLAKAT), price: PRICE.items[1]!, uploadIds: [] },
    ],
    sitePhotoIds: [B],
    source: '/kosar',
    createdAt: NOW,
    ...extra,
  };
}

describe('d1OrderStore', () => {
  it('saves the order with its items, files and first event, and reads it back by its status token', async () => {
    const store = d1OrderStore(t.db);
    const saved = await store.insert(order('t1'));
    expect(saved).toEqual({ id: expect.any(Number), statusToken: 's-t1', created: true });
    expect(await store.findByStatusToken('s-t1')).toEqual({
      id: saved.id,
      statusToken: 's-t1',
      status: 'beerkezett',
      siteOrigin: 'https://stiletdekor.example',
      customer: { name: 'Minta Mária', email: 'maria@example.hu', phone: '+36 70 123 4567', company: 'Minta Kft.', taxNumber: '12345676-1-42' },
      billingAddress: { postalCode: '1061', city: 'Budapest', address: 'Minta utca 1.' },
      shippingMethod: 'telepites',
      shippingAddress: { postalCode: '9021', city: 'Győr', address: 'Minta tér 2.' },
      surveyRequested: true,
      note: 'Hívjanak előtte.',
      totals: {
        itemsNet: PRICE.itemsNet,
        shippingNet: 0,
        shippingPriceOnRequest: true,
        netTotal: PRICE.netTotal,
        vatTotal: PRICE.vatTotal,
        grossTotal: PRICE.grossTotal,
      },
      items: [
        {
          position: 0,
          productId: 'molino',
          description: describeConfiguration(MOLINO),
          quantity: 2,
          express: false,
          netTotal: PRICE.items[0]!.netTotal,
          vatTotal: PRICE.items[0]!.vatTotal,
          grossTotal: PRICE.items[0]!.grossTotal,
          preflight: PREFLIGHT,
          files: [{ id: A, name: 'logo.pdf', sizeBytes: 1234 }],
        },
        {
          position: 1,
          productId: 'plakat',
          description: describeConfiguration(PLAKAT),
          quantity: 1,
          express: true,
          netTotal: PRICE.items[1]!.netTotal,
          vatTotal: PRICE.items[1]!.vatTotal,
          grossTotal: PRICE.items[1]!.grossTotal,
          files: [],
        },
      ],
      sitePhotos: [{ id: B, name: 'helyszin.jpg', sizeBytes: 5678 }],
      source: '/kosar',
      createdAt: NOW,
    });
    const { results } = await t.db.prepare('SELECT status_from, status_to, actor FROM order_events').all();
    expect(results).toEqual([{ status_from: null, status_to: 'beerkezett', actor: 'vasarlo' }]);
  });

  it('saves a resubmitted form only once', async () => {
    const store = d1OrderStore(t.db);
    const first = await store.insert(order('t1'));
    expect(await store.insert(order('t1', { statusToken: 'masik' }))).toEqual({ id: first.id, statusToken: 's-t1', created: false });
    expect(await store.findByFormToken('t1')).toEqual({ id: first.id, statusToken: 's-t1' });
    expect(await t.db.prepare('SELECT COUNT(*) AS n FROM orders').first('n')).toBe(1);
  });

  it('leaves a file with the order that used it first', async () => {
    const store = d1OrderStore(t.db);
    await store.insert(order('t1'));
    await store.insert(order('t2', { sitePhotoIds: [] }));
    const second = await store.findByStatusToken('s-t2');
    expect(second?.items[0]?.files).toEqual([]);
  });

  it('knows nothing about unknown tokens', async () => {
    const store = d1OrderStore(t.db);
    expect(await store.findByStatusToken('nincs')).toBeNull();
    expect(await store.findByFormToken('nincs')).toBeNull();
  });

  it('queues the workshop e-mail with the whole order', async () => {
    const store = d1OrderStore(t.db);
    const { id } = await store.insert(order('t1'));
    const now = new Date(NOW);
    expect(await store.pendingNotificationIds(now)).toEqual([id]);
    const claimed = await store.claimForNotification(id, now);
    expect(claimed?.items).toHaveLength(2);
    expect(claimed?.sitePhotos).toEqual([{ id: B, name: 'helyszin.jpg', sizeBytes: 5678 }]);
    expect(await store.claimForNotification(id, now)).toBeNull();
    await store.markNotified(id, now);
    expect(await store.pendingNotificationIds(now)).toEqual([]);
  });
});
```

- [ ] **Step 3: Futtasd, hogy lásd elbukni**

Run: `npx vitest run src/server/order`
Expected: FAIL (hiányzó modulok).

- [ ] **Step 4: A token, a felület és a D1-tároló**

Új fájl: `src/server/order/token.ts`

```ts
// The secret of an order's status page (/rendeles/<token>): 128 random bits, base64url without padding.
const STATUS_TOKEN = /^[A-Za-z0-9_-]{22}$/;

export function newStatusToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export const isStatusToken = (value: unknown): value is string => typeof value === 'string' && STATUS_TOKEN.test(value);

export const statusPath = (token: string): string => `/rendeles/${token}`;
```

Új fájl: `src/server/order/store.ts`

```ts
// Where webshop orders are kept, as an interface: the API and the status page use the D1 version (d1-store.ts),
// handler tests a fake.
import type { ShippingMethodId, ShopProductId } from '@/domain/catalog';
import type { OrderStatus } from '@/domain/orders';
import type { CartPrice, ConfigurationPrice, ProductConfig } from '@/domain/pricing';
import type { PreflightSummary } from '@/domain/schemas';
import type { NotificationStore } from '../notify/queue';

export interface OrderAddress {
  postalCode: string;
  city: string;
  address: string;
}

export interface OrderCustomer {
  name: string;
  email: string;
  phone: string;
  company?: string | undefined;
  taxNumber?: string | undefined;
}

export interface OrderFile {
  id: string;
  name: string;
  sizeBytes: number;
}

export interface StoredOrderItem {
  position: number;
  productId: ShopProductId;
  description: string;
  quantity: number;
  express: boolean;
  netTotal: number;
  vatTotal: number;
  grossTotal: number;
  /** The browser's preflight; informational only. */
  preflight?: PreflightSummary | undefined;
  files: OrderFile[];
}

export interface OrderTotals {
  itemsNet: number;
  shippingNet: number;
  /** Installation: no list price, the workshop quotes it when confirming. */
  shippingPriceOnRequest: boolean;
  netTotal: number;
  vatTotal: number;
  grossTotal: number;
}

/** A saved order. Its reference is formatReference('R', id). */
export interface StoredOrder {
  id: number;
  statusToken: string;
  status: OrderStatus;
  /** Where the order arrived (https://…), for the e-mail's links. */
  siteOrigin: string;
  customer: OrderCustomer;
  billingAddress: OrderAddress;
  shippingMethod: ShippingMethodId;
  /** Courier or installation address; the billing address when missing. */
  shippingAddress?: OrderAddress | undefined;
  surveyRequested: boolean;
  note?: string | undefined;
  totals: OrderTotals;
  items: StoredOrderItem[];
  /** Photos of the installation site. */
  sitePhotos: OrderFile[];
  source?: string | undefined;
  /** ISO timestamp (UTC). */
  createdAt: string;
}

export interface NewOrderItem {
  config: ProductConfig;
  description: string;
  price: ConfigurationPrice;
  uploadIds: string[];
  preflight?: PreflightSummary | undefined;
}

export interface NewOrder {
  formToken: string;
  statusToken: string;
  siteOrigin: string;
  customer: OrderCustomer;
  billingAddress: OrderAddress;
  shippingMethod: ShippingMethodId;
  shippingAddress?: OrderAddress | undefined;
  surveyRequested: boolean;
  note?: string | undefined;
  /** The server's own calculation (priceCart). */
  price: CartPrice;
  items: NewOrderItem[];
  sitePhotoIds: string[];
  source?: string | undefined;
  createdAt: string;
}

export interface SavedOrder {
  id: number;
  statusToken: string;
  /** False when the form token was used before: the first order is returned, nothing new is saved. */
  created: boolean;
}

export interface OrderStore extends NotificationStore<StoredOrder> {
  /** Saves the order, its items and its first event and binds its uploads, all in one transaction. */
  insert(order: NewOrder): Promise<SavedOrder>;
  findByFormToken(formToken: string): Promise<{ id: number; statusToken: string } | null>;
  findByStatusToken(statusToken: string): Promise<StoredOrder | null>;
}
```

Új fájl: `src/server/order/d1-store.ts`

```ts
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
```

- [ ] **Step 5: Futtasd újra**

Run: `npx vitest run src/server/order`
Expected: PASS.

- [ ] **Step 6: Ellenőrzés és commit**

Run: `npm test && npm run check`
Expected: minden zöld.

```bash
git add src/server/order
git -c user.name=Claude -c user.email=noreply@anthropic.com commit -q -F - <<'EOF'
Save webshop orders with their items, files and first event

The order, its items, the event log's first line and the binding of its
uploads go to D1 in one batch; a resubmitted form token returns the first
order. Each order gets a 128-bit status token for its status page.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 6: A rendelés beküldése, a műhely levele és az újrapróbálás

**Files:**
- Create: `src/server/order/submit.ts`, `src/server/order/submit.test.ts`, `src/server/order/email.ts`, `src/server/order/email.test.ts`, `src/server/order/test-order.ts`, `src/server/order/notify.ts`, `src/server/order/notify.test.ts`
- Create: `src/pages/api/orders.ts`
- Modify: `src/worker.ts`

**Interfaces:**
- Consumes: Task 1 (`formatReference('R', …)`, `OrderRequestSchema` `sitePhotoIds`-szal, `formatFileSize`), Task 3 (`UploadStore.findMany`, `r2BlobStore`, `d1UploadStore`), Task 4 (`deleteOrphanUploads`, `originAllowed`, `jsonResponse`), Task 5 (`OrderStore`, `StoredOrder`, `statusPath`, `newStatusToken`, `d1OrderStore`).
- Produces:
  - `submitOrder(input: unknown, deps: SubmitOrderDeps): Promise<OrderResult>`, `interface OrderResult { status: 200 | 201 | 400 | 422 | 429 | 500; body: OrderResponseBody; notifyId?: number }`, `type OrderResponseBody = { reference: string | null; statusPath: string | null } | { errors: Record<string, string> } | { error: string }`
  - `ORDER_INVALID_MESSAGE`, `ORDER_FILE_MISSING_MESSAGE`, `SITE_PHOTO_MISSING_MESSAGE`, `issueKey(path): string` (pontozott kulcs, például `customer.billingAddress.city`, `items.0.config.widthCm`)
  - `orderEmail(order: StoredOrder, to: string): OutgoingEmail`
  - `notifyOrder(id, deps)`, `deliverPendingOrders(deps)`

- [ ] **Step 1: A beküldés tesztje**

Új fájl: `src/server/order/submit.test.ts`

```ts
import { describe, expect, it, vi } from 'vitest';
import { describeConfiguration, priceCart, type ProductConfig } from '@/domain/pricing';
import type { UploadRecord } from '../upload/store';
import type { NewOrder } from './store';
import { ORDER_FILE_MISSING_MESSAGE, submitOrder, type SubmitOrderDeps } from './submit';

const TOKEN = '3f8a2b6c-1d4e-4f5a-9b7c-0e1d2c3b4a59';
const A = '9c1d2e3f-4a5b-4c6d-8e7f-a0b1c2d3e4f5';
const B = '0b1c2d3e-4f5a-4b6c-8d7e-9f0a1b2c3d4e';
const STATUS = 'AbCdEfGhIjKlMnOpQrStUv';
const NOW = new Date('2026-10-09T10:00:00.000Z');
const MOLINO: ProductConfig = { productId: 'molino', materialId: 'standard', edgeFinishId: 'szeges-ringli', widthCm: 200, heightCm: 100, quantity: 2, express: false };

const INPUT = {
  formToken: TOKEN,
  honlap: '',
  source: '/kosar',
  customer: {
    name: 'Minta Mária',
    email: 'maria@example.hu',
    phone: '+36 70 123 4567',
    company: '',
    billingAddress: { postalCode: '1061', city: 'Budapest', address: 'Minta utca 1.' },
  },
  shippingMethod: 'futar',
  items: [{ config: MOLINO, uploadIds: [A], preflight: { dpi: 150, rating: 'kivalo', aspectMismatch: false } }],
  acceptTerms: true,
  // The browser never decides the price: this must be ignored.
  grossTotal: 1,
};

const record = (id: string, orderId: number | null): UploadRecord => ({
  id,
  r2Key: `feltoltes/${id}`,
  fileName: 'logo.pdf',
  sizeBytes: 1,
  format: 'pdf',
  contentType: 'application/pdf',
  createdAt: NOW.toISOString(),
  orderId,
  orderItemId: null,
});

function deps(overrides: Partial<SubmitOrderDeps> = {}, uploads: UploadRecord[] = [record(A, null)]) {
  const saved: NewOrder[] = [];
  const d: SubmitOrderDeps = {
    store: {
      insert: vi.fn(async (o: NewOrder) => (saved.push(o), { id: 7, statusToken: o.statusToken, created: true })),
      findByFormToken: vi.fn(async () => null),
    },
    uploads: { findMany: vi.fn(async (ids: readonly string[]) => uploads.filter((u) => ids.includes(u.id))) },
    allow: async () => true,
    now: () => NOW,
    newStatusToken: () => STATUS,
    siteOrigin: 'https://stiletdekor.example',
    ...overrides,
  };
  return { saved, deps: d };
}

describe('submitOrder', () => {
  it('saves a valid order at the price the server calculates, and answers with the reference and the status link', async () => {
    const { saved, deps: d } = deps();
    expect(await submitOrder(INPUT, d)).toEqual({
      status: 201,
      body: { reference: 'R-0007', statusPath: `/rendeles/${STATUS}` },
      notifyId: 7,
    });
    const price = priceCart([{ config: MOLINO }], 'futar');
    expect(saved[0]).toEqual({
      formToken: TOKEN,
      statusToken: STATUS,
      siteOrigin: 'https://stiletdekor.example',
      customer: { name: 'Minta Mária', email: 'maria@example.hu', phone: '+36 70 123 4567', company: undefined, taxNumber: undefined },
      billingAddress: { postalCode: '1061', city: 'Budapest', address: 'Minta utca 1.' },
      shippingMethod: 'futar',
      shippingAddress: undefined,
      surveyRequested: false,
      note: undefined,
      price,
      items: [
        {
          config: MOLINO,
          description: describeConfiguration(MOLINO),
          price: price.items[0],
          uploadIds: [A],
          preflight: { dpi: 150, rating: 'kivalo', aspectMismatch: false },
        },
      ],
      sitePhotoIds: [],
      source: '/kosar',
      createdAt: NOW.toISOString(),
    });
  });

  it('answers a resubmitted form with the first order and saves nothing', async () => {
    const { saved, deps: d } = deps({
      store: { insert: vi.fn(), findByFormToken: vi.fn(async () => ({ id: 3, statusToken: 'x'.repeat(22) })) },
    });
    expect(await submitOrder(INPUT, d)).toEqual({ status: 200, body: { reference: 'R-0003', statusPath: `/rendeles/${'x'.repeat(22)}` } });
    expect(saved).toEqual([]);
  });

  it('names every wrong field with its dotted key', async () => {
    const result = await submitOrder({ ...INPUT, customer: { ...INPUT.customer, email: 'nem' }, acceptTerms: false }, deps().deps);
    expect(result).toEqual({
      status: 422,
      body: {
        errors: {
          'customer.email': 'Kérjük, érvényes e-mail-címet adjon meg.',
          acceptTerms: 'A rendeléshez fogadja el az Általános Szerződési Feltételeket.',
        },
      },
    });
  });

  it('refuses files that are gone or belong to another order', async () => {
    const gone = await submitOrder({ ...INPUT, items: [{ config: MOLINO, uploadIds: [B] }] }, deps().deps);
    expect(gone).toEqual({ status: 422, body: { errors: { 'items.0.uploadIds': ORDER_FILE_MISSING_MESSAGE } } });
    const taken = await submitOrder(INPUT, deps({}, [record(A, 5)]).deps);
    expect(taken).toEqual({ status: 422, body: { errors: { 'items.0.uploadIds': ORDER_FILE_MISSING_MESSAGE } } });
  });

  it('pretends to accept a filled trap field, and refuses garbage and too many orders', async () => {
    const { saved, deps: d } = deps();
    expect(await submitOrder({ ...INPUT, honlap: 'x' }, d)).toEqual({ status: 201, body: { reference: null, statusPath: null } });
    expect(saved).toEqual([]);
    expect((await submitOrder('nem objektum', d)).status).toBe(400);
    expect((await submitOrder({ ...INPUT, formToken: 'nem-uuid' }, d)).status).toBe(400);
    expect((await submitOrder(INPUT, deps({ allow: async () => false }).deps)).status).toBe(429);
  });

  it('offers the phone when saving fails', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const failing = { insert: vi.fn(async () => Promise.reject(new Error('D1 down'))), findByFormToken: vi.fn(async () => null) };
    const result = await submitOrder(INPUT, deps({ store: failing }).deps);
    expect(result.status).toBe(500);
    expect(result.body).toEqual({ error: expect.stringContaining('+36 70 538 5030') });
    error.mockRestore();
  });
});
```

- [ ] **Step 2: A levél és az értesítés tesztje**

Új fájl: `src/server/order/test-order.ts` (a tesztek közös mintarendelése; nem tesztfájl, ezért importálható)

```ts
// A saved order for the e-mail and notification tests.
import type { StoredOrder } from './store';

export const FILE_A = '9c1d2e3f-4a5b-4c6d-8e7f-a0b1c2d3e4f5';
export const FILE_B = '0b1c2d3e-4f5a-4b6c-8d7e-9f0a1b2c3d4e';
export const STATUS_TOKEN = 'AbCdEfGhIjKlMnOpQrStUv';

export const ORDER: StoredOrder = {
  id: 7,
  statusToken: STATUS_TOKEN,
  status: 'beerkezett',
  siteOrigin: 'https://stiletdekor.example',
  customer: { name: 'Minta Mária', email: 'maria@example.hu', phone: '+36 70 123 4567', company: 'Minta Kft.', taxNumber: '12345676-1-42' },
  billingAddress: { postalCode: '1061', city: 'Budapest', address: 'Minta utca 1.' },
  shippingMethod: 'telepites',
  shippingAddress: { postalCode: '9021', city: 'Győr', address: 'Minta tér 2.' },
  surveyRequested: true,
  note: 'Hívjanak <előtte>.',
  totals: { itemsNet: 20000, shippingNet: 0, shippingPriceOnRequest: true, netTotal: 20000, vatTotal: 5400, grossTotal: 25400 },
  items: [
    {
      position: 0,
      productId: 'molino',
      description: 'Molinó · Standard frontlit molinó · 200 × 100 cm · Szegés + ringli',
      quantity: 2,
      express: false,
      netTotal: 18000,
      vatTotal: 4860,
      grossTotal: 22860,
      preflight: { dpi: 150, rating: 'kivalo', aspectMismatch: false },
      files: [{ id: FILE_A, name: 'logo.pdf', sizeBytes: 1_200_000 }],
    },
    {
      position: 1,
      productId: 'plakat',
      description: 'Plakát · A2 · Matt · álló',
      quantity: 1,
      express: false,
      netTotal: 2000,
      vatTotal: 540,
      grossTotal: 2540,
      files: [],
    },
  ],
  sitePhotos: [{ id: FILE_B, name: 'helyszin.jpg', sizeBytes: 830_000 }],
  source: '/kosar',
  createdAt: '2026-10-09T10:00:00.000Z',
};
```

Új fájl: `src/server/order/email.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { formatHuf } from '@/domain/money';
import { orderEmail } from './email';
import { FILE_A, FILE_B, ORDER, STATUS_TOKEN } from './test-order';

describe('orderEmail', () => {
  it('tells the workshop everything, with the files and the status page as links', () => {
    const email = orderEmail(ORDER, 'muhely@example.hu');
    expect(email.to).toBe('muhely@example.hu');
    expect(email.replyTo).toBe('maria@example.hu');
    expect(email.subject).toBe(`[R-0007] Rendelés ellenőrzésre – 2 tétel, ${formatHuf(25400)} – Minta Mária`);
    const lines = email.text.split('\n');
    expect(lines).toEqual(
      expect.arrayContaining([
        'Rendelésszám: R-0007',
        'Telefon: +36 70 123 4567',
        'Adószám: 12345676-1-42',
        'Átvétel: Telepítéssel',
        'A telepítés helyszíne: 9021 Győr, Minta tér 2.',
        'Helyszíni felmérés: kéri',
        '1. Molinó · Standard frontlit molinó · 200 × 100 cm · Szegés + ringli',
        `   2 db · ${formatHuf(22860)}`,
        `   Fájl: logo.pdf (1,2 MB): https://stiletdekor.example/api/uploads/${FILE_A}`,
        '2. Plakát · A2 · Matt · álló',
        '   Nincs feltöltött fájl: e-mailben küldi.',
        `   helyszin.jpg (830 kB): https://stiletdekor.example/api/uploads/${FILE_B}`,
        'Átvétel, nettó: egyedi, a visszaigazoláskor adja meg',
        `Bruttó végösszeg: ${formatHuf(25400)}`,
        `Az ügyfél állapotoldala: https://stiletdekor.example/rendeles/${STATUS_TOKEN}`,
      ]),
    );
    expect(email.text).toContain('Felbontás: 150 DPI');
    expect(email.html).toContain(`<a href="https://stiletdekor.example/api/uploads/${FILE_A}">`);
    expect(email.html).toContain('<a href="tel:+36701234567">');
    expect(email.html).toContain('Hívjanak &lt;előtte&gt;.');
    expect(email.html).not.toContain('<előtte>');
  });
});
```

Új fájl: `src/server/order/notify.test.ts`

```ts
import { describe, expect, it, vi } from 'vitest';
import type { OutgoingEmail } from '../notify/mailer';
import { ORDER } from './test-order';
import { notifyOrder } from './notify';
import type { OrderStore } from './store';

describe('notifyOrder', () => {
  it('sends the workshop the order e-mail once, and marks it sent', async () => {
    const sent: OutgoingEmail[] = [];
    const store = {
      claimForNotification: vi.fn(async () => ORDER),
      markNotified: vi.fn(async () => {}),
      recordNotificationFailure: vi.fn(async () => {}),
      pendingNotificationIds: vi.fn(async () => []),
    } as unknown as OrderStore;
    const mailer = { send: vi.fn(async (email: OutgoingEmail) => void sent.push(email)) };
    expect(await notifyOrder(7, { store, mailer, to: 'muhely@example.hu', now: () => new Date() })).toBe('sent');
    expect(sent[0]?.subject).toMatch(/^\[R-0007\] Rendelés ellenőrzésre/);
    expect(store.markNotified).toHaveBeenCalledOnce();
  });
});
```


- [ ] **Step 3: Futtasd, hogy lásd elbukni**

Run: `npx vitest run src/server/order`
Expected: FAIL (hiányzó `submit`, `email`, `notify`).

- [ ] **Step 4: A megvalósítás**

Új fájl: `src/server/order/submit.ts`

```ts
// POST /api/orders: the checkout island's JSON. Trap field, rate limit, the one-time form token, the shared schema,
// the uploads, then the server's own price (priceCart: whatever price the browser sends is ignored) and one
// transaction (docs/superpowers/specs/2026-10-09-webshop-4a-4b-design.md, 7.).
import { formatReference } from '@/domain/reference';
import { ConfigurationError, describeConfiguration, priceCart } from '@/domain/pricing';
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
    found = new Map((ids.length ? await deps.uploads.findMany(ids) : []).map((upload) => [upload.id, upload]));
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
```

Ha a teszt a `customer` objektumon a `company: undefined, taxNumber: undefined` kulcsokat várja, de a séma kihagyja őket: a `toEqual` az `undefined` értékű és a hiányzó kulcsot egyformának veszi, ez így rendben van.

Új fájl: `src/server/order/email.ts`

```ts
// The workshop's e-mail about a webshop order: the customer, every item with its files' download links, the totals,
// and the customer's status page (to paste into the manual reply). Replies go straight to the customer.
import { SHIPPING_METHODS } from '@/domain/catalog';
import { formatFileSize, formatHuf } from '@/domain/money';
import { DPI_RATINGS } from '@/domain/preflight';
import { formatReference } from '@/domain/reference';
import { budapestDateTime, escapeHtml, oneLine, telHref } from '../notify/format';
import type { OutgoingEmail } from '../notify/mailer';
import type { OrderAddress, OrderFile, StoredOrder, StoredOrderItem } from './store';
import { statusPath } from './token';

const INTRO = 'Új rendelés érkezett ellenőrzésre. Fizetési kötelezettség még nincs: visszaigazolás és díjbekérő kell.';
const NO_FILE = 'Nincs feltöltött fájl: e-mailben küldi.';

const addressText = (a: OrderAddress) => `${a.postalCode} ${a.city}, ${a.address}`;
const fileText = (file: OrderFile) => `${file.name} (${formatFileSize(file.sizeBytes)})`;
const preflightText = (item: StoredOrderItem) =>
  item.preflight
    ? `Felbontás: ${item.preflight.dpi} DPI, ${DPI_RATINGS[item.preflight.rating].label} (a böngésző mérte, tájékoztató)`
    : null;

export function orderEmail(order: StoredOrder, to: string): OutgoingEmail {
  const reference = formatReference('R', order.id);
  const method = SHIPPING_METHODS.find((m) => m.id === order.shippingMethod);
  const { customer, totals } = order;
  const fileUrl = (file: OrderFile) => `${order.siteOrigin}/api/uploads/${file.id}`;
  const statusUrl = `${order.siteOrigin}${statusPath(order.statusToken)}`;

  const rows: [string, string][] = [
    ['Rendelésszám', reference],
    ['Név', customer.name],
    ['Telefon', customer.phone],
    ['E-mail', customer.email],
  ];
  if (customer.company) rows.push(['Cég', customer.company]);
  if (customer.taxNumber) rows.push(['Adószám', customer.taxNumber]);
  rows.push(['Számlázási cím', addressText(order.billingAddress)], ['Átvétel', method?.name ?? order.shippingMethod]);
  if (method?.addressLabel) {
    rows.push([method.addressLabel, order.shippingAddress ? addressText(order.shippingAddress) : 'Ugyanaz, mint a számlázási cím']);
  }
  if (order.shippingMethod === 'telepites') rows.push(['Helyszíni felmérés', order.surveyRequested ? 'kéri' : 'nem kéri']);
  if (order.note) rows.push(['Megjegyzés', order.note]);
  if (order.source) rows.push(['Honnan', order.source]);
  rows.push(['Beérkezett', budapestDateTime(order.createdAt)]);

  const totalRows: [string, string][] = [
    ['Tételek, nettó', formatHuf(totals.itemsNet)],
    ['Átvétel, nettó', totals.shippingPriceOnRequest ? 'egyedi, a visszaigazoláskor adja meg' : formatHuf(totals.shippingNet)],
    ['Nettó', formatHuf(totals.netTotal)],
    ['ÁFA', formatHuf(totals.vatTotal)],
    ['Bruttó végösszeg', formatHuf(totals.grossTotal)],
  ];

  const text = [
    INTRO,
    '',
    ...rows.map(([label, value]) => `${label}: ${value}`),
    '',
    'Tételek',
    ...order.items.flatMap((item, index) => [
      `${index + 1}. ${item.description}`,
      `   ${item.quantity} db · ${formatHuf(item.grossTotal)}`,
      ...(item.files.length > 0 ? item.files.map((file) => `   Fájl: ${fileText(file)}: ${fileUrl(file)}`) : [`   ${NO_FILE}`]),
      ...(preflightText(item) ? [`   ${preflightText(item)}`] : []),
    ]),
    ...(order.sitePhotos.length > 0
      ? ['', 'Helyszíni fotók', ...order.sitePhotos.map((file) => `   ${fileText(file)}: ${fileUrl(file)}`)]
      : []),
    '',
    'Összesen',
    ...totalRows.map(([label, value]) => `${label}: ${value}`),
    '',
    `Az ügyfél állapotoldala: ${statusUrl}`,
  ].join('\n');

  const link = (href: string, label: string) => `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`;
  const cell = (label: string, value: string) =>
    label === 'Telefon' ? link(telHref(value), value) : label === 'E-mail' ? link(`mailto:${value}`, value) : escapeHtml(value);
  const table = (list: readonly [string, string][]) =>
    '<table>' +
    list.map(([label, value]) => `<tr><th align="left" style="padding:4px 12px 4px 0">${escapeHtml(label)}</th><td>${cell(label, value)}</td></tr>`).join('') +
    '</table>';
  const itemHtml = (item: StoredOrderItem) => {
    const files = item.files.length > 0 ? item.files.map((file) => `<li>${link(fileUrl(file), fileText(file))}</li>`).join('') : `<li>${NO_FILE}</li>`;
    const check = preflightText(item);
    return (
      `<li><p>${escapeHtml(item.description)}<br>${item.quantity} db · ${escapeHtml(formatHuf(item.grossTotal))}</p>` +
      `<ul>${files}${check ? `<li>${escapeHtml(check)}</li>` : ''}</ul></li>`
    );
  };
  const html = [
    `<p>${escapeHtml(INTRO)}</p>`,
    table(rows),
    `<h3>Tételek</h3><ol>${order.items.map(itemHtml).join('')}</ol>`,
    order.sitePhotos.length > 0
      ? `<h3>Helyszíni fotók</h3><ul>${order.sitePhotos.map((file) => `<li>${link(fileUrl(file), fileText(file))}</li>`).join('')}</ul>`
      : '',
    `<h3>Összesen</h3>${table(totalRows)}`,
    `<p>Az ügyfél állapotoldala: ${link(statusUrl, statusUrl)}</p>`,
  ].join('');

  return {
    to,
    subject: oneLine(`[${reference}] Rendelés ellenőrzésre – ${order.items.length} tétel, ${formatHuf(totals.grossTotal)} – ${customer.name}`),
    text,
    html,
    replyTo: customer.email,
  };
}
```

Új fájl: `src/server/order/notify.ts`

```ts
// Sends the workshop's e-mail about an order (right after it arrives, and from the cron).
import { formatReference } from '@/domain/reference';
import { deliverPending, type DeliverDeps, notifyOne } from '../notify/deliver';
import type { Mailer } from '../notify/mailer';
import type { NotificationStore } from '../notify/queue';
import { orderEmail } from './email';
import type { StoredOrder } from './store';

export interface OrderNotifyDeps {
  store: NotificationStore<StoredOrder>;
  mailer: Mailer;
  to: string;
  now: () => Date;
  logError?: (message: string) => void;
}

const delivery = (deps: OrderNotifyDeps): DeliverDeps<StoredOrder> => ({
  ...deps,
  compose: orderEmail,
  reference: (id) => formatReference('R', id),
  failure: 'A rendelés értesítése nem ment ki',
});

export const notifyOrder = (id: number, deps: OrderNotifyDeps) => notifyOne(id, delivery(deps));
export const deliverPendingOrders = (deps: OrderNotifyDeps) => deliverPending(delivery(deps));
```

- [ ] **Step 5: Futtasd újra**

Run: `npx vitest run src/server/order`
Expected: PASS. Ha a `DPI_RATINGS[…].label` szövege más, mint amit a teszt vár (a teszt csak a „Felbontás: 150 DPI” elejét nézi), nincs teendő.

- [ ] **Step 6: Az útvonal és a cron**

Új fájl: `src/pages/api/orders.ts`

```ts
// POST /api/orders (src/server/order/submit.ts): the order is saved, the workshop's e-mail goes out after the response.
import type { APIRoute } from 'astro';
import { env, waitUntil } from 'cloudflare:workers';
import { FORBIDDEN_MESSAGE, jsonResponse, originAllowed } from '@/server/api';
import { limiterAllows } from '@/server/forms';
import { mailerFor } from '@/server/notify/mailer';
import { d1OrderStore } from '@/server/order/d1-store';
import { notifyOrder } from '@/server/order/notify';
import { ORDER_INVALID_MESSAGE, submitOrder } from '@/server/order/submit';
import { newStatusToken } from '@/server/order/token';
import { d1UploadStore } from '@/server/upload/d1-store';

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!originAllowed(request, env.ALLOWED_ORIGINS)) return jsonResponse(403, { error: FORBIDDEN_MESSAGE });
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return jsonResponse(400, { error: ORDER_INVALID_MESSAGE });
  }
  const store = d1OrderStore(env.DB);
  const now = () => new Date();
  const result = await submitOrder(input, {
    store,
    uploads: d1UploadStore(env.DB),
    allow: () => limiterAllows(env.FORM_LIMITER, `rendeles:${clientAddress}`),
    now,
    newStatusToken,
    siteOrigin: new URL(request.url).origin,
  });
  if (result.notifyId !== undefined) {
    waitUntil(
      notifyOrder(result.notifyId, { store, mailer: mailerFor(env), to: env.ORDER_NOTIFY_EMAIL, now }).catch((error) =>
        console.error('A rendelés értesítése hibával leállt:', error),
      ),
    );
  }
  return jsonResponse(result.status, result.body);
};
```

`src/worker.ts` teljes új tartalma:

```ts
// The Worker's entry: Astro answers every request; the cron retries the workshop's notification e-mails and deletes
// the uploads no order used. (wrangler.jsonc "main"; the build's prerender worker keeps the adapter's own entry.)
import { handle } from '@astrojs/cloudflare/handler';
import { d1CallbackStore } from './server/callback/d1-store';
import { deliverPendingCallbacks } from './server/callback/notify';
import { mailerFor } from './server/notify/mailer';
import { d1OrderStore } from './server/order/d1-store';
import { deliverPendingOrders } from './server/order/notify';
import { d1QuoteStore } from './server/quote/d1-store';
import { deliverPendingQuotes } from './server/quote/notify';
import { r2BlobStore } from './server/upload/blob-store';
import { deleteOrphanUploads } from './server/upload/cleanup';
import { d1UploadStore } from './server/upload/d1-store';

export default {
  fetch: handle,
  async scheduled(_controller, env, ctx) {
    const common = { mailer: mailerFor(env), to: env.ORDER_NOTIFY_EMAIL, now: () => new Date() };
    ctx.waitUntil(
      Promise.all([
        deliverPendingCallbacks({ store: d1CallbackStore(env.DB), ...common }),
        deliverPendingQuotes({ store: d1QuoteStore(env.DB), ...common }),
        deliverPendingOrders({ store: d1OrderStore(env.DB), ...common }),
        env.UPLOADS
          ? deleteOrphanUploads({ blobs: r2BlobStore(env.UPLOADS), store: d1UploadStore(env.DB), now: common.now })
          : Promise.resolve(0),
      ]).then(([visszahivas, ajanlat, rendeles, toroltFajl]) => {
        if (visszahivas.sent || visszahivas.failed || ajanlat.sent || ajanlat.failed || rendeles.sent || rendeles.failed || toroltFajl) {
          console.info('Időzített feladatok:', { visszahivas, ajanlat, rendeles, toroltFajl });
        }
      }),
    );
  },
} satisfies ExportedHandler<Env>;
```

- [ ] **Step 7: Ellenőrzés és commit**

Run: `npm test && npm run check && npm run typecheck`
Expected: minden zöld.

```bash
git add src/server/order src/pages/api/orders.ts src/worker.ts
git -c user.name=Claude -c user.email=noreply@anthropic.com commit -q -F - <<'EOF'
Take webshop orders: repricing, saving and the workshop's e-mail

POST /api/orders checks the order with the shared schema and its uploads,
prices it on the server and saves it with an R- reference; the workshop gets
an e-mail with download links and the customer's status page, retried by the
cron, which now also deletes unused uploads.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 7: Az állapotoldal

**Files:**
- Modify: `src/layouts/Base.astro`, `src/layouts/Page.astro`
- Create: `src/pages/rendeles/[token].astro`

**Interfaces:**
- Consumes: Task 1 (`orderNextStep`, `formatReference('R', …)`), Task 5 (`d1OrderStore(db).findByStatusToken`, `isStatusToken`).
- Produces: `Base` és `Page` új propjai: `analytics?: boolean` (alapból `true`), `noindex?: boolean` (alapból `false`).

Ennek a feladatnak nincs egységtesztje: a logika (`orderNextStep`, a tároló) tesztelt, az oldalt a 15. feladat böngészős próbája nézi végig.

- [ ] **Step 1: A mérés és az indexelés kapcsolója**

`src/layouts/Base.astro`, a `Props`-ban a `theme` után:

```ts
  /** Cookie-free measuring; off on pages whose address is a secret (the order status page). */
  analytics?: boolean;
  /** Never index this page, not even on production. */
  noindex?: boolean;
```

a propok kiolvasása:

```ts
const { title, description, theme: themeOverride, analytics = true, noindex = false } = Astro.props;
```

a jeladó:

```ts
const beacon = analytics ? analyticsBeacon(env.CF_BEACON_TOKEN) : null;
```

és a `robots` meta:

```astro
    {(!indexable || noindex) && <meta name="robots" content="noindex, nofollow" />}
```

`src/layouts/Page.astro`: a `Props`-ba ugyanez a két mező (ugyanazzal a megjegyzéssel), a kiolvasás `const { title, description, currentHref, actionBar = true, theme, analytics, noindex } = Astro.props;`, és a `<Base title={title} description={description} theme={theme} analytics={analytics} noindex={noindex}>`.

- [ ] **Step 2: Az oldal**

Új fájl: `src/pages/rendeles/[token].astro`

```astro
---
// The customer's order status page on a secret link (/rendeles/<token>): reference, status, what comes next, the
// items and the totals, and no personal data, so a forwarded link reveals nothing. "?uj=1" adds the thank-you
// panel right after the order was sent (docs/superpowers/specs/2026-10-09-webshop-4a-4b-design.md, 10.).
import { env } from 'cloudflare:workers';
import { SHIPPING_METHODS } from '@/domain/catalog';
import { COMPANY } from '@/domain/company';
import { FINAL_PRICE_NOTICE, orderNextStep } from '@/domain/orders';
import { formatReference } from '@/domain/reference';
import Page from '@/layouts/Page.astro';
import { budapestDateTime } from '@/server/notify/format';
import { d1OrderStore } from '@/server/order/d1-store';
import { isStatusToken } from '@/server/order/token';
import { Notice } from '@/ui/Notice/Notice';
import { OrderStatusBadge } from '@/ui/OrderStatusBadge/OrderStatusBadge';
import { PriceBreakdown, type PriceRow } from '@/ui/PriceBreakdown/PriceBreakdown';
import { SuccessPanel } from '@/ui/SuccessPanel/SuccessPanel';

const token = Astro.params.token;
const order = isStatusToken(token) ? await d1OrderStore(env.DB).findByStatusToken(token) : null;
// Unknown or malformed token: an empty 404 makes Astro show the site's 404 page.
if (!order) return new Response(null, { status: 404 });

Astro.response.headers.set('Cache-Control', 'private, no-store');
Astro.response.headers.set('Referrer-Policy', 'no-referrer');
Astro.response.headers.set('X-Robots-Tag', 'noindex, nofollow');

const reference = formatReference('R', order.id);
const method = SHIPPING_METHODS.find((m) => m.id === order.shippingMethod);
const fresh = Astro.url.searchParams.get('uj') === '1';
const itemsGross = order.items.reduce((sum, item) => sum + item.grossTotal, 0);
const rows: PriceRow[] = [
  ...order.items.map((item) => ({
    label: item.description,
    detail: `${item.quantity} db · ${item.files.length > 0 ? item.files.map((file) => file.name).join(', ') : 'grafika e-mailben'}`,
    amount: item.grossTotal,
  })),
  order.totals.shippingPriceOnRequest
    ? { label: method?.name ?? 'Átvétel', amountText: 'egyedi' }
    : { label: method?.name ?? 'Átvétel', amount: order.totals.grossTotal - itemsGross, kind: 'muted' as const },
];
const needsArtwork = order.items.some((item) => item.files.length === 0);
const mailto = `mailto:${COMPANY.email}?subject=${encodeURIComponent(reference)}`;
---

<Page title={`${reference} rendelés – Stilet Dekor`} description="A rendelés állapota." actionBar={false} analytics={false} noindex>
  <section class="rd">
    {
      fresh && (
        <SuccessPanel
          title="Köszönjük, megkaptuk a rendelését"
          reference={reference}
          referenceLabel="Rendelésszám"
          nextSteps={[
            'Ellenőrizzük a fájlt, az anyagot és a határidőt.',
            'E-mailben visszaigazoljuk a végleges árat, és küldjük a díjbekérőt.',
            'A gyártás a díjbekérő befizetése után indul.',
          ]}
        >
          <Notice title="Mentse el ezt az oldalt">
            Ezen a címen bármikor megnézheti a rendelés állapotát. A címet ne ossza meg mással.
          </Notice>
        </SuccessPanel>
      )
    }
    <h1>{reference} rendelés</h1>
    <p class="rd__meta">Beküldve: {budapestDateTime(order.createdAt)}</p>
    <div class="rd__status">
      <OrderStatusBadge status={order.status} />
      <p>{orderNextStep(order.status, order.shippingMethod)}</p>
    </div>
    {
      needsArtwork && (
        <Notice tone="warning" title="A grafikát e-mailben várjuk">
          Küldje el a <a href={mailto}>{COMPANY.email}</a> címre, a levél tárgyában a rendelésszámmal ({reference}).
        </Notice>
      )
    }
    <h2>Tételek</h2>
    <PriceBreakdown
      rows={rows}
      total={order.totals.grossTotal}
      totalLabel="Végösszeg, bruttó"
      net={order.totals.netTotal}
      vat={order.totals.vatTotal}
      note={FINAL_PRICE_NOTICE}
    />
    <p class="rd__help">
      Kérdése van? Hívjon: <a href={COMPANY.phone.href}>{COMPANY.phone.display}</a>, és mondja meg a rendelésszámot.
    </p>
  </section>
</Page>

<style>
  .rd {
    max-width: 48rem;
    margin: 0 auto;
    padding: var(--space-7) var(--layout-gutter) var(--space-9);
    display: grid;
    gap: var(--space-5);
  }
  h1 {
    margin: 0;
    font-family: var(--font-display);
    font-size: var(--text-2xl);
    font-variation-settings: var(--font-variation-display);
    font-weight: var(--weight-display);
    line-height: var(--leading-snug);
  }
  h2 {
    margin: var(--space-4) 0 0;
    font-size: var(--text-lg);
  }
  .rd__meta,
  .rd__help {
    margin: 0;
    color: var(--color-text-muted);
  }
  .rd__status {
    display: grid;
    gap: var(--space-2);
    justify-items: start;
  }
  .rd__status p {
    margin: 0;
  }
  .rd a {
    color: var(--color-text);
  }
</style>
```


- [ ] **Step 3: Ellenőrzés és commit**

Run: `npm run check && npm test`
Expected: zöld. A böngészős próba a 15. feladatban.

```bash
git add src/layouts src/pages/rendeles
git -c user.name=Claude -c user.email=noreply@anthropic.com commit -q -F - <<'EOF'
Add the order status page on its secret link

Reference, status, what comes next, the items and the totals; no personal
data, no analytics beacon, never cached, indexed or sent as a referrer.
?uj=1 shows the thank-you panel right after the order.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 8: A webshop belépője, a fejléc kosárlinkje és a darabszám

**Files:**
- Modify: `src/ui/navigation.ts`, `src/ui/SiteHeader/SiteHeader.tsx`, `src/ui/SiteHeader/SiteHeader.test.tsx`, `src/layouts/Page.astro`
- Create: `src/scripts/cart-badge.ts`, `src/scripts/cart-badge.test.ts`
- Create: `src/site/shop-ui.ts`, `src/site/shop-ui.test.ts`
- Create: `src/pages/webshop/index.astro`

**Interfaces:**
- Consumes: Task 2 (`CART_STORAGE_KEY`, `CART_CHANGED_EVENT`, `cartItemCount`).
- Produces:
  - `WEBSHOP_HREF = '/webshop'`, `CART_HREF = '/kosar'`, `CHECKOUT_HREF = '/penztar'` (`@/ui/navigation`)
  - `SiteHeader` `cartHref?: string` prop: link a kosárra `[data-cart-link]`-kel és `[data-cart-count]` jelvénnyel
  - `initCartBadge(root?: ParentNode): void`
  - `@/site/shop-ui`: `PRODUCT_KIND: Record<ShopProductId, ProductKind>`, `productHref(id): string`, `productTiles(): ProductTile[]`, `productPriceTable(id): PriceTableRow[]`

- [ ] **Step 1: A tesztek**

`src/ui/SiteHeader/SiteHeader.test.tsx`: az első tesztben `render(<SiteHeader currentHref="/webshop" />)` (a Webshop menüpont címe `/webshop` lett), és új teszt a blokk végére:

```tsx
  it('links to the cart page, with a badge the page script fills in', () => {
    render(<SiteHeader cartHref="/kosar" />);
    const link = screen.getByRole('link', { name: 'Kosár' });
    expect(link.getAttribute('href')).toBe('/kosar');
    expect(link.hasAttribute('data-cart-link')).toBe(true);
    expect(link.querySelector<HTMLElement>('[data-cart-count]')?.hidden).toBe(true);
  });
```

Új fájl: `src/scripts/cart-badge.test.ts`

```ts
/** @vitest-environment jsdom */
import { afterEach, describe, expect, it } from 'vitest';
import { CART_CHANGED_EVENT, CART_STORAGE_KEY } from '@/domain/cart-count';
import { initCartBadge } from './cart-badge';

afterEach(() => {
  localStorage.clear();
  document.body.innerHTML = '';
});

describe('initCartBadge', () => {
  it('shows the number of items in the cart, and follows changes', () => {
    document.body.innerHTML = '<a href="/kosar" aria-label="Kosár" data-cart-link><span data-cart-count hidden></span></a>';
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ v: 1, items: [{}, {}] }));
    initCartBadge(document);
    const link = document.querySelector('a')!;
    const badge = document.querySelector<HTMLElement>('[data-cart-count]')!;
    expect(badge.hidden).toBe(false);
    expect(badge.textContent).toBe('2');
    expect(link.getAttribute('aria-label')).toBe('Kosár, 2 tétel');

    localStorage.removeItem(CART_STORAGE_KEY);
    window.dispatchEvent(new Event(CART_CHANGED_EVENT));
    expect(badge.hidden).toBe(true);
    expect(link.getAttribute('aria-label')).toBe('Kosár');
  });
});
```

Új fájl: `src/site/shop-ui.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { formatHuf } from '@/domain/money';
import { productPriceTable, productTiles } from './shop-ui';

describe('productTiles', () => {
  it('lists the six products with their lowest gross price and their page', () => {
    const tiles = productTiles();
    expect(tiles.map((t) => t.id)).toEqual(['molino', 'rollup', 'matrica', 'plakat', 'tabla', 'vaszonkep']);
    expect(tiles[0]).toMatchObject({ name: 'Molinó', price: 5067, unit: 'm2', product: 'molino', href: '/webshop/molino' });
    expect(tiles[1]).toMatchObject({ price: 31623, unit: 'db' });
    expect(tiles[5]).toMatchObject({ product: 'vaszon', href: '/webshop/vaszonkep' });
  });
});

describe('productPriceTable', () => {
  it('prices the options gross, per the unit they are sold in', () => {
    const molino = productPriceTable('molino');
    expect(molino[0]).toEqual({ label: 'Standard frontlit molinó', price: `${formatHuf(5067)}/m²` });
    expect(molino).toContainEqual({ label: 'Szélkidolgozás: Méretre vágás', price: 'felár nélkül' });
    expect(productPriceTable('plakat').at(-1)).toEqual({ label: 'Blueback (utcai plakát)', price: `${formatHuf(3797)}/m²` });
    expect(productPriceTable('tabla')).toContainEqual({ label: 'Furatolás', price: `+${formatHuf(635)}/db` });
  });
});
```

- [ ] **Step 2: Futtasd, hogy lásd elbukni**

Run: `npx vitest run src/ui/SiteHeader src/scripts/cart-badge.test.ts src/site/shop-ui.test.ts`
Expected: FAIL.

- [ ] **Step 3: A megvalósítás**

`src/ui/navigation.ts`: a `WEBSHOP_HREF` és mellé két új cím:

```ts
/** The webshop's entry. */
export const WEBSHOP_HREF = '/webshop';

/** The cart page and the checkout. */
export const CART_HREF = '/kosar';
export const CHECKOUT_HREF = '/penztar';
```

A fájl fejléc-megjegyzése: „Until the pages get their own routes, the other items point at sections of the home page.”

`src/ui/SiteHeader/SiteHeader.tsx`: a `SiteHeaderProps`-ba az `onCartClick` után:

```ts
  /**
   * Link to the cart page, when there is no onCartClick. Its item count comes from the page's small script
   * (src/scripts/cart-badge.ts), so the header stays static HTML.
   */
  cartHref?: string;
```

a paraméterlistába `cartHref,`, és az `IconButton` blokk helyett:

```tsx
        {onCartClick ? (
          <IconButton icon="cart" label={`Kosár megnyitása, ${cartCount} tétel`} count={cartCount} aria-haspopup="dialog" onClick={onCartClick} />
        ) : cartHref ? (
          <a className="sd-iconbtn sd-header__cart" href={cartHref} aria-label="Kosár" data-cart-link="">
            <Icon name="cart" />
            <span className="sd-iconbtn__count" aria-hidden="true" data-cart-count="" hidden />
          </a>
        ) : null}
```

Új fájl: `src/scripts/cart-badge.ts`

```ts
// The header's cart count on every page: reads the stored cart's item count (without the cart's schema, so this
// stays tiny) and follows changes from this tab (CART_CHANGED_EVENT) and the others (storage).
import { CART_CHANGED_EVENT, CART_STORAGE_KEY, cartItemCount } from '@/domain/cart-count';

export function initCartBadge(root: ParentNode = document): void {
  const update = () => {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(CART_STORAGE_KEY);
    } catch {
      // No storage: no count.
    }
    const count = cartItemCount(raw);
    for (const link of root.querySelectorAll<HTMLElement>('[data-cart-link]')) {
      link.setAttribute('aria-label', count > 0 ? `Kosár, ${count} tétel` : 'Kosár');
      const badge = link.querySelector<HTMLElement>('[data-cart-count]');
      if (badge) {
        badge.textContent = count > 99 ? '99+' : String(count);
        badge.hidden = count === 0;
      }
    }
  };
  update();
  window.addEventListener(CART_CHANGED_EVENT, update);
  window.addEventListener('storage', (event) => {
    if (event.key === null || event.key === CART_STORAGE_KEY) update();
  });
}
```

`src/layouts/Page.astro`: import `import { CART_HREF } from '@/ui/navigation';`, a fejléc `<SiteHeader currentHref={currentHref} cartHref={CART_HREF} />`, és a `<Base>` végére, az `ActionBar` után:

```astro
  <script>
    import { initCartBadge } from '@/scripts/cart-badge';

    initCartBadge(document);
  </script>
```

Új fájl: `src/site/shop-ui.ts`

```ts
// The webshop's catalog data for its pages: the product tiles with their lowest gross price, and each product's price
// table. Prices become gross here, as everywhere on the site.
import { MATRICA, MOLINO, PLAKAT, ROLLUP, SHOP_PRODUCT_IDS, SHOP_PRODUCTS, TABLA, VASZONKEP, type ShopProductId } from '@/domain/catalog';
import { formatHuf } from '@/domain/money';
import { grossOf } from '@/domain/pricing';
import type { ProductKind } from '@/ui/CategoryTile/CategoryTile';

/** The pictogram of each product (the canvas is "vaszon" there). */
export const PRODUCT_KIND: Readonly<Record<ShopProductId, ProductKind>> = {
  molino: 'molino',
  rollup: 'rollup',
  matrica: 'matrica',
  plakat: 'plakat',
  tabla: 'tabla',
  vaszonkep: 'vaszon',
};

export const productHref = (id: ShopProductId): string => `/webshop/${id}`;

export interface ProductTile {
  id: ShopProductId;
  name: string;
  description: string;
  /** Lowest gross price ("-tól"). */
  price: number;
  unit: 'm2' | 'db';
  product: ProductKind;
  href: string;
}

const lowest = (netPrices: readonly number[]) => grossOf(Math.min(...netPrices));

export function productTiles(): ProductTile[] {
  const from: Record<ShopProductId, { price: number; unit: 'm2' | 'db' }> = {
    molino: { price: lowest(MOLINO.materials.map((m) => m.priceNetPerM2)), unit: 'm2' },
    rollup: { price: lowest(ROLLUP.formats.map((f) => f.priceNet)), unit: 'db' },
    matrica: { price: lowest(MATRICA.materials.map((m) => m.priceNetPerM2)), unit: 'm2' },
    plakat: { price: lowest(PLAKAT.formats.map((f) => f.priceNet)), unit: 'db' },
    tabla: { price: lowest(TABLA.materials.map((m) => m.priceNetPerM2)), unit: 'm2' },
    vaszonkep: { price: lowest(VASZONKEP.formats.map((f) => f.priceNet)), unit: 'db' },
  };
  return SHOP_PRODUCT_IDS.map((id) => ({
    id,
    name: SHOP_PRODUCTS[id].name,
    description: SHOP_PRODUCTS[id].shortDescription,
    ...from[id],
    product: PRODUCT_KIND[id],
    href: productHref(id),
  }));
}

export interface PriceTableRow {
  label: string;
  price: string;
}

const perM2 = (net: number) => `${formatHuf(grossOf(net))}/m²`;
const each = (net: number) => formatHuf(grossOf(net));
const extra = (net: number, unit: string) => (net === 0 ? 'felár nélkül' : `+${formatHuf(grossOf(net))}/${unit}`);

/** The product's prices for its page: materials, formats and options, gross. */
export function productPriceTable(id: ShopProductId): PriceTableRow[] {
  switch (id) {
    case 'molino':
      return [
        ...MOLINO.materials.map((m) => ({ label: m.name, price: perM2(m.priceNetPerM2) })),
        ...MOLINO.edgeFinishes.map((e) => ({ label: `Szélkidolgozás: ${e.name}`, price: extra(e.priceNetPerM, 'fm') })),
        { label: 'Legkisebb tételár', price: each(MOLINO.minimumNet) },
      ];
    case 'rollup':
      return [
        ...ROLLUP.formats.map((f) => ({ label: f.name, price: each(f.priceNet) })),
        { label: ROLLUP.graphicOnly.name, price: each(ROLLUP.graphicOnly.priceNet) },
      ];
    case 'matrica':
      return [
        ...MATRICA.materials.map((m) => ({ label: m.name, price: perM2(m.priceNetPerM2) })),
        ...MATRICA.areaAddOns.map((a) => ({ label: a.name, price: extra(a.priceNetPerM2, 'm²') })),
      ];
    case 'plakat':
      return [
        ...PLAKAT.formats.map((f) => ({ label: `${f.name}, matt vagy fényes`, price: each(f.priceNet) })),
        { label: PLAKAT.blueback.name, price: perM2(PLAKAT.blueback.priceNetPerM2) },
      ];
    case 'tabla':
      return [
        ...TABLA.materials.map((m) => ({ label: m.name, price: perM2(m.priceNetPerM2) })),
        ...TABLA.pieceAddOns.map((a) => ({ label: a.name, price: extra(a.priceNet, a.unit) })),
        { label: 'Legkisebb számlázott terület', price: '0,1 m²' },
      ];
    case 'vaszonkep':
      return [
        ...VASZONKEP.formats.map((f) => ({ label: f.name, price: each(f.priceNet) })),
        { label: VASZONKEP.custom.name, price: perM2(VASZONKEP.custom.priceNetPerM2) },
        { label: 'Egyedi méret legkisebb ára', price: each(VASZONKEP.minimumNet) },
      ];
  }
}
```

Új fájl: `src/pages/webshop/index.astro`

```astro
---
// The webshop's entry: the six products with their lowest gross price. Prerendered; no script but the header's count.
import Page from '@/layouts/Page.astro';
import { productTiles } from '@/site/shop-ui';
import { CategoryTile } from '@/ui/CategoryTile/CategoryTile';
import { QUOTE_HREF, WEBSHOP_HREF } from '@/ui/navigation';

export const prerender = true;

const tiles = productTiles();
---

<Page
  title="Webshop – Stilet Dekor"
  description="Molinó, roll-up, matrica, plakát, tábla és vászonkép online: állítsa össze, töltse fel a grafikát, és küldje el a rendelést ellenőrzésre."
  currentHref={WEBSHOP_HREF}
>
  <section class="ws">
    <h1>Webshop</h1>
    <p class="ws__lead">
      Válassza ki a terméket, állítsa be a méretet és az anyagot, és töltse fel a grafikát. Elküldés után ellenőrizzük a
      rendelést; fizetni csak a visszaigazolás után, a díjbekérő alapján kell.
    </p>
    <ul class="ws__grid">
      {
        tiles.map((tile) => (
          <li>
            <CategoryTile name={tile.name} price={tile.price} unit={tile.unit} product={tile.product} href={tile.href} />
            <p>{tile.description}</p>
          </li>
        ))
      }
    </ul>
    <p class="ws__quote">Fóliázás, cégér vagy egyedi munka? <a href={QUOTE_HREF}>Kérjen ajánlatot</a>.</p>
  </section>
</Page>

<style>
  .ws {
    max-width: 72rem;
    margin: 0 auto;
    padding: var(--space-7) var(--layout-gutter) var(--space-9);
  }
  h1 {
    margin: 0 0 var(--space-2);
    font-family: var(--font-display);
    font-size: var(--text-2xl);
    font-variation-settings: var(--font-variation-display);
    font-weight: var(--weight-display);
    line-height: var(--leading-snug);
  }
  .ws__lead {
    max-width: 44rem;
    margin: 0 0 var(--space-6);
    color: var(--color-text-muted);
  }
  .ws__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
    gap: var(--space-5);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .ws__grid p {
    margin: var(--space-2) 0 0;
    color: var(--color-text-muted);
  }
  .ws__quote {
    margin: var(--space-8) 0 0;
    padding-top: var(--space-5);
    border-top: 1px solid var(--color-line);
  }
  .ws__quote a {
    color: var(--color-text);
  }
</style>
```

- [ ] **Step 4: Futtasd újra, aztán az egészet**

Run: `npx vitest run src/ui/SiteHeader src/scripts/cart-badge.test.ts src/site/shop-ui.test.ts && npm test && npm run check`
Expected: PASS. Ha más teszt a régi `'/#webshop'` címet várja a menüben vagy a láblécben, írd át `'/webshop'`-ra (a `ButtonLink`, `CategoryTile`, `NavLink` tesztjeinek `#webshop` horgonya nem a menü, azok maradnak).

- [ ] **Step 5: Commit**

```bash
git add src/ui/navigation.ts src/ui/SiteHeader src/layouts/Page.astro src/scripts/cart-badge.ts src/scripts/cart-badge.test.ts src/site/shop-ui.ts src/site/shop-ui.test.ts src/pages/webshop/index.astro
git -c user.name=Claude -c user.email=noreply@anthropic.com commit -q -F - <<'EOF'
Open the webshop's entry and put the cart in the header

/webshop lists the six products with their lowest gross price; the menu's
Webshop item leads there. The header links to the cart on every page, and a
tiny script shows the item count from the browser's storage.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 9: A konfigurátor tiszta logikája

**Files:**
- Create: `src/islands/shop/draft.ts`, `src/islands/shop/draft.test.ts`
- Create: `src/islands/shop/artwork-size.ts`, `src/islands/shop/artwork-size.test.ts`
- Create: `src/islands/shop/price-rows.ts`, `src/islands/shop/price-rows.test.ts`

**Interfaces:**
- Consumes: `validateConfiguration`, `priceConfiguration`, `tryPriceConfiguration`, a config-típusok (`@/domain/pricing`); `parseNumberHu` (Task 1); az elemző almoduljai (`@/domain/artwork/formats`, `hints`, `units`, `types`); `preflight` (`@/domain/preflight`).
- Produces:
  - `interface Draft { productId; materialId; edgeFinishId; formatId; paperFinish; orientation; graphicOnly; addOnIds: string[]; furat: number; tavtarto: number; width: string; height: string; quantity: number; express: boolean }`
  - `defaultDraft(productId): Draft`, `draftToConfig(draft): ProductConfig`, `draftFromConfig(config): Draft`, `draftIssues(draft): Record<string, string>` (kulcs: a konfiguráció útvonala, például `widthCm`, `addOnCounts.furat`), `hasFreeSize(draft): boolean`, `sizeText(cm: number): string` (`29.7` → `"29,7"`)
  - `interface ArtworkSize { widthCm; heightCm; formatId?; orientation?; scale: number | null; multiPage: boolean }`, `artworkSizeFor(productId, analysis): ArtworkSize | null`, `preflightSummary(analysis, widthCm, heightCm, fitMode): PreflightSummary | null`, `artworkDetail(analysis): string`
  - `priceRows(price: ConfigurationPrice): PriceRow[]`, `cartTotals(entries: readonly CartEntry[]): { gross: number; net: number; vat: number }`, `DISCOUNT_SUMMARY` („2–4 db: −5% · 5–9 db: −10% · 10 db-tól: −15%”)

Ezek a modulok nem importálják az `@/domain/artwork` indexet és az `analyze`-ot (pdf-lib), csak az almodulokat: így a fájlelemző nem kerül a szigetek főcsomagjába.

- [ ] **Step 1: A tesztek**

Új fájl: `src/islands/shop/draft.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { SHOP_PRODUCT_IDS } from '@/domain/catalog';
import { defaultDraft, draftFromConfig, draftIssues, draftToConfig, hasFreeSize, sizeText } from './draft';

describe('the configurator draft', () => {
  it('starts every product with a valid configuration that survives the round trip', () => {
    for (const id of SHOP_PRODUCT_IDS) {
      const draft = defaultDraft(id);
      expect(draftIssues(draft)).toEqual({});
      expect(draftFromConfig(draftToConfig(draft))).toEqual(draft);
    }
  });

  it('reads the sizes the way people type them', () => {
    expect(draftToConfig({ ...defaultDraft('molino'), width: '120,5', height: ' 80 ' })).toMatchObject({ widthCm: 120.5, heightCm: 80 });
    expect(sizeText(29.7)).toBe('29,7');
  });

  it('names the wrong fields with the catalog messages', () => {
    expect(draftIssues({ ...defaultDraft('molino'), width: '600', height: '' })).toEqual({
      widthCm: 'A szélesség 20 és 500 cm között lehet.',
      heightCm: 'Adja meg a magasságot centiméterben.',
    });
    expect(draftIssues({ ...defaultDraft('tabla'), furat: 99 })).toHaveProperty(['addOnCounts.furat']);
  });

  it('types the size only for free-size products and formats', () => {
    const blueback = { ...defaultDraft('plakat'), formatId: 'blueback', width: '300', height: '200' };
    expect(draftToConfig(blueback)).toEqual({ productId: 'plakat', formatId: 'blueback', widthCm: 300, heightCm: 200, quantity: 1, express: false });
    expect(hasFreeSize(blueback)).toBe(true);
    expect(hasFreeSize(defaultDraft('plakat'))).toBe(false);
    expect(hasFreeSize({ ...defaultDraft('vaszonkep'), formatId: 'egyedi' })).toBe(true);
    expect(hasFreeSize(defaultDraft('molino'))).toBe(true);
    expect(hasFreeSize(defaultDraft('rollup'))).toBe(false);
  });
});
```

Új fájl: `src/islands/shop/artwork-size.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import type { ArtworkAnalysis, ArtworkPage } from '@/domain/artwork/types';
import { artworkDetail, artworkSizeFor, preflightSummary } from './artwork-size';

const page = (widthMm: number, heightMm: number, index = 1): ArtworkPage => ({
  index,
  size: { widthMm, heightMm },
  sizeSource: 'trimbox',
  printSize: { widthMm, heightMm },
  bleedMm: null,
  rotation: 0,
  contentKey: null,
});

const analysis = (pages: ArtworkPage[], extra: Partial<ArtworkAnalysis> = {}): ArtworkAnalysis => ({
  format: 'pdf',
  pages,
  pixels: null,
  dpi: null,
  confidence: pages.length ? 'exact' : 'none',
  hints: { scale: null, bleedMmFromText: null, title: null },
  warnings: [],
  ...extra,
});

describe('artworkSizeFor', () => {
  it('takes the size of the first page, in whole millimetres', () => {
    expect(artworkSizeFor('molino', analysis([page(2000.04, 1000)]))).toEqual({ widthCm: 200, heightCm: 100, scale: null, multiPage: false });
    expect(artworkSizeFor('molino', analysis([page(1000, 500), page(1000, 500, 2)]))?.multiPage).toBe(true);
    expect(artworkSizeFor('molino', analysis([]))).toBeNull();
  });

  it('scales a 1:10 drawing up, as the file name says or when it is below the minimum', () => {
    expect(artworkSizeFor('molino', analysis([page(300, 100)], { hints: { scale: 10, bleedMmFromText: null, title: null } }))).toMatchObject({
      widthCm: 300,
      heightCm: 100,
      scale: 10,
    });
    expect(artworkSizeFor('rollup', analysis([page(85, 200)]))).toMatchObject({ formatId: '85x200', scale: 10 });
  });

  it('finds the standard poster, canvas and roll-up formats', () => {
    expect(artworkSizeFor('plakat', analysis([page(594, 420)]))).toMatchObject({ formatId: 'a2', orientation: 'fekvo' });
    expect(artworkSizeFor('plakat', analysis([page(610, 430)]))?.formatId).toBeUndefined();
    expect(artworkSizeFor('vaszonkep', analysis([page(500, 700)]))).toMatchObject({ formatId: '50x70', orientation: 'allo' });
    expect(artworkSizeFor('vaszonkep', analysis([page(450, 450)]))).toMatchObject({ formatId: 'egyedi', widthCm: 45, heightCm: 45 });
    expect(artworkSizeFor('rollup', analysis([page(1000, 2000)]))?.formatId).toBe('100x200');
  });
});

describe('preflightSummary', () => {
  it('rates a raster image at the chosen size, and asks how to fit a different shape', () => {
    const photo = analysis([], { format: 'jpeg', pixels: { width: 6000, height: 3000 } });
    expect(preflightSummary(photo, 200, 100, 'fill')).toEqual({ dpi: 76, rating: 'megfelelo', aspectMismatch: false });
    expect(preflightSummary(photo, 100, 100, 'fit')).toMatchObject({ aspectMismatch: true, fitMode: 'fit' });
    expect(preflightSummary(analysis([page(100, 100)]), 10, 10, 'fill')).toBeNull();
  });
});

describe('artworkDetail', () => {
  it('says what was read from the file', () => {
    // formatNumberHu groups thousands with a no-break space ("1 189").
    const plain = (text: string) => text.replace(/[  ]/g, ' ');
    expect(plain(artworkDetail(analysis([page(841, 1189), page(841, 1189, 2)])))).toBe('841 × 1 189 mm · vektoros · 2 oldal');
    expect(artworkDetail(analysis([], { pixels: { width: 4000, height: 3000 } }))).toBe('4000 × 3000 px');
    expect(artworkDetail(analysis([]))).toBe('A méretét nem tudtuk kiolvasni');
  });
});
```

(A `preflightSummary` első sorában a 76 DPI: 6000 px / (200 cm / 2,54) = 76,2 → lefelé kerekítve 76, és ez a `DPI_THRESHOLDS` szerint „megfelelő”. Ha a teszt mást kap, a `src/domain/preflight.ts` küszöbeit nézd meg, ne a tesztet igazítsd vakon.)

Új fájl: `src/islands/shop/price-rows.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import type { CartEntry } from '@/domain/cart';
import { formatHuf } from '@/domain/money';
import { grossOf, priceConfiguration, type ProductConfig } from '@/domain/pricing';
import { cartTotals, DISCOUNT_SUMMARY, priceRows } from './price-rows';

const MOLINO: ProductConfig = { productId: 'molino', materialId: 'standard', edgeFinishId: 'szeges-ringli', widthCm: 200, heightCm: 100, quantity: 5, express: true };

describe('priceRows', () => {
  it('shows one piece gross, then the quantity, the discount and the express surcharge', () => {
    const price = priceConfiguration(MOLINO);
    expect(priceRows(price)).toEqual([
      { label: 'Standard frontlit molinó', detail: `2 m² × ${formatHuf(grossOf(3990))}`, amount: grossOf(7980) },
      { label: 'Szélkidolgozás: Szegés + ringli', detail: `6 fm × ${formatHuf(grossOf(350))}`, amount: grossOf(2100) },
      { label: '5 darab', detail: `${formatHuf(grossOf(10080))} × 5`, amount: grossOf(50400), kind: 'muted' },
      { label: 'Mennyiségi kedvezmény (−10%)', amount: -grossOf(5040), kind: 'discount' },
      { label: 'Expressz gyártás (+30%)', amount: grossOf(13608) },
    ]);
  });

  it('adds up the cart and sums up the discount tiers', () => {
    const entry = (config: ProductConfig): CartEntry => ({ key: 'k', config, files: [], addedAt: '2026-10-09T10:00:00.000Z' });
    const one = priceConfiguration(MOLINO);
    expect(cartTotals([entry(MOLINO), entry(MOLINO)])).toEqual({
      gross: 2 * one.grossTotal,
      net: 2 * one.netTotal,
      vat: 2 * one.vatTotal,
    });
    expect(DISCOUNT_SUMMARY).toBe('2–4 db: −5% · 5–9 db: −10% · 10 db-tól: −15%');
  });
});
```

- [ ] **Step 2: Futtasd, hogy lásd elbukni**

Run: `npx vitest run src/islands/shop`
Expected: FAIL (hiányzó modulok).

- [ ] **Step 3: A megvalósítás**

Új fájl: `src/islands/shop/draft.ts`

```ts
// The configurator's editable state: what the customer has chosen so far, with the sizes as typed ("29,7"), and its
// conversion to the domain's ProductConfig, which validateConfiguration checks and priceConfiguration prices.
import type { Orientation, ShopProductId } from '@/domain/catalog';
import { parseNumberHu } from '@/domain/money';
import {
  type MatricaConfig,
  type MolinoConfig,
  type PlakatFormatConfig,
  type ProductConfig,
  type RollupConfig,
  type TablaConfig,
  validateConfiguration,
  type VaszonkepFormatConfig,
} from '@/domain/pricing';

export interface Draft {
  productId: ShopProductId;
  /** Molinó, matrica, tábla. */
  materialId: string;
  /** Molinó. */
  edgeFinishId: string;
  /** Roll-up; plakát (a3 … b1, or "blueback"); vászonkép (30x40 …, or "egyedi"). */
  formatId: string;
  /** Plakát. */
  paperFinish: string;
  /** Plakát and vászonkép formats. */
  orientation: Orientation;
  /** Roll-up. */
  graphicOnly: boolean;
  /** Matrica. */
  addOnIds: string[];
  /** Tábla. */
  furat: number;
  tavtarto: number;
  /** As typed, in cm. */
  width: string;
  height: string;
  quantity: number;
  express: boolean;
}

const BASE = {
  materialId: '',
  edgeFinishId: '',
  formatId: '',
  paperFinish: 'matt',
  orientation: 'allo' as Orientation,
  graphicOnly: false,
  addOnIds: [] as string[],
  furat: 0,
  tavtarto: 0,
  width: '',
  height: '',
  quantity: 1,
  express: false,
};

/** What a product's configurator starts with. */
export function defaultDraft(productId: ShopProductId): Draft {
  switch (productId) {
    case 'molino':
      return { ...BASE, productId, materialId: 'standard', edgeFinishId: 'szeges-ringli', width: '200', height: '100' };
    case 'rollup':
      return { ...BASE, productId, formatId: '85x200' };
    case 'matrica':
      return { ...BASE, productId, materialId: 'monomer', width: '50', height: '50' };
    case 'plakat':
      return { ...BASE, productId, formatId: 'a2' };
    case 'tabla':
      return { ...BASE, productId, materialId: 'pvc-3mm', width: '60', height: '40' };
    case 'vaszonkep':
      return { ...BASE, productId, formatId: '50x70' };
  }
}

/** A size in cm the way it is typed in Hungarian: 29.7 → "29,7". */
export const sizeText = (cm: number): string => String(cm).replace('.', ',');

const cmOf = (text: string): number => {
  const value = parseNumberHu(text);
  return typeof value === 'number' ? value : Number.NaN;
};

/** True when the customer types the size (not a fixed format). */
export function hasFreeSize(draft: Draft): boolean {
  switch (draft.productId) {
    case 'molino':
    case 'matrica':
    case 'tabla':
      return true;
    case 'plakat':
      return draft.formatId === 'blueback';
    case 'vaszonkep':
      return draft.formatId === 'egyedi';
    case 'rollup':
      return false;
  }
}

export function draftToConfig(d: Draft): ProductConfig {
  const common = { quantity: d.quantity, express: d.express };
  const size = { widthCm: cmOf(d.width), heightCm: cmOf(d.height) };
  switch (d.productId) {
    case 'molino':
      return {
        productId: 'molino',
        materialId: d.materialId as MolinoConfig['materialId'],
        edgeFinishId: d.edgeFinishId as MolinoConfig['edgeFinishId'],
        ...size,
        ...common,
      };
    case 'rollup':
      return { productId: 'rollup', formatId: d.formatId as RollupConfig['formatId'], graphicOnly: d.graphicOnly, ...common };
    case 'matrica':
      return {
        productId: 'matrica',
        materialId: d.materialId as MatricaConfig['materialId'],
        addOnIds: d.addOnIds as MatricaConfig['addOnIds'],
        ...size,
        ...common,
      };
    case 'plakat':
      return d.formatId === 'blueback'
        ? { productId: 'plakat', formatId: 'blueback', ...size, ...common }
        : {
            productId: 'plakat',
            formatId: d.formatId as PlakatFormatConfig['formatId'],
            paperFinish: d.paperFinish as PlakatFormatConfig['paperFinish'],
            orientation: d.orientation,
            ...common,
          };
    case 'tabla':
      return {
        productId: 'tabla',
        materialId: d.materialId as TablaConfig['materialId'],
        addOnCounts: { furat: d.furat, tavtarto: d.tavtarto },
        ...size,
        ...common,
      };
    case 'vaszonkep':
      return d.formatId === 'egyedi'
        ? { productId: 'vaszonkep', formatId: 'egyedi', ...size, ...common }
        : { productId: 'vaszonkep', formatId: d.formatId as VaszonkepFormatConfig['formatId'], orientation: d.orientation, ...common };
  }
}

/** The draft of a saved configuration (editing a cart item). */
export function draftFromConfig(config: ProductConfig): Draft {
  const d: Draft = { ...defaultDraft(config.productId), quantity: config.quantity, express: config.express };
  switch (config.productId) {
    case 'molino':
      return { ...d, materialId: config.materialId, edgeFinishId: config.edgeFinishId, width: sizeText(config.widthCm), height: sizeText(config.heightCm) };
    case 'rollup':
      return { ...d, formatId: config.formatId, graphicOnly: config.graphicOnly };
    case 'matrica':
      return { ...d, materialId: config.materialId, addOnIds: [...config.addOnIds], width: sizeText(config.widthCm), height: sizeText(config.heightCm) };
    case 'plakat':
      if (config.formatId === 'blueback') return { ...d, formatId: 'blueback', width: sizeText(config.widthCm), height: sizeText(config.heightCm) };
      if (config.formatId === 'egyedi') {
        return { ...d, formatId: 'egyedi', paperFinish: config.paperFinish, width: sizeText(config.widthCm), height: sizeText(config.heightCm) };
      }
      return { ...d, formatId: config.formatId, paperFinish: config.paperFinish, orientation: config.orientation };
    case 'tabla':
      return {
        ...d,
        materialId: config.materialId,
        furat: config.addOnCounts.furat,
        tavtarto: config.addOnCounts.tavtarto,
        width: sizeText(config.widthCm),
        height: sizeText(config.heightCm),
      };
    case 'vaszonkep':
      return config.formatId === 'egyedi'
        ? { ...d, formatId: 'egyedi', width: sizeText(config.widthCm), height: sizeText(config.heightCm) }
        : { ...d, formatId: config.formatId, orientation: config.orientation };
  }
}

/** Messages for the draft, keyed by the configuration's path ("widthCm", "addOnCounts.furat"); empty when it can be priced. */
export function draftIssues(draft: Draft): Record<string, string> {
  const issues: Record<string, string> = {};
  for (const issue of validateConfiguration(draftToConfig(draft))) issues[issue.path.join('.')] ??= issue.message;
  return issues;
}
```

Új fájl: `src/islands/shop/artwork-size.ts`

```ts
// From the browser's analysis of a print file to the configurator: the size to fill in (with the suggested scale
// applied), the standard format it matches (plakát, roll-up, vászonkép), the preflight at the chosen size, and a line
// about the file. Only the analyzer's small modules are imported: the analyzer itself (pdf-lib) loads on demand.
import { matchStandardFormat, type StandardFormat } from '@/domain/artwork/formats';
import { suggestScale } from '@/domain/artwork/hints';
import type { ArtworkAnalysis } from '@/domain/artwork/types';
import { applyScale } from '@/domain/artwork/units';
import { MATRICA, MOLINO, type Orientation, PLAKAT, ROLLUP, type ShopProductId, TABLA, VASZONKEP } from '@/domain/catalog';
import { formatNumberHu } from '@/domain/money';
import { type FitMode, preflight } from '@/domain/preflight';
import type { PreflightSummary } from '@/domain/schemas';

export interface ArtworkSize {
  widthCm: number;
  heightCm: number;
  /** The product's standard format the file matches (or "egyedi" for a canvas that matches none). */
  formatId?: string | undefined;
  orientation?: Orientation | undefined;
  /** The suggested scale (10 for a 1:10 file), already applied to the size. */
  scale: number | null;
  /** The file has more pages; the first one is used. */
  multiPage: boolean;
}

/** Below this longer side the file is probably a scaled drawing (brief 8). */
const MIN_SIDE_MM: Readonly<Record<ShopProductId, number>> = {
  molino: MOLINO.size.minCm * 10,
  matrica: MATRICA.size.minCm * 10,
  tabla: TABLA.size.minCm * 10,
  plakat: PLAKAT.bluebackSize.minCm * 10,
  vaszonkep: VASZONKEP.custom.size.minCm * 10,
  rollup: Math.min(...ROLLUP.formats.map((f) => f.widthCm)) * 10,
};

const inMm = (formats: readonly { id: string; widthCm: number; heightCm: number }[]): StandardFormat[] =>
  formats.map((f) => ({ id: f.id, widthMm: Math.round(f.widthCm * 10), heightMm: Math.round(f.heightCm * 10) }));
const PLAKAT_FORMATS = inMm(PLAKAT.formats);
const VASZON_FORMATS = inMm(VASZONKEP.formats);

/** Whole millimetres, in cm. */
const cm = (mm: number) => Math.round(mm) / 10;

export function artworkSizeFor(productId: ShopProductId, analysis: Pick<ArtworkAnalysis, 'pages' | 'hints'>): ArtworkSize | null {
  const page = analysis.pages[0];
  if (!page) return null;
  // The price is for the whole printed size, bleed included (brief 8).
  const scale = suggestScale(page.printSize, MIN_SIDE_MM[productId], analysis.hints.scale);
  const size = scale ? applyScale(page.printSize, scale) : page.printSize;
  const base: ArtworkSize = { widthCm: cm(size.widthMm), heightCm: cm(size.heightMm), scale, multiPage: analysis.pages.length > 1 };
  const orientation: Orientation = size.widthMm > size.heightMm ? 'fekvo' : 'allo';
  switch (productId) {
    case 'plakat': {
      const match = matchStandardFormat(size, PLAKAT_FORMATS);
      return match ? { ...base, formatId: match.id, orientation } : base;
    }
    case 'vaszonkep': {
      const match = matchStandardFormat(size, VASZON_FORMATS, { bleedsMm: [0] });
      return { ...base, formatId: match ? match.id : 'egyedi', orientation };
    }
    case 'rollup': {
      const format = ROLLUP.formats.find((f) => Math.abs(f.widthCm * 10 - size.widthMm) <= 1);
      return format ? { ...base, formatId: format.id } : base;
    }
    default:
      return base;
  }
}

/** The preflight of a raster image at the product size, for the cart and the workshop; null for vector files. */
export function preflightSummary(
  analysis: Pick<ArtworkAnalysis, 'pixels'>,
  widthCm: number,
  heightCm: number,
  fitMode: FitMode,
): PreflightSummary | null {
  if (!analysis.pixels || !(widthCm > 0) || !(heightCm > 0)) return null;
  const result = preflight(analysis.pixels.width, analysis.pixels.height, widthCm, heightCm, fitMode);
  return {
    dpi: Math.min(result.dpi, 100_000),
    rating: result.rating,
    aspectMismatch: result.aspect.exceeds,
    ...(result.needsFitChoice ? { fitMode } : {}),
  };
}

/** One line about the file for its row: "841 × 1189 mm · vektoros · 2 oldal". */
export function artworkDetail(analysis: Pick<ArtworkAnalysis, 'pages' | 'pixels' | 'confidence'>): string {
  const page = analysis.pages[0];
  const parts: string[] = [];
  if (page) parts.push(`${formatNumberHu(page.size.widthMm, 1)} × ${formatNumberHu(page.size.heightMm, 1)} mm`);
  else if (analysis.pixels) parts.push(`${analysis.pixels.width} × ${analysis.pixels.height} px`);
  if (analysis.confidence === 'exact') parts.push('vektoros');
  if (analysis.pages.length > 1) parts.push(`${analysis.pages.length} oldal`);
  return parts.length > 0 ? parts.join(' · ') : 'A méretét nem tudtuk kiolvasni';
}
```

Új fájl: `src/islands/shop/price-rows.ts`

```ts
// Prices for the shop's islands: the configurator's breakdown (the domain's net lines of one piece as gross rows, then
// the quantity, the discount and the express surcharge) and the cart's totals. The totals are the domain's own sums;
// a gross row may differ from the net line × 1,27 by a forint of rounding.
import type { CartEntry } from '@/domain/cart';
import { EXPRESS_SURCHARGE_PERCENT, QUANTITY_DISCOUNT_TIERS } from '@/domain/catalog';
import { formatHuf, formatNumberHu } from '@/domain/money';
import { type ConfigurationPrice, grossOf, tryPriceConfiguration } from '@/domain/pricing';
import type { PriceRow } from '@/ui/PriceBreakdown/PriceBreakdown';

/** "2–4 db: −5% · 5–9 db: −10% · 10 db-tól: −15%". */
export const DISCOUNT_SUMMARY = QUANTITY_DISCOUNT_TIERS.filter((tier) => tier.pct > 0)
  .map((tier) => `${tier.label}: −${tier.pct}%`)
  .join(' · ');

export function priceRows(price: ConfigurationPrice): PriceRow[] {
  const rows: PriceRow[] = price.lines.map((line) => ({
    label: line.label,
    detail: `${formatNumberHu(line.quantity)} ${line.unit} × ${formatHuf(grossOf(line.unitPriceNet))}`,
    amount: grossOf(line.amountNet),
  }));
  if (price.quantity > 1) {
    rows.push({
      label: `${price.quantity} darab`,
      detail: `${formatHuf(grossOf(price.itemNet))} × ${price.quantity}`,
      amount: grossOf(price.subtotalNet),
      kind: 'muted',
    });
  }
  if (price.discountNet > 0) {
    rows.push({ label: `Mennyiségi kedvezmény (−${price.discountPct}%)`, amount: -grossOf(price.discountNet), kind: 'discount' });
  }
  if (price.expressSurchargeNet > 0) {
    rows.push({ label: `Expressz gyártás (+${EXPRESS_SURCHARGE_PERCENT}%)`, amount: grossOf(price.expressSurchargeNet) });
  }
  return rows;
}

/** The cart's items together, without shipping (chosen at the checkout). */
export function cartTotals(entries: readonly CartEntry[]): { gross: number; net: number; vat: number } {
  const totals = { gross: 0, net: 0, vat: 0 };
  for (const entry of entries) {
    const priced = tryPriceConfiguration(entry.config);
    if (!priced.ok) continue;
    totals.gross += priced.price.grossTotal;
    totals.net += priced.price.netTotal;
    totals.vat += priced.price.vatTotal;
  }
  return totals;
}
```

- [ ] **Step 4: Futtasd újra**

Run: `npx vitest run src/islands/shop`
Expected: PASS.

- [ ] **Step 5: Ellenőrzés és commit**

Run: `npm test && npm run check`
Expected: zöld.

```bash
git add src/islands/shop
git -c user.name=Claude -c user.email=noreply@anthropic.com commit -q -F - <<'EOF'
Add the configurator's logic: the draft, sizes from files, price rows

The draft keeps the customer's choices with sizes as typed and turns them into
the domain's configuration; the size, format and preflight come from the
browser's file analysis; the price breakdown is gross, row by row.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 10: Böngészős segédek: kosár, feltöltés, a fájlok állapota

**Files:**
- Create: `src/islands/shop/cart-store.ts`, `src/islands/shop/cart-store.test.ts`
- Create: `src/islands/shop/upload-client.ts`, `src/islands/shop/upload-client.test.ts`
- Create: `src/islands/shop/useArtworkFiles.ts`, `src/islands/shop/useArtworkFiles.test.ts`
- Create: `src/islands/shop/useDebounced.ts`

**Interfaces:**
- Consumes: Task 2 (`parseStoredCart`, `serializeCart`, `CartEntry`, `CartFile`, `CART_STORAGE_KEY`, `CART_CHANGED_EVENT`), Task 1 (`MAX_UPLOAD_BYTES`, az üzenetek).
- Produces:
  - `readCart(): { entries: CartEntry[]; dropped: number }`, `writeCart(entries): void`, `interface CartApi { entries; dropped: number; ready: boolean; add(entry); replace(entry); remove(key); setQuantity(key, quantity); clear() }`, `useCart(): CartApi`
  - `interface UploadedFile { id; name; size; format }`, `class UploadError extends Error { emailFallback: boolean }`, `uploadFile(file: File, options?: { onProgress?: (percent: number) => void }): Promise<UploadedFile>`
  - `interface ArtworkFileState { localId; name; size; status: 'uploading' | 'done' | 'error'; progress; uploadId?; uploadedAt?; error?; emailFallback?; analysis?; previewUrl? }`, `interface ArtworkFiles { files; add(files: readonly File[]); retry(localId); remove(localId); clear(); busy: boolean; full: boolean; uploaded: CartFile[] }`, `useArtworkFiles(options?: { initial?: readonly CartFile[]; analyze?: boolean; onAnalysis?: (analysis: ArtworkAnalysis, first: boolean) => void; max?: number }): ArtworkFiles`
  - `useDebounced<T>(value: T, ms: number): T`

- [ ] **Step 1: A tesztek**

Új fájl: `src/islands/shop/cart-store.test.ts`

```ts
/** @vitest-environment jsdom */
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type CartEntry, parseStoredCart, serializeCart } from '@/domain/cart';
import { CART_CHANGED_EVENT, CART_STORAGE_KEY } from '@/domain/cart-count';
import { useCart, writeCart } from './cart-store';

const ENTRY: CartEntry = {
  key: 'a1',
  config: { productId: 'molino', materialId: 'standard', edgeFinishId: 'szeges-ringli', widthCm: 200, heightCm: 100, quantity: 1, express: false },
  files: [],
  addedAt: '2026-10-09T10:00:00.000Z',
};

afterEach(() => localStorage.clear());

describe('useCart', () => {
  it('loads the stored cart, drops the broken items for good, and changes it', () => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ v: 1, items: [ENTRY, { broken: true }] }));
    const { result } = renderHook(() => useCart());
    expect(result.current).toMatchObject({ ready: true, entries: [ENTRY], dropped: 1 });
    expect(parseStoredCart(localStorage.getItem(CART_STORAGE_KEY))).toEqual({ entries: [ENTRY], dropped: 0 });

    act(() => result.current.add({ ...ENTRY, key: 'b2' }));
    act(() => result.current.setQuantity('a1', 3));
    expect(result.current.entries.map((e) => [e.key, e.config.quantity])).toEqual([
      ['a1', 3],
      ['b2', 1],
    ]);
    act(() => result.current.replace({ ...ENTRY, key: 'b2', config: { ...ENTRY.config, widthCm: 300 } }));
    expect(result.current.entries[1]?.config).toMatchObject({ widthCm: 300 });
    act(() => result.current.remove('a1'));
    expect(result.current.entries.map((e) => e.key)).toEqual(['b2']);
    act(() => result.current.clear());
    expect(localStorage.getItem(CART_STORAGE_KEY)).toBeNull();
  });

  it('follows the cart changed in another tab', () => {
    const { result } = renderHook(() => useCart());
    act(() => {
      localStorage.setItem(CART_STORAGE_KEY, serializeCart([ENTRY]));
      window.dispatchEvent(new StorageEvent('storage', { key: CART_STORAGE_KEY }));
    });
    expect(result.current.entries).toEqual([ENTRY]);
  });

  it('tells the header about every change', () => {
    const listener = vi.fn();
    window.addEventListener(CART_CHANGED_EVENT, listener);
    writeCart([ENTRY]);
    window.removeEventListener(CART_CHANGED_EVENT, listener);
    expect(listener).toHaveBeenCalledOnce();
  });
});
```

Új fájl: `src/islands/shop/upload-client.test.ts`

```ts
/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MAX_UPLOAD_BYTES, UPLOAD_FAILED_MESSAGE, UPLOAD_TOO_LARGE_MESSAGE } from '@/domain/uploads';
import { UploadError, uploadFile } from './upload-client';

class FakeXhr {
  static last: FakeXhr;
  upload: { onprogress: ((event: { lengthComputable: boolean; loaded: number; total: number }) => void) | null } = { onprogress: null };
  status = 0;
  responseText = '';
  method = '';
  url = '';
  headers: Record<string, string> = {};
  body: unknown;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor() {
    FakeXhr.last = this;
  }
  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }
  setRequestHeader(name: string, value: string) {
    this.headers[name] = value;
  }
  send(body: unknown) {
    this.body = body;
  }
  respond(status: number, body: unknown) {
    this.status = status;
    this.responseText = JSON.stringify(body);
    this.onload?.();
  }
}

beforeEach(() => vi.stubGlobal('XMLHttpRequest', FakeXhr));
afterEach(() => vi.unstubAllGlobals());

describe('uploadFile', () => {
  it('sends the file as it is, with its name, and reports the progress', async () => {
    const file = new File(['%PDF-1.7'], 'Molinó.pdf', { type: 'application/pdf' });
    const progress = vi.fn();
    const done = uploadFile(file, { onProgress: progress });
    const xhr = FakeXhr.last;
    expect([xhr.method, xhr.url, xhr.body]).toEqual(['POST', '/api/uploads', file]);
    expect(xhr.headers).toEqual({ 'Content-Type': 'application/octet-stream', 'X-File-Name': encodeURIComponent('Molinó.pdf') });
    xhr.upload.onprogress?.({ lengthComputable: true, loaded: 45, total: 100 });
    xhr.respond(201, { id: 'u1', name: 'Molinó.pdf', size: 8, format: 'pdf' });
    await expect(done).resolves.toEqual({ id: 'u1', name: 'Molinó.pdf', size: 8, format: 'pdf' });
    expect(progress).toHaveBeenCalledWith(45);
  });

  it('passes on the server message and whether e-mail is the way out', async () => {
    const done = uploadFile(new File(['x'], 'a.exe'));
    FakeXhr.last.respond(415, { error: 'Ezt a fájlt nem tudjuk fogadni.', emailFallback: true });
    await expect(done).rejects.toEqual(expect.objectContaining({ message: 'Ezt a fájlt nem tudjuk fogadni.', emailFallback: true }));
  });

  it('says the upload broke on a network error, and refuses too large files before sending', async () => {
    const broken = uploadFile(new File(['x'], 'a.pdf'));
    FakeXhr.last.onerror?.();
    await expect(broken).rejects.toEqual(expect.objectContaining({ message: UPLOAD_FAILED_MESSAGE, emailFallback: false }));
    const large = new File(['x'], 'nagy.pdf');
    Object.defineProperty(large, 'size', { value: MAX_UPLOAD_BYTES + 1 });
    await expect(uploadFile(large)).rejects.toBeInstanceOf(UploadError);
    await expect(uploadFile(large)).rejects.toEqual(expect.objectContaining({ message: UPLOAD_TOO_LARGE_MESSAGE }));
  });
});
```

Új fájl: `src/islands/shop/useArtworkFiles.test.ts`

```ts
/** @vitest-environment jsdom */
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ArtworkAnalysis } from '@/domain/artwork/types';
import { UploadError, uploadFile } from './upload-client';
import { useArtworkFiles } from './useArtworkFiles';

// vi.mock is hoisted above the imports, so its data must be hoisted too.
const { ANALYSIS } = vi.hoisted(() => ({
  ANALYSIS: {
    format: 'pdf',
    pages: [],
    pixels: null,
    dpi: null,
    confidence: 'none',
    hints: { scale: null, bleedMmFromText: null, title: null },
    warnings: [],
  } as ArtworkAnalysis,
}));

vi.mock('./upload-client', async (importOriginal) => ({ ...(await importOriginal<typeof import('./upload-client')>()), uploadFile: vi.fn() }));
vi.mock('@/domain/artwork/analyze', () => ({ analyzeArtwork: vi.fn(async () => ANALYSIS) }));

const upload = vi.mocked(uploadFile);

beforeEach(() => upload.mockReset());

describe('useArtworkFiles', () => {
  it('reads and uploads a chosen file, then lists it for the cart', async () => {
    upload.mockImplementation(async (file, options) => {
      options?.onProgress?.(50);
      return { id: '3f8a2b6c-1d4e-4f5a-9b7c-0e1d2c3b4a59', name: file.name, size: file.size, format: 'pdf' };
    });
    const onAnalysis = vi.fn();
    const { result } = renderHook(() => useArtworkFiles({ analyze: true, onAnalysis }));
    act(() => result.current.add([new File(['%PDF-1.7'], 'logo.pdf')]));
    expect(result.current.busy).toBe(true);
    await waitFor(() => expect(result.current.files[0]?.status).toBe('done'));
    expect(result.current.busy).toBe(false);
    expect(result.current.uploaded).toEqual([
      { uploadId: '3f8a2b6c-1d4e-4f5a-9b7c-0e1d2c3b4a59', name: 'logo.pdf', size: 8, uploadedAt: expect.any(String) },
    ]);
    await waitFor(() => expect(onAnalysis).toHaveBeenCalledWith(ANALYSIS, true));
  });

  it('keeps a refused file with its message, and tries again', async () => {
    upload.mockRejectedValueOnce(new UploadError('A fájlfeltöltés most nem működik.', true));
    const { result } = renderHook(() => useArtworkFiles());
    act(() => result.current.add([new File(['x'], 'logo.pdf')]));
    await waitFor(() => expect(result.current.files[0]).toMatchObject({ status: 'error', error: 'A fájlfeltöltés most nem működik.', emailFallback: true }));
    upload.mockResolvedValueOnce({ id: 'u2', name: 'logo.pdf', size: 1, format: 'pdf' });
    act(() => result.current.retry(result.current.files[0]!.localId));
    await waitFor(() => expect(result.current.files[0]?.status).toBe('done'));
  });

  it('starts from the files of a cart item, and takes at most the limit', () => {
    const initial = [{ uploadId: 'u1', name: 'regi.pdf', size: 3, uploadedAt: '2026-10-09T10:00:00.000Z' }];
    const { result } = renderHook(() => useArtworkFiles({ initial, max: 2 }));
    expect(result.current.uploaded).toEqual(initial);
    upload.mockImplementation(() => new Promise(() => {}));
    act(() => result.current.add([new File(['a'], 'a.pdf'), new File(['b'], 'b.pdf')]));
    expect(result.current.files).toHaveLength(2);
    expect(result.current.full).toBe(true);
  });
});
```

- [ ] **Step 2: Futtasd, hogy lásd elbukni**

Run: `npx vitest run src/islands/shop`
Expected: FAIL (hiányzó modulok).

- [ ] **Step 3: A megvalósítás**

Új fájl: `src/islands/shop/cart-store.ts`

```ts
// The cart in the browser for the islands: read and write the stored cart, tell the header (CART_CHANGED_EVENT), and
// a hook that follows changes from this tab and the others.
import { useCallback, useEffect, useState } from 'react';
import { type CartEntry, parseStoredCart, serializeCart } from '@/domain/cart';
import { CART_CHANGED_EVENT, CART_STORAGE_KEY } from '@/domain/cart-count';

export function readCart(): { entries: CartEntry[]; dropped: number } {
  try {
    return parseStoredCart(localStorage.getItem(CART_STORAGE_KEY));
  } catch {
    return { entries: [], dropped: 0 };
  }
}

export function writeCart(entries: readonly CartEntry[]): void {
  try {
    if (entries.length > 0) localStorage.setItem(CART_STORAGE_KEY, serializeCart(entries));
    else localStorage.removeItem(CART_STORAGE_KEY);
  } catch {
    // Private mode or full storage: the cart lasts as long as the page.
  }
  window.dispatchEvent(new Event(CART_CHANGED_EVENT));
}

export interface CartApi {
  entries: CartEntry[];
  /** Items dropped when the cart was loaded (no longer valid). */
  dropped: number;
  /** False until the stored cart is read. */
  ready: boolean;
  add(entry: CartEntry): void;
  /** Replaces the item with the same key (editing). */
  replace(entry: CartEntry): void;
  remove(key: string): void;
  setQuantity(key: string, quantity: number): void;
  clear(): void;
}

export function useCart(): CartApi {
  const [state, setState] = useState({ entries: [] as CartEntry[], dropped: 0, ready: false });
  useEffect(() => {
    const first = readCart();
    if (first.dropped > 0) writeCart(first.entries);
    setState({ entries: first.entries, dropped: first.dropped, ready: true });
    const reload = () => setState((current) => ({ ...current, entries: readCart().entries }));
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === CART_STORAGE_KEY) reload();
    };
    window.addEventListener(CART_CHANGED_EVENT, reload);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(CART_CHANGED_EVENT, reload);
      window.removeEventListener('storage', onStorage);
    };
  }, []);
  const update = useCallback((change: (entries: CartEntry[]) => CartEntry[]) => writeCart(change(readCart().entries)), []);
  return {
    ...state,
    add: (entry) => update((list) => [...list, entry]),
    replace: (entry) => update((list) => list.map((item) => (item.key === entry.key ? entry : item))),
    remove: (key) => update((list) => list.filter((item) => item.key !== key)),
    setQuantity: (key, quantity) =>
      update((list) => list.map((item) => (item.key === key ? { ...item, config: { ...item.config, quantity } } : item))),
    clear: () => writeCart([]),
  };
}
```

Új fájl: `src/islands/shop/upload-client.ts`

```ts
// Uploads one file to POST /api/uploads: the file itself as the body, its name in X-File-Name. XMLHttpRequest instead
// of fetch, because only it reports the upload's progress.
import { MAX_UPLOAD_BYTES, UPLOAD_FAILED_MESSAGE, UPLOAD_TOO_LARGE_MESSAGE } from '@/domain/uploads';

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  format: string;
}

export class UploadError extends Error {
  /** The server suggests sending the file by e-mail instead (too large, unknown type, no storage). */
  readonly emailFallback: boolean;

  constructor(message: string, emailFallback: boolean) {
    super(message);
    this.name = 'UploadError';
    this.emailFallback = emailFallback;
  }
}

export function uploadFile(file: File, { onProgress }: { onProgress?: (percent: number) => void } = {}): Promise<UploadedFile> {
  if (file.size > MAX_UPLOAD_BYTES) return Promise.reject(new UploadError(UPLOAD_TOO_LARGE_MESSAGE, true));
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/uploads');
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');
    xhr.setRequestHeader('X-File-Name', encodeURIComponent(file.name));
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      let body: { id?: unknown; name?: unknown; size?: unknown; format?: unknown; error?: unknown; emailFallback?: unknown } = {};
      try {
        body = JSON.parse(xhr.responseText) as typeof body;
      } catch {
        // Not JSON: a generic message below.
      }
      if (xhr.status === 201 && typeof body.id === 'string') {
        resolve({ id: body.id, name: String(body.name ?? file.name), size: Number(body.size ?? file.size), format: String(body.format ?? '') });
      } else {
        reject(new UploadError(typeof body.error === 'string' ? body.error : UPLOAD_FAILED_MESSAGE, body.emailFallback === true));
      }
    };
    xhr.onerror = () => reject(new UploadError(UPLOAD_FAILED_MESSAGE, false));
    xhr.send(file);
  });
}
```

Új fájl: `src/islands/shop/useArtworkFiles.ts`

```ts
// The files of one cart item (or the site photos): each chosen file is uploaded at once, and, in the configurator,
// read in the browser for its size and resolution (the analyzer, with pdf-lib, loads on the first file only).
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ArtworkAnalysis } from '@/domain/artwork/types';
import type { CartFile } from '@/domain/cart';
import { MAX_UPLOADS_PER_ITEM } from '@/domain/schemas';
import { UPLOAD_FAILED_MESSAGE } from '@/domain/uploads';
import { UploadError, uploadFile } from './upload-client';

export interface ArtworkFileState {
  localId: string;
  name: string;
  size: number;
  status: 'uploading' | 'done' | 'error';
  progress: number;
  uploadId?: string | undefined;
  uploadedAt?: string | undefined;
  error?: string | undefined;
  emailFallback?: boolean | undefined;
  analysis?: ArtworkAnalysis | undefined;
  /** An object URL of an image file, for the preview. */
  previewUrl?: string | undefined;
}

export interface ArtworkFiles {
  files: ArtworkFileState[];
  add(files: readonly File[]): void;
  retry(localId: string): void;
  remove(localId: string): void;
  clear(): void;
  /** A file is still uploading. */
  busy: boolean;
  /** No more files fit. */
  full: boolean;
  /** The uploaded files, as the cart keeps them. */
  uploaded: CartFile[];
}

export interface ArtworkFilesOptions {
  initial?: readonly CartFile[];
  /** Read each file's size and resolution in the browser (the configurator); off for the site photos. */
  analyze?: boolean;
  /** A file's analysis is ready; `first` tells whether it is the first file of the list. */
  onAnalysis?: (analysis: ArtworkAnalysis, first: boolean) => void;
  max?: number;
}

const PREVIEWABLE = /^image\/(png|jpeg|webp|gif|avif|svg\+xml)$/;

function readBytes(file: Blob): Promise<Uint8Array> {
  if (typeof file.arrayBuffer === 'function') return file.arrayBuffer().then((buffer) => new Uint8Array(buffer));
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

async function analyzeFile(file: File): Promise<ArtworkAnalysis> {
  const [{ analyzeArtwork }, bytes] = await Promise.all([import('@/domain/artwork/analyze'), readBytes(file)]);
  return analyzeArtwork(bytes, file.name);
}

const fromCart = (file: CartFile): ArtworkFileState => ({
  localId: file.uploadId,
  name: file.name,
  size: file.size,
  status: 'done',
  progress: 100,
  uploadId: file.uploadId,
  uploadedAt: file.uploadedAt,
});

export function useArtworkFiles({ initial = [], analyze = false, onAnalysis, max = MAX_UPLOADS_PER_ITEM }: ArtworkFilesOptions = {}): ArtworkFiles {
  const [files, setFiles] = useState<ArtworkFileState[]>(() => initial.map(fromCart));
  const originals = useRef(new Map<string, File>());
  const latest = useRef({ files, onAnalysis });
  latest.current = { files, onAnalysis };

  const patch = useCallback((localId: string, change: Partial<ArtworkFileState>) => {
    setFiles((list) => list.map((file) => (file.localId === localId ? { ...file, ...change } : file)));
  }, []);

  const start = useCallback(
    (localId: string, file: File) => {
      patch(localId, { status: 'uploading', progress: 0, error: undefined, emailFallback: undefined });
      uploadFile(file, { onProgress: (progress) => patch(localId, { progress }) })
        .then((uploaded) => patch(localId, { status: 'done', progress: 100, uploadId: uploaded.id, uploadedAt: new Date().toISOString() }))
        .catch((error: unknown) =>
          patch(localId, {
            status: 'error',
            error: error instanceof UploadError ? error.message : UPLOAD_FAILED_MESSAGE,
            emailFallback: error instanceof UploadError && error.emailFallback,
          }),
        );
    },
    [patch],
  );

  const add = useCallback(
    (chosen: readonly File[]) => {
      const room = Math.max(0, max - latest.current.files.length);
      for (const file of chosen.slice(0, room)) {
        const localId = crypto.randomUUID();
        originals.current.set(localId, file);
        const previewUrl = PREVIEWABLE.test(file.type) && typeof URL.createObjectURL === 'function' ? URL.createObjectURL(file) : undefined;
        setFiles((list) => [...list, { localId, name: file.name, size: file.size, status: 'uploading', progress: 0, previewUrl }]);
        start(localId, file);
        if (analyze) {
          analyzeFile(file)
            .then((analysis) => {
              patch(localId, { analysis });
              latest.current.onAnalysis?.(analysis, latest.current.files[0]?.localId === localId);
            })
            .catch(() => {
              // The size can still be typed; the upload goes on.
            });
        }
      }
    },
    [analyze, max, patch, start],
  );

  const forget = (file: ArtworkFileState) => {
    if (file.previewUrl) URL.revokeObjectURL(file.previewUrl);
    originals.current.delete(file.localId);
  };

  useEffect(() => () => latest.current.files.forEach((file) => file.previewUrl && URL.revokeObjectURL(file.previewUrl)), []);

  return {
    files,
    add,
    retry: (localId) => {
      const file = originals.current.get(localId);
      if (file) start(localId, file);
    },
    remove: (localId) =>
      setFiles((list) => {
        const gone = list.find((file) => file.localId === localId);
        if (gone) forget(gone);
        return list.filter((file) => file.localId !== localId);
      }),
    clear: () =>
      setFiles((list) => {
        list.forEach(forget);
        return [];
      }),
    busy: files.some((file) => file.status === 'uploading'),
    full: files.length >= max,
    uploaded: files
      .filter((file) => file.status === 'done' && file.uploadId)
      .map((file) => ({ uploadId: file.uploadId!, name: file.name, size: file.size, uploadedAt: file.uploadedAt ?? new Date().toISOString() })),
  };
}
```

Új fájl: `src/islands/shop/useDebounced.ts`

```ts
// The value after it has stopped changing for `ms` milliseconds: the configurator announces its price this way, so a
// screen reader does not read every keystroke's price.
import { useEffect, useState } from 'react';

export function useDebounced<T>(value: T, ms: number): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return settled;
}
```

- [ ] **Step 4: Futtasd újra**

Run: `npx vitest run src/islands/shop`
Expected: PASS. (A jsdom nem ismeri az `URL.createObjectURL`-t; a hook ezt ellenőrzi, és ilyenkor nem készít előnézetet.)

- [ ] **Step 5: Ellenőrzés és commit**

Run: `npm test && npm run check`
Expected: zöld.

```bash
git add src/islands/shop
git -c user.name=Claude -c user.email=noreply@anthropic.com commit -q -F - <<'EOF'
Add the shop's browser helpers: the cart, uploads and file state

useCart keeps the stored cart in step across tabs and tells the header;
uploadFile sends one file with progress; useArtworkFiles uploads each chosen
file and, in the configurator, reads it with the analyzer loaded on demand.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 11: A konfigurátor szigete és a termékoldal

**Files:**
- Create: `src/islands/shop/shop.css`, `src/islands/shop/ProductOptions.tsx`, `src/islands/shop/ArtworkField.tsx`, `src/islands/shop/CartLines.tsx`, `src/islands/shop/CartDrawer.tsx`, `src/islands/shop/Configurator.tsx`, `src/islands/shop/Configurator.test.tsx`
- Create: `src/pages/webshop/[termek].astro`

**Interfaces:**
- Consumes: Task 9 (`Draft`, `defaultDraft`, `draftToConfig`, `draftFromConfig`, `draftIssues`, `sizeText`, `artworkSizeFor`, `preflightSummary`, `artworkDetail`, `priceRows`, `cartTotals`, `DISCOUNT_SUMMARY`), Task 10 (`useCart`, `readCart`, `CartApi`, `useArtworkFiles`, `ArtworkFiles`, `useDebounced`), Task 8 (`PRODUCT_KIND`, `productHref`, `productPriceTable`, `CART_HREF`, `CHECKOUT_HREF`).
- Produces:
  - `Configurator({ productId }: { productId: ShopProductId })` (sziget, `client:only="react"`)
  - `CartLines(props: { entries; onRemove?; onQuantity?; editable?; errors?: Record<number, string>; now? })`
  - `CartDrawer({ open, onClose, cart }: { open: boolean; onClose: () => void; cart: CartApi })`
  - `ArtworkField({ files, title?, hint? }: { files: ArtworkFiles; title?: string; hint?: string })`
  - a közös `shop.css` osztályai: `shop-cfg*`, `shop-lines*`, `shop-drawer*` (a 12–13. feladat `shop-page*` és `shop-checkout*` osztályokkal bővíti)

- [ ] **Step 1: A teszt**

Új fájl: `src/islands/shop/Configurator.test.tsx`

```tsx
/** @vitest-environment jsdom */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ArtworkAnalysis } from '@/domain/artwork/types';
import { type CartEntry, parseStoredCart, serializeCart } from '@/domain/cart';
import { CART_STORAGE_KEY } from '@/domain/cart-count';
import { formatHuf } from '@/domain/money';
import { priceConfiguration, type ProductConfig } from '@/domain/pricing';
import { Configurator } from './Configurator';
import { uploadFile } from './upload-client';

const UPLOAD = '3f8a2b6c-1d4e-4f5a-9b7c-0e1d2c3b4a59';
const { ANALYSIS } = vi.hoisted(() => ({
  ANALYSIS: {
    format: 'pdf',
    pages: [
      {
        index: 1,
        size: { widthMm: 3000, heightMm: 1500 },
        sizeSource: 'trimbox',
        printSize: { widthMm: 3000, heightMm: 1500 },
        bleedMm: null,
        rotation: 0,
        contentKey: null,
      },
    ],
    pixels: null,
    dpi: null,
    confidence: 'exact',
    hints: { scale: null, bleedMmFromText: null, title: null },
    warnings: [],
  } as ArtworkAnalysis,
}));

vi.mock('./upload-client', async (importOriginal) => ({ ...(await importOriginal<typeof import('./upload-client')>()), uploadFile: vi.fn() }));
vi.mock('@/domain/artwork/analyze', () => ({ analyzeArtwork: vi.fn(async () => ANALYSIS) }));

const MOLINO: ProductConfig = { productId: 'molino', materialId: 'standard', edgeFinishId: 'szeges-ringli', widthCm: 200, heightCm: 100, quantity: 1, express: false };
/** Prices contain no-break spaces; compare text with plain ones. */
const plain = (text: string | null | undefined) => (text ?? '').replace(/[  ]/g, ' ');
const pageText = () => plain(document.body.textContent);
const priceText = (config: ProductConfig) => plain(formatHuf(priceConfiguration(config).grossTotal));
const addButton = (name: string) => screen.getByRole('button', { name }) as HTMLButtonElement;

beforeEach(() => {
  vi.mocked(uploadFile).mockResolvedValue({ id: UPLOAD, name: 'nyitas.pdf', size: 8, format: 'pdf' });
  window.location.hash = '';
});
afterEach(() => localStorage.clear());

describe('Configurator', () => {
  it('prices the default molinó, follows the size typed in, and stops at a wrong size', () => {
    render(<Configurator productId="molino" />);
    expect(pageText()).toContain(priceText(MOLINO));
    fireEvent.change(screen.getByLabelText('Szélesség'), { target: { value: '300' } });
    expect(pageText()).toContain(priceText({ ...MOLINO, widthCm: 300 }));
    fireEvent.change(screen.getByLabelText('Szélesség'), { target: { value: '900' } });
    expect(pageText()).toContain('A szélesség 20 és 500 cm között lehet.');
    expect(addButton('Kosárba').disabled).toBe(true);
  });

  it('fills the size from the uploaded file and puts the item with its file in the cart', async () => {
    render(<Configurator productId="molino" />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(['%PDF-1.7'], 'nyitas.pdf', { type: 'application/pdf' })] } });
    await waitFor(() => expect((screen.getByLabelText('Szélesség') as HTMLInputElement).value).toBe('300'));
    expect((screen.getByLabelText('Magasság') as HTMLInputElement).value).toBe('150');
    expect(pageText()).toContain('A méret a fájlból');
    await waitFor(() => expect(addButton('Kosárba').disabled).toBe(false));
    fireEvent.click(addButton('Kosárba'));
    const { entries } = parseStoredCart(localStorage.getItem(CART_STORAGE_KEY));
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      config: { ...MOLINO, widthCm: 300, heightCm: 150 },
      files: [{ uploadId: UPLOAD, name: 'nyitas.pdf', size: 8 }],
    });
    expect(screen.getByRole('link', { name: 'Tovább a pénztárba' }).getAttribute('href')).toBe('/penztar');
  });

  it('edits a cart item opened with #tetel=', () => {
    const entry: CartEntry = { key: 'k1', config: { ...MOLINO, widthCm: 250 }, files: [], addedAt: '2026-10-09T10:00:00.000Z' };
    localStorage.setItem(CART_STORAGE_KEY, serializeCart([entry]));
    window.location.hash = '#tetel=k1';
    render(<Configurator productId="molino" />);
    expect((screen.getByLabelText('Szélesség') as HTMLInputElement).value).toBe('250');
    fireEvent.change(screen.getByLabelText('Magasság'), { target: { value: '120' } });
    fireEvent.click(addButton('Tétel frissítése'));
    const { entries } = parseStoredCart(localStorage.getItem(CART_STORAGE_KEY));
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ key: 'k1', config: { widthCm: 250, heightCm: 120 } });
  });
});
```

- [ ] **Step 2: Futtasd, hogy lásd elbukni**

Run: `npx vitest run src/islands/shop/Configurator.test.tsx`
Expected: FAIL (`Cannot find module './Configurator'`).

- [ ] **Step 3: A közös stílus és a darabok**

Új fájl: `src/islands/shop/shop.css`

```css
/* The webshop islands: configurator, cart lines and drawer (the cart page and the checkout add theirs below). Tokens only. */

.shop-cfg {
  display: grid;
  gap: var(--space-6);
}
.shop-cfg__options,
.shop-cfg__summary {
  display: grid;
  gap: var(--space-5);
  align-content: start;
}
@media (min-width: 960px) {
  .shop-cfg {
    grid-template-columns: minmax(0, 1fr) minmax(18rem, 26rem);
    align-items: start;
  }
  .shop-cfg__summary {
    position: sticky;
    top: calc(var(--layout-header-height) + var(--space-4));
  }
}
.shop-cfg__group {
  display: grid;
  gap: var(--space-3);
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}
.shop-cfg__group > legend,
.shop-cfg__group > h3 {
  margin: 0 0 var(--space-2);
  padding: 0;
  font-size: var(--text-md);
  font-weight: var(--weight-semibold);
}
.shop-cfg__optional {
  font-weight: var(--weight-regular);
  color: var(--color-text-muted);
}
.shop-cfg__files {
  display: grid;
  gap: var(--space-3);
}
.shop-cfg__wait {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.shop-lines {
  display: grid;
  gap: var(--space-4);
  margin: 0;
  padding: 0;
  list-style: none;
}
.shop-lines__item {
  display: grid;
  gap: var(--space-2);
}
.shop-lines__tools {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  align-items: end;
}
.shop-lines__tools a,
.shop-drawer__foot a {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  color: var(--color-text);
}
.shop-lines__warn,
.shop-lines__error {
  margin: 0;
  font-size: var(--text-sm);
}
.shop-lines__warn {
  color: var(--color-signal-warn);
}
.shop-lines__error {
  color: var(--color-signal-bad);
}

.shop-drawer__foot {
  display: grid;
  gap: var(--space-3);
}
.shop-drawer__total {
  display: flex;
  justify-content: space-between;
  margin: 0;
}
```

Új fájl: `src/islands/shop/ProductOptions.tsx`

```tsx
// The product-specific part of the configurator: material, size, edge finish, add-ons and formats, all from the
// catalog and priced gross. One switch instead of six components: they would repeat the same few controls.
import { MATRICA, MOLINO, ORIENTATIONS, type Orientation, PLAKAT, ROLLUP, TABLA, VASZONKEP } from '@/domain/catalog';
import { formatHuf } from '@/domain/money';
import { grossOf } from '@/domain/pricing';
import { materialOption } from '@/site/catalog-ui';
import { ChipGroup } from '@/ui/ChipGroup/ChipGroup';
import { MaterialPicker } from '@/ui/MaterialPicker/MaterialPicker';
import { OptionRow } from '@/ui/OptionRow/OptionRow';
import { QuantityStepper } from '@/ui/QuantityStepper/QuantityStepper';
import { SegmentedChoice } from '@/ui/SegmentedChoice/SegmentedChoice';
import { SizeFields } from '@/ui/SizeFields/SizeFields';
import { type Draft, sizeText } from './draft';

export interface ProductOptionsProps {
  draft: Draft;
  /** Messages by configuration path (draftIssues). */
  issues: Readonly<Record<string, string>>;
  onChange: (change: Partial<Draft>) => void;
  /** The size was read from the uploaded file. */
  sizeFromFile: boolean;
  /** The customer typed or picked a size: it no longer comes from the file. */
  onSizeTyped: () => void;
}

const gross = (net: number) => formatHuf(grossOf(net));

function Size({ draft, issues, onChange, sizeFromFile, onSizeTyped, presets }: ProductOptionsProps & {
  presets?: readonly { readonly widthCm: number; readonly heightCm: number }[];
}) {
  const key = (widthCm: number, heightCm: number) => `${sizeText(widthCm)}×${sizeText(heightCm)}`;
  return (
    <>
      {presets && (
        <ChipGroup
          legend="Gyakori méretek"
          options={presets.map((p) => ({ value: key(p.widthCm, p.heightCm), label: `${key(p.widthCm, p.heightCm)} cm` }))}
          value={`${draft.width}×${draft.height}`}
          onChange={(value) => {
            const [width = '', height = ''] = value.split('×');
            onSizeTyped();
            onChange({ width, height });
          }}
        />
      )}
      <SizeFields
        width={draft.width}
        height={draft.height}
        onWidthChange={(width) => {
          onSizeTyped();
          onChange({ width });
        }}
        onHeightChange={(height) => {
          onSizeTyped();
          onChange({ height });
        }}
        onSwap={() => onChange({ width: draft.height, height: draft.width })}
        fromFile={sizeFromFile}
        error={issues.widthCm ?? issues.heightCm}
      />
    </>
  );
}

function Orientations({ draft, onChange }: ProductOptionsProps) {
  return (
    <SegmentedChoice
      legend="Tájolás"
      options={ORIENTATIONS.map((o) => ({ value: o.id, label: o.name }))}
      value={draft.orientation}
      onChange={(orientation) => onChange({ orientation: orientation as Orientation })}
    />
  );
}

export function ProductOptions(props: ProductOptionsProps) {
  const { draft, issues, onChange } = props;
  switch (draft.productId) {
    case 'molino':
      return (
        <>
          <MaterialPicker materials={MOLINO.materials.map(materialOption)} value={draft.materialId} onChange={(materialId) => onChange({ materialId })} />
          <Size {...props} presets={MOLINO.suggestedSizes} />
          <fieldset className="shop-cfg__group">
            <legend>Szélkidolgozás</legend>
            {MOLINO.edgeFinishes.map((edge) => (
              <OptionRow
                key={edge.id}
                name="edgeFinishId"
                value={edge.id}
                label={edge.name}
                description={edge.description}
                rate={grossOf(edge.priceNetPerM)}
                rateUnit="fm"
                checked={draft.edgeFinishId === edge.id}
                onChange={() => onChange({ edgeFinishId: edge.id })}
              />
            ))}
          </fieldset>
        </>
      );
    case 'matrica':
      return (
        <>
          <MaterialPicker materials={MATRICA.materials.map(materialOption)} value={draft.materialId} onChange={(materialId) => onChange({ materialId })} />
          <Size {...props} />
          <fieldset className="shop-cfg__group">
            <legend>Kiegészítők</legend>
            {MATRICA.areaAddOns.map((addOn) => (
              <OptionRow
                key={addOn.id}
                type="checkbox"
                name="addOnIds"
                value={addOn.id}
                label={addOn.name}
                description={addOn.description}
                rate={grossOf(addOn.priceNetPerM2)}
                rateUnit="m²"
                checked={draft.addOnIds.includes(addOn.id)}
                onChange={(event) =>
                  onChange({
                    addOnIds: event.target.checked ? [...draft.addOnIds, addOn.id] : draft.addOnIds.filter((id) => id !== addOn.id),
                  })
                }
              />
            ))}
          </fieldset>
        </>
      );
    case 'tabla':
      return (
        <>
          <MaterialPicker materials={TABLA.materials.map(materialOption)} value={draft.materialId} onChange={(materialId) => onChange({ materialId })} />
          <Size {...props} />
          {TABLA.pieceAddOns.map((addOn) => (
            <QuantityStepper
              key={addOn.id}
              label={`${addOn.name} (${gross(addOn.priceNet)}/${addOn.unit})`}
              help={addOn.description}
              min={0}
              max={addOn.maxCount}
              value={addOn.id === 'furat' ? draft.furat : draft.tavtarto}
              onChange={(count) => onChange(addOn.id === 'furat' ? { furat: count } : { tavtarto: count })}
              error={issues[`addOnCounts.${addOn.id}`]}
            />
          ))}
        </>
      );
    case 'rollup':
      return (
        <>
          <SegmentedChoice
            legend="Kivitel"
            options={[
              { value: 'teljes', label: 'Teljes roll-up', description: 'Állvány, nyomott grafika és táska' },
              { value: 'grafika', label: ROLLUP.graphicOnly.name, description: `${ROLLUP.graphicOnly.description} ${gross(ROLLUP.graphicOnly.priceNet)}` },
            ]}
            value={draft.graphicOnly ? 'grafika' : 'teljes'}
            onChange={(value) => onChange({ graphicOnly: value === 'grafika' })}
          />
          <SegmentedChoice
            legend="Méret"
            options={ROLLUP.formats.map((f) => ({ value: f.id, label: f.name, description: draft.graphicOnly ? undefined : gross(f.priceNet) }))}
            value={draft.formatId}
            onChange={(formatId) => onChange({ formatId })}
          />
        </>
      );
    case 'plakat':
      return (
        <>
          <SegmentedChoice
            legend="Méret"
            options={[
              ...PLAKAT.formats.map((f) => ({ value: f.id, label: f.name, description: gross(f.priceNet) })),
              { value: PLAKAT.blueback.id, label: PLAKAT.blueback.name, description: `${gross(PLAKAT.blueback.priceNetPerM2)}/m²` },
            ]}
            value={draft.formatId}
            onChange={(formatId) => onChange({ formatId })}
          />
          {draft.formatId === PLAKAT.blueback.id ? (
            <Size {...props} />
          ) : (
            <>
              <SegmentedChoice
                legend="Papír"
                options={PLAKAT.paperFinishes.map((p) => ({ value: p.id, label: p.name }))}
                value={draft.paperFinish}
                onChange={(paperFinish) => onChange({ paperFinish })}
              />
              <Orientations {...props} />
            </>
          )}
        </>
      );
    case 'vaszonkep':
      return (
        <>
          <SegmentedChoice
            legend="Méret"
            options={[
              ...VASZONKEP.formats.map((f) => ({ value: f.id, label: f.name, description: gross(f.priceNet) })),
              { value: 'egyedi', label: VASZONKEP.custom.name, description: `${gross(VASZONKEP.custom.priceNetPerM2)}/m²` },
            ]}
            value={draft.formatId}
            onChange={(formatId) => onChange({ formatId })}
          />
          {draft.formatId === 'egyedi' ? <Size {...props} /> : <Orientations {...props} />}
        </>
      );
  }
}
```

Új fájl: `src/islands/shop/ArtworkField.tsx`

```tsx
// The file field of the configurator and of the site photos: choose or drop files; each is uploaded at once, with its
// progress as text. A refused upload offers e-mail instead, and the item can still go into the cart without it.
import { ARTWORK_ACCEPT } from '@/domain/artwork/filetypes';
import { UPLOAD_ACCEPTED_TEXT } from '@/domain/uploads';
import { Button } from '@/ui/Button/Button';
import { FileDrop } from '@/ui/FileDrop/FileDrop';
import { FileList, type FileListItem } from '@/ui/FileList/FileList';
import { Notice } from '@/ui/Notice/Notice';
import { artworkDetail } from './artwork-size';
import type { ArtworkFiles } from './useArtworkFiles';

export interface ArtworkFieldProps {
  files: ArtworkFiles;
  title?: string;
  hint?: string;
}

export function ArtworkField({ files, title = 'Húzza ide a grafikát', hint = UPLOAD_ACCEPTED_TEXT }: ArtworkFieldProps) {
  const items: FileListItem[] = files.files.map((file) => ({
    id: file.localId,
    name: file.name,
    size: file.size,
    thumbnailUrl: file.previewUrl,
    detail: file.status === 'error' ? file.error : file.analysis ? artworkDetail(file.analysis) : undefined,
    status: file.status === 'uploading' ? 'pending' : file.status === 'done' ? 'ok' : 'error',
    statusText: file.status === 'uploading' ? `Feltöltés: ${file.progress}%` : file.status === 'done' ? 'Feltöltve' : 'Nem sikerült',
  }));
  const failed = files.files.filter((file) => file.status === 'error');
  return (
    <div className="shop-cfg__files">
      <FileDrop onFiles={files.add} accept={ARTWORK_ACCEPT} multiple title={title} hint={hint} disabled={files.full} />
      {items.length > 0 && <FileList items={items} onRemove={files.remove} />}
      {failed.map((file) => (
        <Button key={file.localId} variant="secondary" size="sm" onClick={() => files.retry(file.localId)}>
          Újra: {file.name}
        </Button>
      ))}
      {failed.some((file) => file.emailFallback) && (
        <Notice>A fájlt a rendelés után e-mailben is elküldheti, a rendelésszámmal. A tétel fájl nélkül is kosárba tehető.</Notice>
      )}
    </div>
  );
}
```

Új fájl: `src/islands/shop/CartLines.tsx`

```tsx
// The cart's items, in the drawer and on the cart page: the product, its configuration in one line, the files, the
// gross price; on the cart page also the quantity, "Módosítás" and a warning about files the server may have deleted.
import { type CartEntry, expiredFiles } from '@/domain/cart';
import { MAX_QUANTITY, SHOP_PRODUCTS } from '@/domain/catalog';
import { describeConfiguration, tryPriceConfiguration } from '@/domain/pricing';
import { PRODUCT_KIND, productHref } from '@/site/shop-ui';
import { Badge } from '@/ui/Badge/Badge';
import { CartLine } from '@/ui/CartLine/CartLine';
import { QuantityStepper } from '@/ui/QuantityStepper/QuantityStepper';

export interface CartLinesProps {
  entries: readonly CartEntry[];
  onRemove?: (key: string) => void;
  /** Shows the quantity stepper (the cart page). */
  onQuantity?: (key: string, quantity: number) => void;
  /** Shows the "Módosítás" link (the cart page). */
  editable?: boolean;
  /** Messages from the order API, by item index. */
  errors?: Readonly<Record<number, string>>;
  now?: Date;
}

export function CartLines({ entries, onRemove, onQuantity, editable = false, errors = {}, now = new Date() }: CartLinesProps) {
  return (
    <ul className="shop-lines">
      {entries.map((entry, index) => {
        const priced = tryPriceConfiguration(entry.config);
        const spec = describeConfiguration(entry.config).split(' · ').slice(1).join(' · ');
        const files = entry.files.length > 0 ? `Grafika: ${entry.files.map((f) => f.name).join(', ')}` : 'Grafika: e-mailben küldi';
        const expired = expiredFiles(entry, now);
        const error = errors[index];
        return (
          <li key={entry.key} className="shop-lines__item">
            <CartLine
              title={SHOP_PRODUCTS[entry.config.productId].name}
              spec={
                <>
                  {spec}
                  <br />
                  {files}
                </>
              }
              price={priced.ok ? priced.price.grossTotal : 0}
              product={PRODUCT_KIND[entry.config.productId]}
              badges={entry.config.express ? <Badge tone="brand">Expressz</Badge> : undefined}
              onRemove={onRemove ? () => onRemove(entry.key) : undefined}
            />
            {(onQuantity || editable) && (
              <div className="shop-lines__tools">
                {onQuantity && (
                  <QuantityStepper value={entry.config.quantity} min={1} max={MAX_QUANTITY} onChange={(quantity) => onQuantity(entry.key, quantity)} />
                )}
                {editable && <a href={`${productHref(entry.config.productId)}#tetel=${entry.key}`}>Módosítás</a>}
              </div>
            )}
            {expired.length > 0 && (
              <p className="shop-lines__warn">
                Lejárt fájl: {expired.map((f) => f.name).join(', ')}. Töltse fel újra a Módosítás linkkel, vagy küldje el e-mailben a
                rendelés után.
              </p>
            )}
            {error && (
              <p className="shop-lines__error" role="alert">
                {error}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
```

Új fájl: `src/islands/shop/CartDrawer.tsx`

```tsx
// The cart drawer the configurator opens after "Kosárba": the items, the gross total and the way on.
import { formatHuf } from '@/domain/money';
import { Button } from '@/ui/Button/Button';
import { ButtonLink } from '@/ui/ButtonLink/ButtonLink';
import { Drawer } from '@/ui/Drawer/Drawer';
import { CART_HREF, CHECKOUT_HREF } from '@/ui/navigation';
import type { CartApi } from './cart-store';
import { CartLines } from './CartLines';
import { cartTotals } from './price-rows';

export interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  cart: CartApi;
}

export function CartDrawer({ open, onClose, cart }: CartDrawerProps) {
  const totals = cartTotals(cart.entries);
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Kosár"
      footer={
        <div className="shop-drawer__foot">
          <p className="shop-drawer__total">
            <span>Összesen, bruttó</span>
            <strong>{formatHuf(totals.gross)}</strong>
          </p>
          <ButtonLink href={CHECKOUT_HREF} block>
            Tovább a pénztárba
          </ButtonLink>
          <Button variant="secondary" block onClick={onClose}>
            Vásárlás folytatása
          </Button>
          <a href={CART_HREF}>A kosár megtekintése</a>
        </div>
      }
    >
      {cart.entries.length > 0 ? <CartLines entries={cart.entries} onRemove={cart.remove} /> : <p>A kosár üres.</p>}
    </Drawer>
  );
}
```

- [ ] **Step 4: A konfigurátor**

Új fájl: `src/islands/shop/Configurator.tsx`

```tsx
// The product page's island (client:only="react"): the product's options, the print files, the live gross price with
// its breakdown, the ready date and "Kosárba". A cart item opens for editing with /webshop/<termek>#tetel=<key>
// (docs/superpowers/specs/2026-10-09-webshop-4a-4b-design.md, 3.).
import { useMemo, useState } from 'react';
import type { ArtworkAnalysis } from '@/domain/artwork/types';
import type { CartEntry } from '@/domain/cart';
import { MAX_QUANTITY, type ShopProductId } from '@/domain/catalog';
import { estimateOrderReadyDate } from '@/domain/leadtime';
import { formatHuf } from '@/domain/money';
import { FINAL_PRICE_NOTICE } from '@/domain/orders';
import type { FitMode } from '@/domain/preflight';
import { configDimensionsCm, tryPriceConfiguration } from '@/domain/pricing';
import { MAX_ORDER_ITEMS } from '@/domain/schemas';
import { Button } from '@/ui/Button/Button';
import { DiscountHint } from '@/ui/DiscountHint/DiscountHint';
import { FitPicker } from '@/ui/FitPicker/FitPicker';
import { LeadTimeNote } from '@/ui/LeadTimeNote/LeadTimeNote';
import { Notice } from '@/ui/Notice/Notice';
import { PriceBreakdown } from '@/ui/PriceBreakdown/PriceBreakdown';
import { QuantityStepper } from '@/ui/QuantityStepper/QuantityStepper';
import { ReadinessLight } from '@/ui/ReadinessLight/ReadinessLight';
import { ScalePreview } from '@/ui/ScalePreview/ScalePreview';
import { Switch } from '@/ui/Switch/Switch';
import { ArtworkField } from './ArtworkField';
import { artworkSizeFor, preflightSummary } from './artwork-size';
import { CartDrawer } from './CartDrawer';
import { readCart, useCart } from './cart-store';
import { defaultDraft, type Draft, draftFromConfig, draftIssues, draftToConfig, sizeText } from './draft';
import { DISCOUNT_SUMMARY, priceRows } from './price-rows';
import { ProductOptions } from './ProductOptions';
import { useArtworkFiles } from './useArtworkFiles';
import { useDebounced } from './useDebounced';
import './shop.css';

/** The cart item of this product named in the address (#tetel=<key>), for editing. */
function editedEntry(productId: ShopProductId): CartEntry | null {
  const key = new URLSearchParams(window.location.hash.slice(1)).get('tetel');
  if (!key) return null;
  return readCart().entries.find((entry) => entry.key === key && entry.config.productId === productId) ?? null;
}

export interface ConfiguratorProps {
  productId: ShopProductId;
}

export function Configurator({ productId }: ConfiguratorProps) {
  const cart = useCart();
  const [editing] = useState(() => editedEntry(productId));
  const [draft, setDraft] = useState<Draft>(() => (editing ? draftFromConfig(editing.config) : defaultDraft(productId)));
  const [sizeFromFile, setSizeFromFile] = useState(false);
  const [fitMode, setFitMode] = useState<FitMode>(editing?.preflight?.fitMode ?? 'fill');
  const [fileNote, setFileNote] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const change = (patch: Partial<Draft>) => setDraft((current) => ({ ...current, ...patch }));

  // The first file sets the size (and the format, where the product has formats), without a confirm button (brief 8).
  const applyArtwork = (analysis: ArtworkAnalysis, first: boolean) => {
    if (!first) return;
    const size = artworkSizeFor(productId, analysis);
    if (!size) {
      setFileNote('A fájlból nem tudtuk kiolvasni a méretet. Adja meg kézzel.');
      return;
    }
    const notes: string[] = [];
    if (size.scale) notes.push(`A fájl 1:${size.scale} méretarányú rajznak tűnik, ezért a méretet ennek megfelelően állítottuk be.`);
    if (size.multiPage) notes.push('A fájl több oldalas: az első oldal méretét vettük alapul, a többit a műhely egyezteti.');
    const sized = { width: sizeText(size.widthCm), height: sizeText(size.heightCm) };
    setDraft((current) => {
      if (size.formatId) {
        return {
          ...current,
          formatId: size.formatId,
          ...(size.orientation ? { orientation: size.orientation } : {}),
          ...(size.formatId === 'egyedi' ? sized : {}),
        };
      }
      if (productId === 'rollup') return current;
      if (productId === 'plakat') return current.formatId === 'blueback' ? { ...current, ...sized } : current;
      return { ...current, ...sized };
    });
    if (productId === 'plakat' && !size.formatId) {
      notes.push(`A fájl mérete (${sized.width} × ${sized.height} cm) nem szabványos plakátméret. Válasszon formátumot, vagy kérjen ajánlatot.`);
    }
    setFileNote(notes.length > 0 ? notes.join(' ') : null);
    setSizeFromFile(true);
  };

  const files = useArtworkFiles({ initial: editing?.files ?? [], analyze: true, onAnalysis: applyArtwork });

  const config = useMemo(() => draftToConfig(draft), [draft]);
  const issues = useMemo(() => draftIssues(draft), [draft]);
  const priced = useMemo(() => tryPriceConfiguration(config), [config]);
  const price = priced.ok ? priced.price : null;
  const dims = price ? configDimensionsCm(config) : null;
  const analysis = files.files.find((file) => file.analysis)?.analysis;
  const preflight = analysis && dims ? preflightSummary(analysis, dims.widthCm, dims.heightCm, fitMode) : null;
  const vector = analysis?.confidence === 'exact';
  const announced = useDebounced(price ? `Kalkulált ár: ${formatHuf(price.grossTotal)}` : '', 600);
  const full = !editing && cart.entries.length >= MAX_ORDER_ITEMS;

  const addToCart = () => {
    if (!price) return;
    const entry: CartEntry = {
      key: editing?.key ?? crypto.randomUUID(),
      config,
      files: files.uploaded,
      ...(preflight ? { preflight } : {}),
      addedAt: editing?.addedAt ?? new Date().toISOString(),
    };
    if (editing) {
      cart.replace(entry);
    } else {
      cart.add(entry);
      // The next item starts without this one's files.
      files.clear();
      setSizeFromFile(false);
      setFileNote(null);
    }
    setDrawerOpen(true);
  };

  return (
    <div className="shop-cfg">
      <div className="shop-cfg__options">
        {editing && <Notice>A kosárban lévő tételt módosítja.</Notice>}
        <ProductOptions draft={draft} issues={issues} onChange={change} sizeFromFile={sizeFromFile} onSizeTyped={() => setSizeFromFile(false)} />
        <section className="shop-cfg__group" aria-labelledby="shop-cfg-files">
          <h3 id="shop-cfg-files">
            Grafika <span className="shop-cfg__optional">(nem kötelező)</span>
          </h3>
          <ArtworkField files={files} />
          {fileNote && <Notice live="polite">{fileNote}</Notice>}
        </section>
        <QuantityStepper
          value={draft.quantity}
          onChange={(quantity) => change({ quantity })}
          max={MAX_QUANTITY}
          help={DISCOUNT_SUMMARY}
          error={issues.quantity}
        />
        <Switch
          label="Expressz gyártás"
          description="1 munkanap, +30%. A visszaigazoláskor derül ki, vállalható-e."
          checked={draft.express}
          onChange={(event) => change({ express: event.target.checked })}
        />
      </div>
      <aside className="shop-cfg__summary" aria-label="Összesítő">
        {dims && (
          <ScalePreview
            widthCm={dims.widthCm}
            heightCm={dims.heightCm}
            imageUrl={files.files.find((file) => file.previewUrl)?.previewUrl}
            fit={fitMode}
            stand={productId === 'rollup'}
          />
        )}
        {preflight?.aspectMismatch && <FitPicker value={fitMode} onChange={setFitMode} />}
        {(preflight || vector) && <ReadinessLight rating={preflight?.rating} dpi={preflight?.dpi} vector={vector && !preflight} />}
        {price ? (
          <PriceBreakdown rows={priceRows(price)} total={price.grossTotal} net={price.netTotal} vat={price.vatTotal} note={FINAL_PRICE_NOTICE} />
        ) : (
          <Notice tone="warning">Javítsa a jelölt beállítást, és megmutatjuk az árat.</Notice>
        )}
        {price?.nextDiscountHint && <DiscountHint additionalQty={price.nextDiscountHint.additionalQty} pct={price.nextDiscountHint.pct} />}
        <LeadTimeNote readyBy={estimateOrderReadyDate(new Date(), { express: draft.express })} express={draft.express} />
        <p className="sd-vh" aria-live="polite">
          {announced}
        </p>
        <Button block onClick={addToCart} disabled={!price || files.busy || full}>
          {editing ? 'Tétel frissítése' : 'Kosárba'}
        </Button>
        {files.busy && <p className="shop-cfg__wait">A feltöltés befejezése után teheti kosárba.</p>}
        {full && <p className="shop-cfg__wait">A kosárban legfeljebb {MAX_ORDER_ITEMS} tétel lehet.</p>}
      </aside>
      <CartDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} cart={cart} />
    </div>
  );
}
```

- [ ] **Step 5: Futtasd újra**

Run: `npx vitest run src/islands/shop`
Expected: PASS. Ha a második teszt a fiók linkjét nem találja: a jsdom-ban a `<dialog>` `showModal` nélkül is `open` attribútumot kap (a `Drawer` így kezeli), és a `getByRole` csak a nyitott dialógus tartalmát látja; nézd meg, hogy a `drawerOpen` a kattintás után `true`-e.

- [ ] **Step 6: A termékoldal**

Új fájl: `src/pages/webshop/[termek].astro`

```astro
---
// One product of the webshop (prerendered): what it is, the configurator island (client:only, because the cart lives
// in the browser), its prices, production and handover. Without JavaScript everything but the configurator shows,
// with the quote and callback ways instead (docs/superpowers/specs/2026-10-09-webshop-4a-4b-design.md, 1. and 3.).
import { env } from 'cloudflare:workers';
import {
  EXPRESS_LEAD_BUSINESS_DAYS,
  EXPRESS_SURCHARGE_PERCENT,
  MATERIAL_SPECS_NEED_REVIEW,
  PRICES_ARE_PLACEHOLDERS,
  SHIPPING_METHODS,
  SHOP_PRODUCT_IDS,
  SHOP_PRODUCTS,
  type ShopProductId,
  STANDARD_LEAD_BUSINESS_DAYS,
} from '@/domain/catalog';
import { formatHuf } from '@/domain/money';
import { FINAL_PRICE_NOTICE } from '@/domain/orders';
import { grossOf } from '@/domain/pricing';
import { Configurator } from '@/islands/shop/Configurator';
import { DISCOUNT_SUMMARY } from '@/islands/shop/price-rows';
import Page from '@/layouts/Page.astro';
import { productPriceTable } from '@/site/shop-ui';
import { Notice } from '@/ui/Notice/Notice';
import { CALLBACK_HREF, QUOTE_HREF, WEBSHOP_HREF } from '@/ui/navigation';

export const prerender = true;

export function getStaticPaths() {
  return SHOP_PRODUCT_IDS.map((termek) => ({ params: { termek } }));
}

const productId = Astro.params.termek as ShopProductId;
const product = SHOP_PRODUCTS[productId];
const prices = productPriceTable(productId);
const showPlaceholders = (PRICES_ARE_PLACEHOLDERS || MATERIAL_SPECS_NEED_REVIEW) && env.PUBLIC_SITE_ENV !== 'production';
const shipping = SHIPPING_METHODS.map((method) => {
  const net = product.parcel === 'large' ? method.largeParcelPriceNet : method.priceNet;
  return { name: method.name, description: method.description, price: net === null ? 'egyedi' : net === 0 ? 'ingyenes' : formatHuf(grossOf(net)) };
});
---

<Page title={`${product.name} rendelés – Stilet Dekor`} description={product.shortDescription} currentHref={WEBSHOP_HREF}>
  <article class="tp">
    <nav class="tp__crumbs" aria-label="Morzsamenü">
      <ol>
        <li><a href={WEBSHOP_HREF}>Webshop</a></li>
        <li aria-current="page">{product.name}</li>
      </ol>
    </nav>
    <h1>{product.name}</h1>
    <p class="tp__lead">{product.shortDescription}</p>
    {
      showPlaceholders && (
        <Notice tone="warning" title="Helyőrző árak">
          Az árak és az anyagadatok egyelőre becslések; élesítés előtt a műhely átírja őket.
        </Notice>
      )
    }
    <section class="tp__tool" aria-label="Összeállítás">
      <Configurator client:only="react" productId={productId}>
        <p slot="fallback" class="tp__loading">A konfigurátor betöltése…</p>
      </Configurator>
      <noscript>
        <style is:inline>
          .tp__loading {
            display: none;
          }
        </style>
        <p class="tp__nojs">
          A rendeléshez JavaScript kell. Addig <a href={QUOTE_HREF}>kérjen ajánlatot</a>, vagy
          <a href={CALLBACK_HREF}>kérjen visszahívást</a>.
        </p>
      </noscript>
    </section>
    <section class="tp__info">
      <h2>Árak</h2>
      <table class="tp__prices">
        <caption class="sd-vh">{product.name} árai, bruttó</caption>
        <tbody>
          {
            prices.map((row) => (
              <tr>
                <th scope="row">{row.label}</th>
                <td>{row.price}</td>
              </tr>
            ))
          }
        </tbody>
      </table>
      <p class="tp__note">
        Az árak bruttók, 27% ÁFÁ-val. Mennyiségi kedvezmény azonos tételből: {DISCOUNT_SUMMARY}. {FINAL_PRICE_NOTICE}
      </p>
      <h2>Gyártás és átvétel</h2>
      <p>
        Gyártási idő: {STANDARD_LEAD_BUSINESS_DAYS} munkanap a díjbekérő befizetésétől; expressz gyártással
        {EXPRESS_LEAD_BUSINESS_DAYS} munkanap (+{EXPRESS_SURCHARGE_PERCENT}%), ha vállalható.
      </p>
      <ul class="tp__shipping">
        {
          shipping.map((s) => (
            <li>
              <strong>{s.name}</strong>: {s.price}. {s.description}
            </li>
          ))
        }
      </ul>
    </section>
  </article>
</Page>

<style>
  .tp {
    max-width: 72rem;
    margin: 0 auto;
    padding: var(--space-6) var(--layout-gutter) var(--space-9);
    display: grid;
    gap: var(--space-5);
  }
  .tp__crumbs ol {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }
  .tp__crumbs li + li::before {
    content: '/';
    margin-right: var(--space-2);
  }
  .tp__crumbs a,
  .tp a {
    color: var(--color-text);
  }
  h1 {
    margin: 0;
    font-family: var(--font-display);
    font-size: var(--text-2xl);
    font-variation-settings: var(--font-variation-display);
    font-weight: var(--weight-display);
    line-height: var(--leading-snug);
  }
  h2 {
    margin: var(--space-5) 0 var(--space-2);
    font-size: var(--text-lg);
  }
  .tp__lead,
  .tp__note {
    max-width: 44rem;
    margin: 0;
    color: var(--color-text-muted);
  }
  .tp__loading {
    min-height: 32rem;
    margin: 0;
    color: var(--color-text-muted);
  }
  .tp__prices {
    width: 100%;
    max-width: 44rem;
    border-collapse: collapse;
  }
  .tp__prices th,
  .tp__prices td {
    padding: var(--space-2) 0;
    border-bottom: 1px solid var(--color-line);
    text-align: left;
    font-weight: var(--weight-regular);
  }
  .tp__prices td {
    text-align: right;
    font-family: var(--font-mono);
    white-space: nowrap;
  }
  .tp__shipping {
    margin: 0;
    padding-left: var(--space-5);
  }
</style>
```


- [ ] **Step 7: Ellenőrzés és commit**

Run: `npm test && npm run check && npm run build`
Expected: zöld; a build kiírja a `/webshop/<termek>/index.html` oldalakat (6 db).

```bash
git add src/islands/shop src/pages/webshop
git -c user.name=Claude -c user.email=noreply@anthropic.com commit -q -F - <<'EOF'
Add the product pages and their configurator

Six prerendered product pages with their prices, production and handover;
the configurator island prices every option gross, fills the size from the
uploaded file, uploads it, and puts the item in the cart, whose drawer leads
to the checkout. #tetel=<key> opens a cart item for editing.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 12: A kosár oldala

**Files:**
- Create: `src/islands/shop/CartPage.tsx`, `src/islands/shop/CartPage.test.tsx`
- Modify: `src/islands/shop/shop.css`
- Create: `src/pages/kosar.astro`

**Interfaces:**
- Consumes: Task 10 (`useCart`), Task 11 (`CartLines`, `shop.css`), Task 9 (`cartTotals`).
- Produces: `CartPage()` (sziget, `client:only="react"`).

- [ ] **Step 1: A teszt**

Új fájl: `src/islands/shop/CartPage.test.tsx`

```tsx
/** @vitest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { type CartEntry, parseStoredCart } from '@/domain/cart';
import { CART_STORAGE_KEY } from '@/domain/cart-count';
import { formatHuf } from '@/domain/money';
import { priceConfiguration } from '@/domain/pricing';
import { CartPage } from './CartPage';

const ENTRY: CartEntry = {
  key: 'a1',
  config: { productId: 'molino', materialId: 'standard', edgeFinishId: 'szeges-ringli', widthCm: 200, heightCm: 100, quantity: 1, express: false },
  files: [{ uploadId: '3f8a2b6c-1d4e-4f5a-9b7c-0e1d2c3b4a59', name: 'logo.pdf', size: 1000, uploadedAt: new Date().toISOString() }],
  addedAt: new Date().toISOString(),
};
const plain = (text: string | null | undefined) => (text ?? '').replace(/[  ]/g, ' ');

afterEach(() => localStorage.clear());

describe('CartPage', () => {
  it('says when the cart is empty and where to go', () => {
    render(<CartPage />);
    expect(screen.getByText('A kosár üres.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Vissza a webshopba' }).getAttribute('href')).toBe('/webshop');
  });

  it('lists the items, changes the quantity, and leads to the checkout', () => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ v: 1, items: [ENTRY, { broken: true }] }));
    render(<CartPage />);
    expect(screen.getByText(/Egy tétel már nem rendelhető így/)).toBeTruthy();
    expect(plain(document.body.textContent)).toContain('Grafika: logo.pdf');
    expect(screen.getByRole('link', { name: 'Módosítás' }).getAttribute('href')).toBe('/webshop/molino#tetel=a1');
    fireEvent.click(screen.getByRole('button', { name: 'Eggyel több' }));
    expect(parseStoredCart(localStorage.getItem(CART_STORAGE_KEY)).entries[0]?.config.quantity).toBe(2);
    const total = priceConfiguration({ ...ENTRY.config, quantity: 2 }).grossTotal;
    expect(plain(document.body.textContent)).toContain(plain(formatHuf(total)));
    expect(screen.getByRole('link', { name: 'Tovább a pénztárba' }).getAttribute('href')).toBe('/penztar');
  });

  it('removes an item', () => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ v: 1, items: [ENTRY] }));
    render(<CartPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Tétel törlése: Molinó' }));
    expect(screen.getByText('A kosár üres.')).toBeTruthy();
  });
});
```


- [ ] **Step 2: Futtasd, hogy lásd elbukni**

Run: `npx vitest run src/islands/shop/CartPage.test.tsx`
Expected: FAIL (`Cannot find module './CartPage'`).

- [ ] **Step 3: A megvalósítás**

Új fájl: `src/islands/shop/CartPage.tsx`

```tsx
// The cart page's island (/kosar, client:only="react"): the items with quantity, editing and removal, the gross total
// and the way to the checkout. The handover is chosen at the checkout.
import { formatHuf } from '@/domain/money';
import { FINAL_PRICE_NOTICE } from '@/domain/orders';
import { ButtonLink } from '@/ui/ButtonLink/ButtonLink';
import { Notice } from '@/ui/Notice/Notice';
import { CHECKOUT_HREF, QUOTE_HREF, WEBSHOP_HREF } from '@/ui/navigation';
import { CartLines } from './CartLines';
import { useCart } from './cart-store';
import { cartTotals } from './price-rows';
import './shop.css';

export function CartPage() {
  const cart = useCart();
  if (!cart.ready) return null;
  const totals = cartTotals(cart.entries);
  return (
    <div className="shop-page">
      {cart.dropped > 0 && (
        <Notice tone="warning" live="polite">
          {cart.dropped === 1 ? 'Egy tétel' : `${cart.dropped} tétel`} már nem rendelhető így, ezért kikerült a kosárból.
        </Notice>
      )}
      {cart.entries.length === 0 ? (
        <div className="shop-page__empty">
          <p>A kosár üres.</p>
          <p>
            <a href={WEBSHOP_HREF}>Vissza a webshopba</a>, vagy egyedi munkához <a href={QUOTE_HREF}>kérjen ajánlatot</a>.
          </p>
        </div>
      ) : (
        <>
          <CartLines entries={cart.entries} onRemove={cart.remove} onQuantity={cart.setQuantity} editable />
          <div className="shop-page__summary">
            <p className="shop-page__total">
              <span>Összesen, bruttó</span>
              <strong>{formatHuf(totals.gross)}</strong>
            </p>
            <p className="shop-page__small">
              Nettó {formatHuf(totals.net)} + ÁFA {formatHuf(totals.vat)}. Az átvételt a pénztárban választja. {FINAL_PRICE_NOTICE}
            </p>
            <ButtonLink href={CHECKOUT_HREF} block>
              Tovább a pénztárba
            </ButtonLink>
          </div>
        </>
      )}
    </div>
  );
}
```

`src/islands/shop/shop.css` végére:

```css
.shop-page {
  display: grid;
  gap: var(--space-6);
}
.shop-page__empty p {
  margin: 0 0 var(--space-2);
}
.shop-page a {
  color: var(--color-text);
}
.shop-page__summary {
  display: grid;
  gap: var(--space-3);
  max-width: 28rem;
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-line);
}
.shop-page__total {
  display: flex;
  justify-content: space-between;
  margin: 0;
  font-size: var(--text-lg);
}
.shop-page__small {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}
```

Új fájl: `src/pages/kosar.astro`

```astro
---
// The cart (prerendered shell; the island reads the cart from the browser).
import { CartPage } from '@/islands/shop/CartPage';
import Page from '@/layouts/Page.astro';
import { QUOTE_HREF } from '@/ui/navigation';

export const prerender = true;
---

<Page title="Kosár – Stilet Dekor" description="A kosárba tett termékek." noindex>
  <section class="kp">
    <h1>Kosár</h1>
    <CartPage client:only="react">
      <p slot="fallback" class="kp__loading">A kosár betöltése…</p>
    </CartPage>
    <noscript>
      <style is:inline>
        .kp__loading {
          display: none;
        }
      </style>
      <p>A kosárhoz JavaScript kell. Addig <a href={QUOTE_HREF}>kérjen ajánlatot</a>.</p>
    </noscript>
  </section>
</Page>

<style>
  .kp {
    max-width: 56rem;
    margin: 0 auto;
    padding: var(--space-7) var(--layout-gutter) var(--space-9);
  }
  h1 {
    margin: 0 0 var(--space-6);
    font-family: var(--font-display);
    font-size: var(--text-2xl);
    font-variation-settings: var(--font-variation-display);
    font-weight: var(--weight-display);
    line-height: var(--leading-snug);
  }
  .kp__loading {
    min-height: 16rem;
    margin: 0;
    color: var(--color-text-muted);
  }
  .kp a {
    color: var(--color-text);
  }
</style>
```

- [ ] **Step 4: Futtasd újra, ellenőrzés és commit**

Run: `npx vitest run src/islands/shop && npm test && npm run check`
Expected: PASS.

```bash
git add src/islands/shop src/pages/kosar.astro
git -c user.name=Claude -c user.email=noreply@anthropic.com commit -q -F - <<'EOF'
Add the cart page

The items with quantity, editing and removal, files the server may have
deleted marked, the gross total with net and VAT, and the way to the checkout.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 13: A pénztár

**Files:**
- Create: `src/islands/shop/checkout-form.ts`, `src/islands/shop/checkout-form.test.ts`, `src/islands/shop/Checkout.tsx`, `src/islands/shop/Checkout.test.tsx`
- Modify: `src/islands/shop/shop.css`
- Create: `src/pages/penztar.astro`

**Interfaces:**
- Consumes: Task 1 (`OrderRequestSchema` `sitePhotoIds`-szal, `MAX_SITE_PHOTOS`), Task 2 (`toOrderItems`), Task 10 (`useCart`, `useArtworkFiles`), Task 11 (`CartLines`, `ArtworkField`), Task 9 (`cartTotals`), Task 6 (a `POST /api/orders` válaszai: `201/200 { reference, statusPath }`, `422 { errors }`, egyébként `{ error }`).
- Produces:
  - `CheckoutValues`, `CheckoutField`, `EMPTY_CHECKOUT`, `CHECKOUT_FIELDS`, `CHECKOUT_DRAFT_KEY = 'stilet-penztar'`, `CHECKOUT_TOKEN_KEY = 'stilet-penztar-token'`, `needsAddress(method)`, `orderBody(values, entries, extra)`, `CheckoutErrors { fields; items: Record<number, string>; sitePhotos?; form? }`, `noErrors()`, `errorsFromKeys(errors)`, `checkOrder(values, entries, extra)`, `hasErrors(errors)`, `fieldId(field)` → `penztar-<field>`
  - `Checkout({ navigate? }: { navigate?: (url: string) => void })` (sziget, `client:only="react"`)

- [ ] **Step 1: Az űrlaplogika tesztje**

Új fájl: `src/islands/shop/checkout-form.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import type { CartEntry } from '@/domain/cart';
import { checkOrder, EMPTY_CHECKOUT, errorsFromKeys, hasErrors, orderBody, type CheckoutValues } from './checkout-form';

const TOKEN = '3f8a2b6c-1d4e-4f5a-9b7c-0e1d2c3b4a59';
const PHOTO = '9c1d2e3f-4a5b-4c6d-8e7f-a0b1c2d3e4f5';
const ENTRY: CartEntry = {
  key: 'a1',
  config: { productId: 'molino', materialId: 'standard', edgeFinishId: 'szeges-ringli', widthCm: 200, heightCm: 100, quantity: 1, express: false },
  files: [],
  addedAt: '2026-10-09T10:00:00.000Z',
};
const FILLED: CheckoutValues = {
  ...EMPTY_CHECKOUT,
  name: 'Minta Mária',
  email: 'maria@example.hu',
  phone: '+36 70 123 4567',
  billingPostalCode: '1061',
  billingCity: 'Budapest',
  billingAddress: 'Minta utca 1.',
  shippingMethod: 'szemelyes',
  acceptTerms: true,
};
const extra = { formToken: TOKEN, sitePhotoIds: [PHOTO], source: '/kosar' };

describe('orderBody', () => {
  it('sends the order as the API takes it', () => {
    expect(orderBody(FILLED, [ENTRY], extra)).toEqual({
      formToken: TOKEN,
      honlap: '',
      source: '/kosar',
      customer: {
        name: 'Minta Mária',
        email: 'maria@example.hu',
        phone: '+36 70 123 4567',
        company: '',
        taxNumber: '',
        billingAddress: { postalCode: '1061', city: 'Budapest', address: 'Minta utca 1.' },
      },
      shippingMethod: 'szemelyes',
      surveyRequested: false,
      sitePhotoIds: [],
      items: [{ config: ENTRY.config, uploadIds: [] }],
      note: '',
      acceptTerms: true,
    });
  });

  it('adds the separate address, the survey and the site photos only where they belong', () => {
    const installation = {
      ...FILLED,
      shippingMethod: 'telepites' as const,
      sameAddress: false,
      shippingPostalCode: '9021',
      shippingCity: 'Győr',
      shippingAddress: 'Minta tér 2.',
      surveyRequested: true,
    };
    expect(orderBody(installation, [ENTRY], extra)).toMatchObject({
      shippingAddress: { postalCode: '9021', city: 'Győr', address: 'Minta tér 2.' },
      surveyRequested: true,
      sitePhotoIds: [PHOTO],
    });
    expect(orderBody({ ...installation, sameAddress: true }, [ENTRY], extra)).not.toHaveProperty('shippingAddress');
    expect(orderBody({ ...installation, shippingMethod: 'szemelyes' }, [ENTRY], extra)).toMatchObject({ surveyRequested: false, sitePhotoIds: [] });
  });
});

describe('checking the order in the browser', () => {
  it('names the missing fields with the server messages', () => {
    const errors = checkOrder(EMPTY_CHECKOUT, [ENTRY], extra);
    expect(errors.fields).toMatchObject({
      name: 'Adja meg a nevét.',
      email: 'Adja meg az e-mail-címét.',
      phone: 'Adja meg a telefonszámát.',
      billingPostalCode: 'Az irányítószám 4 számjegyből áll.',
      shippingMethod: 'Válasszon átvételi módot.',
      acceptTerms: 'A rendeléshez fogadja el az Általános Szerződési Feltételeket.',
    });
    expect(hasErrors(errors)).toBe(true);
    expect(hasErrors(checkOrder(FILLED, [ENTRY], extra))).toBe(false);
  });

  it('sorts the server keys into fields, items and the rest', () => {
    expect(
      errorsFromKeys({
        'customer.billingAddress.city': 'A',
        'shippingAddress.postalCode': 'B',
        'items.1.uploadIds': 'C',
        sitePhotoIds: 'D',
        items: 'E',
      }),
    ).toEqual({ fields: { billingCity: 'A', shippingPostalCode: 'B' }, items: { 1: 'C' }, sitePhotos: 'D', form: 'E' });
  });
});
```

- [ ] **Step 2: A pénztár tesztje**

Új fájl: `src/islands/shop/Checkout.test.tsx`

```tsx
/** @vitest-environment jsdom */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type CartEntry, serializeCart } from '@/domain/cart';
import { CART_STORAGE_KEY } from '@/domain/cart-count';
import { Checkout } from './Checkout';

const ENTRY: CartEntry = {
  key: 'a1',
  config: { productId: 'molino', materialId: 'standard', edgeFinishId: 'szeges-ringli', widthCm: 200, heightCm: 100, quantity: 1, express: false },
  files: [],
  addedAt: '2026-10-09T10:00:00.000Z',
};

const fetchMock = vi.fn();
const respond = (status: number, body: unknown) => fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(body), { status }));
const send = () => fireEvent.click(screen.getByRole('button', { name: 'Rendelés elküldése ellenőrzésre' }));

function fill() {
  fireEvent.change(screen.getByLabelText(/^Név/), { target: { value: 'Minta Mária' } });
  fireEvent.change(screen.getByLabelText(/^E-mail-cím/), { target: { value: 'maria@example.hu' } });
  fireEvent.change(screen.getByLabelText(/^Telefonszám/), { target: { value: '+36 70 123 4567' } });
  fireEvent.change(screen.getByLabelText(/^Irányítószám/), { target: { value: '1061' } });
  fireEvent.change(screen.getByLabelText(/^Település/), { target: { value: 'Budapest' } });
  fireEvent.change(screen.getByLabelText(/^Utca, házszám/), { target: { value: 'Minta utca 1.' } });
  fireEvent.click(screen.getByRole('radio', { name: /Személyes átvétel/ }));
  fireEvent.click(screen.getByRole('checkbox', { name: /ÁSZF/ }));
}

beforeEach(() => {
  localStorage.setItem(CART_STORAGE_KEY, serializeCart([ENTRY]));
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe('Checkout', () => {
  it('lists what is missing at the top and moves the focus there', () => {
    render(<Checkout navigate={vi.fn()} />);
    send();
    const summary = screen.getByRole('alert');
    expect(summary.textContent).toContain('Adja meg a nevét.');
    expect(summary.textContent).toContain('Válasszon átvételi módot.');
    expect(document.activeElement).toBe(summary);
    expect(screen.getByRole('link', { name: 'Adja meg a nevét.' }).getAttribute('href')).toBe('#penztar-name');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends the order, empties the cart and goes to the status page', async () => {
    const navigate = vi.fn();
    respond(201, { reference: 'R-0007', statusPath: '/rendeles/AbCdEfGhIjKlMnOpQrStUv' });
    render(<Checkout navigate={navigate} />);
    fill();
    send();
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/rendeles/AbCdEfGhIjKlMnOpQrStUv?uj=1'));
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/orders');
    expect(JSON.parse(String(init.body))).toMatchObject({
      formToken: expect.stringMatching(/^[0-9a-f-]{36}$/),
      customer: { name: 'Minta Mária', billingAddress: { city: 'Budapest' } },
      shippingMethod: 'szemelyes',
      items: [{ config: ENTRY.config }],
      acceptTerms: true,
    });
    expect(localStorage.getItem(CART_STORAGE_KEY)).toBeNull();
  });

  it('shows the server messages next to the fields and keeps what was typed', async () => {
    respond(422, { errors: { 'customer.email': 'Ez az e-mail-cím nem jó.' } });
    render(<Checkout navigate={vi.fn()} />);
    fill();
    send();
    await waitFor(() => expect(screen.getAllByText('Ez az e-mail-cím nem jó.').length).toBeGreaterThan(0));
    expect((screen.getByLabelText(/^Név/) as HTMLInputElement).value).toBe('Minta Mária');
  });

  it('offers the phone when the order cannot be sent', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    render(<Checkout navigate={vi.fn()} />);
    fill();
    send();
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('+36 70 538 5030'));
  });
});
```

- [ ] **Step 3: Futtasd, hogy lásd elbukni**

Run: `npx vitest run src/islands/shop/checkout-form.test.ts src/islands/shop/Checkout.test.tsx`
Expected: FAIL (hiányzó modulok).

- [ ] **Step 4: Az űrlaplogika**

Új fájl: `src/islands/shop/checkout-form.ts`

```ts
// The checkout's state and its way to POST /api/orders: the values, the request body, the field each error key belongs
// to (the server and the browser use the same schema, so the messages are the same), and the draft kept in the tab.
import { type CartEntry, toOrderItems } from '@/domain/cart';
import type { ShippingMethodId } from '@/domain/catalog';
import { OrderRequestSchema } from '@/domain/schemas';

export interface CheckoutValues {
  name: string;
  email: string;
  phone: string;
  company: string;
  taxNumber: string;
  billingPostalCode: string;
  billingCity: string;
  billingAddress: string;
  shippingMethod: ShippingMethodId | '';
  /** The courier or installation address is the billing address. */
  sameAddress: boolean;
  shippingPostalCode: string;
  shippingCity: string;
  shippingAddress: string;
  surveyRequested: boolean;
  note: string;
  acceptTerms: boolean;
}

export type CheckoutField = keyof CheckoutValues;

export const EMPTY_CHECKOUT: CheckoutValues = {
  name: '',
  email: '',
  phone: '',
  company: '',
  taxNumber: '',
  billingPostalCode: '',
  billingCity: '',
  billingAddress: '',
  shippingMethod: '',
  sameAddress: true,
  shippingPostalCode: '',
  shippingCity: '',
  shippingAddress: '',
  surveyRequested: false,
  note: '',
  acceptTerms: false,
};

/** The fields in page order, for the error summary. */
export const CHECKOUT_FIELDS: readonly CheckoutField[] = [
  'name',
  'email',
  'phone',
  'company',
  'taxNumber',
  'billingPostalCode',
  'billingCity',
  'billingAddress',
  'shippingMethod',
  'shippingPostalCode',
  'shippingCity',
  'shippingAddress',
  'surveyRequested',
  'note',
  'acceptTerms',
];

export const CHECKOUT_DRAFT_KEY = 'stilet-penztar';
export const CHECKOUT_TOKEN_KEY = 'stilet-penztar-token';

export const needsAddress = (method: CheckoutValues['shippingMethod']): boolean => method === 'futar' || method === 'telepites';
export const fieldId = (field: CheckoutField): string => `penztar-${field}`;

export interface OrderExtras {
  formToken: string;
  sitePhotoIds: readonly string[];
  source?: string | undefined;
  /** The trap field; empty for people. */
  honlap?: string;
}

/** The body of POST /api/orders. */
export function orderBody(values: CheckoutValues, entries: readonly CartEntry[], extra: OrderExtras) {
  const separate = needsAddress(values.shippingMethod) && !values.sameAddress;
  return {
    formToken: extra.formToken,
    honlap: extra.honlap ?? '',
    ...(extra.source ? { source: extra.source } : {}),
    customer: {
      name: values.name,
      email: values.email,
      phone: values.phone,
      company: values.company,
      taxNumber: values.taxNumber,
      billingAddress: { postalCode: values.billingPostalCode, city: values.billingCity, address: values.billingAddress },
    },
    ...(separate ? { shippingAddress: { postalCode: values.shippingPostalCode, city: values.shippingCity, address: values.shippingAddress } } : {}),
    shippingMethod: values.shippingMethod,
    surveyRequested: values.shippingMethod === 'telepites' && values.surveyRequested,
    sitePhotoIds: values.shippingMethod === 'telepites' ? [...extra.sitePhotoIds] : [],
    items: toOrderItems(entries),
    note: values.note,
    acceptTerms: values.acceptTerms,
  };
}

export interface CheckoutErrors {
  fields: Partial<Record<CheckoutField, string>>;
  /** By item index. */
  items: Record<number, string>;
  sitePhotos?: string | undefined;
  /** Not tied to a field: the server's message, an empty cart. */
  form?: string | undefined;
}

export const noErrors = (): CheckoutErrors => ({ fields: {}, items: {} });

const FIELD_OF_KEY: Readonly<Record<string, CheckoutField>> = {
  'customer.name': 'name',
  'customer.email': 'email',
  'customer.phone': 'phone',
  'customer.company': 'company',
  'customer.taxNumber': 'taxNumber',
  'customer.billingAddress.postalCode': 'billingPostalCode',
  'customer.billingAddress.city': 'billingCity',
  'customer.billingAddress.address': 'billingAddress',
  shippingMethod: 'shippingMethod',
  'shippingAddress.postalCode': 'shippingPostalCode',
  'shippingAddress.city': 'shippingCity',
  'shippingAddress.address': 'shippingAddress',
  surveyRequested: 'surveyRequested',
  note: 'note',
  acceptTerms: 'acceptTerms',
};

/** Sorts the dotted error keys ("customer.email", "items.0.uploadIds") into fields, items and the rest. */
export function errorsFromKeys(errors: Readonly<Record<string, string>>): CheckoutErrors {
  const result = noErrors();
  for (const [key, message] of Object.entries(errors)) {
    const field = FIELD_OF_KEY[key];
    const item = /^items\.(\d+)/.exec(key);
    if (field) result.fields[field] ??= message;
    else if (item) result.items[Number(item[1])] ??= message;
    else if (key.startsWith('sitePhotoIds')) result.sitePhotos ??= message;
    else result.form ??= message;
  }
  return result;
}

/** The browser's check with the server's schema, before sending. */
export function checkOrder(values: CheckoutValues, entries: readonly CartEntry[], extra: OrderExtras): CheckoutErrors {
  const parsed = OrderRequestSchema.safeParse(orderBody(values, entries, extra));
  if (parsed.success) return noErrors();
  const errors: Record<string, string> = {};
  for (const issue of parsed.error.issues) errors[issue.path.map(String).join('.') || 'form'] ??= issue.message;
  return errorsFromKeys(errors);
}

export const hasErrors = (errors: CheckoutErrors): boolean =>
  Object.keys(errors.fields).length > 0 || Object.keys(errors.items).length > 0 || Boolean(errors.sitePhotos) || Boolean(errors.form);
```

- [ ] **Step 5: A pénztár szigete**

Új fájl: `src/islands/shop/Checkout.tsx`

```tsx
// The checkout island (/penztar, client:only="react"): one page in four sections (contact, billing address, handover,
// summary and sending). The server's schema checks a field when it is left and everything on sending; then
// POST /api/orders and on to the status page (docs/superpowers/specs/2026-10-09-webshop-4a-4b-design.md, 5.).
import { useEffect, useMemo, useRef, useState } from 'react';
import { INSTALLATION_NOTE, SHIPPING_METHODS, SHOP_PRODUCTS } from '@/domain/catalog';
import { estimateOrderReadyDate } from '@/domain/leadtime';
import { FINAL_PRICE_NOTICE } from '@/domain/orders';
import { grossOf, priceCart } from '@/domain/pricing';
import { MAX_SITE_PHOTOS } from '@/domain/schemas';
import { SAVE_FAILED_MESSAGE } from '@/server/forms';
import { Checkbox } from '@/ui/Checkbox/Checkbox';
import { CheckoutSection } from '@/ui/CheckoutSection/CheckoutSection';
import { LeadTimeNote } from '@/ui/LeadTimeNote/LeadTimeNote';
import { Notice } from '@/ui/Notice/Notice';
import { OptionRow } from '@/ui/OptionRow/OptionRow';
import { OrderSubmit } from '@/ui/OrderSubmit/OrderSubmit';
import { PriceBreakdown, type PriceRow } from '@/ui/PriceBreakdown/PriceBreakdown';
import { TextField } from '@/ui/TextField/TextField';
import { WEBSHOP_HREF } from '@/ui/navigation';
import { ArtworkField } from './ArtworkField';
import { CartLines } from './CartLines';
import { useCart } from './cart-store';
import {
  CHECKOUT_DRAFT_KEY,
  CHECKOUT_FIELDS,
  CHECKOUT_TOKEN_KEY,
  type CheckoutErrors,
  type CheckoutField,
  type CheckoutValues,
  checkOrder,
  EMPTY_CHECKOUT,
  errorsFromKeys,
  fieldId,
  hasErrors,
  needsAddress,
  noErrors,
  orderBody,
} from './checkout-form';
import { cartTotals } from './price-rows';
import { useArtworkFiles } from './useArtworkFiles';
import './shop.css';

const PHOTO_WAIT_MESSAGE = 'Várja meg, amíg a helyszíni fotók feltöltődnek.';

function loadDraft(): CheckoutValues {
  try {
    const saved = JSON.parse(sessionStorage.getItem(CHECKOUT_DRAFT_KEY) ?? '{}') as Partial<CheckoutValues>;
    return { ...EMPTY_CHECKOUT, ...saved, acceptTerms: false };
  } catch {
    return EMPTY_CHECKOUT;
  }
}

/** The one-time form token, kept in the tab until the order is sent, so a resent order is not saved twice. */
function formToken(): string {
  try {
    const saved = sessionStorage.getItem(CHECKOUT_TOKEN_KEY);
    if (saved) return saved;
    const token = crypto.randomUUID();
    sessionStorage.setItem(CHECKOUT_TOKEN_KEY, token);
    return token;
  } catch {
    return crypto.randomUUID();
  }
}

/** Where the customer came to the checkout from, when it is a page of this site (for measuring). */
function sameSitePath(referrer: string): string | undefined {
  try {
    const url = new URL(referrer);
    return url.origin === window.location.origin ? url.pathname : undefined;
  } catch {
    return undefined;
  }
}

export interface CheckoutProps {
  /** Goes to the status page after sending (tests replace it). */
  navigate?: (url: string) => void;
}

export function Checkout({ navigate = (url) => window.location.assign(url) }: CheckoutProps) {
  const cart = useCart();
  const [values, setValues] = useState<CheckoutValues>(loadDraft);
  const [errors, setErrors] = useState<CheckoutErrors>(noErrors);
  const [summaryShown, setSummaryShown] = useState(0);
  const [sending, setSending] = useState(false);
  const [trap, setTrap] = useState('');
  const [token] = useState(formToken);
  const summary = useRef<HTMLDivElement>(null);
  const photos = useArtworkFiles({ max: MAX_SITE_PHOTOS });

  useEffect(() => {
    try {
      const { acceptTerms: _accept, ...draft } = values;
      sessionStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // Works without storage too.
    }
  }, [values]);
  useEffect(() => {
    if (summaryShown > 0) summary.current?.focus();
  }, [summaryShown]);

  const extra = () => ({
    formToken: token,
    sitePhotoIds: photos.uploaded.map((photo) => photo.uploadId),
    source: sameSitePath(document.referrer),
    honlap: trap,
  });
  const set = <K extends CheckoutField>(field: K, value: CheckoutValues[K]) => setValues((current) => ({ ...current, [field]: value }));
  const check = (field: CheckoutField) => {
    const found = checkOrder(values, cart.entries, extra());
    setErrors((current) => ({ ...current, fields: { ...current.fields, [field]: found.fields[field] } }));
  };
  const show = (found: CheckoutErrors) => {
    setErrors(found);
    setSummaryShown((count) => count + 1);
  };

  const largeParcel = cart.entries.some((entry) => SHOP_PRODUCTS[entry.config.productId].parcel === 'large');
  const totals = cartTotals(cart.entries);
  const price = useMemo(() => {
    if (!values.shippingMethod || cart.entries.length === 0) return null;
    try {
      return priceCart(cart.entries, values.shippingMethod);
    } catch {
      return null;
    }
  }, [cart.entries, values.shippingMethod]);

  const submit = async () => {
    const found = checkOrder(values, cart.entries, extra());
    if (photos.busy) found.form ??= PHOTO_WAIT_MESSAGE;
    if (hasErrors(found)) {
      show(found);
      return;
    }
    setSending(true);
    setErrors(noErrors());
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderBody(values, cart.entries, extra())),
      });
      const body = (await response.json().catch(() => ({}))) as { statusPath?: string | null; errors?: Record<string, string>; error?: string };
      if (response.ok) {
        cart.clear();
        try {
          sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
          sessionStorage.removeItem(CHECKOUT_TOKEN_KEY);
        } catch {
          // Nothing to clean.
        }
        navigate(body.statusPath ? `${body.statusPath}?uj=1` : '/');
        return;
      }
      show(body.errors ? errorsFromKeys(body.errors) : { ...noErrors(), form: body.error ?? SAVE_FAILED_MESSAGE });
    } catch {
      show({ ...noErrors(), form: SAVE_FAILED_MESSAGE });
    } finally {
      setSending(false);
    }
  };

  if (!cart.ready) return null;
  if (cart.entries.length === 0) {
    return (
      <Notice title="A kosár üres">
        Válasszon terméket a <a href={WEBSHOP_HREF}>webshopban</a>.
      </Notice>
    );
  }

  const field = (name: CheckoutField) => ({
    id: fieldId(name),
    value: String(values[name]),
    error: errors.fields[name],
    onChange: (event: { target: { value: string } }) => set(name, event.target.value as never),
    onBlur: () => check(name),
  });
  const summaryItems = [
    ...(errors.form ? [{ href: null, text: errors.form }] : []),
    ...CHECKOUT_FIELDS.filter((name) => errors.fields[name]).map((name) => ({ href: `#${fieldId(name)}`, text: errors.fields[name]! })),
    ...Object.entries(errors.items).map(([index, text]) => ({ href: '#penztar-tetelek', text: `${Number(index) + 1}. tétel: ${text}` })),
    ...(errors.sitePhotos ? [{ href: '#penztar-fotok', text: errors.sitePhotos }] : []),
  ];
  const method = SHIPPING_METHODS.find((m) => m.id === values.shippingMethod);
  const rows: PriceRow[] = [
    { label: `Tételek (${cart.entries.length})`, amount: totals.gross },
    !price
      ? { label: 'Átvétel', amountText: 'válasszon' }
      : price.shipping.priceOnRequest
        ? { label: price.shipping.name, amountText: 'egyedi' }
        : { label: price.shipping.name, amount: price.shipping.gross },
  ];

  return (
    <form className="shop-checkout" noValidate onSubmit={(event) => event.preventDefault()}>
      {summaryShown > 0 && summaryItems.length > 0 && (
        <div ref={summary} tabIndex={-1} role="alert" className="shop-checkout__errors">
          <p>
            <strong>Kérjük, javítsa a következőket:</strong>
          </p>
          <ul>
            {summaryItems.map((item, index) => (
              <li key={`${index}-${item.text}`}>{item.href ? <a href={item.href}>{item.text}</a> : item.text}</li>
            ))}
          </ul>
        </div>
      )}

      <CheckoutSection step={1} title="Kapcsolat">
        <TextField label="Név" required autoComplete="name" {...field('name')} />
        <TextField label="E-mail-cím" type="email" required autoComplete="email" {...field('email')} />
        <TextField label="Telefonszám" type="tel" inputMode="tel" required autoComplete="tel" {...field('phone')} />
        <TextField label="Cégnév (nem kötelező)" autoComplete="organization" {...field('company')} />
        <TextField label="Adószám (nem kötelező)" help="Cégnek, például 12345678-1-12" inputMode="numeric" {...field('taxNumber')} />
      </CheckoutSection>

      <CheckoutSection step={2} title="Számlázási cím">
        <TextField label="Irányítószám" required inputMode="numeric" autoComplete="postal-code" {...field('billingPostalCode')} />
        <TextField label="Település" required autoComplete="address-level2" {...field('billingCity')} />
        <TextField label="Utca, házszám" required autoComplete="street-address" {...field('billingAddress')} />
      </CheckoutSection>

      <CheckoutSection step={3} title="Átvétel">
        <fieldset className="shop-cfg__group" id={fieldId('shippingMethod')} tabIndex={-1}>
          <legend>Átvételi mód</legend>
          {SHIPPING_METHODS.map((m) => {
            const net = largeParcel ? m.largeParcelPriceNet : m.priceNet;
            return (
              <OptionRow
                key={m.id}
                name="shippingMethod"
                value={m.id}
                label={m.name}
                description={m.description}
                {...(net === null ? { amountText: 'egyedi' } : { amount: grossOf(net) })}
                checked={values.shippingMethod === m.id}
                onChange={() => set('shippingMethod', m.id)}
              />
            );
          })}
          {errors.fields.shippingMethod && <p className="shop-lines__error">{errors.fields.shippingMethod}</p>}
        </fieldset>
        {method?.addressLabel && (
          <>
            <Checkbox
              label={`${method.addressLabel}: ugyanaz, mint a számlázási cím`}
              checked={values.sameAddress}
              onChange={(event) => set('sameAddress', event.target.checked)}
            />
            {!values.sameAddress && (
              <>
                <TextField label={`${method.addressLabel}: irányítószám`} required inputMode="numeric" autoComplete="shipping postal-code" {...field('shippingPostalCode')} />
                <TextField label={`${method.addressLabel}: település`} required autoComplete="shipping address-level2" {...field('shippingCity')} />
                <TextField label={`${method.addressLabel}: utca, házszám`} required autoComplete="shipping street-address" {...field('shippingAddress')} />
              </>
            )}
          </>
        )}
        {values.shippingMethod === 'telepites' && (
          <>
            <Notice>{INSTALLATION_NOTE}</Notice>
            <Checkbox
              label="Helyszíni felmérést kérek"
              description="Gyártás előtt a helyszínen ellenőrizzük a méreteket."
              checked={values.surveyRequested}
              onChange={(event) => set('surveyRequested', event.target.checked)}
            />
            <div id="penztar-fotok" className="shop-cfg__group">
              <ArtworkField files={photos} title="Fotó a helyszínről (nem kötelező)" hint={`JPG, PNG, HEIC · legfeljebb ${MAX_SITE_PHOTOS} fotó`} />
              {errors.sitePhotos && <p className="shop-lines__error">{errors.sitePhotos}</p>}
            </div>
          </>
        )}
      </CheckoutSection>

      <CheckoutSection step={4} title="Összesítő és elküldés">
        <div id="penztar-tetelek">
          <CartLines entries={cart.entries} errors={errors.items} />
        </div>
        <PriceBreakdown
          rows={rows}
          total={price ? price.grossTotal : totals.gross}
          net={price ? price.netTotal : totals.net}
          vat={price ? price.vatTotal : totals.vat}
          note={FINAL_PRICE_NOTICE}
        />
        <LeadTimeNote
          readyBy={estimateOrderReadyDate(new Date(), { express: cart.entries.every((entry) => entry.config.express) })}
          express={cart.entries.every((entry) => entry.config.express)}
        />
        <TextField label="Megjegyzés (nem kötelező)" multiline {...field('note')} />
        <div className="shop-checkout__trap" aria-hidden="true">
          <label>
            Honlap
            <input name="honlap" tabIndex={-1} autoComplete="off" value={trap} onChange={(event) => setTrap(event.target.value)} />
          </label>
        </div>
        <div id={fieldId('acceptTerms')} tabIndex={-1}>
          <OrderSubmit
            accepted={values.acceptTerms}
            onAcceptedChange={(accepted) => set('acceptTerms', accepted)}
            acceptLabel={
              <>
                Elfogadom az <a href="/aszf">ÁSZF-et</a> és az <a href="/adatkezeles">adatkezelési tájékoztatót</a>
              </>
            }
            error={errors.fields.acceptTerms}
            loading={sending}
            onSubmit={() => void submit()}
          />
        </div>
      </CheckoutSection>
    </form>
  );
}
```


`src/islands/shop/shop.css` végére:

```css
.shop-checkout {
  display: grid;
  gap: var(--space-6);
}
.shop-checkout a {
  color: var(--color-text);
}
.shop-checkout__errors {
  padding: var(--space-4);
  border: 2px solid var(--color-signal-bad);
  border-radius: var(--radius-md);
}
.shop-checkout__errors:focus {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}
.shop-checkout__errors p,
.shop-checkout__errors ul {
  margin: 0;
}
.shop-checkout__errors ul {
  margin-top: var(--space-2);
  padding-left: var(--space-5);
}
.shop-checkout__trap {
  position: absolute;
  left: -10000px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}
```

- [ ] **Step 6: Futtasd újra**

Run: `npx vitest run src/islands/shop`
Expected: PASS. Ha a mezők `getByLabelText`-je nem találja a címkét: a `Field` a kötelező mező címkéje után `*`-ot tesz, ezért a teszt `/^Név/` alakú regexet használ; nézd meg a `src/ui/Field/Field.tsx`-ben, mi kerül a `<label>`-be.

- [ ] **Step 7: Az oldal**

Új fájl: `src/pages/penztar.astro`

```astro
---
// The checkout (prerendered shell; the island reads the cart from the browser). No action bar here.
import { Checkout } from '@/islands/shop/Checkout';
import Page from '@/layouts/Page.astro';
import { CALLBACK_HREF } from '@/ui/navigation';

export const prerender = true;
---

<Page title="Pénztár – Stilet Dekor" description="Rendelés elküldése ellenőrzésre." actionBar={false} noindex>
  <section class="pt">
    <h1>Pénztár</h1>
    <Checkout client:only="react">
      <p slot="fallback" class="pt__loading">A pénztár betöltése…</p>
    </Checkout>
    <noscript>
      <style is:inline>
        .pt__loading {
          display: none;
        }
      </style>
      <p>A rendeléshez JavaScript kell. Addig <a href={CALLBACK_HREF}>kérjen visszahívást</a>.</p>
    </noscript>
  </section>
</Page>

<style>
  .pt {
    max-width: 48rem;
    margin: 0 auto;
    padding: var(--space-7) var(--layout-gutter) var(--space-9);
  }
  h1 {
    margin: 0 0 var(--space-6);
    font-family: var(--font-display);
    font-size: var(--text-2xl);
    font-variation-settings: var(--font-variation-display);
    font-weight: var(--weight-display);
    line-height: var(--leading-snug);
  }
  .pt__loading {
    min-height: 40rem;
    margin: 0;
    color: var(--color-text-muted);
  }
  .pt a {
    color: var(--color-text);
  }
</style>
```

- [ ] **Step 8: Ellenőrzés és commit**

Run: `npm test && npm run check && npm run typecheck`
Expected: zöld.

```bash
git add src/islands/shop src/pages/penztar.astro
git -c user.name=Claude -c user.email=noreply@anthropic.com commit -q -F - <<'EOF'
Add the one-page checkout

Contact, billing address, handover (with an optional site survey and site
photos for installation) and the summary with the terms and the order button.
The server's schema checks each field on leaving it and all on sending; the
order goes to POST /api/orders and the customer to the status page.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 14: A build utáni csomagméret-ellenőrzés

**Files:**
- Create: `scripts/check-bundles.mjs`, `scripts/check-bundles.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: `BUDGETS`, `pageEntries(html): { urls: string[]; inline: string[] }`, `staticImports(code): string[]`, `pageJsBytes(html, readModule: (url) => string | null): number`, `checkBudgets(clientDir): { page; kb; limitKb; label; ok }[]`; `npm run build` a végén lefuttatja.

- [ ] **Step 1: A teszt**

Új fájl: `scripts/check-bundles.test.mjs`

```js
import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { BUDGETS, pageEntries, pageJsBytes, staticImports } from './check-bundles.mjs';

describe('check-bundles', () => {
  it('finds the scripts and islands of a page, but not data blocks', () => {
    const html =
      '<script type="module" src="/_astro/page.js"></script>' +
      '<astro-island component-url="/_astro/Cfg.js" renderer-url="/_astro/client.js"></astro-island>' +
      '<script>window.x=1</script><script type="application/ld+json">{}</script>' +
      '<script defer src="https://static.cloudflareinsights.com/beacon.min.js"></script>';
    expect(pageEntries(html)).toEqual({
      urls: ['/_astro/page.js', 'https://static.cloudflareinsights.com/beacon.min.js', '/_astro/Cfg.js', '/_astro/client.js'],
      inline: ['window.x=1'],
    });
  });

  it('follows static imports, not dynamic ones', () => {
    expect(staticImports('import{a as b}from"./x.js";import"./y.js";export*from"./z.js";const m=()=>import("./lazy.js")')).toEqual([
      './x.js',
      './y.js',
      './z.js',
    ]);
  });

  it('adds up the gzipped size of what a page loads up front', () => {
    const files = {
      '/_astro/page.js': 'import"./shared.js";console.log(1)',
      '/_astro/shared.js': 'export const a=1;const l=()=>import("./lazy.js")',
      '/_astro/lazy.js': 'x'.repeat(10000),
    };
    const read = (url) => files[url] ?? null;
    const expected = gzipSync(files['/_astro/page.js']).length + gzipSync(files['/_astro/shared.js']).length;
    expect(pageJsBytes('<script type="module" src="/_astro/page.js"></script>', read)).toBe(expected);
  });

  it('gives the shop tool pages 130 KB and every other page 5 KB', () => {
    const limit = (page) => BUDGETS.find((budget) => budget.pattern.test(page)).limitKb;
    expect([limit('/webshop/molino/'), limit('/kosar/'), limit('/penztar/')]).toEqual([130, 130, 130]);
    expect([limit('/webshop/'), limit('/404')]).toEqual([5, 5]);
  });
});
```

- [ ] **Step 2: Futtasd, hogy lásd elbukni**

Run: `npx vitest run scripts/check-bundles.test.mjs`
Expected: FAIL (`Cannot find module './check-bundles.mjs'`).

- [ ] **Step 3: A megvalósítás**

Új fájl: `scripts/check-bundles.mjs`

```js
// After `astro build`: the JavaScript each prerendered page loads up front (its scripts and islands, with everything
// they import statically), gzipped, against the frame spec's budgets
// (docs/superpowers/specs/2026-10-08-weboldal-mukodesi-elvek-design.md, 5.). A dynamic import() loads later, on
// demand (the file analyzer), so it does not count. Exits with 1 when a page is over its budget.
// Server-rendered pages are not in dist/client; their scripts are the same small ones (the header's count, the quote
// wizard's 1–2 KB).
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, posix, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';

export const BUDGETS = [
  { pattern: /^\/(webshop\/[^/]+|kosar|penztar)\/$/, limitKb: 130, label: 'webshop eszközoldal' },
  { pattern: /./, limitKb: 5, label: 'tartalmi oldal' },
];

const DATA_TYPES = /\btype="application\/(?:ld\+)?json"/;

/** The scripts a page loads (by URL or inline) and its islands' component and renderer modules. */
export function pageEntries(html) {
  const urls = new Set();
  const inline = [];
  for (const [, attrs, code] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (DATA_TYPES.test(attrs)) continue;
    const src = /\bsrc="([^"]+)"/.exec(attrs)?.[1];
    if (src) urls.add(src);
    else if (code.trim()) inline.push(code);
  }
  for (const [, url] of html.matchAll(/\b(?:component-url|renderer-url)="([^"]+)"/g)) urls.add(url);
  return { urls: [...urls], inline };
}

/** The static imports of a built module: import … from "x", import "x", export … from "x". */
export function staticImports(code) {
  const found = new Set();
  for (const [, spec] of code.matchAll(/\b(?:import|export)\s*(?:[\w$*{}\s,]+?\s*from\s*)?["']([^"']+)["']/g)) found.add(spec);
  return [...found];
}

/** Gzipped bytes of the JavaScript a page loads up front; `readModule` gives a module's code by URL, or null. */
export function pageJsBytes(html, readModule) {
  const { urls, inline } = pageEntries(html);
  const seen = new Set();
  let bytes = 0;
  const visit = (url) => {
    if (/^https?:/.test(url) || seen.has(url)) return;
    seen.add(url);
    const code = readModule(url);
    if (code === null) return;
    bytes += gzipSync(code).length;
    for (const spec of staticImports(code)) visit(spec.startsWith('.') ? posix.resolve(posix.dirname(url), spec) : spec);
  };
  for (const code of inline) {
    bytes += gzipSync(code).length;
    for (const spec of staticImports(code)) visit(spec.startsWith('.') ? posix.resolve('/', spec) : spec);
  }
  urls.forEach(visit);
  return bytes;
}

function htmlFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return htmlFiles(path);
    return name.endsWith('.html') ? [path] : [];
  });
}

export function checkBudgets(clientDir) {
  const read = (url) => {
    const file = join(clientDir, ...url.split('/').filter(Boolean));
    return existsSync(file) ? readFileSync(file, 'utf8') : null;
  };
  return htmlFiles(clientDir).map((file) => {
    const page = `/${relative(clientDir, file).split(sep).join('/')}`.replace(/index\.html$/, '').replace(/\.html$/, '');
    const budget = BUDGETS.find((b) => b.pattern.test(page));
    const kb = pageJsBytes(readFileSync(file, 'utf8'), read) / 1024;
    return { page, kb, limitKb: budget.limitKb, label: budget.label, ok: kb <= budget.limitKb };
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const results = checkBudgets(fileURLToPath(new URL('../dist/client/', import.meta.url)));
  for (const r of results) {
    console.log(`${r.ok ? 'ok ' : 'TÚL'}  ${r.page.padEnd(28)} ${r.kb.toFixed(1).padStart(6)} KB / ${r.limitKb} KB (${r.label})`);
  }
  if (results.some((r) => !r.ok)) {
    console.error('Egy vagy több oldal JavaScriptje túllépi a keretet (működési elvek, 5. fejezet).');
    process.exit(1);
  }
}
```

`package.json`, a `scripts`-ben:

```json
    "build": "astro build && node scripts/check-bundles.mjs",
    "check:bundles": "node scripts/check-bundles.mjs",
```

- [ ] **Step 4: Futtasd újra, és a valódi buildet is**

Run: `npx vitest run scripts/check-bundles.test.mjs && npm run build`
Expected: a teszt PASS; a build végén soronként `ok` a `/404`, `/webshop/`, a 6 termékoldal, `/kosar/` és `/penztar/` mellett. Ha egy eszközoldal túllépi a 130 KB-ot: nézd meg, mi került a csomagba (`npx vite-bundle-visualizer` helyett elég a `dist/client/_astro` legnagyobb fájljait nézni), és első gyanúsítottként azt, hogy a `pdf-lib` vagy az `@/domain/artwork` index statikusan importálódik-e valahonnan. A keretet ne emeld meg kérdés nélkül.

- [ ] **Step 5: Commit**

```bash
git add scripts/check-bundles.mjs scripts/check-bundles.test.mjs package.json
git -c user.name=Claude -c user.email=noreply@anthropic.com commit -q -F - <<'EOF'
Check every prerendered page's JavaScript against its budget after the build

The shop's tool pages may load ~130 KB (gzip) up front, every other page 5 KB;
the file analyzer loads on demand and does not count. npm run build fails when
a page is over.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 15: R2, a dev adatbázis, böngészős próba és dokumentáció

**Files:**
- Modify: `wrangler.jsonc`, `src/env.d.ts` (csak ha az R2 be van kapcsolva)
- Modify: `README.md`, `docs/architecture.md`

- [ ] **Step 1: Az R2 bekötése (csak ha a 0. feladat 2. lépésében az R2 már be volt kapcsolva)**

1. A Cloudflare MCP `r2_bucket_create` hívásával: `stiletdekor-uploads-dev`.
2. `wrangler.jsonc`: a felső szinten, a `previews`-ban és az `env.galeria`-ban (a két dev oldal és a Preview-k közös tárolója):

```jsonc
  "r2_buckets": [{ "binding": "UPLOADS", "bucket_name": "stiletdekor-uploads-dev" }],
```

   A felső szintű megjegyzés frissül: „Customer uploads (src/server/upload). The production bucket (stiletdekor-uploads-prod) is created at launch; env.production stays without it until then, and the upload API answers 503 there.” Az `env.production` kikommentelt sora marad.
3. `src/env.d.ts`: az `UPLOADS` megjegyzése: „Bound on the dev sites and Previews; not on production until launch (the upload API then answers 503 and offers e-mail).” A mező opcionális marad.

Ha az R2 még nincs bekapcsolva, ez a lépés kimarad. A helyi próbához (3. lépés) a kötést ideiglenesen, commit nélkül tedd be a felső szintre, és a próba után állítsd vissza: `git checkout -- wrangler.jsonc`.

- [ ] **Step 2: A migráció a dev adatbázisra**

A wrangler nincs bejelentkezve, ezért a korábbi módon, a Cloudflare MCP `d1_database_query` hívásaival a `stiletdekor-dev` adatbázison (`fb3e2883-e461-42ac-94d9-81d3a4f1f2d2`):

1. `SELECT name FROM d1_migrations ORDER BY id` → a `0001_…` és `0002_…` sorok látszanak.
2. A `migrations/0003_orders.sql` utasításai egyenként (a megjegyzések nélkül).
3. `INSERT INTO d1_migrations (name) VALUES ('0003_orders.sql')`.
4. `SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('orders', 'order_items', 'order_events', 'uploads')` → mind a négy megvan.

- [ ] **Step 3: Böngészős próba a lefordított Workerrel**

`npm run build`, majd a `.claude/launch.json` `wrangler dev`-es konfigurációjával a beépített böngészőben (ha nincs ilyen, vedd fel: `npx wrangler dev`, port 8787). A helyi D1-re előtte `npm run db:migrate:local`. Végigjárandó:

1. `/webshop`: hat csempe, linkek a termékoldalakra; a menü „Webshop” pontja ide visz.
2. `/webshop/molino`:
   - az ár megjelenik, a szélesség átírására frissül;
   - hibás méretre mezőhiba, a „Kosárba” tiltott;
   - egy valódi PDF-fel a méret a fájlból töltődik, a feltöltés haladása látszik (R2 nélkül az e-mailes üzenet jön, és a tétel fájl nélkül kosárba tehető);
   - „Kosárba” → a fiók kinyílik, Escape bezárja, a fókusz visszakerül; a fejléc darabszáma 1.
3. A többi öt termékoldal: alapáron betölt, a formátumválasztók működnek (plakát: blueback-nél méretmezők; vászonkép: egyedinél méretmezők; tábla: furat és távtartó).
4. `/kosar`: darabszám, „Módosítás” (visszaviszi a konfigurátorba a tételt „Tétel frissítése” gombbal), törlés.
5. `/penztar`:
   - üres küldésre az összesítő a hibákkal, a fókusz rajta, a linkek a mezőkre ugranak;
   - telepítésnél: cím, felmérés, helyszíni fotó;
   - kitöltve elküldve → `/rendeles/<token>?uj=1` a köszönő panellel.
6. Az állapotoldal:
   - nincs rajta név, telefon, cím;
   - `curl -sI http://localhost:8787/rendeles/<token>` → `Cache-Control: private, no-store`, `Referrer-Policy: no-referrer`, `X-Robots-Tag: noindex, nofollow`;
   - egy kitalált token → 404.
7. A wrangler naplójában a műhely levele (`[értesítés → …] [R-0001] Rendelés ellenőrzésre – …`) a letöltő linkekkel; R2-vel a link `attachment`-ként tölti le a fájlt.
8. `npx wrangler d1 execute DB --local --command "SELECT id, status, gross_total FROM orders"` → a rendelés ott van, az `order_events`-ben az első sor.
9. Mobil (375 px, `resize_window`): nincs vízszintes görgetés; a konfigurátor összesítője a beállítások alatt.
10. Csak billentyűzettel: a konfigurátor, a fiók és a pénztár végigjárható, a fókusz mindig látszik.
11. JavaScript nélkül: `curl -s http://localhost:8787/webshop/molino/` tartalmazza az ártáblázatot és a `<noscript>` szövegét („A rendeléshez JavaScript kell”).

Talált hibát a hozzá tartozó feladat tesztjével együtt javíts (előbb egy bukó teszt), külön commitban.

- [ ] **Step 4: Dokumentáció**

`README.md`: új szakasz a „Visszahívás, ajánlatkérés és értesítő e-mailek” után, „Webshop: rendelések és feltöltések” címmel:

````markdown
## Webshop: rendelések és feltöltések

A működés: [`docs/superpowers/specs/2026-10-09-webshop-4a-4b-design.md`](docs/superpowers/specs/2026-10-09-webshop-4a-4b-design.md).

- **Oldalak:** `/webshop`, `/webshop/<termek>`, `/kosar`, `/penztar` (előre generált oldalak React-szigettel), `/rendeles/<token>` (állapotoldal titkos linken).
- **API:** `POST /api/uploads` (fájl R2-be), `GET /api/uploads/<id>` (a műhely letöltő linkje, 90 napig), `POST /api/orders` (rendelés, a szerver újraáraz).
- **Fájltár:** R2, `UPLOADS` kötés (`stiletdekor-uploads-dev`). Kötés nélkül a feltöltés 503-at ad, és a vásárló e-mailben küldi a fájlt.
- **Cron:** 15 percenként újraküldi a műhely el nem ment leveleit, és törli a 3 napnál régebbi, rendeléshez nem kötött feltöltéseket.
- **Csomagméret:** a `npm run build` végén a `scripts/check-bundles.mjs` ellenőrzi, hogy a termék-, kosár- és pénztároldal legfeljebb ~130 KB, a többi előre generált oldal legfeljebb 5 KB JavaScriptet tölt (gzip).

Amíg nincs műhely-felület (4c), a rendelés állapotát kézzel lehet állítani a D1-ben:

```sql
-- A legutóbbi rendelések
SELECT id, status, customer_name, gross_total, created_at FROM orders ORDER BY id DESC LIMIT 20;
-- Visszaigazolva (az állapotoldal ezt mutatja)
UPDATE orders SET status = 'visszaigazolva' WHERE id = 1;
INSERT INTO order_events (order_id, created_at, status_from, status_to, actor) VALUES (1, datetime('now'), 'beerkezett', 'visszaigazolva', 'muhely');
```

E-mail-teszt: a levél a naplóba kerül, amíg a domain nincs a Cloudflare-en. Valódi levél teszteléséhez a `.dev.vars`-ban `ORDER_NOTIFY_EMAIL=leonardistenes@gmail.com`.
````

`docs/architecture.md`, az API-táblázat:

```markdown
| Végpont | Feladat |
|---|---|
| `POST /api/uploads` | Fájl feltöltése R2-be (méret, kiterjesztés, a tartalom első 4 KB-ja), metaadat D1-be, visszaad egy feltöltés-azonosítót |
| `GET /api/uploads/[id]` | A műhely letöltő linkje: csak rendeléshez kötött fájl, 90 napig, csatolmányként |
| `POST /api/orders` | Rendelés elküldése ellenőrzésre (fizetési kötelezettség nélkül): **a szerver újraáraz**, a kliens által küldött árat nem fogadja el |
```

(A `POST /api/price` és a `POST /api/quotes` sor kikerül: az ár a böngészőben ugyanazzal a kóddal számolódik, az ajánlatkérés pedig az oldal saját POST-ja, mint a visszahívásé.) Az oldaltérképben a `/rendeles/[azonosito]` → `/rendeles/[token]`, és a „Környezetek” pont R2-mondata a valós állapotot írja (bekötve a dev oldalakon, vagy még nincs bekapcsolva).

- [ ] **Step 5: A teljes ellenőrzés és commit**

Run: `npm test && npm run check && npm run typecheck && npm run build`
Expected: minden zöld, a csomagméret-ellenőrzés minden sora `ok`.

```bash
git add README.md docs/architecture.md wrangler.jsonc src/env.d.ts
git -c user.name=Claude -c user.email=noreply@anthropic.com commit -q -F - <<'EOF'
Document the webshop and bind its file storage

README: pages, API, R2, the cron, the bundle check, and how to set an
order's status by hand until the workshop UI exists. The architecture's API
table matches the code.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

(Ha az R2 nincs bekapcsolva, a `wrangler.jsonc` és az `src/env.d.ts` nem változott: hagyd ki őket a `git add`-ból.)

- [ ] **Step 6: Az ág lezárása**

A `superpowers:finishing-a-development-branch` szerint: a teljes tesztsor zöld, utána a felhasználó választ (helyi merge a `main`-be, PR, vagy marad az ág). Push csak kérésre.
