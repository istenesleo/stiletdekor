# Tabló, 2. terv: teljes irányok (X1–X6) – megvalósítási terv

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hat merőben eltérő, teljes mini-oldal (X1–X6) a `/tablo` új „Teljes irányok” csoportjában, mindegyik saját „Teljes képernyő” oldallal (`/tablo/irany/x1` …).

**Architecture:** A közös, valós tartalom egy modulból jön (`src/tablo/irany/tartalom.ts`, a `src/domain/`-ből). Minden irány egy önálló Astro-komponens (`src/tablo/irany/X…astro`) saját betűkkel, saját helyi színtokenekkel és saját konténerrel (`container: xN / inline-size`), így a tabló keretében és a teljes oldalon is helyesen tördel. A G1 jelenetek egyedi azonosító-előtagot (`uid`) kapnak, hogy ugyanazon az oldalon többször is szerepelhessenek.

**Tech Stack:** Astro 7 (SSR), TypeScript strict, vitest, Google Fonts (latin-ext), CSS container query, sima böngészős JS.

**Spec:** `docs/superpowers/specs/2026-10-07-tablo-iranyok-design.md` (kiegészíti: `docs/superpowers/specs/2026-10-07-tablo-design.md`)

## Global Constraints

- Változhat: a fekete alap, a rózsaszín szerepe, a szerkezet, a tipográfia. Nem változhat: valós adat (nincs kitalált tény), WCAG 2.2 AA, magyar nyelv és tipográfia; a rózsaszín mindig `var(--color-brand)`, rajta a szöveg `var(--color-on-brand)`.
- Világos alapon rózsaszín szöveg nem lehet (2,9:1); ott a rózsaszín csak felület.
- A katalógus árai helyőrzők: minden ár mellett „helyőrző” jelölés; a nyitvatartás is „helyőrző”.
- Minden irány a gyökérelemén újradefiniálja a használt színtokeneket (`--color-bg`, `--color-surface`, `--color-surface-raised`, `--color-line`, `--color-text`, `--color-text-muted`, `--color-measure`, `--color-focus`), így a beágyazott G1 jelenet és a fókuszkeret is az irány színeit veszi fel.
- Címsorszint: `fejlec` prop (`4` a tablón, `2` a teljes oldalon); a fő cím `h{fejlec}`, a szakaszcímek `h{fejlec+1}`.
- 360–1440 px, vízszintes görgetés nélkül; csökkentett mozgásnál nincs animáció (a `base.css` intézi).
- A márkanevet tartalmazó szöveg `class="notranslate"`.
- Minden feladat végén zöld: `npm test`, `npm run check`; a végén `npm run build` is.
- Commit: `git -c user.name=Claude -c user.email=noreply@anthropic.com commit …`, üzenet végén `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Ág: `tablo-1`. Push nincs.

## Fájlszerkezet

| Fájl | Felelősség |
|---|---|
| `src/tablo/irany/tartalom.ts` (+ `.test.ts`) | A hat irány közös, valós tartalma és árformázói |
| `src/tablo/irany/gyorsar.ts` (+ `.test.ts`) | X4 élő molinó-ára a valós árazóból és határidőből |
| `src/tablo/irany/Rajzfej.astro` | X2 rajzfeje |
| `src/tablo/irany/X1Arlista.astro` … `X6Cegerfesto.astro` | A hat irány |
| `src/tablo/variants.ts` (+ teszt) | Új `irany` csoport, 6. kör, `page` mező, `finishedVariantByPage` |
| `src/tablo/Frame.astro`, `src/tablo/tablo.css` | „Teljes képernyő” link, vissza-link stílusa |
| `src/tablo/Variant.astro` | `fejlec` prop, az X-változatok bekötése |
| `src/pages/tablo/irany/[id].astro` | Egy irány teljes oldalként |
| `src/tablo/grafika/Jelenet.astro`, `src/tablo/grafika/jelenetek/*.astro` | `uid` prop az azonosítókhoz |

---

### Task 1: Közös tartalom

**Files:**
- Create: `src/tablo/irany/tartalom.ts`, `src/tablo/irany/tartalom.test.ts`

**Interfaces:**
- Produces: `interface IranyBelepo { cim; leiras; href }`, `interface IranyCsoport { nev; elemek: { nev; online }[] }`, `interface IranyAr { termek; osszeg: number; egyseg: 'Ft/m²-től' | 'Ft-tól' }`, `interface IranyLepes { cim; leiras }`, `TARTALOM: IranyTartalom` (`ceg`, `szlogen`, `bevezeto`, `belepok`, `csoportok`, `arak`, `arakHelyorzok`, `gyartasiIdo`, `folyamat`), `arSzam(ar: IranyAr): string` („5 067”), `arTeljes(ar: IranyAr): string` („5 067 Ft/m²-től”).

- [ ] **Step 1: Write the failing test**

`src/tablo/irany/tartalom.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { ON_SITE_SERVICE, PRICES_ARE_PLACEHOLDERS, SERVICE_GROUPS } from '@/domain/catalog';
import { COMPANY } from '@/domain/company';
import { grossOf } from '@/domain/pricing';
import { TARTALOM, arSzam, arTeljes } from './tartalom';

describe('the shared content of the full directions', () => {
  it('takes the company, slogan and service groups from the domain', () => {
    expect(TARTALOM.ceg).toBe(COMPANY);
    expect(TARTALOM.szlogen).toBe('Kiszállunk, felmérjük, felszereljük.');
    expect(TARTALOM.szlogen).toBe(ON_SITE_SERVICE.description);
    expect(TARTALOM.csoportok.map((g) => g.nev)).toEqual(SERVICE_GROUPS.map((g) => g.name));
    expect(TARTALOM.csoportok.every((g) => g.elemek.length > 0)).toBe(true);
    expect(TARTALOM.csoportok.flatMap((g) => g.elemek).some((e) => e.online)).toBe(true);
  });

  it('shows the lowest gross catalog prices, marked as placeholders while they are', () => {
    expect(TARTALOM.arak).toEqual([
      { termek: 'Molinó', osszeg: grossOf(3990), egyseg: 'Ft/m²-től' },
      { termek: 'Roll-up', osszeg: grossOf(24900), egyseg: 'Ft-tól' },
      { termek: 'Matrica', osszeg: grossOf(6990), egyseg: 'Ft/m²-től' },
    ]);
    expect(TARTALOM.arakHelyorzok).toBe(PRICES_ARE_PLACEHOLDERS);
  });

  it('formats prices the Hungarian way, with no-break spaces', () => {
    const molino = TARTALOM.arak[0]!;
    expect(arSzam(molino)).toBe('5 067');
    expect(arTeljes(molino)).toBe('5 067 Ft/m²-től');
  });

  it('keeps the four process steps in their real order', () => {
    expect(TARTALOM.folyamat.map((l) => l.cim)).toEqual(['Felmérés', 'Tervezés', 'Gyártás saját műhelyben', 'Telepítés']);
    expect(TARTALOM.gyartasiIdo).toBe('3 munkanap');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tablo/irany/tartalom.test.ts`
Expected: FAIL – `Cannot find module './tartalom'`.

- [ ] **Step 3: Write the implementation**

`src/tablo/irany/tartalom.ts`:

```ts
// The shared, real content of the full-direction sketches (X1–X6), so the directions differ only in form.
// Facts come from src/domain; the intro and process texts are the approved copy of the mockups. Nothing invented.
import {
  ON_SITE_SERVICE,
  PRICES,
  PRICES_ARE_PLACEHOLDERS,
  SERVICE_GROUPS,
  STANDARD_LEAD_BUSINESS_DAYS,
  isShopOrderable,
} from '@/domain/catalog';
import { COMPANY } from '@/domain/company';
import { formatNumberHu } from '@/domain/money';
import { grossOf } from '@/domain/pricing';

export interface IranyBelepo {
  readonly cim: string;
  readonly leiras: string;
  readonly href: string;
}

export interface IranyCsoport {
  readonly nev: string;
  readonly elemek: readonly { readonly nev: string; readonly online: boolean }[];
}

export interface IranyAr {
  readonly termek: string;
  /** Gross forints. */
  readonly osszeg: number;
  readonly egyseg: 'Ft/m²-től' | 'Ft-tól';
}

export interface IranyLepes {
  readonly cim: string;
  readonly leiras: string;
}

export interface IranyTartalom {
  readonly ceg: typeof COMPANY;
  readonly szlogen: string;
  readonly bevezeto: string;
  readonly belepok: readonly IranyBelepo[];
  readonly csoportok: readonly IranyCsoport[];
  readonly arak: readonly IranyAr[];
  /** True while the catalog prices are placeholders: every price is labelled so. */
  readonly arakHelyorzok: boolean;
  readonly gyartasiIdo: string;
  readonly folyamat: readonly IranyLepes[];
}

const lowest = (prices: Readonly<Record<string, number>>): number => Math.min(...Object.values(prices));

export const TARTALOM: IranyTartalom = {
  ceg: COMPANY,
  szlogen: ON_SITE_SERVICE.description,
  bevezeto:
    'Fóliázás, cégér és világító reklám, nyomtatás, rendezvénydíszlet: a felméréstől a telepítésig egy csapat, saját műhellyel.',
  belepok: [
    { cim: 'Online rendelés', leiras: 'Azonnali ár, grafikafeltöltés.', href: '/#/webshop' },
    { cim: 'Egyedi ajánlat', leiras: 'Négy lépésben, kérésre helyszíni felméréssel.', href: '/#/ajanlatkeres' },
  ],
  csoportok: SERVICE_GROUPS.map((g) => ({
    nev: g.name,
    elemek: g.items.map((i) => ({ nev: i.name, online: isShopOrderable(i) })),
  })),
  arak: [
    { termek: 'Molinó', osszeg: grossOf(lowest(PRICES.molino.perM2)), egyseg: 'Ft/m²-től' },
    { termek: 'Roll-up', osszeg: grossOf(lowest(PRICES.rollup.formats)), egyseg: 'Ft-tól' },
    { termek: 'Matrica', osszeg: grossOf(lowest(PRICES.matrica.perM2)), egyseg: 'Ft/m²-től' },
  ],
  arakHelyorzok: PRICES_ARE_PLACEHOLDERS,
  gyartasiIdo: `${STANDARD_LEAD_BUSINESS_DAYS} munkanap`,
  folyamat: [
    { cim: 'Felmérés', leiras: 'Kimegyünk, lemérjük a felületet, és megbeszéljük, mire van szüksége.' },
    { cim: 'Tervezés', leiras: 'Látványtervet küldünk, és a jóváhagyásig finomítjuk.' },
    { cim: 'Gyártás saját műhelyben', leiras: 'Nyomtatás, fóliavágás, táblák és betűk egy helyen.' },
    { cim: 'Telepítés', leiras: 'Kiszállítjuk, felszereljük, és átadás előtt együtt ellenőrizzük.' },
  ],
};

/** "5 067": the amount of a price, grouped with a no-break space, without its unit. */
export const arSzam = (ar: IranyAr): string => formatNumberHu(ar.osszeg);

/** "5 067 Ft/m²-től". */
export const arTeljes = (ar: IranyAr): string => `${arSzam(ar)} ${ar.egyseg}`;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/tablo/irany/tartalom.test.ts`
Expected: PASS (4 tests). Ha az ezres elválasztó nem U+00A0, nézd meg a `formatNumberHu` kimenetét, és a tesztben azt a karaktert várd (a `src/domain/money.ts` szerint U+00A0).

- [ ] **Step 5: Commit**

```bash
git add src/tablo/irany/tartalom.ts src/tablo/irany/tartalom.test.ts
git -c user.name=Claude -c user.email=noreply@anthropic.com commit -m "Share the real content of the full-direction sketches" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: A „Teljes irányok” csoport, a teljes oldal és az egyedi jelenet-azonosítók

**Files:**
- Modify: `src/tablo/variants.ts`, `src/tablo/variants.test.ts`, `src/tablo/Frame.astro`, `src/tablo/tablo.css`, `src/tablo/Variant.astro`, `src/tablo/grafika/Jelenet.astro`, `src/tablo/grafika/jelenetek/*.astro`
- Create: `src/pages/tablo/irany/[id].astro`

**Interfaces:**
- Consumes: `boardAvailable` (`src/tablo/availability.ts`), `Base` layout.
- Produces: `VariantGroup` bővül `'irany'`-val; `Variant.round: 1 | 2 | 3 | 4 | 5 | 6`; `Variant.page?: string` (`'x1'` … `'x6'`); `finishedVariantByPage(page: string | undefined): Variant | undefined`; `Variant` komponens: `fejlec?: 2 | 4` prop; `Jelenet` és minden jelenet: `uid?: string` prop (alap: `sc-${info.id}`).

- [ ] **Step 1: Update the tests first**

`src/tablo/variants.test.ts` – a második és harmadik tesztet cseréld erre, és add hozzá az utolsó két tesztet:

```ts
  it('match the spec: 34 variants; at least 3 token-based and 1 experimental per element group', () => {
    expect(VARIANTS).toHaveLength(34);
    const counts = Object.fromEntries(VARIANT_GROUPS.map((g) => [g.id, VARIANTS.filter((v) => v.group === g.id).length]));
    expect(counts).toEqual({ irany: 6, hero: 6, szolgaltatas: 5, folyamat: 5, referencia: 6, grafika: 6 });
    for (const g of VARIANT_GROUPS.filter((x) => x.id !== 'irany')) {
      expect(variantsOf(g.id, 'tokenes').length, g.id).toBeGreaterThanOrEqual(3);
      expect(variantsOf(g.id, 'kiserleti').length, g.id).toBeGreaterThanOrEqual(1);
    }
    expect(variantsOf('irany', 'tokenes')).toEqual([]);
    expect(variantsOf('irany', 'kiserleti').map((v) => v.id)).toEqual(['X1', 'X2', 'X3', 'X4', 'X5', 'X6']);
  });

  it('say which rule an experiment breaks, and only experiments do', () => {
    for (const v of VARIANTS) {
      if (v.lane === 'kiserleti') {
        expect(v.breaks, v.id).toBeTruthy();
        expect(v.round, v.id).toBe(v.group === 'irany' ? 6 : 5);
      } else {
        expect(v.breaks, v.id).toBeUndefined();
        expect(v.tokenProposals, v.id).toBeUndefined();
      }
    }
  });
```

```ts
  it('give every full direction, and only those, its own page', () => {
    expect(VARIANTS.filter((v) => v.page).map((v) => [v.id, v.page])).toEqual([
      ['X1', 'x1'],
      ['X2', 'x2'],
      ['X3', 'x3'],
      ['X4', 'x4'],
      ['X5', 'x5'],
      ['X6', 'x6'],
    ]);
    expect(VARIANTS.filter((v) => v.page).every((v) => v.group === 'irany')).toBe(true);
  });

  it('find a finished full direction by its page, and nothing else', () => {
    expect(finishedVariantByPage(undefined)).toBeUndefined();
    expect(finishedVariantByPage('nincs-ilyen')).toBeUndefined();
    for (const v of VARIANTS.filter((x) => x.page)) {
      expect(finishedVariantByPage(v.page), v.id).toBe(v.status === 'kesz' ? v : undefined);
    }
  });
```

A fájl elején az import: `import { LANES, VARIANT_GROUPS, VARIANTS, finishedVariantByPage, variantsOf } from './variants';`

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/tablo/variants.test.ts`
Expected: FAIL – `finishedVariantByPage` nincs exportálva, és a darabszám 28.

- [ ] **Step 3: Extend the variant list**

`src/tablo/variants.ts`:

1. A típus: `export type VariantGroup = 'irany' | 'hero' | 'szolgaltatas' | 'folyamat' | 'referencia' | 'grafika';`
2. Az interfészben a `round` sora: `readonly round: 1 | 2 | 3 | 4 | 5 | 6;` és a doc-komment: `/** Build round: 1 graphics, 2 hero, 3 services and process, 4 references, 5 experiments, 6 full directions. */`
3. Az interfészbe a `file` elé:

```ts
  /** Full directions only: the slug of its own page, /tablo/irany/<page>. */
  readonly page?: string;
```

4. A `VARIANT_GROUPS` első eleme: `{ id: 'irany', label: 'Teljes irányok' },`
5. A `VARIANTS` tömb elejére (a `// Hero` sor elé):

```ts
  // Teljes irányok
  {
    id: 'X1', group: 'irany', lane: 'kiserleti', round: 6, status: 'tervezett', file: 'irany/X1Arlista.astro', page: 'x1',
    name: 'Árlista-plakát',
    idea: 'Papírfehér, svájci plakát: az árlista maga a kezdőlap, óriás számokkal; a rózsaszín egyetlen nagy blokk a két belépővel.',
    novelty: 'Az ár az első üzenet, nem a szlogen; világos alap.',
    breaks: 'Világos alap a fekete helyett; új betű.',
    tokenProposals: ['papírfehér alap', 'Inter Tight'],
  },
  {
    id: 'X2', group: 'irany', lane: 'kiserleti', round: 6, status: 'tervezett', file: 'irany/X2Tervrajz.astro', page: 'x2',
    name: 'Tervrajz-sorozat',
    idea: 'Tervrajzkék alapon az oldal egy rajzsorozat lapjai („1/6. lap”), mindegyik rajzfejjel; a rózsaszín csak pecsét.',
    novelty: 'A mérés nyelve az egész oldal műfaja lesz, nem díszítés.',
    breaks: 'Kék alap; a rózsaszín csak pecsétként.',
    tokenProposals: ['tervrajzkék alap', 'Space Grotesk, Space Mono'],
  },
  {
    id: 'X3', group: 'irany', lane: 'kiserleti', round: 6, status: 'tervezett', file: 'irany/X3Rozsaszin.astro', page: 'x3',
    name: 'Rózsaszín áradat',
    idea: 'Teljes rózsaszín felület, fekete óriásbetűk: kampányoldal nagy állításokkal; a fekete az akcentus.',
    novelty: 'A márkaszín környezet lesz, nem kiemelés.',
    breaks: 'Rózsaszín alap; plakátbetű.',
    tokenProposals: ['rózsaszín alap', 'Anton, DM Sans'],
  },
  {
    id: 'X4', group: 'irany', lane: 'kiserleti', round: 6, status: 'tervezett', file: 'irany/X4Eszkoz.astro', page: 'x4',
    name: 'Eszköz-első',
    idea: 'Az első képernyő egy élő molinó-kalkulátor (méret, darab, expressz → bruttó ár és várható elkészülés), minden más utána jön.',
    novelty: 'Bemutatkozás helyett azonnal használható eszköz, a valós árazóval.',
    breaks: 'Világos, felületi (UI) megjelenés; a rózsaszín csak gomb.',
    tokenProposals: ['betonszürke alap', 'DM Sans, DM Mono'],
  },
  {
    id: 'X5', group: 'irany', lane: 'kiserleti', round: 6, status: 'tervezett', file: 'irany/X5Mintakonyv.astro', page: 'x5',
    name: 'Mintakönyv',
    idea: 'Lapozós anyagkatalógus kraftpapíron, regiszterfülekkel; minden szolgáltatás egy mintakártya.',
    novelty: 'Tárgyszerű böngészés; a navigáció a könyv fülei.',
    breaks: 'Meleg kraft alap; fül-navigáció; új betűk.',
    tokenProposals: ['kraftpapír alap', 'Fraunces, DM Mono'],
  },
  {
    id: 'X6', group: 'irany', lane: 'kiserleti', round: 6, status: 'tervezett', file: 'irany/X6Cegerfesto.astro', page: 'x6',
    name: 'Cégérfestő',
    idea: 'Krémszínű zománctábla-világ: kettős keretek, festett rózsaszín díszcsík, árnyékolt betűk, ártáblák.',
    novelty: 'A kézműves cégérfestés hagyománya, a műhely gyökere.',
    breaks: 'Krém alap; retro display és írott betű; díszítés.',
    tokenProposals: ['krém zománc alap', 'Abril Fatface, Pacifico, DM Sans'],
  },
```

6. A fájl végére:

```ts
/** A finished full direction by the slug of its page (/tablo/irany/<page>); undefined for anything else. */
export function finishedVariantByPage(page: string | undefined): Variant | undefined {
  return VARIANTS.find((v) => v.page !== undefined && v.page === page && v.status === 'kesz');
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/tablo/variants.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Unique scene ids**

`src/tablo/grafika/Jelenet.astro`: a Props és az azonosítók:

```astro
interface Props {
  info: JelenetInfo;
  /** Prefix of the title and description ids; give a new one when the scene appears twice on a page. */
  uid?: string;
}

const { info, uid = `sc-${info.id}` } = Astro.props;
const titleId = `${uid}-t`;
const descId = `${uid}-d`;
```

Minden jelenetfájlban (`src/tablo/grafika/jelenetek/*.astro`) adjuk tovább:

```bash
for f in src/tablo/grafika/jelenetek/*.astro; do
  sed -i 's|^  info: JelenetInfo;$|  info: JelenetInfo;\n  uid?: string;|; s|^const { info } = Astro.props;$|const { info, uid } = Astro.props;|; s|<Jelenet info={info}>|<Jelenet info={info} uid={uid}>|' "$f"
done
grep -c "uid" src/tablo/grafika/jelenetek/*.astro
```

Expected: minden fájlban 3 találat.

- [ ] **Step 6: Full-screen link and back link**

`src/tablo/Frame.astro`: a `.tb-frame__width` csoport utáni sorba (még a `.tb-frame__top`-on belül):

```astro
      {
        v.page && v.status === 'kesz' && (
          <a class="tb-frame__full" href={`/tablo/irany/${v.page}`}>
            Teljes képernyő
          </a>
        )
      }
```

`src/tablo/tablo.css` végére:

```css
.tb-frame__full {
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-pill);
  color: var(--color-text);
  font-size: var(--text-xs);
  text-decoration: none;
  touch-action: manipulation;
}

.tb-frame__full:hover {
  border-color: var(--color-text-muted);
}

/* Full-direction page: the way back to the board, in a corner that no sketch uses for content. */
.tb-back {
  position: fixed;
  bottom: var(--space-3);
  left: var(--space-3);
  z-index: 30;
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-pill);
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  text-decoration: none;
}
```

`src/tablo/Variant.astro` Props:

```astro
interface Props {
  id: string;
  /** Heading level of a full direction's main heading: 4 on the board (default), 2 on its own page. */
  fejlec?: 2 | 4;
}

const { id, fejlec = 4 } = Astro.props;
```

- [ ] **Step 7: The full-direction page**

`src/pages/tablo/irany/[id].astro`:

```astro
---
import { env } from 'cloudflare:workers';
import Base from '@/layouts/Base.astro';
import { boardAvailable } from '@/tablo/availability';
import Variant from '@/tablo/Variant.astro';
import { finishedVariantByPage } from '@/tablo/variants';
import '@/tablo/tablo.css';

// One full-direction sketch (X1–X6) as a real page at the window's full width. Dev sites only; production 404.
const variant = finishedVariantByPage(Astro.params.id);
if (!boardAvailable(env.PUBLIC_SITE_ENV) || !variant) {
  return new Response(null, { status: 404 });
}
---

<Base title={`${variant.id} ${variant.name} – Tabló`} description={variant.idea}>
  <h1 class="tb-sr">{variant.id} · {variant.name}</h1>
  <Variant id={variant.id} fejlec={2} />
  <a class="tb-back" href={`/tablo#v-${variant.id}`}>← Vissza a tablóhoz</a>
</Base>
```

- [ ] **Step 8: Check**

Run: `npm test && npm run check`
Expected: zöld. A dev szerveren a `/tablo` tetején a „Teljes irányok” csoport hat „Tervezett · 6. kör” kártyával; a `/tablo/irany/x1` 404 (még nincs kész irány).

- [ ] **Step 9: Commit**

```bash
git add src/tablo src/pages/tablo
git -c user.name=Claude -c user.email=noreply@anthropic.com commit -m "Add the full-directions group, its own pages and unique scene ids" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: X1 – Árlista-plakát

**Files:**
- Create: `src/tablo/irany/X1Arlista.astro`
- Modify: `src/tablo/variants.ts` (X1 `status: 'kesz'`), `src/tablo/Variant.astro`

**Interfaces:**
- Consumes: `TARTALOM`, `arSzam`, `arTeljes` (Task 1); `Rollup` jelenet `uid` proppal, `JELENETEK` (Task 2).
- Produces: `X1Arlista` (`fejlec?: 2 | 4`).

- [ ] **Step 1: The component**

`src/tablo/irany/X1Arlista.astro`:

```astro
---
// X1 · Árlista-plakát: a paper-white Swiss price poster. The price list is the home page; pink is one block.
import { JELENETEK } from '../grafika/jelenet-lista';
import Rollup from '../grafika/jelenetek/Rollup.astro';
import { TARTALOM, arSzam, arTeljes } from './tartalom';

interface Props {
  /** Heading level of the main heading: 4 on the board, 2 on its own page. */
  fejlec?: 2 | 4;
}

const { fejlec = 4 } = Astro.props;
const H = `h${fejlec}` as 'h2' | 'h4';
const Hk = `h${fejlec + 1}` as 'h3' | 'h5';
const { ceg, szlogen, bevezeto, belepok, csoportok, arak, gyartasiIdo, folyamat } = TARTALOM;
const fo = arak[0]!;
const jelenet = JELENETEK.find((j) => j.id === 'rollup')!;
---

<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;600;800&display=swap" />
<div class="x1">
  <div class="x1__in">
    <header class="x1__top">
      <span class="notranslate">STILET DEKOR</span>
      <a href={ceg.phone.href}>{ceg.phone.display}</a>
    </header>

    <section class="x1__hero" aria-labelledby="x1-cim">
      <div>
        <p class="x1__big"><span>{arSzam(fo)}</span><small>{fo.egyseg}</small></p>
        <p class="x1__cap">{fo.termek}, bruttó · helyőrző ár</p>
      </div>
      <div class="x1__claim">
        <H id="x1-cim" class="x1__h">{szlogen}</H>
        <p>{bevezeto}</p>
        <div class="x1__block">
          {
            belepok.map((b) => (
              <a href={b.href}>
                <strong>{b.cim} →</strong>
                <span>{b.leiras}</span>
              </a>
            ))
          }
        </div>
      </div>
    </section>

    <section aria-labelledby="x1-arlista">
      <Hk id="x1-arlista" class="x1__label">Árlista</Hk>
      <ul class="x1__list">
        {
          arak.map((a) => (
            <li>
              <span>{a.termek}</span>
              <span class="x1__dots" aria-hidden="true" />
              <span class="x1__num">{arTeljes(a)}</span>
            </li>
          ))
        }
        <li>
          <span>Gyártási idő</span>
          <span class="x1__dots" aria-hidden="true"></span>
          <span class="x1__num">{gyartasiIdo}</span>
        </li>
      </ul>
      <p class="x1__note">Minden ár bruttó. Helyőrző árak: élesítés előtt a műhely véglegesíti.</p>
    </section>

    <section aria-labelledby="x1-szolg">
      <Hk id="x1-szolg" class="x1__label">Szolgáltatások</Hk>
      <div class="x1__cols">
        {
          csoportok.map((g) => (
            <div>
              <p class="x1__group">{g.nev}</p>
              <ul class="x1__items">
                {g.elemek.map((e) => (
                  <li>
                    {e.nev}
                    {e.online && <span class="x1__tag">online ár</span>}
                  </li>
                ))}
              </ul>
            </div>
          ))
        }
      </div>
    </section>

    <section aria-labelledby="x1-folyamat">
      <Hk id="x1-folyamat" class="x1__label">Folyamat</Hk>
      <ol class="x1__steps">
        {
          folyamat.map((l, i) => (
            <li>
              <span class="x1__n">{String(i + 1).padStart(2, '0')}</span>
              <strong>{l.cim}</strong>
              <span>{l.leiras}</span>
            </li>
          ))
        }
      </ol>
    </section>

    <section class="x1__ref" aria-label="Referencia">
      <Rollup info={jelenet} uid="x1-sc" />
    </section>

    <footer class="x1__foot">
      <a class="x1__phone" href={ceg.phone.href}>{ceg.phone.display}</a>
      <p>
        <a href={`mailto:${ceg.email}`}>{ceg.email}</a> · {ceg.address} · {ceg.openingHours}
        <span class="x1__tag">helyőrző</span>
      </p>
    </footer>
  </div>
</div>

<style>
  .x1 {
    --color-bg: #f4f1ea;
    --color-surface: #e9e4d9;
    --color-surface-raised: #ddd6c8;
    --color-line: #b8b0a1;
    --color-text: #121212;
    --color-text-muted: #4a4741;
    --color-measure: #4a4741;
    --color-focus: #121212;
    container: x1 / inline-size;
    background: var(--color-bg);
    color: var(--color-text);
    font-family: 'Inter Tight', system-ui, sans-serif;
  }

  .x1 a {
    color: inherit;
  }

  .x1__in {
    display: grid;
    gap: 3rem;
    padding: 1.25rem clamp(1rem, 4cqi, 3rem) 3rem;
  }

  .x1__top {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding-block-end: 0.75rem;
    border-block-end: 2px solid var(--color-text);
    font-size: 0.875rem;
    font-weight: 600;
    letter-spacing: 0.04em;
  }

  .x1__top a {
    text-decoration: none;
  }

  .x1__hero {
    display: grid;
    gap: 2rem;
  }

  .x1__big {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.25em;
    margin: 0;
    font-weight: 800;
    font-size: clamp(4rem, 22cqi, 15rem);
    font-variant-numeric: tabular-nums;
    line-height: 0.85;
    letter-spacing: -0.04em;
  }

  .x1__big small {
    font-size: max(1rem, 3.2cqi);
    font-weight: 600;
    letter-spacing: 0;
  }

  .x1__cap,
  .x1__note {
    margin: 0.5rem 0 0;
    font-size: 0.875rem;
    color: var(--color-text-muted);
  }

  .x1__h {
    margin: 0 0 0.75rem;
    font-size: clamp(1.75rem, 5cqi, 3rem);
    font-weight: 800;
    line-height: 1.02;
    letter-spacing: -0.02em;
  }

  .x1__claim > p {
    max-width: 46ch;
    margin: 0 0 1.5rem;
    color: var(--color-text-muted);
  }

  .x1__block {
    display: grid;
    background: var(--color-brand);
    color: var(--color-on-brand);
  }

  .x1__block a {
    display: grid;
    gap: 0.25rem;
    padding: 1.25rem 1.5rem;
    border-block-end: 2px solid var(--color-on-brand);
    text-decoration: none;
  }

  .x1__block a:last-child {
    border-block-end: 0;
  }

  .x1__block strong {
    font-size: 1.5rem;
    font-weight: 800;
  }

  .x1__block a:hover strong,
  .x1__block a:focus-visible strong {
    text-decoration: underline;
    text-underline-offset: 0.15em;
  }

  .x1__label {
    margin: 0 0 1rem;
    padding-block-start: 0.5rem;
    border-block-start: 2px solid var(--color-text);
    font-size: 0.8125rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .x1__list,
  .x1__items,
  .x1__steps {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .x1__list li {
    display: flex;
    align-items: baseline;
    gap: 0.75rem;
    padding-block: 0.6rem;
    border-block-end: 1px solid var(--color-line);
    font-size: clamp(1.125rem, 3cqi, 1.75rem);
    font-weight: 600;
  }

  .x1__dots {
    flex: 1;
    border-block-end: 2px dotted var(--color-line);
  }

  .x1__num {
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .x1__cols {
    display: grid;
    gap: 1.5rem;
  }

  .x1__group {
    margin: 0 0 0.5rem;
    font-size: 1.25rem;
    font-weight: 800;
  }

  .x1__items li {
    padding-block: 0.2rem;
  }

  .x1__tag {
    margin-inline-start: 0.5rem;
    padding: 0 0.4rem;
    border: 1px solid currentColor;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .x1__steps {
    display: grid;
    gap: 1.25rem;
  }

  .x1__steps li {
    display: grid;
    gap: 0.25rem;
  }

  .x1__n {
    font-size: 2.5rem;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    line-height: 1;
  }

  .x1__steps li > span:last-child {
    color: var(--color-text-muted);
  }

  .x1__foot {
    display: grid;
    gap: 0.5rem;
    padding-block-start: 1rem;
    border-block-start: 2px solid var(--color-text);
  }

  .x1__phone {
    font-size: clamp(2.25rem, 9cqi, 6rem);
    font-weight: 800;
    line-height: 1;
    letter-spacing: -0.03em;
    text-decoration: none;
  }

  .x1__foot p {
    margin: 0;
    color: var(--color-text-muted);
  }

  @container x1 (min-width: 720px) {
    .x1__hero {
      grid-template-columns: 1.3fr 1fr;
      align-items: end;
    }

    .x1__cols {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .x1__steps {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }

    .x1__ref {
      max-width: 40rem;
    }
  }

  @container x1 (min-width: 1040px) {
    .x1__cols {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }
</style>
```

- [ ] **Step 2: Wire it**

`src/tablo/variants.ts`: X1 → `status: 'kesz'`.
`src/tablo/Variant.astro`: `import X1Arlista from './irany/X1Arlista.astro';` és a sablon elejére `{id === 'X1' && <X1Arlista fejlec={fejlec} />}`.

- [ ] **Step 3: Check**

Run: `npm test && npm run check`
Expected: zöld. A dev szerveren a `/tablo#v-X1` és a `/tablo/irany/x1` is megjelenik; 390 px-en nincs vízszintes görgetés.

- [ ] **Step 4: Commit**

```bash
git add src/tablo
git -c user.name=Claude -c user.email=noreply@anthropic.com commit -m "Add X1, the price-list poster direction" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: X2 – Tervrajz-sorozat

**Files:**
- Create: `src/tablo/irany/Rajzfej.astro`, `src/tablo/irany/X2Tervrajz.astro`
- Modify: `src/tablo/variants.ts` (X2 `status: 'kesz'`), `src/tablo/Variant.astro`

**Interfaces:**
- Consumes: `TARTALOM`, `arTeljes` (Task 1); `Ledfal` jelenet `uid` proppal (Task 2).
- Produces: `X2Tervrajz` (`fejlec?: 2 | 4`); `Rajzfej` (`targy: string`, `lap: string`).

- [ ] **Step 1: The title block**

`src/tablo/irany/Rajzfej.astro`:

```astro
---
// Title block in the corner of an X2 blueprint sheet: subject, sheet number, drawn by.
interface Props {
  targy: string;
  lap: string;
}

const { targy, lap } = Astro.props;
---

<dl class="rajzfej">
  <div><dt>Tárgy</dt><dd>{targy}</dd></div>
  <div><dt>Lap</dt><dd>{lap}</dd></div>
  <div><dt>Rajzolta</dt><dd class="notranslate">STILET DEKOR</dd></div>
</dl>

<style>
  .rajzfej {
    position: absolute;
    right: 0;
    bottom: 0;
    display: grid;
    grid-template-columns: repeat(3, auto);
    margin: 0;
    border-block-start: 1.5px solid currentColor;
    border-inline-start: 1.5px solid currentColor;
    font-family: 'Space Mono', monospace;
    font-size: 0.75rem;
  }

  .rajzfej div {
    padding: 0.4rem 0.75rem;
    border-inline-start: 1px solid currentColor;
  }

  .rajzfej div:first-child {
    border-inline-start: 0;
  }

  .rajzfej dt {
    font-size: 0.6875rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .rajzfej dd {
    margin: 0;
    font-weight: 700;
  }
</style>
```

- [ ] **Step 2: The component**

`src/tablo/irany/X2Tervrajz.astro`:

```astro
---
// X2 · Tervrajz-sorozat: the site as a set of blueprint sheets, each with a title block; pink only as a stamp.
import { JELENETEK } from '../grafika/jelenet-lista';
import Ledfal from '../grafika/jelenetek/Ledfal.astro';
import Rajzfej from './Rajzfej.astro';
import { TARTALOM, arTeljes } from './tartalom';

interface Props {
  /** Heading level of the main heading: 4 on the board, 2 on its own page. */
  fejlec?: 2 | 4;
}

const { fejlec = 4 } = Astro.props;
const H = `h${fejlec}` as 'h2' | 'h4';
const Hk = `h${fejlec + 1}` as 'h3' | 'h5';
const { ceg, szlogen, bevezeto, belepok, csoportok, arak, gyartasiIdo, folyamat } = TARTALOM;
const jelenet = JELENETEK.find((j) => j.id === 'ledfal')!;
const BETUK = ['A', 'B', 'C', 'D'];
---

<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&family=Space+Mono:wght@400;700&display=swap"
/>
<div class="x2">
  <div class="x2__in">
    <section class="x2__sheet x2__sheet--first" aria-labelledby="x2-cim">
      <p class="x2__dim" aria-hidden="true">M 1:1</p>
      <H id="x2-cim" class="x2__title">{szlogen}</H>
      <p class="x2__lead">{bevezeto}</p>
      <ol class="x2__callouts">
        {
          belepok.map((b, i) => (
            <li>
              <a href={b.href}>
                <span class="x2__key">{BETUK[i]}</span>
                <strong>{b.cim}</strong>
                <span class="x2__muted">{b.leiras}</span>
              </a>
            </li>
          ))
        }
      </ol>
      <p class="x2__stamp">Saját műhely<br />Budapest</p>
      <Rajzfej targy="Kezdőlap" lap="1/6" />
    </section>

    <section class="x2__sheet" aria-labelledby="x2-szolg">
      <Hk id="x2-szolg" class="x2__h">Szolgáltatások</Hk>
      <div class="x2__grid">
        {
          csoportok.map((g, i) => (
            <div class="x2__detail">
              <p class="x2__dname">
                <span class="x2__key">{BETUK[i]}</span>
                {g.nev}
              </p>
              <ul>
                {g.elemek.map((e) => (
                  <li>
                    {e.nev}
                    {e.online && <span class="x2__muted"> · online ár</span>}
                  </li>
                ))}
              </ul>
            </div>
          ))
        }
      </div>
      <Rajzfej targy="Szolgáltatások" lap="2/6" />
    </section>

    <section class="x2__sheet" aria-labelledby="x2-arak">
      <Hk id="x2-arak" class="x2__h">Árak</Hk>
      <table class="x2__table">
        <thead>
          <tr><th scope="col">Tétel</th><th scope="col">Bruttó ár</th></tr>
        </thead>
        <tbody>
          {arak.map((a) => <tr><th scope="row">{a.termek}</th><td>{arTeljes(a)}</td></tr>)}
          <tr><th scope="row">Gyártási idő</th><td>{gyartasiIdo}</td></tr>
        </tbody>
      </table>
      <p class="x2__muted">Helyőrző árak; élesítés előtt a műhely véglegesíti.</p>
      <Rajzfej targy="Árak" lap="3/6" />
    </section>

    <section class="x2__sheet" aria-labelledby="x2-folyamat">
      <Hk id="x2-folyamat" class="x2__h">Folyamat</Hk>
      <ol class="x2__flow">
        {
          folyamat.map((l, i) => (
            <li>
              <span class="x2__key">{i + 1}</span>
              <strong>{l.cim}</strong>
              <span class="x2__muted">{l.leiras}</span>
            </li>
          ))
        }
      </ol>
      <Rajzfej targy="Folyamat" lap="4/6" />
    </section>

    <section class="x2__sheet" aria-label="Referencia">
      <Ledfal info={jelenet} uid="x2-sc" />
      <Rajzfej targy="Referencia" lap="5/6" />
    </section>

    <section class="x2__sheet" aria-labelledby="x2-kapcsolat">
      <Hk id="x2-kapcsolat" class="x2__h">Kapcsolat</Hk>
      <dl class="x2__contact">
        <div><dt>Telefon</dt><dd><a href={ceg.phone.href}>{ceg.phone.display}</a></dd></div>
        <div><dt>E-mail</dt><dd><a href={`mailto:${ceg.email}`}>{ceg.email}</a></dd></div>
        <div><dt>Műhely</dt><dd>{ceg.address}</dd></div>
        <div><dt>Nyitvatartás</dt><dd>{ceg.openingHours} · helyőrző</dd></div>
      </dl>
      <Rajzfej targy="Kapcsolat" lap="6/6" />
    </section>
  </div>
</div>

<style>
  .x2 {
    --color-bg: #123a6a;
    --color-surface: #164477;
    --color-surface-raised: #1c4f88;
    --color-line: #4a78ad;
    --color-text: #eef4fb;
    --color-text-muted: #b9cde4;
    --color-measure: #eef4fb;
    --color-focus: #ffffff;
    container: x2 / inline-size;
    background-color: var(--color-bg);
    background-image:
      linear-gradient(rgb(238 244 251 / 0.08) 1px, transparent 1px),
      linear-gradient(90deg, rgb(238 244 251 / 0.08) 1px, transparent 1px);
    background-size: 24px 24px;
    color: var(--color-text);
    font-family: 'Space Grotesk', system-ui, sans-serif;
  }

  .x2 a {
    color: inherit;
  }

  .x2__in {
    display: grid;
    gap: 2rem;
    padding: clamp(1rem, 3cqi, 2.5rem);
  }

  .x2__sheet {
    position: relative;
    display: grid;
    align-content: start;
    gap: 1.25rem;
    padding: clamp(1.25rem, 4cqi, 3rem);
    padding-block-end: 6rem;
    border: 2px solid var(--color-text);
    outline: 1px solid var(--color-text);
    outline-offset: -8px;
  }

  .x2__dim {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin: 0;
    font-family: 'Space Mono', monospace;
    font-size: 0.75rem;
  }

  .x2__dim::before,
  .x2__dim::after {
    content: '';
    flex: 1;
    height: 1px;
    background: currentColor;
  }

  .x2__title {
    margin: 0;
    font-size: clamp(2.25rem, 8cqi, 5.5rem);
    font-weight: 700;
    line-height: 0.95;
    letter-spacing: -0.01em;
    text-transform: uppercase;
  }

  .x2__lead {
    max-width: 52ch;
    margin: 0;
    color: var(--color-text-muted);
  }

  .x2__muted {
    color: var(--color-text-muted);
  }

  .x2__sheet > p.x2__muted {
    margin: 0;
    font-size: 0.875rem;
  }

  .x2__callouts,
  .x2__flow,
  .x2__detail ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .x2__callouts {
    display: grid;
    gap: 0.75rem;
  }

  .x2__callouts a {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.1rem 1rem;
    padding: 1rem;
    border: 1px dashed var(--color-text);
    text-decoration: none;
  }

  .x2__callouts a:hover,
  .x2__callouts a:focus-visible {
    border-style: solid;
    background: var(--color-surface);
  }

  .x2__callouts strong {
    font-size: 1.25rem;
  }

  .x2__callouts .x2__muted,
  .x2__flow .x2__muted {
    grid-column: 2;
  }

  .x2__key {
    display: inline-grid;
    place-items: center;
    flex: none;
    width: 2rem;
    height: 2rem;
    margin-inline-end: 0.5rem;
    border: 1.5px solid currentColor;
    border-radius: 50%;
    font-family: 'Space Mono', monospace;
    font-size: 0.875rem;
    font-weight: 700;
  }

  .x2__callouts .x2__key,
  .x2__flow .x2__key {
    grid-row: span 2;
  }

  .x2__stamp {
    justify-self: start;
    margin: 0;
    padding: 0.5rem 0.9rem;
    border: 3px solid var(--color-brand);
    color: var(--color-brand);
    font-family: 'Space Mono', monospace;
    font-size: 1.25rem;
    font-weight: 700;
    line-height: 1.15;
    text-align: center;
    text-transform: uppercase;
    transform: rotate(-6deg);
  }

  .x2__h {
    margin: 0;
    font-family: 'Space Mono', monospace;
    font-size: 1rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .x2__grid {
    display: grid;
    gap: 1rem;
  }

  .x2__detail {
    padding: 1rem;
    border: 1px solid var(--color-line);
  }

  .x2__dname {
    display: flex;
    align-items: center;
    margin: 0 0 0.75rem;
    font-size: 1.125rem;
    font-weight: 700;
  }

  .x2__detail li {
    padding-block: 0.2rem;
    font-family: 'Space Mono', monospace;
    font-size: 0.875rem;
  }

  .x2__table {
    width: 100%;
    border-collapse: collapse;
    font-family: 'Space Mono', monospace;
  }

  .x2__table th,
  .x2__table td {
    padding: 0.6rem 0.75rem;
    border: 1px solid var(--color-line);
    text-align: start;
  }

  .x2__table td {
    font-variant-numeric: tabular-nums;
    text-align: end;
    white-space: nowrap;
  }

  .x2__table thead th {
    font-size: 0.75rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .x2__flow {
    display: grid;
    gap: 1rem;
  }

  .x2__flow li {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.25rem 1rem;
    padding: 1rem;
    border: 1px solid var(--color-line);
  }

  .x2__contact {
    display: grid;
    gap: 0.5rem;
    margin: 0;
    font-family: 'Space Mono', monospace;
  }

  .x2__contact div {
    display: grid;
    grid-template-columns: minmax(7rem, auto) 1fr;
    gap: 1rem;
    padding-block: 0.4rem;
    border-block-end: 1px solid var(--color-line);
  }

  .x2__contact dt {
    color: var(--color-text-muted);
  }

  .x2__contact dd {
    margin: 0;
    overflow-wrap: anywhere;
  }

  @container x2 (min-width: 720px) {
    .x2__grid,
    .x2__flow,
    .x2__callouts {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .x2__stamp {
      position: absolute;
      top: 1.75rem;
      right: 1.75rem;
    }

    .x2__title {
      padding-inline-end: 9rem;
    }
  }

  @container x2 (min-width: 1100px) {
    .x2__in {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .x2__sheet--first {
      grid-column: 1 / -1;
    }
  }
</style>
```

- [ ] **Step 3: Wire it**

`src/tablo/variants.ts`: X2 → `status: 'kesz'`.
`src/tablo/Variant.astro`: `import X2Tervrajz from './irany/X2Tervrajz.astro';` és az X1 sor után `{id === 'X2' && <X2Tervrajz fejlec={fejlec} />}`.

- [ ] **Step 4: Check**

Run: `npm test && npm run check`
Expected: zöld. A pecsét szövege (rózsaszín a kéken, 20 px félkövér, nagy szövegnek számít) legalább 3:1; a rajzfej nem takar tartalmat 390 px-en.

- [ ] **Step 5: Commit**

```bash
git add src/tablo
git -c user.name=Claude -c user.email=noreply@anthropic.com commit -m "Add X2, the blueprint-sheets direction" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: X3 – Rózsaszín áradat

**Files:**
- Create: `src/tablo/irany/X3Rozsaszin.astro`
- Modify: `src/tablo/variants.ts` (X3 `status: 'kesz'`), `src/tablo/Variant.astro`

**Interfaces:**
- Consumes: `TARTALOM`, `arSzam` (Task 1); `Kisbusz` jelenet `uid` proppal (Task 2).
- Produces: `X3Rozsaszin` (`fejlec?: 2 | 4`).

- [ ] **Step 1: The component**

`src/tablo/irany/X3Rozsaszin.astro`:

```astro
---
// X3 · Rózsaszín áradat: the brand color becomes the whole surface; black giant type is the accent.
import { JELENETEK } from '../grafika/jelenet-lista';
import Kisbusz from '../grafika/jelenetek/Kisbusz.astro';
import { TARTALOM, arSzam } from './tartalom';

interface Props {
  /** Heading level of the main heading: 4 on the board, 2 on its own page. */
  fejlec?: 2 | 4;
}

const { fejlec = 4 } = Astro.props;
const H = `h${fejlec}` as 'h2' | 'h4';
const Hk = `h${fejlec + 1}` as 'h3' | 'h5';
const { ceg, szlogen, belepok, csoportok, arak, folyamat } = TARTALOM;
// "Kiszállunk, felmérjük, felszereljük." → one line per verb, punctuation kept.
const szavak = szlogen.replace(/\.$/, '').split(', ');
const jelenet = JELENETEK.find((j) => j.id === 'kisbusz')!;
---

<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Anton&family=DM+Sans:wght@400;700&display=swap" />
<div class="x3">
  <div class="x3__in">
    <p class="x3__brand notranslate">STILET DEKOR</p>
    <H class="x3__claim">{szavak.map((s, i) => <span>{s}{i < szavak.length - 1 ? ',' : '.'}</span>)}</H>

    <div class="x3__band">
      {
        belepok.map((b) => (
          <a href={b.href}>
            <strong>{b.cim}</strong>
            <span>{b.leiras}</span>
          </a>
        ))
      }
    </div>

    <section aria-labelledby="x3-szolg">
      <Hk id="x3-szolg" class="x3__label">Szolgáltatások</Hk>
      <ul class="x3__list">
        {csoportok.map((g) => <li>{g.nev}</li>)}
      </ul>
    </section>

    <section aria-labelledby="x3-arak">
      <Hk id="x3-arak" class="x3__label">Árak, bruttó</Hk>
      <ul class="x3__prices">
        {
          arak.map((a) => (
            <li>
              <span class="x3__num">{arSzam(a)}</span>
              <span>{a.egyseg} · {a.termek}</span>
            </li>
          ))
        }
      </ul>
      <p class="x3__note">Helyőrző árak; élesítés előtt a műhely véglegesíti.</p>
    </section>

    <section aria-labelledby="x3-folyamat">
      <Hk id="x3-folyamat" class="x3__label">Folyamat</Hk>
      <ol class="x3__steps">
        {
          folyamat.map((l, i) => (
            <li>
              <span class="x3__num">{i + 1}</span>
              <strong>{l.cim}</strong>
              <span>{l.leiras}</span>
            </li>
          ))
        }
      </ol>
    </section>

    <div class="x3__ref">
      <Kisbusz info={jelenet} uid="x3-sc" />
    </div>

    <footer class="x3__foot">
      <a class="x3__phone" href={ceg.phone.href}>{ceg.phone.display}</a>
      <p><a href={`mailto:${ceg.email}`}>{ceg.email}</a> · {ceg.address} · {ceg.openingHours} (helyőrző)</p>
    </footer>
  </div>
</div>

<style>
  .x3 {
    --color-focus: var(--color-on-brand);
    container: x3 / inline-size;
    background: var(--color-brand);
    color: var(--color-on-brand);
    font-family: 'DM Sans', system-ui, sans-serif;
  }

  .x3 a {
    color: inherit;
  }

  .x3__in {
    display: grid;
    gap: clamp(2rem, 6cqi, 4.5rem);
    padding: clamp(1rem, 4cqi, 3rem);
  }

  .x3__brand {
    margin: 0;
    font-family: 'Anton', Impact, sans-serif;
    font-size: 1.25rem;
    letter-spacing: 0.08em;
  }

  .x3__claim {
    display: grid;
    margin: 0;
    font-family: 'Anton', Impact, sans-serif;
    font-weight: 400;
    font-size: clamp(3.25rem, 16cqi, 12rem);
    line-height: 0.88;
    text-transform: uppercase;
    overflow-wrap: anywhere;
  }

  .x3__band {
    display: grid;
    gap: 2px;
    padding: 2px;
    background: var(--color-on-brand);
  }

  .x3__band a {
    display: grid;
    gap: 0.35rem;
    padding: 1.5rem;
    background: var(--color-on-brand);
    color: var(--color-brand);
    text-decoration: none;
  }

  .x3__band a:focus-visible {
    outline: 3px solid var(--color-brand);
    outline-offset: -8px;
  }

  .x3__band a:hover strong,
  .x3__band a:focus-visible strong {
    text-decoration: underline;
    text-underline-offset: 0.1em;
  }

  .x3__band strong {
    font-family: 'Anton', Impact, sans-serif;
    font-weight: 400;
    font-size: clamp(2rem, 6cqi, 3.5rem);
    line-height: 1;
    text-transform: uppercase;
  }

  .x3__label {
    margin: 0 0 1rem;
    font-size: 0.875rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .x3__list,
  .x3__prices,
  .x3__steps {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .x3__list {
    font-family: 'Anton', Impact, sans-serif;
    font-size: clamp(2rem, 7cqi, 5rem);
    line-height: 1.05;
    text-transform: uppercase;
  }

  .x3__list li {
    border-block-start: 3px solid currentColor;
  }

  .x3__prices {
    display: grid;
    gap: 1rem;
  }

  .x3__prices li {
    display: grid;
    padding-block-start: 0.5rem;
    border-block-start: 3px solid currentColor;
    font-weight: 700;
  }

  .x3__num {
    font-family: 'Anton', Impact, sans-serif;
    font-size: clamp(3rem, 12cqi, 8rem);
    font-variant-numeric: tabular-nums;
    line-height: 0.9;
  }

  .x3__note {
    margin: 1rem 0 0;
    font-size: 0.875rem;
    font-weight: 700;
  }

  .x3__steps {
    display: grid;
    gap: 1.25rem;
  }

  .x3__steps li {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: baseline;
    gap: 0 1rem;
    padding-block-start: 0.5rem;
    border-block-start: 3px solid currentColor;
  }

  .x3__steps .x3__num {
    grid-row: span 2;
    font-size: clamp(2.5rem, 8cqi, 5rem);
  }

  .x3__steps strong {
    font-size: 1.5rem;
  }

  .x3__ref {
    --color-bg: #0a0a0b;
    --color-surface: #141416;
    --color-surface-raised: #1d1d20;
    --color-line: #3a3a3f;
    --color-text: #f3f0ea;
    --color-text-muted: #a3a1a8;
    --color-measure: #f3f0ea;
    --color-focus: #f3f0ea;
    padding: 1rem;
    background: var(--color-bg);
    color: var(--color-text);
  }

  .x3__foot {
    display: grid;
    gap: 0.5rem;
    padding-block-start: 1rem;
    border-block-start: 3px solid currentColor;
  }

  .x3__phone {
    font-family: 'Anton', Impact, sans-serif;
    font-size: clamp(2.5rem, 12cqi, 8rem);
    line-height: 1;
    text-decoration: none;
  }

  .x3__foot p {
    margin: 0;
    font-weight: 700;
    overflow-wrap: anywhere;
  }

  @container x3 (min-width: 720px) {
    .x3__band {
      grid-template-columns: 1fr 1fr;
    }

    .x3__prices {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .x3__steps {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .x3__ref {
      max-width: 44rem;
    }
  }
</style>
```

- [ ] **Step 2: Wire it**

`src/tablo/variants.ts`: X3 → `status: 'kesz'`.
`src/tablo/Variant.astro`: `import X3Rozsaszin from './irany/X3Rozsaszin.astro';` és az X2 sor után `{id === 'X3' && <X3Rozsaszin fejlec={fejlec} />}`.

- [ ] **Step 3: Check**

Run: `npm test && npm run check`
Expected: zöld. Fekete szöveg a rózsaszínen legalább 4,5:1 (a tokenteszt szerint 5,66:1), rózsaszín a feketén ugyanannyi.

- [ ] **Step 4: Commit**

```bash
git add src/tablo
git -c user.name=Claude -c user.email=noreply@anthropic.com commit -m "Add X3, the pink-flood campaign direction" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: X4 – Eszköz-első

**Files:**
- Create: `src/tablo/irany/gyorsar.ts`, `src/tablo/irany/gyorsar.test.ts`, `src/tablo/irany/X4Eszkoz.astro`
- Modify: `src/tablo/variants.ts` (X4 `status: 'kesz'`), `src/tablo/Variant.astro`

**Interfaces:**
- Consumes: `tryPriceConfiguration`, `priceConfiguration` (`src/domain/pricing.ts`), `estimateOrderReadyDate`, `formatReadyBy` (`src/domain/leadtime.ts`), `formatHuf` (`src/domain/money.ts`), `EXPRESS_SURCHARGE_PERCENT`, `EXPRESS_LEAD_BUSINESS_DAYS` (`src/domain/catalog.ts`); `TARTALOM`, `arTeljes` (Task 1); `Uvegfolia` jelenet `uid` proppal (Task 2).
- Produces: `interface GyorsArBemenet { widthCm; heightCm; quantity; express }`; `type GyorsAr = { ok: true; brutto; netto; afa; minimum; kesz } | { ok: false; uzenet }`; `molinoGyorsAr(be: GyorsArBemenet, now: Date): GyorsAr`; `X4Eszkoz` (`fejlec?: 2 | 4`).

- [ ] **Step 1: Write the failing test**

`src/tablo/irany/gyorsar.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { estimateOrderReadyDate, formatReadyBy } from '@/domain/leadtime';
import { formatHuf } from '@/domain/money';
import { priceConfiguration } from '@/domain/pricing';
import { molinoGyorsAr } from './gyorsar';

const NOW = new Date('2026-10-07T08:00:00Z');

describe('molinoGyorsAr', () => {
  it('prices a standard molinó cut to size with the real pricing and lead-time rules', () => {
    const be = { widthCm: 300, heightCm: 100, quantity: 2, express: false };
    const price = priceConfiguration({ productId: 'molino', materialId: 'standard', edgeFinishId: 'meretre-vagas', ...be });
    expect(molinoGyorsAr(be, NOW)).toEqual({
      ok: true,
      brutto: formatHuf(price.grossTotal),
      netto: formatHuf(price.netTotal),
      afa: formatHuf(price.vatTotal),
      minimum: false,
      kesz: formatReadyBy(estimateOrderReadyDate(NOW, { express: false })),
    });
  });

  it('applies the minimum item price to small pieces', () => {
    const r = molinoGyorsAr({ widthCm: 50, heightCm: 50, quantity: 1, express: false }, NOW);
    expect(r.ok && r.minimum).toBe(true);
  });

  it('explains an invalid size in Hungarian instead of pricing it', () => {
    const r = molinoGyorsAr({ widthCm: 10, heightCm: 100, quantity: 1, express: false }, NOW);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.uzenet.length).toBeGreaterThan(5);
  });

  it('brings the ready date forward with express', () => {
    const normal = molinoGyorsAr({ widthCm: 300, heightCm: 100, quantity: 1, express: false }, NOW);
    const express = molinoGyorsAr({ widthCm: 300, heightCm: 100, quantity: 1, express: true }, NOW);
    expect(normal.ok && express.ok && normal.kesz !== express.kesz).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tablo/irany/gyorsar.test.ts`
Expected: FAIL – `Cannot find module './gyorsar'`.

- [ ] **Step 3: Write the implementation**

`src/tablo/irany/gyorsar.ts`:

```ts
// The live quick quote of X4: a standard frontlit molinó, cut to size, priced by the real pricing and
// lead-time rules of src/domain (no numbers of its own). Runs on the server and in the browser.
import { estimateOrderReadyDate, formatReadyBy } from '@/domain/leadtime';
import { formatHuf } from '@/domain/money';
import { tryPriceConfiguration } from '@/domain/pricing';

export interface GyorsArBemenet {
  readonly widthCm: number;
  readonly heightCm: number;
  readonly quantity: number;
  readonly express: boolean;
}

export type GyorsAr =
  | {
      readonly ok: true;
      readonly brutto: string;
      readonly netto: string;
      readonly afa: string;
      /** The minimum item price was applied. */
      readonly minimum: boolean;
      /** "október 13-ára, keddre" for "Várhatóan … elkészül". */
      readonly kesz: string;
    }
  | { readonly ok: false; readonly uzenet: string };

export function molinoGyorsAr(be: GyorsArBemenet, now: Date): GyorsAr {
  const result = tryPriceConfiguration({
    productId: 'molino',
    materialId: 'standard',
    edgeFinishId: 'meretre-vagas',
    widthCm: be.widthCm,
    heightCm: be.heightCm,
    quantity: be.quantity,
    express: be.express,
  });
  if (!result.ok) return { ok: false, uzenet: result.issues[0]?.message ?? 'Ellenőrizze a megadott értékeket.' };
  const { price } = result;
  return {
    ok: true,
    brutto: formatHuf(price.grossTotal),
    netto: formatHuf(price.netTotal),
    afa: formatHuf(price.vatTotal),
    minimum: price.minimumApplied,
    kesz: formatReadyBy(estimateOrderReadyDate(now, { express: be.express })),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/tablo/irany/gyorsar.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: The component**

`src/tablo/irany/X4Eszkoz.astro`:

```astro
---
// X4 · Eszköz-első: the first screen is a working molinó calculator; everything else comes after it.
import { EXPRESS_LEAD_BUSINESS_DAYS, EXPRESS_SURCHARGE_PERCENT } from '@/domain/catalog';
import { JELENETEK } from '../grafika/jelenet-lista';
import Uvegfolia from '../grafika/jelenetek/Uvegfolia.astro';
import { molinoGyorsAr } from './gyorsar';
import { TARTALOM, arTeljes } from './tartalom';

interface Props {
  /** Heading level of the main heading: 4 on the board, 2 on its own page. */
  fejlec?: 2 | 4;
}

const { fejlec = 4 } = Astro.props;
const H = `h${fejlec}` as 'h2' | 'h4';
const Hk = `h${fejlec + 1}` as 'h3' | 'h5';
const { ceg, szlogen, belepok, csoportok, arak, folyamat } = TARTALOM;
const jelenet = JELENETEK.find((j) => j.id === 'uvegfolia')!;
const kezdo = molinoGyorsAr({ widthCm: 300, heightCm: 100, quantity: 1, express: false }, new Date());
---

<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=DM+Mono:wght@400;500&display=swap" />
<div class="x4">
  <div class="x4__in">
    <header class="x4__top">
      <span class="notranslate">STILET DEKOR</span>
      <a href={ceg.phone.href}>{ceg.phone.display}</a>
    </header>

    <section class="x4__tool" aria-labelledby="x4-cim">
      <H id="x4-cim" class="x4__h">Mennyibe kerül a molinója?</H>
      <p class="x4__muted">Standard frontlit molinó, méretre vágva. {szlogen}</p>
      <form class="x4__form" data-x4-form>
        <div class="x4__fields">
          <label>Szélesség<span class="x4__unit"><input name="w" type="number" inputmode="numeric" min="20" max="500" value="300" />cm</span></label>
          <label>Magasság<span class="x4__unit"><input name="h" type="number" inputmode="numeric" min="20" max="500" value="100" />cm</span></label>
          <label>Darab<span class="x4__unit"><input name="q" type="number" inputmode="numeric" min="1" max="999" value="1" />db</span></label>
        </div>
        <label class="x4__check">
          <input name="x" type="checkbox" />
          Expressz gyártás ({EXPRESS_LEAD_BUSINESS_DAYS} munkanap, +{EXPRESS_SURCHARGE_PERCENT}%)
        </label>
      </form>
      <output class="x4__out" aria-live="polite">
        <span class="x4__price" data-x4="brutto">{kezdo.ok ? kezdo.brutto : ''}</span>
        <span class="x4__small" data-x4="reszlet">{kezdo.ok ? `Nettó ${kezdo.netto} + ÁFA ${kezdo.afa}` : ''}</span>
        <span class="x4__ready" data-x4="kesz">{kezdo.ok ? `Várhatóan ${kezdo.kesz} elkészül.` : ''}</span>
        <span class="x4__err" data-x4="hiba"></span>
      </output>
      <div class="x4__actions">
        {belepok.map((b, i) => <a class:list={['x4__btn', i > 0 && 'x4__btn--ghost']} href={b.href}>{b.cim}</a>)}
      </div>
      <p class="x4__note">
        Helyőrző árak. A végleges ár eltérhet a kalkulált ártól. További kiinduló árak: {arak.slice(1).map((a) => `${a.termek} ${arTeljes(a)}`).join(' · ')}.
      </p>
    </section>

    <section class="x4__sec" aria-labelledby="x4-szolg">
      <Hk id="x4-szolg" class="x4__h2">Minden szolgáltatás</Hk>
      <div class="x4__cards">
        {
          csoportok.map((g) => (
            <div class="x4__card">
              <p class="x4__card-t">{g.nev}</p>
              <ul>
                {g.elemek.map((e) => (
                  <li>
                    <span>{e.nev}</span>
                    <span class:list={['x4__badge', e.online && 'x4__badge--on']}>{e.online ? 'Online ár' : 'Ajánlatra'}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))
        }
      </div>
    </section>

    <section class="x4__sec x4__split" aria-labelledby="x4-folyamat">
      <div>
        <Hk id="x4-folyamat" class="x4__h2">Így dolgozunk</Hk>
        <ol class="x4__steps">
          {
            folyamat.map((l, i) => (
              <li>
                <span class="x4__step-n">{i + 1}</span>
                <div>
                  <strong>{l.cim}</strong>
                  <p>{l.leiras}</p>
                </div>
              </li>
            ))
          }
        </ol>
      </div>
      <Uvegfolia info={jelenet} uid="x4-sc" />
    </section>

    <footer class="x4__foot">
      <a href={ceg.phone.href}>{ceg.phone.display}</a>
      <a href={`mailto:${ceg.email}`}>{ceg.email}</a>
      <span>{ceg.address}</span>
      <span>{ceg.openingHours} (helyőrző)</span>
    </footer>
  </div>
</div>

<script>
  import { molinoGyorsAr } from './gyorsar';

  // Live quick quote: recalculates on every input with the real pricing and lead-time rules.
  for (const form of document.querySelectorAll<HTMLFormElement>('[data-x4-form]')) {
    const tool = form.closest('.x4__tool');
    const slot = (name: string) => tool?.querySelector<HTMLElement>(`[data-x4="${name}"]`) ?? null;
    const update = () => {
      const data = new FormData(form);
      const r = molinoGyorsAr(
        {
          widthCm: Number(data.get('w')),
          heightCm: Number(data.get('h')),
          quantity: Number(data.get('q')),
          express: data.get('x') === 'on',
        },
        new Date(),
      );
      const set = (name: string, text: string) => {
        const el = slot(name);
        if (el) el.textContent = text;
      };
      if (r.ok) {
        set('brutto', r.brutto);
        set('reszlet', `Nettó ${r.netto} + ÁFA ${r.afa}${r.minimum ? ' · minimális tételár' : ''}`);
        set('kesz', `Várhatóan ${r.kesz} elkészül.`);
        set('hiba', '');
      } else {
        set('brutto', '–');
        set('reszlet', '');
        set('kesz', '');
        set('hiba', r.uzenet);
      }
    };
    form.addEventListener('input', update);
    form.addEventListener('submit', (event) => event.preventDefault());
  }
</script>

<style>
  .x4 {
    --color-bg: #f2f2ef;
    --color-surface: #ffffff;
    --color-surface-raised: #e6e6e1;
    --color-line: #c9c9c2;
    --color-text: #17171a;
    --color-text-muted: #55555c;
    --color-measure: #55555c;
    --color-focus: #17171a;
    container: x4 / inline-size;
    background: var(--color-bg);
    color: var(--color-text);
    font-family: 'DM Sans', system-ui, sans-serif;
  }

  .x4 a {
    color: inherit;
  }

  .x4__in {
    display: grid;
    gap: 2.5rem;
    padding: clamp(1rem, 4cqi, 3rem);
  }

  .x4__top {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    font-weight: 700;
  }

  .x4__top a {
    font-family: 'DM Mono', monospace;
    font-weight: 400;
    text-decoration: none;
  }

  .x4__tool {
    display: grid;
    gap: 1.25rem;
    padding: clamp(1.25rem, 4cqi, 2.5rem);
    border: 1px solid var(--color-line);
    border-radius: 16px;
    background: var(--color-surface);
    box-shadow: 0 24px 48px -32px rgb(23 23 26 / 0.35);
  }

  .x4__h {
    margin: 0;
    font-size: clamp(1.75rem, 5cqi, 3rem);
    line-height: 1.05;
    letter-spacing: -0.02em;
  }

  .x4__muted,
  .x4__note {
    margin: 0;
    color: var(--color-text-muted);
  }

  .x4__note {
    font-size: 0.875rem;
  }

  .x4__form {
    display: grid;
    gap: 1rem;
  }

  .x4__fields {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.75rem;
  }

  .x4__fields label {
    display: grid;
    gap: 0.35rem;
    font-size: 0.875rem;
    font-weight: 700;
  }

  .x4__unit {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0 0.75rem;
    border: 1.5px solid var(--color-line);
    border-radius: 10px;
    background: var(--color-bg);
    color: var(--color-text-muted);
    font-family: 'DM Mono', monospace;
    font-weight: 400;
  }

  .x4__unit:focus-within {
    border-color: var(--color-text);
    box-shadow: 0 0 0 2px var(--color-text);
  }

  .x4__unit input {
    width: 100%;
    min-width: 0;
    padding: 0.75rem 0;
    border: 0;
    background: transparent;
    color: var(--color-text);
    font: 500 1.25rem/1 'DM Mono', monospace;
  }

  .x4__unit input:focus-visible {
    outline: none;
  }

  .x4__check {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-weight: 500;
  }

  .x4__check input {
    width: 1.25rem;
    height: 1.25rem;
    accent-color: var(--color-text);
  }

  .x4__out {
    display: grid;
    gap: 0.25rem;
    padding: 1.25rem;
    border-radius: 12px;
    background: var(--color-text);
    color: var(--color-surface);
  }

  .x4__price {
    font: 500 clamp(2.5rem, 9cqi, 4.5rem) / 1 'DM Mono', monospace;
    letter-spacing: -0.03em;
  }

  .x4__small {
    font-size: 0.875rem;
  }

  .x4__ready,
  .x4__err {
    font-weight: 700;
  }

  .x4__small:empty,
  .x4__ready:empty,
  .x4__err:empty {
    display: none;
  }

  .x4__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .x4__btn {
    display: inline-flex;
    align-items: center;
    min-height: 48px;
    padding: 0 1.5rem;
    border: 1.5px solid var(--color-brand);
    border-radius: 999px;
    background: var(--color-brand);
    color: var(--color-on-brand);
    font-weight: 700;
    text-decoration: none;
    touch-action: manipulation;
  }

  .x4__btn:hover {
    box-shadow: 0 0 0 3px var(--color-surface-raised);
  }

  .x4 .x4__btn--ghost {
    border-color: var(--color-text);
    background: transparent;
    color: var(--color-text);
  }

  .x4__sec {
    display: grid;
    gap: 1.25rem;
  }

  .x4__h2 {
    margin: 0;
    font-size: clamp(1.5rem, 4cqi, 2.25rem);
    letter-spacing: -0.01em;
  }

  .x4__cards {
    display: grid;
    gap: 1rem;
  }

  .x4__card {
    padding: 1.25rem;
    border: 1px solid var(--color-line);
    border-radius: 12px;
    background: var(--color-surface);
  }

  .x4__card-t {
    margin: 0 0 0.75rem;
    font-weight: 700;
    font-size: 1.125rem;
  }

  .x4__card ul,
  .x4__steps {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .x4__card li {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 0.75rem;
    padding-block: 0.4rem;
    border-block-start: 1px solid var(--color-surface-raised);
  }

  .x4__badge {
    flex: none;
    padding: 0.1rem 0.5rem;
    border: 1px solid var(--color-line);
    border-radius: 999px;
    color: var(--color-text-muted);
    font-size: 0.75rem;
  }

  .x4__badge--on {
    border-color: var(--color-text);
    color: var(--color-text);
    font-weight: 700;
  }

  .x4__split {
    align-items: start;
  }

  .x4__steps {
    display: grid;
    gap: 1rem;
  }

  .x4__steps li {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 1rem;
  }

  .x4__step-n {
    display: grid;
    place-items: center;
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 50%;
    background: var(--color-text);
    color: var(--color-surface);
    font-family: 'DM Mono', monospace;
  }

  .x4__steps p {
    margin: 0.2rem 0 0;
    color: var(--color-text-muted);
  }

  .x4__foot {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1.5rem;
    padding-block-start: 1.25rem;
    border-block-start: 1px solid var(--color-line);
    color: var(--color-text-muted);
    font-family: 'DM Mono', monospace;
    font-size: 0.875rem;
  }

  @container x4 (max-width: 420px) {
    .x4__fields {
      grid-template-columns: 1fr 1fr;
    }
  }

  @container x4 (min-width: 760px) {
    .x4__cards {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .x4__split {
      grid-template-columns: 1fr 1fr;
    }
  }
</style>
```

- [ ] **Step 6: Wire it**

`src/tablo/variants.ts`: X4 → `status: 'kesz'`.
`src/tablo/Variant.astro`: `import X4Eszkoz from './irany/X4Eszkoz.astro';` és az X3 sor után `{id === 'X4' && <X4Eszkoz fejlec={fejlec} />}`.

- [ ] **Step 7: Check**

Run: `npm test && npm run check`
Expected: zöld. A böngészőben a szélesség átírására (pl. 10) hibaüzenet jelenik meg, a darabszámra és az expresszre az ár és a dátum újraszámolódik.

- [ ] **Step 8: Commit**

```bash
git add src/tablo
git -c user.name=Claude -c user.email=noreply@anthropic.com commit -m "Add X4, the tool-first direction with a live molinó quote" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: X5 – Mintakönyv

**Files:**
- Create: `src/tablo/irany/X5Mintakonyv.astro`
- Modify: `src/tablo/variants.ts` (X5 `status: 'kesz'`), `src/tablo/Variant.astro`

**Interfaces:**
- Consumes: `TARTALOM`, `arTeljes` (Task 1); `Kinalopult` jelenet `uid` proppal (Task 2).
- Produces: `X5Mintakonyv` (`fejlec?: 2 | 4`). Fülek: `role="tablist"`, nyilakkal, Home/End-del kezelhető; JavaScript nélkül minden lap látszik.

- [ ] **Step 1: The component**

`src/tablo/irany/X5Mintakonyv.astro`:

```astro
---
// X5 · Mintakönyv: a kraft-paper sample book; register tabs page through the services as swatch cards.
import { JELENETEK } from '../grafika/jelenet-lista';
import Kinalopult from '../grafika/jelenetek/Kinalopult.astro';
import { TARTALOM, arTeljes } from './tartalom';

interface Props {
  /** Heading level of the main heading: 4 on the board, 2 on its own page. */
  fejlec?: 2 | 4;
}

const { fejlec = 4 } = Astro.props;
const H = `h${fejlec}` as 'h2' | 'h4';
const Hk = `h${fejlec + 1}` as 'h3' | 'h5';
const { ceg, szlogen, bevezeto, belepok, csoportok, arak, gyartasiIdo, folyamat } = TARTALOM;
const jelenet = JELENETEK.find((j) => j.id === 'kinalopult')!;
const lapok = ['Borító', ...csoportok.map((g) => g.nev), 'Árak, kapcsolat'];
const utolso = lapok.length - 1;
/** Swatch texture per service group: film sheen, LED dots, print halftone, event stripes. */
const MINTAK = ['folia', 'led', 'raszter', 'csik'];
---

<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;600;800&family=DM+Mono&display=swap" />
<div class="x5" data-x5>
  <div class="x5__book">
    <div class="x5__tabs" role="tablist" aria-label="A mintakönyv fejezetei">
      {
        lapok.map((cim, i) => (
          <button
            type="button"
            role="tab"
            id={`x5-ful-${i}`}
            aria-controls={`x5-lap-${i}`}
            aria-selected={i === 0 ? 'true' : 'false'}
            tabindex={i === 0 ? 0 : -1}
          >
            {cim}
          </button>
        ))
      }
    </div>

    <div class="x5__pages">
      <section class="x5__page" id="x5-lap-0" role="tabpanel" aria-labelledby="x5-ful-0">
        <p class="x5__over">Mintakönyv · <span class="notranslate">Stilet Dekor</span></p>
        <H class="x5__h">{szlogen}</H>
        <p>{bevezeto}</p>
        <div class="x5__entries">
          {
            belepok.map((b) => (
              <a href={b.href}>
                <strong>{b.cim}</strong>
                <span>{b.leiras}</span>
              </a>
            ))
          }
        </div>
        <ol class="x5__steps">
          {folyamat.map((l, i) => <li><strong>{i + 1}. {l.cim}</strong> – {l.leiras}</li>)}
        </ol>
      </section>

      {
        csoportok.map((g, i) => (
          <section class="x5__page" id={`x5-lap-${i + 1}`} role="tabpanel" aria-labelledby={`x5-ful-${i + 1}`}>
            <Hk class="x5__h2">{g.nev}</Hk>
            <ul class="x5__swatches">
              {g.elemek.map((e) => (
                <li class="x5__swatch">
                  <span class={`x5__chip x5__chip--${MINTAK[i]}`} aria-hidden="true" />
                  <span class="x5__sname">{e.nev}</span>
                  <span class="x5__meta">{e.online ? 'Online rendelhető' : 'Egyedi ajánlat'}</span>
                </li>
              ))}
            </ul>
          </section>
        ))
      }

      <section class="x5__page" id={`x5-lap-${utolso}`} role="tabpanel" aria-labelledby={`x5-ful-${utolso}`}>
        <Hk class="x5__h2">Árak, kapcsolat</Hk>
        <ul class="x5__prices">
          {arak.map((a) => <li><span>{a.termek}</span><strong>{arTeljes(a)}</strong></li>)}
        </ul>
        <p class="x5__meta">Bruttó, helyőrző árak; gyártási idő: {gyartasiIdo}.</p>
        <Kinalopult info={jelenet} uid="x5-sc" />
        <dl class="x5__contact">
          <div><dt>Telefon</dt><dd><a href={ceg.phone.href}>{ceg.phone.display}</a></dd></div>
          <div><dt>E-mail</dt><dd><a href={`mailto:${ceg.email}`}>{ceg.email}</a></dd></div>
          <div><dt>Műhely</dt><dd>{ceg.address}</dd></div>
          <div><dt>Nyitvatartás</dt><dd>{ceg.openingHours} (helyőrző)</dd></div>
        </dl>
      </section>
    </div>
  </div>
</div>

<script>
  // Register tabs: click, arrow keys, Home and End. Without this script every page stays visible.
  const MOVES: Record<string, number> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
  for (const root of document.querySelectorAll<HTMLElement>('[data-x5]')) {
    const tabs = [...root.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
    const panels = tabs.map((t) => root.querySelector<HTMLElement>(`#${t.getAttribute('aria-controls')}`));
    const select = (index: number, focus: boolean) => {
      tabs.forEach((tab, k) => {
        const on = k === index;
        tab.setAttribute('aria-selected', String(on));
        tab.tabIndex = on ? 0 : -1;
        panels[k]?.toggleAttribute('hidden', !on);
      });
      if (focus) tabs[index]?.focus();
    };
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(i, false));
      tab.addEventListener('keydown', (event) => {
        const move = MOVES[event.key];
        if (move !== undefined) select((i + move + tabs.length) % tabs.length, true);
        else if (event.key === 'Home') select(0, true);
        else if (event.key === 'End') select(tabs.length - 1, true);
        else return;
        event.preventDefault();
      });
    });
    select(0, false);
  }
</script>

<style>
  .x5 {
    --color-bg: #d6c19b;
    --color-surface: #ebdfc5;
    --color-surface-raised: #dfcfab;
    --color-line: #a08a62;
    --color-text: #2a2016;
    --color-text-muted: #554533;
    --color-measure: #554533;
    --color-focus: #2a2016;
    container: x5 / inline-size;
    padding: clamp(1rem, 3cqi, 2.5rem);
    background-color: var(--color-bg);
    background-image: repeating-linear-gradient(105deg, rgb(42 32 22 / 0.035) 0 2px, transparent 2px 7px);
    color: var(--color-text);
    font-family: 'Fraunces', Georgia, serif;
  }

  .x5 a {
    color: inherit;
  }

  .x5__book {
    display: grid;
  }

  .x5__tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  .x5__tabs button {
    padding: 0.6rem 0.9rem;
    border: 1.5px solid var(--color-text);
    border-block-end: 0;
    border-radius: 10px 10px 0 0;
    background: var(--color-surface-raised);
    color: var(--color-text);
    font: 600 0.9375rem / 1.1 'Fraunces', Georgia, serif;
    cursor: pointer;
    touch-action: manipulation;
  }

  .x5__tabs button:hover {
    background: var(--color-surface);
  }

  .x5__tabs button[aria-selected='true'] {
    background: var(--color-brand);
    color: var(--color-on-brand);
  }

  .x5__pages {
    border: 1.5px solid var(--color-text);
    background: var(--color-surface);
    box-shadow: 6px 6px 0 var(--color-text);
  }

  .x5__page {
    display: grid;
    align-content: start;
    gap: 1.25rem;
    min-height: 26rem;
    padding: clamp(1.25rem, 4cqi, 3rem);
  }

  .x5__page + .x5__page {
    border-block-start: 1.5px dashed var(--color-line);
  }

  .x5__page[hidden] {
    display: none;
  }

  .x5__over,
  .x5__meta,
  .x5__entries span {
    margin: 0;
    color: var(--color-text-muted);
    font-family: 'DM Mono', monospace;
    font-size: 0.8125rem;
  }

  .x5__over {
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .x5__h {
    margin: 0;
    font-size: clamp(2rem, 7cqi, 4.25rem);
    font-weight: 800;
    line-height: 1;
    letter-spacing: -0.02em;
  }

  .x5__h2 {
    margin: 0;
    font-size: clamp(1.5rem, 4.5cqi, 2.5rem);
    font-weight: 800;
  }

  .x5__page > p {
    max-width: 54ch;
    margin: 0;
  }

  .x5__entries {
    display: grid;
    gap: 0.75rem;
  }

  .x5__entries a {
    display: grid;
    gap: 0.2rem;
    padding: 1rem 1.25rem;
    border: 1.5px solid var(--color-text);
    background: var(--color-bg);
    text-decoration: none;
  }

  .x5__entries a:hover {
    background: var(--color-surface-raised);
  }

  .x5__entries strong {
    font-size: 1.25rem;
  }

  .x5__steps,
  .x5__swatches,
  .x5__prices {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .x5__steps {
    display: grid;
    gap: 0.4rem;
    font-size: 0.9375rem;
  }

  .x5__swatches {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(10.5rem, 1fr));
    gap: 1rem;
  }

  .x5__swatch {
    display: grid;
    gap: 0.5rem;
    padding: 0.75rem;
    border: 1px solid var(--color-line);
    background: var(--color-bg);
    box-shadow: 2px 2px 0 var(--color-line);
  }

  .x5__chip {
    display: block;
    aspect-ratio: 4 / 3;
    border: 1px solid var(--color-text);
  }

  .x5__chip--folia {
    background: linear-gradient(135deg, #f7f4ee 0 35%, #d9d4ca 50%, #f7f4ee 65%);
  }

  .x5__chip--led {
    background-color: #1a1a1a;
    background-image: radial-gradient(circle, var(--color-brand) 0 2px, transparent 2.5px);
    background-size: 10px 10px;
  }

  .x5__chip--raszter {
    background-color: #f7f4ee;
    background-image: radial-gradient(circle, #2a2016 0 1.6px, transparent 2px);
    background-size: 7px 7px;
  }

  .x5__chip--csik {
    background: repeating-linear-gradient(45deg, var(--color-brand) 0 8px, #f7f4ee 8px 16px);
  }

  .x5__sname {
    font-weight: 600;
  }

  .x5__prices li {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding-block: 0.6rem;
    border-block-end: 1px dashed var(--color-line);
    font-size: 1.125rem;
  }

  .x5__prices strong {
    font-family: 'DM Mono', monospace;
    font-weight: 400;
    white-space: nowrap;
  }

  .x5__contact {
    display: grid;
    gap: 0.4rem;
    margin: 0;
  }

  .x5__contact div {
    display: grid;
    grid-template-columns: minmax(7rem, auto) 1fr;
    gap: 1rem;
  }

  .x5__contact dt {
    color: var(--color-text-muted);
    font-family: 'DM Mono', monospace;
    font-size: 0.8125rem;
  }

  .x5__contact dd {
    margin: 0;
    overflow-wrap: anywhere;
  }

  @container x5 (min-width: 760px) {
    .x5__book {
      grid-template-columns: minmax(0, 1fr) auto;
    }

    .x5__tabs {
      order: 2;
      flex-direction: column;
      flex-wrap: nowrap;
      padding-block-start: 1.5rem;
    }

    .x5__tabs button {
      border-block-end: 1.5px solid var(--color-text);
      border-inline-start: 0;
      border-radius: 0 10px 10px 0;
      text-align: start;
    }

    .x5__entries {
      grid-template-columns: 1fr 1fr;
    }
  }
</style>
```

- [ ] **Step 2: Wire it**

`src/tablo/variants.ts`: X5 → `status: 'kesz'`.
`src/tablo/Variant.astro`: `import X5Mintakonyv from './irany/X5Mintakonyv.astro';` és az X4 sor után `{id === 'X5' && <X5Mintakonyv fejlec={fejlec} />}`.

- [ ] **Step 3: Check**

Run: `npm test && npm run check`
Expected: zöld. A fülek kattintásra és nyilakkal váltanak, csak a kiválasztott lap látszik; a kiválasztott fül rózsaszín, rajta fekete szöveg.

- [ ] **Step 4: Commit**

```bash
git add src/tablo
git -c user.name=Claude -c user.email=noreply@anthropic.com commit -m "Add X5, the sample-book direction with register tabs" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: X6 – Cégérfestő

**Files:**
- Create: `src/tablo/irany/X6Cegerfesto.astro`
- Modify: `src/tablo/variants.ts` (X6 `status: 'kesz'`), `src/tablo/Variant.astro`

**Interfaces:**
- Consumes: `TARTALOM`, `arSzam` (Task 1); `Betuk3d` jelenet `uid` proppal (Task 2).
- Produces: `X6Cegerfesto` (`fejlec?: 2 | 4`).

- [ ] **Step 1: The component**

`src/tablo/irany/X6Cegerfesto.astro`:

```astro
---
// X6 · Cégérfestő: cream enamel signs, double frames, painted pink pinstripes and shadowed letters.
import { JELENETEK } from '../grafika/jelenet-lista';
import Betuk3d from '../grafika/jelenetek/Betuk3d.astro';
import { TARTALOM, arSzam } from './tartalom';

interface Props {
  /** Heading level of the main heading: 4 on the board, 2 on its own page. */
  fejlec?: 2 | 4;
}

const { fejlec = 4 } = Astro.props;
const H = `h${fejlec}` as 'h2' | 'h4';
const Hk = `h${fejlec + 1}` as 'h3' | 'h5';
const { ceg, szlogen, bevezeto, belepok, csoportok, arak, gyartasiIdo, folyamat } = TARTALOM;
const jelenet = JELENETEK.find((j) => j.id === 'betuk-3d')!;
---

<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Pacifico&family=DM+Sans:wght@400;700&display=swap"
/>
<div class="x6">
  <div class="x6__in">
    <section class="x6__sign" aria-labelledby="x6-cim">
      <p class="x6__script">Saját műhely · Budapest</p>
      <p class="x6__name notranslate">Stilet Dekor</p>
      <H id="x6-cim" class="x6__h">{szlogen}</H>
      <p class="x6__lead">{bevezeto}</p>
      <div class="x6__entries">
        {
          belepok.map((b) => (
            <a href={b.href}>
              <strong>{b.cim}</strong>
              <span>{b.leiras}</span>
            </a>
          ))
        }
      </div>
    </section>

    <section class="x6__sec" aria-labelledby="x6-szolg">
      <Hk id="x6-szolg" class="x6__ribbon">Szolgáltatásaink</Hk>
      <div class="x6__plaques">
        {
          csoportok.map((g) => (
            <div class="x6__plaque">
              <p class="x6__ptitle">{g.nev}</p>
              <ul>
                {g.elemek.map((e) => (
                  <li>
                    {e.nev}
                    {e.online && <span class="x6__online"> · online ár</span>}
                  </li>
                ))}
              </ul>
            </div>
          ))
        }
      </div>
    </section>

    <section class="x6__sec" aria-labelledby="x6-arak">
      <Hk id="x6-arak" class="x6__ribbon">Árak</Hk>
      <ul class="x6__tags">
        {
          arak.map((a) => (
            <li class="x6__tag">
              <span class="x6__tname">{a.termek}</span>
              <span class="x6__tprice">{arSzam(a)}</span>
              <span class="x6__muted">{a.egyseg}</span>
            </li>
          ))
        }
      </ul>
      <p class="x6__note">Bruttó, helyőrző árak. Gyártási idő: {gyartasiIdo}.</p>
    </section>

    <section class="x6__sec" aria-labelledby="x6-folyamat">
      <Hk id="x6-folyamat" class="x6__ribbon">Így készül</Hk>
      <ol class="x6__steps">
        {
          folyamat.map((l, i) => (
            <li>
              <span class="x6__num">{i + 1}.</span>
              <strong>{l.cim}</strong>
              <span class="x6__muted">{l.leiras}</span>
            </li>
          ))
        }
      </ol>
    </section>

    <div class="x6__ref">
      <Betuk3d info={jelenet} uid="x6-sc" />
    </div>

    <footer class="x6__sign x6__sign--small">
      <p class="x6__script">Keressen bizalommal</p>
      <p class="x6__phone"><a href={ceg.phone.href}>{ceg.phone.display}</a></p>
      <p class="x6__contact">
        <a href={`mailto:${ceg.email}`}>{ceg.email}</a>
        <span>{ceg.address}</span>
        <span>{ceg.openingHours} (helyőrző)</span>
      </p>
    </footer>
  </div>
</div>

<style>
  .x6 {
    --color-bg: #efe3c6;
    --color-surface: #f8f0de;
    --color-surface-raised: #e6d6b2;
    --color-line: #a98f5d;
    --color-text: #1b1612;
    --color-text-muted: #4a3f33;
    --color-measure: #4a3f33;
    --color-focus: #1b1612;
    container: x6 / inline-size;
    background: var(--color-bg);
    color: var(--color-text);
    font-family: 'DM Sans', system-ui, sans-serif;
  }

  .x6 a {
    color: inherit;
  }

  .x6__in {
    display: grid;
    gap: 3rem;
    padding: clamp(1rem, 4cqi, 3rem);
  }

  .x6__sign {
    display: grid;
    justify-items: center;
    gap: 1rem;
    padding: clamp(1.75rem, 6cqi, 4rem) clamp(1.25rem, 5cqi, 4rem);
    border: 6px double var(--color-text);
    border-radius: 18px;
    background: var(--color-surface);
    box-shadow:
      inset 0 0 0 10px var(--color-surface),
      inset 0 0 0 12px var(--color-brand),
      6px 8px 0 var(--color-text);
    text-align: center;
  }

  .x6__script {
    margin: 0;
    font-family: 'Pacifico', cursive;
    font-size: clamp(1.125rem, 3.5cqi, 1.75rem);
  }

  .x6__name {
    margin: 0;
    font-family: 'Abril Fatface', Georgia, serif;
    font-size: clamp(2.75rem, 12cqi, 8rem);
    line-height: 0.95;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    text-shadow: 3px 3px 0 var(--color-brand);
  }

  .x6__h {
    margin: 0;
    font-family: 'Abril Fatface', Georgia, serif;
    font-weight: 400;
    font-size: clamp(1.5rem, 4.5cqi, 2.75rem);
    line-height: 1.1;
  }

  .x6__lead {
    max-width: 52ch;
    margin: 0;
    color: var(--color-text-muted);
  }

  .x6__entries {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.75rem;
  }

  .x6__entries a {
    display: grid;
    gap: 0.1rem;
    padding: 0.8rem 1.4rem;
    border: 2px solid var(--color-text);
    border-radius: 999px;
    background: var(--color-bg);
    text-decoration: none;
  }

  .x6__entries a:first-child {
    background: var(--color-brand);
    color: var(--color-on-brand);
  }

  .x6__entries a:hover {
    box-shadow: 3px 3px 0 var(--color-text);
  }

  .x6__entries strong {
    font-family: 'Abril Fatface', Georgia, serif;
    font-weight: 400;
    font-size: 1.25rem;
  }

  .x6__entries span {
    font-size: 0.8125rem;
  }

  .x6__sec {
    display: grid;
  }

  .x6__ribbon {
    justify-self: center;
    width: fit-content;
    margin: 0 0 1.5rem;
    padding: 0.4rem 2.25rem;
    background: var(--color-text);
    color: var(--color-bg);
    font-family: 'Abril Fatface', Georgia, serif;
    font-weight: 400;
    font-size: 1.5rem;
    clip-path: polygon(0 0, 100% 0, 95% 50%, 100% 100%, 0 100%, 5% 50%);
  }

  .x6__plaques,
  .x6__tags,
  .x6__steps {
    display: grid;
    gap: 1.25rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .x6__plaque {
    padding: 1.25rem 1.5rem;
    border: 3px solid var(--color-text);
    border-radius: 12px;
    background: var(--color-surface);
    box-shadow:
      inset 0 0 0 5px var(--color-surface),
      inset 0 0 0 6.5px var(--color-brand);
  }

  .x6__plaque ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .x6__plaque li {
    padding-block: 0.15rem;
  }

  .x6__plaque li::before {
    content: '✦ ' / '';
    color: var(--color-text-muted);
  }

  .x6__ptitle {
    margin: 0 0 0.5rem;
    font-family: 'Abril Fatface', Georgia, serif;
    font-size: 1.5rem;
  }

  .x6__online,
  .x6__muted,
  .x6__note {
    color: var(--color-text-muted);
  }

  .x6__tag {
    position: relative;
    display: grid;
    gap: 0.1rem;
    padding: 1.25rem 1.5rem 1.25rem 3rem;
    border: 2px solid var(--color-text);
    border-radius: 6px 18px 18px 6px;
    background: var(--color-surface);
  }

  .x6__tag::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 1.1rem;
    width: 0.75rem;
    height: 0.75rem;
    border: 2px solid var(--color-text);
    border-radius: 50%;
    transform: translateY(-50%);
  }

  .x6__tname {
    font-family: 'Pacifico', cursive;
    font-size: 1.25rem;
  }

  .x6__tprice {
    font-family: 'Abril Fatface', Georgia, serif;
    font-size: clamp(2rem, 6cqi, 3rem);
    line-height: 1;
  }

  .x6__note {
    margin: 1rem 0 0;
    text-align: center;
  }

  .x6__steps li {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.1rem 1rem;
    padding: 1rem 0.5rem;
    border-block-end: 2px dotted var(--color-line);
  }

  .x6__num {
    grid-row: span 2;
    font-family: 'Abril Fatface', Georgia, serif;
    font-size: 2.5rem;
    line-height: 1;
    text-shadow: 2px 2px 0 var(--color-brand);
  }

  .x6__steps strong {
    font-family: 'Abril Fatface', Georgia, serif;
    font-weight: 400;
    font-size: 1.375rem;
  }

  .x6__ref {
    padding: 1rem;
    border: 6px double var(--color-text);
    border-radius: 18px;
    background: var(--color-surface);
  }

  .x6__phone {
    margin: 0;
    font-family: 'Abril Fatface', Georgia, serif;
    font-size: clamp(2rem, 7cqi, 3.5rem);
  }

  .x6__phone a {
    text-decoration: none;
  }

  .x6__contact {
    display: grid;
    gap: 0.25rem;
    margin: 0;
    overflow-wrap: anywhere;
  }

  @container x6 (min-width: 720px) {
    .x6__plaques,
    .x6__steps {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .x6__tags {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .x6__ref {
      max-width: 44rem;
      justify-self: center;
    }
  }
</style>
```

- [ ] **Step 2: Wire it**

`src/tablo/variants.ts`: X6 → `status: 'kesz'`.
`src/tablo/Variant.astro`: `import X6Cegerfesto from './irany/X6Cegerfesto.astro';` és az X5 sor után `{id === 'X6' && <X6Cegerfesto fejlec={fejlec} />}`.

- [ ] **Step 3: Check**

Run: `npm test && npm run check`
Expected: zöld. A Pacifico és az Abril Fatface rajzolja az ő és ű betűt („Saját műhely”, „Szolgáltatásaink”).

- [ ] **Step 4: Commit**

```bash
git add src/tablo
git -c user.name=Claude -c user.email=noreply@anthropic.com commit -m "Add X6, the sign-painter direction" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Az irányok átnézése

**Files:**
- Modify: a talált hibák szerint az X-komponensek.

- [ ] **Step 1: Képernyőképek**

A beépített böngészőben nyisd meg mind a hat irányt a saját oldalán (`/tablo/irany/x1` … `x6`):
- 1280 px körüli szélességen és mobilnézetben (`resize_window` preset `mobile`);
- a `/tablo` „Teljes irányok” csoportjában a „390 px” nézetben is.

Minden irányban ellenőrizd: vízszintes görgetés nincs; a betűk betöltődtek és rajzolják az ő és ű betűt; a beágyazott jelenet az irány színeit veszi fel.

- [ ] **Step 2: Kontraszt mérése**

A böngészőben futtass kontrasztmérést irányonként (a 1. kör átnézésében használt canvas-alapú szkripttel): a fő szöveg, a halvány szöveg, a gombok szövege, a pecsét (X2) és a fókuszszín a háttéren. Elvárás: szöveg ≥ 4,5:1, nagy szöveg és grafika ≥ 3:1.

- [ ] **Step 3: Interakciók**

- X4: írd át a szélességet 10-re → hibaüzenet; 300 → ár; pipáld be az expresszt → korábbi dátum.
- X5: a fülek kattintásra, nyilakkal, Home/End-del váltanak, csak a kiválasztott lap látszik.
- Minden irányban: Tab-bal végigmenve minden link és mező kap látható fókuszkeretet.

- [ ] **Step 4: Javítás és ellenőrzés**

A talált hibák javítása után: `npm test && npm run check && npm run build`
Expected: minden zöld.

- [ ] **Step 5: Commit (ha volt javítás)**

```bash
git add src/tablo
git -c user.name=Claude -c user.email=noreply@anthropic.com commit -m "Polish the full directions after review" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
