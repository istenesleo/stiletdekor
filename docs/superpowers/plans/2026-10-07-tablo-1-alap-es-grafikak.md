# Tabló, 1. terv: az oldal váza és a grafikák (G1–G4) – megvalósítási terv

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A `/tablo` fejlesztői oldal felépítése (változatlista, keret, A/B váltó, 390 px / teljes szélesség), és rajta az 1. kör négy tokenes grafikai változata: G1 referencia-jelenetek, G2 piktogramcsalád, G3 mérés-motívumok, G4 szómárka-változatok.

**Architecture:** Az oldal (`src/pages/tablo.astro`) a `src/tablo/variants.ts` listából épül: mind a 28 változat szerepel benne, a még el nem készültek „Tervezett” kártyaként. Minden kész változat egy `.astro` fájl a `src/tablo/<csoport>/` mappában, a `Variant.astro` id alapján jeleníti meg, a `Frame.astro` keretezi. Csak tokeneket használ (`src/styles/tokens.css`); a közös grafikai CSS globális fájlokban van, mert a `set:html`-lel beszúrt és a más komponensben rajzolt SVG-elemekre az Astro scoped stílusa nem hat.

**Tech Stack:** Astro 7 (SSR, Cloudflare adapter), TypeScript (strict), vitest, sima böngészős JS (`<script>`), SVG, CSS container query.

**Spec:** `docs/superpowers/specs/2026-10-07-tablo-design.md`

**Hatókör:** ez a terv a vázat és az 1. kört fedi le. A 2–5. kör (Hero; Szolgáltatások és folyamat; Referenciák; Kísérletiek) mindegyike az előző kör bemutatása után kap saját tervet.

## Global Constraints

- Csak tokenek a tokenes sávban; minden rózsaszín a `--color-brand`-ből jön (közvetlenül vagy `color-mix()`-szel); nyers színérték tilos.
- Nincs kitalált tény: valós adat a `src/domain/`-ből; a példaméretek és helyőrzők jelölve („példa”, „Referenciakép helye”, `[felirat]`).
- Magyar, magázó szöveg; „idézőjel”, nagykötőjeles tartomány, × jel, ezres tagolás nem törhető szóközzel (12 990 Ft).
- WCAG 2.2 AA: szöveg 4,5:1, UI-elem 3:1, látható fókusz, billentyűzettel minden kezelhető; az illusztrációk `role="img"` + `<title>`/`<desc>` vagy `aria-label`; csökkentett mozgásnál nincs animáció (a `src/styles/base.css` ezt globálisan intézi).
- 360 px-től 1440 px-ig és felette hibátlan, vízszintes görgetés nélkül; a változatok a `variant` nevű konténerhez igazodnak (`@container variant (…)`).
- A változatokon belül a címsorok `<h4>`-gyel kezdődnek (az oldal: `h1` rejtett, csoport `h2`, keret `h3`).
- A `/tablo` élesben (`PUBLIC_SITE_ENV === 'production'`) 404.
- A tesztek sima Node-ban futnak: tesztfájl nem importálhat `cloudflare:workers` vagy `astro:*` modult.
- Minden feladat végén zöld: `npm test`; a 2. feladattól `npm run check` és `npm run build` is.
- Commit: ezen a gépen nincs git-identitás; a repó eddigi szerzőjét követjük, a beállítás módosítása nélkül:
  `git -c user.name=Claude -c user.email=noreply@anthropic.com commit …`, az üzenet végén
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Push nincs (a GitHub-belépés még nincs meg).

## Fájlszerkezet

| Fájl | Felelősség |
|---|---|
| `src/tablo/variants.ts` (+ `.test.ts`) | A 28 változat listája, csoportok, sávok; lekérdező függvény |
| `src/tablo/availability.ts` (+ `.test.ts`) | Elérhető-e a tabló az adott környezetben |
| `src/tablo/tablo.css` | A tabló kerete: sáv, csoportok, keretek (tokenekből) |
| `src/tablo/Frame.astro` | Egy változat kerete: leírás, szélességváltó, színpad |
| `src/tablo/Variant.astro` | Kész változat megjelenítése azonosító alapján |
| `src/pages/tablo.astro` | Az oldal: felső sáv, csoportok, sávok |
| `src/tablo/grafika/motivumok/ruler.ts` (+ `.test.ts`) | Vonalzó-osztások számítása |
| `src/tablo/grafika/motivumok/{Vonalzo,Illesztojel,VagojelKeret}.astro`, `motivumok.css` | Mérés-motívumok |
| `src/tablo/grafika/G3Motivumok.astro` | G3 változat |
| `src/tablo/grafika/piktogramok.ts` (+ `.test.ts`), `Piktogram.astro`, `piktogram.css` | Piktogramcsalád |
| `src/tablo/grafika/G2Piktogramok.astro` | G2 változat |
| `src/tablo/grafika/jelenet-lista.ts` (+ `.test.ts`), `Jelenet.astro`, `Alak.astro`, `Meretvonal.astro`, `jelenet.css`, `jelenetek/*.astro` | Referencia-jelenetek |
| `src/tablo/grafika/G1Jelenetek.astro` | G1 változat |
| `src/tablo/grafika/szomarka.ts`, `Szomarka.astro`, `szomarka.css` | Szómárka-változatok |
| `src/tablo/grafika/G4Szomarka.astro` | G4 változat |
| `.claude/launch.json` | A dev szerver indítása a beépített böngészőhöz |

---

### Task 1: A változatok listája

**Files:**
- Create: `src/tablo/variants.ts`
- Test: `src/tablo/variants.test.ts`

**Interfaces:**
- Produces: `type VariantGroup = 'hero' | 'szolgaltatas' | 'folyamat' | 'referencia' | 'grafika'`; `type VariantLane = 'tokenes' | 'kiserleti'`; `type VariantStatus = 'kesz' | 'tervezett'`; `interface Variant { id; group; lane; name; idea; novelty; breaks?; tokenProposals?; round: 1|2|3|4|5; status; file }`; `VARIANT_GROUPS: readonly { id: VariantGroup; label: string }[]`; `LANES: readonly ['tokenes', 'kiserleti']`; `LANE_LABELS: Record<VariantLane, string>`; `VARIANTS: readonly Variant[]`; `variantsOf(group: VariantGroup, lane: VariantLane): Variant[]`.

- [ ] **Step 1: Write the failing test**

`src/tablo/variants.test.ts`:

```ts
import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { LANES, VARIANT_GROUPS, VARIANTS, variantsOf } from './variants';

describe('the /tablo variants', () => {
  it('have unique ids and unique files', () => {
    expect(new Set(VARIANTS.map((v) => v.id)).size).toBe(VARIANTS.length);
    expect(new Set(VARIANTS.map((v) => v.file)).size).toBe(VARIANTS.length);
  });

  it('match the spec: 28 variants, at least 3 token-based and 1 experimental per group', () => {
    expect(VARIANTS).toHaveLength(28);
    const counts = Object.fromEntries(VARIANT_GROUPS.map((g) => [g.id, VARIANTS.filter((v) => v.group === g.id).length]));
    expect(counts).toEqual({ hero: 6, szolgaltatas: 5, folyamat: 5, referencia: 6, grafika: 6 });
    for (const g of VARIANT_GROUPS) {
      expect(variantsOf(g.id, 'tokenes').length, g.id).toBeGreaterThanOrEqual(3);
      expect(variantsOf(g.id, 'kiserleti').length, g.id).toBeGreaterThanOrEqual(1);
    }
  });

  it('say which rule an experiment breaks, and only experiments do', () => {
    for (const v of VARIANTS) {
      if (v.lane === 'kiserleti') {
        expect(v.breaks, v.id).toBeTruthy();
        expect(v.round, v.id).toBe(5);
      } else {
        expect(v.breaks, v.id).toBeUndefined();
        expect(v.tokenProposals, v.id).toBeUndefined();
      }
    }
  });

  it('keep each file in its group folder', () => {
    for (const v of VARIANTS) expect(v.file, v.id).toMatch(new RegExp(`^${v.group}/[A-Z][A-Za-z0-9]*\\.astro$`));
  });

  it('have a component for every finished variant, listed in Variant.astro', () => {
    const variantAstro = fs.readFileSync('src/tablo/Variant.astro', 'utf8');
    for (const v of VARIANTS.filter((x) => x.status === 'kesz')) {
      expect(fs.existsSync(`src/tablo/${v.file}`), v.file).toBe(true);
      expect(variantAstro, v.id).toContain(`id === '${v.id}'`);
    }
  });

  it('lists lanes token-based first and keeps the list order within a lane', () => {
    expect(LANES).toEqual(['tokenes', 'kiserleti']);
    expect(variantsOf('grafika', 'tokenes').map((v) => v.id)).toEqual(['G1', 'G2', 'G3', 'G4']);
  });
});
```

Ideiglenes `src/tablo/Variant.astro`, hogy a fájlolvasás ne bukjon (a 2. feladat bővíti):

```astro
---
// Renders a finished variant of the /tablo board by its id. When a variant's status becomes 'kesz', import its
// component here and add its line below; variants.test.ts checks that every finished variant is listed.
interface Props {
  id: string;
}

const { id } = Astro.props;
---

{id === '' && null}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tablo/variants.test.ts`
Expected: FAIL – `Failed to resolve import "./variants"`.

- [ ] **Step 3: Write the implementation**

`src/tablo/variants.ts`:

```ts
// The variants on the /tablo board (docs/superpowers/specs/2026-10-07-tablo-design.md). The page renders this
// list in order; a finished variant ('kesz') has its component at src/tablo/<file> and a line in Variant.astro.

export type VariantGroup = 'hero' | 'szolgaltatas' | 'folyamat' | 'referencia' | 'grafika';
export type VariantLane = 'tokenes' | 'kiserleti';
export type VariantStatus = 'kesz' | 'tervezett';

export interface Variant {
  /** Short code used when choosing winners, e.g. "H2", "R-K1". */
  readonly id: string;
  readonly group: VariantGroup;
  readonly lane: VariantLane;
  readonly name: string;
  /** One sentence: what the idea is. */
  readonly idea: string;
  /** What is new compared with the two mockups in design/mockups/. */
  readonly novelty: string;
  /** Experimental lane only: which rule it steps over. */
  readonly breaks?: string;
  /** Experimental lane only: values outside the tokens, proposed as new tokens if it wins. */
  readonly tokenProposals?: readonly string[];
  /** Build round: 1 graphics, 2 hero, 3 services and process, 4 references, 5 experiments. */
  readonly round: 1 | 2 | 3 | 4 | 5;
  readonly status: VariantStatus;
  /** The variant's component relative to src/tablo, e.g. "grafika/G1Jelenetek.astro". */
  readonly file: string;
}

export const VARIANT_GROUPS: readonly { readonly id: VariantGroup; readonly label: string }[] = [
  { id: 'hero', label: 'Hero' },
  { id: 'szolgaltatas', label: 'Szolgáltatások' },
  { id: 'folyamat', label: 'Folyamat' },
  { id: 'referencia', label: 'Referenciák' },
  { id: 'grafika', label: 'Grafikák és motívumok' },
];

export const LANES = ['tokenes', 'kiserleti'] as const satisfies readonly VariantLane[];

export const LANE_LABELS: Readonly<Record<VariantLane, string>> = { tokenes: 'Tokenes', kiserleti: 'Kísérleti' };

export const VARIANTS: readonly Variant[] = [
  // Hero
  {
    id: 'H1', group: 'hero', lane: 'tokenes', round: 2, status: 'tervezett', file: 'hero/H1GyartasiRajz.astro',
    name: 'Gyártási rajz',
    idea: 'A hero egy műhelyi gyártási rajz: a cím a terv, körülötte méretvonalak, M 1:10, a sarokban rajzfej; a két belépő a rajzfej két sora.',
    novelty: 'A mostani heroban illusztrált cégér van; itt maga a hero a műhely rajza.',
  },
  {
    id: 'H2', group: 'hero', lane: 'tokenes', round: 2, status: 'tervezett', file: 'hero/H2KetAjto.astro',
    name: 'Két ajtó',
    idea: 'Két egyenrangú fél: Online rendelés anyagmintával és valós „-tól” bruttó árral, Egyedi ajánlat munkatípus-piktogramokkal; a cím átível.',
    novelty: 'A belépők nem a cím alatti gombok, hanem maguk alkotják a herót.',
  },
  {
    id: 'H3', group: 'hero', lane: 'tokenes', round: 2, status: 'tervezett', file: 'hero/H3AzonnaliAr.astro',
    name: 'Azonnali ár',
    idea: 'Molinó-gyorskalkulátor a heroban: szélesség × magasság → bruttó ár és várható elkészülés, a meglévő árazó és határidő-logikából.',
    novelty: 'A látogató az első képernyőn árat kap, görgetés és aloldal nélkül.',
  },
  {
    id: 'H4', group: 'hero', lane: 'tokenes', round: 2, status: 'tervezett', file: 'hero/H4Anyagfal.astro',
    name: 'Anyagfal',
    idea: 'A háttér valós anyagminták csempéiből áll (frontlit és hálós molinó, perforált fólia, plexi, dibond) valós adatokkal; a cím rajta.',
    novelty: 'Illusztráció helyett az anyagok, a kézművesség tapintható háttere.',
  },
  {
    id: 'H-K1', group: 'hero', lane: 'kiserleti', round: 5, status: 'tervezett', file: 'hero/HK1EloCeger.astro',
    name: 'Élő cégér',
    idea: 'A látogató beírja a cégnevét, és világító betűs cégérként látja nappal és éjjel, méretjelöléssel; innen kitöltött ajánlatkérés.',
    novelty: 'Személyre szabott, interaktív hero, amely egyből ajánlatkéréshez vezet.',
    breaks: 'Új fény- és perspektívaeffektek a tokeneken túl.',
    tokenProposals: ['neoncső fénye (többrétegű árnyék)', 'perspektíva-dőlés'],
  },
  {
    id: 'H-K2', group: 'hero', lane: 'kiserleti', round: 5, status: 'tervezett', file: 'hero/HK2Foliafelhordas.astro',
    name: 'Fóliafelhordás',
    idea: 'Nagy, változó betűs cím; a „felszereljük” szót egy simítólapát húzza fel, mint a fóliát, egyetlen mozdulattal.',
    novelty: 'Az oldal megkomponált mozgása a szakma mozdulatából születik.',
    breaks: 'Új, változó betűtípus és saját mozgás.',
    tokenProposals: ['változó display betű szélesség-tengellyel'],
  },
  // Szolgáltatások
  {
    id: 'SZ1', group: 'szolgaltatas', lane: 'tokenes', round: 3, status: 'tervezett', file: 'szolgaltatas/SZ1Feluletek.astro',
    name: 'Mit szeretne dekorálni?',
    idea: 'Belépés felület szerint (autó, kirakat és üveg, homlokzat és cégér, pult, rendezvény, nyomtatott termék); választás után a hozzá tartozó szolgáltatások, jelölve: online vagy ajánlatra.',
    novelty: 'A látogató nyelvén indul, nem a szakmai csoportokból.',
  },
  {
    id: 'SZ2', group: 'szolgaltatas', lane: 'tokenes', round: 3, status: 'tervezett', file: 'szolgaltatas/SZ2KetSav.astro',
    name: 'Azonnal rendelhető / Ajánlatra',
    idea: 'Két sáv: a 6 webshop-termék valós bruttó „-tól” árral és 3 munkanapos gyártással; az egyedi munkák „Kérjen ajánlatot” gombbal.',
    novelty: 'A hibrid modell (webshop + ajánlat) egy pillantásra érthető.',
  },
  {
    id: 'SZ3', group: 'szolgaltatas', lane: 'tokenes', round: 3, status: 'tervezett', file: 'szolgaltatas/SZ3Utcakep.astro',
    name: 'Utcakép',
    idea: 'Széles illusztrált utcarészlet jelölőpontokkal (üzletportál, kisbusz, kirakat, rendezvénysátor); billentyűzettel és listaként is bejárható.',
    novelty: 'Felfedezhető kép a listák helyett.',
  },
  {
    id: 'SZ4', group: 'szolgaltatas', lane: 'tokenes', round: 3, status: 'tervezett', file: 'szolgaltatas/SZ4Targymutato.astro',
    name: 'Tárgymutató',
    idea: 'Ábécérendes mutató az összes szolgáltatásról, gépelés közbeni szűréssel.',
    novelty: 'Gyors út annak, aki pontosan tudja, mit keres.',
  },
  {
    id: 'SZ-K1', group: 'szolgaltatas', lane: 'kiserleti', round: 5, status: 'tervezett', file: 'szolgaltatas/SZK1Kerdezzen.astro',
    name: 'Kérdezzen bátran',
    idea: 'Nagy kereső-jellegű mező („Mit szeretne? Pl. feliratot a kisbuszra”); gépelés közben beépített szólistából javasol szolgáltatást és következő lépést.',
    novelty: 'Beszélgetésszerű belépés, MI nélkül.',
    breaks: 'Új interakciós minta: óriás beviteli mező a navigáció helyett.',
    tokenProposals: ['óriás beviteli betűméret'],
  },
  // Folyamat
  {
    id: 'F1', group: 'folyamat', lane: 'tokenes', round: 3, status: 'tervezett', file: 'folyamat/F1OnEsMi.astro',
    name: 'Ön és mi',
    idea: 'Két párhuzamos sáv: lépésenként mit tesz a megrendelő és mit a műhely.',
    novelty: 'A közös munka átlátható, nem csak a műhely lépései látszanak.',
  },
  {
    id: 'F2', group: 'folyamat', lane: 'tokenes', round: 3, status: 'tervezett', file: 'folyamat/F2Vonalzo.astro',
    name: 'Vonalzó-idővonal',
    idea: 'A négy lépés egy hosszú méretvonalon, osztásokként; mobilon függőleges vonalzó.',
    novelty: 'A mérés nyelve viszi a folyamatot.',
  },
  {
    id: 'F3', group: 'folyamat', lane: 'tokenes', round: 3, status: 'tervezett', file: 'folyamat/F3MunkaUtja.astro',
    name: 'Egy munka útja',
    idea: 'Egy világító betűs cégér illusztrációja végigmegy a négy lépésen: felmérési vázlat → vektoros terv → gyártás → felszerelve.',
    novelty: 'Történet egy tárgyon keresztül, nem felsorolás.',
  },
  {
    id: 'F4', group: 'folyamat', lane: 'tokenes', round: 3, status: 'tervezett', file: 'folyamat/F4KetUtvonal.astro',
    name: 'Két útvonal',
    idea: 'A webshop-rendelés és az egyedi munka útja egymás mellett; kiemelve, hogy az ellenőrzésre küldés még nem jár fizetési kötelezettséggel.',
    novelty: 'A rendelés valódi menete a briefből, a bizalom fő kérdésére válaszol.',
  },
  {
    id: 'F-K1', group: 'folyamat', lane: 'kiserleti', round: 5, status: 'tervezett', file: 'folyamat/FK1Munkalap.astro',
    name: 'Munkalap pecsétekkel',
    idea: 'A folyamat egy műhelyi munkalap; görgetéskor egyszer lecsapódnak a pecsétek: Felmérve, Jóváhagyva, Legyártva, Felszerelve.',
    novelty: 'Tárgyszerű, műhelyhangulatú megjelenés.',
    breaks: 'Új, pecsétszerű betű és papírtextúra; görgetésre induló mozgás.',
    tokenProposals: ['pecsét-betűtípus', 'papír-felület szín'],
  },
  // Referenciák
  {
    id: 'R1', group: 'referencia', lane: 'tokenes', round: 4, status: 'tervezett', file: 'referencia/R1Projektlap.astro',
    name: 'Projektlap',
    idea: 'Egyszerre egy munka egy teljes munkalapon: nagy kép, előtte/utána, méretvonal, anyagok, elvégzett lépések; lapozás és szűrés.',
    novelty: 'Mélység a mennyiség helyett.',
  },
  {
    id: 'R2', group: 'referencia', lane: 'tokenes', round: 4, status: 'tervezett', file: 'referencia/R2Terkep.astro',
    name: 'Térkép',
    idea: 'Stilizált Budapest/Magyarország-térkép a munkák helyszínével, felület szerinti szűréssel; mellette sima lista.',
    novelty: 'Megmutatja, hogy a műhely kiszáll és telepít.',
  },
  {
    id: 'R3', group: 'referencia', lane: 'tokenes', round: 4, status: 'tervezett', file: 'referencia/R3Leptekfal.astro',
    name: 'Léptékfal',
    idea: 'A munkák egymáshoz képest valós arányban a 180 cm-es sziluett mellett, a katalógus szabványos méreteivel, „példa” jelöléssel.',
    novelty: 'A műhely mérettartománya egy képen.',
  },
  {
    id: 'R4', group: 'referencia', lane: 'tokenes', round: 4, status: 'tervezett', file: 'referencia/R4Nagyito.astro',
    name: 'Nagyító',
    idea: 'Kör alakú lencse a csúszka helyett: ahol áll, ott az „utána” látszik; nyilakkal is mozgatható; világító munkáknál nappal/éjjel.',
    novelty: 'Játékosabb, pontosabb összehasonlítás, mint a csúszka.',
  },
  {
    id: 'R-K1', group: 'referencia', lane: 'kiserleti', round: 5, status: 'tervezett', file: 'referencia/RK1Mintalegyezo.astro',
    name: 'Mintalegyező',
    idea: 'A referenciák egy színmintalegyező lapjai, szétnyitható és forgatható; billentyűzettel és listaként is.',
    novelty: 'Tárgyszerű böngészés a rács helyett.',
    breaks: 'Forgatós interakció és térhatás.',
    tokenProposals: ['legyezőlapok árnyéka'],
  },
  {
    id: 'R-K2', group: 'referencia', lane: 'kiserleti', round: 5, status: 'tervezett', file: 'referencia/RK2EjszakaiSeta.astro',
    name: 'Éjszakai séta',
    idea: 'Éjszakai mód: a rács elsötétül, csak a világító munkák fénylenek, mintha este sétálna az utcán.',
    novelty: 'A cégér-üzletág kiemelése hangulattal.',
    breaks: 'Oldalszintű éjszakai mód: a teljes színvilág átvált.',
    tokenProposals: ['éjszakai háttér a --color-bg-nél sötétebben'],
  },
  // Grafikák
  {
    id: 'G1', group: 'grafika', lane: 'tokenes', round: 1, status: 'tervezett', file: 'grafika/G1Jelenetek.astro',
    name: 'Referencia-jelenetek',
    idea: 'A brief nyolc illusztrált helyőrzője egységes stílusban és léptékben, újrahasználható SVG-ként, nappal/éjjel nézettel.',
    novelty: 'Egy közös lépték és stílus a mostani eltérő jelenetek helyett; a színek tokenekből jönnek.',
  },
  {
    id: 'G2', group: 'grafika', lane: 'tokenes', round: 1, status: 'tervezett', file: 'grafika/G2Piktogramok.astro',
    name: 'Piktogramcsalád',
    idea: 'Egy család a 4 szolgáltatáscsoporthoz, a 9 munkatípushoz és a 6 termékhez, 24 px-es rácson, három stílusban: vonalas, kitöltött, tervrajz.',
    novelty: 'Egy közös rendszer a két különálló piktogramkészlet helyett, mérési részletekkel.',
  },
  {
    id: 'G3', group: 'grafika', lane: 'tokenes', round: 1, status: 'tervezett', file: 'grafika/G3Motivumok.astro',
    name: 'Mérés-motívumok',
    idea: 'Vonalzó, méretvonal, illesztőjel, vágójeles keret és vágóalátét-rács egy készletben, használati szabályokkal.',
    novelty: 'A márka legegyedibb eleme rendszerként, nem eseti díszként.',
  },
  {
    id: 'G4', group: 'grafika', lane: 'tokenes', round: 1, status: 'tervezett', file: 'grafika/G4Szomarka.astro',
    name: 'Szómárka-változatok',
    idea: 'A STILET DEKOR jel öt változata (vágott fólia, méretvonal, neoncső, illesztőjel, SD monogram) sötét és rózsaszín alapon, favicon-méretben is.',
    novelty: 'A mostani egyetlen szómárka helyett választható irányok a logóig.',
  },
  {
    id: 'G-K1', group: 'grafika', lane: 'kiserleti', round: 5, status: 'tervezett', file: 'grafika/GK1Neoncso.astro',
    name: 'Neoncső-betűk',
    idea: 'Neoncső-hatású betűrendszer címekhez: cső, fény, rögzítőkapocs, kábel; a H-K1 is ezt használja.',
    novelty: 'Valódi neonreklám-hatás a sima ragyogás helyett.',
    breaks: 'Többrétegű fényeffektus, amelyet a tokenek nem írnak le.',
    tokenProposals: ['neoncső fénye', 'csőárnyék'],
  },
  {
    id: 'G-K2', group: 'grafika', lane: 'kiserleti', round: 5, status: 'tervezett', file: 'grafika/GK2Texturak.astro',
    name: 'Anyagtextúrák',
    idea: 'Gépi SVG/CSS-textúrák: szálcsiszolt alumínium, homokfúvott üveg, hálós molinó, perforált fólia.',
    novelty: 'Anyagszerű felületek az anyagfalhoz és az anyagkártyákhoz.',
    breaks: 'SVG-szűrős textúrák új felületszínekkel.',
    tokenProposals: ['alu, üveg és háló felületszínek'],
  },
];

/** The variants of one group and lane, in list order. */
export function variantsOf(group: VariantGroup, lane: VariantLane): Variant[] {
  return VARIANTS.filter((v) => v.group === group && v.lane === lane);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/tablo/variants.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/tablo/variants.ts src/tablo/variants.test.ts src/tablo/Variant.astro
git -c user.name=Claude -c user.email=noreply@anthropic.com commit -m "List the /tablo board's 28 variants" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: A `/tablo` oldal váza

**Files:**
- Create: `src/tablo/availability.ts`, `src/tablo/availability.test.ts`, `src/tablo/tablo.css`, `src/tablo/Frame.astro`, `src/pages/tablo.astro`, `.claude/launch.json`
- Modify: `src/tablo/Variant.astro` (marad a 1. feladat szerinti tartalom; ebben a feladatban nem változik)

**Interfaces:**
- Consumes: `VARIANT_GROUPS`, `LANES`, `LANE_LABELS`, `variantsOf`, `type Variant` (Task 1); `SITE_THEMES`, `siteThemeOf` (`src/site/themes.ts`); `Base` layout (`theme` prop).
- Produces: `boardAvailable(siteEnv: unknown): boolean`; `Frame` (`variant: Variant` prop, a változat a slotba); a `.tb-stage` konténer neve `variant` (a változatok `@container variant (…)`-t használnak); CSS-osztály `tb-sr` (képernyőolvasónak szóló rejtett szöveg).

- [ ] **Step 1: Write the failing test**

`src/tablo/availability.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { boardAvailable } from './availability';

describe('boardAvailable', () => {
  it('hides the board on production only', () => {
    expect(boardAvailable('production')).toBe(false);
    expect(boardAvailable('dev')).toBe(true);
    expect(boardAvailable('preview')).toBe(true);
    expect(boardAvailable(undefined)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tablo/availability.test.ts`
Expected: FAIL – `Failed to resolve import "./availability"`.

- [ ] **Step 3: Write the implementation**

`src/tablo/availability.ts`:

```ts
/** The /tablo board is a design tool: dev sites, Previews and local dev only, never production. */
export const boardAvailable = (siteEnv: unknown): boolean => siteEnv !== 'production';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/tablo/availability.test.ts`
Expected: PASS.

- [ ] **Step 5: A tabló stílusa**

`src/tablo/tablo.css`:

```css
/* The /tablo board's own chrome: top bar, groups, lanes and variant frames. Tokens only. */

.tb-root {
  padding-block-end: var(--space-9);
}

.tb-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

.tb-bar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3) var(--space-5);
  padding: var(--space-3) var(--layout-gutter);
  background: var(--color-bg);
  border-block-end: 1px solid var(--color-line);
  font-size: var(--text-sm);
}

.tb-bar__title {
  margin: 0;
  font-family: var(--font-display);
  font-weight: var(--weight-display);
  font-size: var(--text-lg);
}

.tb-bar__title span {
  margin-inline-start: var(--space-2);
  font-family: var(--font-body);
  font-weight: var(--weight-regular);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.tb-bar nav {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.tb-bar a {
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-pill);
  color: var(--color-text);
  text-decoration: none;
}

.tb-bar a[aria-current='true'] {
  border-color: var(--color-brand);
  color: var(--color-brand);
}

.tb-legend {
  display: flex;
  gap: var(--space-2);
  margin: 0;
}

.tb-legend span,
.tb-frame__lane {
  margin: 0;
  padding: 0 var(--space-2);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.tb-legend [data-lane='kiserleti'],
.tb-frame[data-lane='kiserleti'] .tb-frame__lane {
  border-style: dashed;
  border-color: var(--color-measure);
  color: var(--color-measure);
}

.tb-group {
  padding: var(--layout-section-gap) var(--layout-gutter) 0;
  scroll-margin-top: var(--space-9);
}

.tb-group > h2 {
  margin: 0 0 var(--space-5);
  font-family: var(--font-display);
  font-weight: var(--weight-display);
  font-size: var(--text-2xl);
  line-height: var(--leading-tight);
}

.tb-lane {
  display: grid;
  gap: var(--space-6);
  margin-block-end: var(--space-7);
}

.tb-lane__label {
  margin: 0;
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-caps);
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.tb-frame {
  overflow: hidden;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.tb-frame[data-lane='kiserleti'] {
  border-style: dashed;
  border-color: var(--color-measure);
}

.tb-frame__head {
  display: grid;
  gap: var(--space-1);
  padding: var(--space-4) var(--space-5);
  border-block-end: 1px solid var(--color-line);
}

.tb-frame__head > p {
  max-width: 72ch;
  margin: 0;
}

.tb-frame__top {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--space-2) var(--space-3);
}

.tb-frame__id {
  margin: 0;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--color-brand);
}

.tb-frame__name {
  margin: 0;
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
}

.tb-frame__note {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.tb-frame__width {
  display: flex;
  gap: var(--space-1);
  margin-inline-start: auto;
}

.tb-frame__width button {
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--color-text);
  font: inherit;
  font-size: var(--text-xs);
  cursor: pointer;
}

.tb-frame__width button[aria-pressed='true'] {
  border-color: var(--color-brand);
  color: var(--color-brand);
}

.tb-stage-wrap {
  padding: var(--space-5);
  background: var(--color-bg);
}

.tb-stage {
  container: variant / inline-size;
  margin-inline: auto;
}

.tb-stage[data-width='390'] {
  max-width: 390px;
  outline: 1px dashed var(--color-line);
  outline-offset: 4px;
}

.tb-planned {
  margin: 0;
  padding: var(--space-5);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}
```

- [ ] **Step 6: A változatkeret**

`src/tablo/Frame.astro`:

```astro
---
// One variant on the /tablo board: what it is and what is new, then the variant itself at 390 px or full width.
import { LANE_LABELS, type Variant } from './variants';

interface Props {
  variant: Variant;
}

const { variant: v } = Astro.props;
const titleId = `v-${v.id}-t`;
---

<article class="tb-frame" id={`v-${v.id}`} data-lane={v.lane} aria-labelledby={titleId}>
  <header class="tb-frame__head">
    <div class="tb-frame__top">
      <p class="tb-frame__id">{v.id}</p>
      <h3 class="tb-frame__name" id={titleId}>{v.name}</h3>
      <p class="tb-frame__lane">{LANE_LABELS[v.lane]}</p>
      {
        v.status === 'kesz' && (
          <div class="tb-frame__width" role="group" aria-label={`${v.id} szélessége`}>
            <button type="button" data-width="390" aria-pressed="false">390 px</button>
            <button type="button" data-width="full" aria-pressed="true">Teljes</button>
          </div>
        )
      }
    </div>
    <p>{v.idea}</p>
    <p class="tb-frame__note"><b>Újdonság:</b> {v.novelty}</p>
    {v.breaks && <p class="tb-frame__note"><b>Túllép:</b> {v.breaks}</p>}
    {
      v.tokenProposals && v.tokenProposals.length > 0 && (
        <p class="tb-frame__note"><b>Token-javaslat:</b> {v.tokenProposals.join(' · ')}</p>
      )
    }
  </header>
  {
    v.status === 'kesz' ? (
      <div class="tb-stage-wrap">
        <div class="tb-stage" data-width="full">
          <slot />
        </div>
      </div>
    ) : (
      <p class="tb-planned">Tervezett · {v.round}. kör</p>
    )
  }
</article>

<script>
  // Width switch: the variant at phone width (390 px) or at the frame's full width.
  for (const group of document.querySelectorAll<HTMLElement>('.tb-frame__width')) {
    const stage = group.closest('.tb-frame')?.querySelector<HTMLElement>('.tb-stage');
    if (!stage) continue;
    group.addEventListener('click', (event) => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-width]');
      if (!button) return;
      stage.dataset.width = button.dataset.width;
      for (const b of group.querySelectorAll('button')) b.setAttribute('aria-pressed', String(b === button));
    });
  }
</script>
```

- [ ] **Step 7: Az oldal**

`src/pages/tablo.astro`:

```astro
---
import { env } from 'cloudflare:workers';
import Base from '@/layouts/Base.astro';
import { SITE_THEMES, siteThemeOf } from '@/site/themes';
import { boardAvailable } from '@/tablo/availability';
import Frame from '@/tablo/Frame.astro';
import Variant from '@/tablo/Variant.astro';
import { LANE_LABELS, LANES, VARIANT_GROUPS, variantsOf } from '@/tablo/variants';
import '@/tablo/tablo.css';

// The variant board (docs/superpowers/specs/2026-10-07-tablo-design.md): alternative page elements and graphics
// in either design direction (?tema=neon-muhely or ?tema=galeria-editorial). Dev sites only; production 404.
if (!boardAvailable(env.PUBLIC_SITE_ENV)) {
  return new Response(null, { status: 404 });
}
const requested = Astro.url.searchParams.get('tema');
const theme = SITE_THEMES.find((t) => t.id === requested) ?? siteThemeOf(env.SITE_THEME);
---

<Base title="Tabló – Stilet Dekor" description="Alternatív weblap-elemek és grafikák változatai." theme={theme.id}>
  <div class="tb-root">
    <header class="tb-bar">
      <p class="tb-bar__title">Tabló<span>{theme.label}</span></p>
      <nav aria-label="Design-irány">
        {
          SITE_THEMES.map((t) => (
            <a class="tb-theme" href={`?tema=${t.id}`} aria-current={t.id === theme.id ? 'true' : undefined}>
              {t.label}
            </a>
          ))
        }
      </nav>
      <nav aria-label="Elemek">
        {VARIANT_GROUPS.map((g) => <a href={`#${g.id}`}>{g.label}</a>)}
      </nav>
      <p class="tb-legend">
        <span data-lane="tokenes">{LANE_LABELS.tokenes}</span>
        <span data-lane="kiserleti">{LANE_LABELS.kiserleti}</span>
      </p>
    </header>
    <main>
      <h1 class="tb-sr">Tabló: alternatív weblap-elemek és grafikák</h1>
      {
        VARIANT_GROUPS.map((g) => (
          <section class="tb-group" id={g.id} aria-labelledby={`${g.id}-t`}>
            <h2 id={`${g.id}-t`}>{g.label}</h2>
            {LANES.map((lane) => {
              const list = variantsOf(g.id, lane);
              return (
                list.length > 0 && (
                  <div class="tb-lane">
                    <p class="tb-lane__label">{LANE_LABELS[lane]} sáv</p>
                    {list.map((v) => (
                      <Frame variant={v}>
                        <Variant id={v.id} />
                      </Frame>
                    ))}
                  </div>
                )
              );
            })}
          </section>
        ))
      }
    </main>
  </div>
</Base>

<script>
  // Keep the place on the page when switching direction.
  for (const link of document.querySelectorAll<HTMLAnchorElement>('a.tb-theme')) {
    link.addEventListener('click', () => {
      link.hash = location.hash;
    });
  }
</script>
```

`.claude/launch.json` (a beépített böngésző `preview_start` hívásához):

```json
{
  "version": "0.0.1",
  "configurations": [
    {
      "name": "dev",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "port": 4321
    }
  ]
}
```

- [ ] **Step 8: Ellenőrzés a dev szerveren**

Run (háttérben): `npm run dev -- --port 4321`
Majd: `curl -s http://localhost:4321/tablo | grep -o 'class="tb-frame"' | wc -l` → Expected: `28`.
`curl -s "http://localhost:4321/tablo?tema=galeria-editorial" | grep -o 'data-theme="[a-z-]*"'` → Expected: `data-theme="galeria-editorial"`.
`curl -s http://localhost:4321/tablo | grep -o 'Tervezett · ' | wc -l` → Expected: `28`.
Állítsd le a dev szervert.

- [ ] **Step 9: Teljes ellenőrzés**

Run: `npm test && npm run check && npm run build`
Expected: minden zöld; `astro check` 0 hiba.

- [ ] **Step 10: Commit**

```bash
git add src/tablo/availability.ts src/tablo/availability.test.ts src/tablo/tablo.css src/tablo/Frame.astro src/pages/tablo.astro .claude/launch.json
git -c user.name=Claude -c user.email=noreply@anthropic.com commit -m "Add the /tablo board page with frames, direction switch and width switch" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: G3 – mérés-motívumok

**Files:**
- Create: `src/tablo/grafika/motivumok/ruler.ts`, `src/tablo/grafika/motivumok/ruler.test.ts`, `src/tablo/grafika/motivumok/motivumok.css`, `src/tablo/grafika/motivumok/Vonalzo.astro`, `src/tablo/grafika/motivumok/Illesztojel.astro`, `src/tablo/grafika/motivumok/VagojelKeret.astro`, `src/tablo/grafika/G3Motivumok.astro`
- Modify: `src/tablo/variants.ts` (G3 `status: 'kesz'`), `src/tablo/Variant.astro`

**Interfaces:**
- Consumes: `DimensionLine` (`src/ui/DimensionLine/DimensionLine.tsx`, props `orientation`, `valueMm`, `label`), React-komponens statikus renderelése Astro-ban (kliens-direktíva nélkül).
- Produces: `rulerTicks(lengthCm: number, detail?: 'mm' | 'half'): RulerTick[]`; `Vonalzo` (`lengthCm?`, `detail?`, `orientation?`); `Illesztojel` (`size?`); `VagojelKeret` (slot); CSS-osztály `tb-cutmat` (vágóalátét-rács háttér). A későbbi körök (H1, F2, R1) ezeket használják.

- [ ] **Step 1: Write the failing test**

`src/tablo/grafika/motivumok/ruler.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { rulerTicks } from './ruler';

describe('rulerTicks', () => {
  it('marks every millimetre, longer at half and whole centimetres, numbering the centimetres', () => {
    const ticks = rulerTicks(2);
    expect(ticks).toHaveLength(21);
    expect(ticks[0]).toEqual({ mm: 0, kind: 'cm', label: '0' });
    expect(ticks[1]).toEqual({ mm: 1, kind: 'mm', label: null });
    expect(ticks[5]).toEqual({ mm: 5, kind: 'half', label: null });
    expect(ticks[10]).toEqual({ mm: 10, kind: 'cm', label: '1' });
    expect(ticks[20]).toEqual({ mm: 20, kind: 'cm', label: '2' });
  });

  it('can show half centimetres only', () => {
    expect(rulerTicks(1, 'half').map((t) => [t.mm, t.kind])).toEqual([
      [0, 'cm'],
      [5, 'half'],
      [10, 'cm'],
    ]);
  });

  it('rejects lengths that are not whole positive centimetres', () => {
    expect(() => rulerTicks(0)).toThrow(RangeError);
    expect(() => rulerTicks(2.5)).toThrow(RangeError);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tablo/grafika/motivumok/ruler.test.ts`
Expected: FAIL – `Failed to resolve import "./ruler"`.

- [ ] **Step 3: Write the implementation**

`src/tablo/grafika/motivumok/ruler.ts`:

```ts
// Tick marks of a centimetre ruler, the brand's measuring motif (Vonalzo.astro).

export type RulerTickKind = 'cm' | 'half' | 'mm';
export type RulerDetail = 'mm' | 'half';

export interface RulerTick {
  /** Distance from the zero mark in millimetres. */
  readonly mm: number;
  readonly kind: RulerTickKind;
  /** Whole centimetres carry their number. */
  readonly label: string | null;
}

/** Ticks of a ruler `lengthCm` long: every millimetre ('mm') or every half centimetre ('half'). */
export function rulerTicks(lengthCm: number, detail: RulerDetail = 'mm'): RulerTick[] {
  if (!Number.isInteger(lengthCm) || lengthCm < 1) {
    throw new RangeError(`lengthCm must be a positive whole number, got ${lengthCm}`);
  }
  const step = detail === 'mm' ? 1 : 5;
  const ticks: RulerTick[] = [];
  for (let mm = 0; mm <= lengthCm * 10; mm += step) {
    const kind: RulerTickKind = mm % 10 === 0 ? 'cm' : mm % 5 === 0 ? 'half' : 'mm';
    ticks.push({ mm, kind, label: kind === 'cm' ? String(mm / 10) : null });
  }
  return ticks;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/tablo/grafika/motivumok/ruler.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: A motívum-komponensek**

`src/tablo/grafika/motivumok/motivumok.css`:

```css
/* Measuring motifs (G3): ruler, registration mark, crop-mark frame, cutting-mat grid. Measure color only. */

.tb-ruler {
  display: block;
  width: 100%;
  height: auto;
  color: var(--color-measure);
}

.tb-ruler--vertical {
  width: auto;
  height: 100%;
  max-height: 32rem;
}

.tb-ruler line {
  stroke: currentColor;
  stroke-width: 0.4;
}

.tb-ruler .tb-ruler__edge,
.tb-ruler .tb-ruler__tick--cm {
  stroke-width: 0.7;
}

.tb-ruler__label {
  fill: currentColor;
  font-family: var(--font-mono);
  font-size: 5px;
  text-anchor: middle;
  dominant-baseline: middle;
}

.tb-reg {
  flex: none;
  color: var(--color-measure);
}

.tb-reg * {
  fill: none;
  stroke: currentColor;
  stroke-width: 1;
}

.tb-crop {
  --crop-gap: 14px;
  --crop-len: 10px;
  position: relative;
  padding: var(--crop-gap);
}

.tb-crop__c {
  position: absolute;
  width: var(--crop-gap);
  height: var(--crop-gap);
  color: var(--color-measure);
}

.tb-crop__c::before,
.tb-crop__c::after {
  content: '';
  position: absolute;
  background: currentColor;
}

.tb-crop__c::before {
  width: 1px;
  height: var(--crop-len);
}

.tb-crop__c::after {
  width: var(--crop-len);
  height: 1px;
}

.tb-crop__c--tl { top: 0; left: 0; }
.tb-crop__c--tl::before { top: 0; right: 0; }
.tb-crop__c--tl::after { bottom: 0; left: 0; }
.tb-crop__c--tr { top: 0; right: 0; }
.tb-crop__c--tr::before { top: 0; left: 0; }
.tb-crop__c--tr::after { bottom: 0; right: 0; }
.tb-crop__c--bl { bottom: 0; left: 0; }
.tb-crop__c--bl::before { bottom: 0; right: 0; }
.tb-crop__c--bl::after { top: 0; left: 0; }
.tb-crop__c--br { bottom: 0; right: 0; }
.tb-crop__c--br::before { bottom: 0; left: 0; }
.tb-crop__c--br::after { top: 0; right: 0; }

.tb-cutmat {
  background-color: var(--color-surface);
  background-image:
    linear-gradient(var(--color-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--color-line) 1px, transparent 1px),
    linear-gradient(color-mix(in oklab, var(--color-line) 45%, transparent) 1px, transparent 1px),
    linear-gradient(90deg, color-mix(in oklab, var(--color-line) 45%, transparent) 1px, transparent 1px);
  background-size: 60px 60px, 60px 60px, 12px 12px, 12px 12px;
}
```

`src/tablo/grafika/motivumok/Vonalzo.astro`:

```astro
---
// A centimetre ruler in the measure color. Use it only where real sizes are shown.
import { type RulerDetail, rulerTicks } from './ruler';
import './motivumok.css';

interface Props {
  lengthCm?: number;
  detail?: RulerDetail;
  orientation?: 'horizontal' | 'vertical';
}

const { lengthCm = 30, detail = 'mm', orientation = 'horizontal' } = Astro.props;
const ticks = rulerTicks(lengthCm, detail);
const vertical = orientation === 'vertical';
const margin = 4; // mm before zero and after the last mark
const along = lengthCm * 10 + 2 * margin;
const across = 24;
const tickLength = { cm: 10, half: 6, mm: 3 } as const;
/** Point at `a` along the ruler and `c` across it. */
const at = (a: number, c: number) => (vertical ? { x: c, y: a } : { x: a, y: c });
const edgeEnd = at(along, 0);
const viewBox = vertical ? `0 0 ${across} ${along}` : `0 0 ${along} ${across}`;
---

<svg class:list={['tb-ruler', `tb-ruler--${orientation}`]} viewBox={viewBox} role="img" aria-label={`Vonalzó, ${lengthCm} cm`}>
  <line class="tb-ruler__edge" x1="0" y1="0" x2={edgeEnd.x} y2={edgeEnd.y} />
  {
    ticks.map((t) => {
      const from = at(t.mm + margin, 0);
      const to = at(t.mm + margin, tickLength[t.kind]);
      return <line class={`tb-ruler__tick--${t.kind}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} />;
    })
  }
  {
    ticks
      .filter((t) => t.label !== null)
      .map((t) => {
        const p = at(t.mm + margin, 17);
        return (
          <text class="tb-ruler__label" x={p.x} y={p.y}>
            {t.label}
          </text>
        );
      })
  }
</svg>
```

`src/tablo/grafika/motivumok/Illesztojel.astro`:

```astro
---
// Registration mark: a crosshair in a circle, the print workshop's alignment sign. Decorative.
import './motivumok.css';

interface Props {
  size?: number;
}

const { size = 24 } = Astro.props;
---

<svg class="tb-reg" viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
  <circle cx="12" cy="12" r="6"></circle>
  <path d="M12 0v24M0 12h24"></path>
</svg>
```

`src/tablo/grafika/motivumok/VagojelKeret.astro`:

```astro
---
// Crop marks around an image or a print preview, as on a press sheet.
import './motivumok.css';
---

<div class="tb-crop">
  <span class="tb-crop__c tb-crop__c--tl" aria-hidden="true"></span>
  <span class="tb-crop__c tb-crop__c--tr" aria-hidden="true"></span>
  <span class="tb-crop__c tb-crop__c--bl" aria-hidden="true"></span>
  <span class="tb-crop__c tb-crop__c--br" aria-hidden="true"></span>
  <slot />
</div>
```

- [ ] **Step 6: A G3 változat**

`src/tablo/grafika/G3Motivumok.astro`:

```astro
---
// G3: the measuring motifs as one kit, each with its rule of use.
import { DimensionLine } from '@/ui/DimensionLine/DimensionLine';
import Illesztojel from './motivumok/Illesztojel.astro';
import VagojelKeret from './motivumok/VagojelKeret.astro';
import Vonalzo from './motivumok/Vonalzo.astro';
import './motivumok/motivumok.css';
---

<div class="g3">
  <section class="g3-item">
    <h4>Vonalzó</h4>
    <Vonalzo lengthCm={30} />
    <Vonalzo lengthCm={10} detail="half" />
    <p class="g3-rule"><b>Szabály:</b> csak ott, ahol valós méretről van szó (konfigurátor, léptékfal, gyártási rajz); díszítésnek nem.</p>
  </section>

  <section class="g3-item">
    <h4>Méretvonal</h4>
    <DimensionLine valueMm={4200} />
    <div class="g3-dim-pair">
      <div class="g3-dim-v"><DimensionLine orientation="vertical" valueMm={880} /></div>
      <DimensionLine label="85 cm" />
    </div>
    <p class="g3-rule"><b>Szabály:</b> mindig valós vagy „példa” jelölésű méretet mutat, a mérés színével.</p>
  </section>

  <section class="g3-item">
    <h4>Illesztőjel</h4>
    <div class="g3-row">
      <Illesztojel size={16} />
      <Illesztojel size={24} />
      <Illesztojel size={40} />
    </div>
    <p class="g3-rule"><b>Szabály:</b> szakaszok és rajzfejek sarkán, szakaszonként legfeljebb egy.</p>
  </section>

  <section class="g3-item">
    <h4>Vágójeles keret</h4>
    <VagojelKeret>
      <div class="g3-ph">Referenciakép helye</div>
    </VagojelKeret>
    <p class="g3-rule"><b>Szabály:</b> referenciaképek és nyomdai előnézetek kerete.</p>
  </section>

  <section class="g3-item g3-item--wide">
    <h4>Vágóalátét-rács</h4>
    <div class="g3-mat tb-cutmat">
      <div class="g3-mat__card">
        <Illesztojel size={20} />
        <p>Szöveg a rácson: a kontraszt nem romolhat, ezért a szöveg mindig saját felületen áll.</p>
      </div>
    </div>
    <p class="g3-rule"><b>Szabály:</b> csak háttér, oldalanként legfeljebb egy szakaszban.</p>
  </section>
</div>

<style>
  .g3 {
    display: grid;
    gap: var(--space-6);
    grid-template-columns: minmax(0, 1fr);
  }

  @container variant (min-width: 760px) {
    .g3 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .g3-item--wide {
      grid-column: 1 / -1;
    }
  }

  .g3-item {
    display: grid;
    gap: var(--space-3);
    align-content: start;
  }

  .g3-item h4 {
    margin: 0;
    font-size: var(--text-md);
    font-weight: var(--weight-semibold);
  }

  .g3-rule {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }

  .g3-row {
    display: flex;
    align-items: center;
    gap: var(--space-4);
  }

  .g3-dim-pair {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: var(--space-4);
  }

  .g3-dim-v {
    height: 8rem;
  }

  .g3-ph {
    display: grid;
    place-items: center;
    aspect-ratio: 4 / 3;
    background: var(--color-surface-raised);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .g3-mat {
    padding: var(--space-7) var(--space-5);
    border-radius: var(--radius-md);
  }

  .g3-mat__card {
    display: flex;
    gap: var(--space-3);
    align-items: start;
    max-width: 36rem;
    padding: var(--space-4);
    background: var(--color-surface-raised);
    border-radius: var(--radius-sm);
  }

  .g3-mat__card p {
    margin: 0;
  }
</style>
```

- [ ] **Step 7: Bekötés**

`src/tablo/variants.ts`: a G3 bejegyzésben `status: 'tervezett'` → `status: 'kesz'`.

`src/tablo/Variant.astro` – a teljes fájl:

```astro
---
// Renders a finished variant of the /tablo board by its id. When a variant's status becomes 'kesz', import its
// component here and add its line below; variants.test.ts checks that every finished variant is listed.
import G3Motivumok from './grafika/G3Motivumok.astro';

interface Props {
  id: string;
}

const { id } = Astro.props;
---

{id === 'G3' && <G3Motivumok />}
```

- [ ] **Step 8: Ellenőrzés**

Run: `npm test && npm run check`
Expected: zöld. Dev szerveren (`npm run dev`) a `http://localhost:4321/tablo#grafika` címen a G3 keret látszik, a „390 px” gomb keskeny nézetre vált, a rács 1 hasábos lesz. Mindkét irányban (`?tema=galeria-editorial`).

- [ ] **Step 9: Commit**

```bash
git add src/tablo/grafika src/tablo/variants.ts src/tablo/Variant.astro
git -c user.name=Claude -c user.email=noreply@anthropic.com commit -m "Add G3, the measuring motif kit, to the board" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: G2 – piktogramcsalád

**Files:**
- Create: `src/tablo/grafika/piktogramok.ts`, `src/tablo/grafika/piktogramok.test.ts`, `src/tablo/grafika/piktogram.css`, `src/tablo/grafika/Piktogram.astro`, `src/tablo/grafika/G2Piktogramok.astro`
- Modify: `src/tablo/variants.ts` (G2 `status: 'kesz'`), `src/tablo/Variant.astro`

**Interfaces:**
- Consumes: `SERVICE_GROUPS`, `QUOTE_TYPES`, `QUOTE_TYPE_IDS`, `SHOP_PRODUCTS`, `SHOP_PRODUCT_IDS`, típusok `ServiceGroupSlug`, `QuoteTypeId`, `ShopProductId` (`src/domain/catalog.ts`).
- Produces: `type PiktogramStilus = 'vonal' | 'kitoltott' | 'tervrajz'`; `PIKTOGRAM_STILUSOK`; `PIKTOGRAM_CSOPORT: Record<ServiceGroupSlug, string>`; `PIKTOGRAM_MUNKA: Record<QuoteTypeId, string>`; `PIKTOGRAM_TERMEK: Record<ShopProductId, string>`; `Piktogram` (`markup`, `label`, `stilus?`, `size?`, `decorative?`). A 2–4. kör (H2, SZ1, SZ2) ezeket használja.

- [ ] **Step 1: Write the failing test**

`src/tablo/grafika/piktogramok.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { QUOTE_TYPE_IDS, SERVICE_GROUPS, SHOP_PRODUCT_IDS } from '@/domain/catalog';
import { PIKTOGRAM_CSOPORT, PIKTOGRAM_MUNKA, PIKTOGRAM_TERMEK } from './piktogramok';

const ALL = [...Object.values(PIKTOGRAM_CSOPORT), ...Object.values(PIKTOGRAM_MUNKA), ...Object.values(PIKTOGRAM_TERMEK)];

describe('the pictogram family', () => {
  it('covers every service group, quote type and shop product', () => {
    expect(Object.keys(PIKTOGRAM_CSOPORT).sort()).toEqual(SERVICE_GROUPS.map((g) => g.slug).sort());
    expect(Object.keys(PIKTOGRAM_MUNKA).sort()).toEqual([...QUOTE_TYPE_IDS].sort());
    expect(Object.keys(PIKTOGRAM_TERMEK).sort()).toEqual([...SHOP_PRODUCT_IDS].sort());
  });

  it('uses only basic shapes, styled by CSS rather than attributes', () => {
    for (const markup of ALL) {
      const tags = [...markup.matchAll(/<([a-z]+)/g)].map((m) => m[1]);
      expect(tags.length).toBeGreaterThan(0);
      for (const tag of tags) expect(['path', 'rect', 'circle', 'line', 'polyline']).toContain(tag);
      expect(markup).not.toMatch(/\s(fill|stroke|style)=/);
    }
  });

  it('has a fillable shape in every pictogram, so the filled style differs', () => {
    for (const markup of ALL) expect(markup).toContain('class="f"');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tablo/grafika/piktogramok.test.ts`
Expected: FAIL – `Failed to resolve import "./piktogramok"`.

- [ ] **Step 3: Write the implementation**

`src/tablo/grafika/piktogramok.ts`:

```ts
// The board's pictogram family (G2): one set of shapes on a 24×24 grid, drawn three ways by CSS (line, filled,
// blueprint; piktogram.css). Shapes with class "f" take the fill; class "m" marks measuring details.
import type { QuoteTypeId, ServiceGroupSlug, ShopProductId } from '@/domain/catalog';

export type PiktogramStilus = 'vonal' | 'kitoltott' | 'tervrajz';

export const PIKTOGRAM_STILUSOK: readonly { readonly id: PiktogramStilus; readonly label: string }[] = [
  { id: 'vonal', label: 'Vonalas' },
  { id: 'kitoltott', label: 'Kitöltött' },
  { id: 'tervrajz', label: 'Tervrajz' },
];

export const PIKTOGRAM_CSOPORT: Readonly<Record<ServiceGroupSlug, string>> = {
  foliazas: '<path class="f" d="M3 10h18v10H3z"/><circle cx="6.5" cy="6.5" r="3.5"/><path d="M10 6.5h11"/><path class="m" d="M7 20v-2M11 20v-2M15 20v-2M19 20v-2"/>',
  'ceger-vilagito-reklam': '<rect class="f" x="3" y="7" width="18" height="9" rx="1"/><path d="M7 11.5h10M8 16v5M16 16v5"/><path class="m" d="M5 3.5l1 1.5M12 2.5v2M19 3.5l-1 1.5"/>',
  nyomtatas: '<rect class="f" x="3" y="9" width="18" height="8" rx="1"/><path d="M7 9V3h10v6M7 14h10v7H7z"/><path class="m" d="M9 17.5h6M9 19.5h4"/>',
  'rendezveny-egyedi': '<path class="f" d="M4 4h16v12H4z"/><path d="M4 16v5M20 16v5M2 21h20"/><path class="m" d="M12 7.5v5M9.5 10h5"/>',
};

export const PIKTOGRAM_MUNKA: Readonly<Record<QuoteTypeId, string>> = {
  autofoliazas: '<path class="f" d="M2 17V8h12l4 4h4v5z"/><circle cx="7" cy="17.5" r="2"/><circle cx="17" cy="17.5" r="2"/><path d="M14 8v4h4"/><path class="m" d="M4 11h7"/>',
  kirakat: '<rect x="3" y="4" width="18" height="16"/><path class="f" d="M3 10h18v4H3z"/><path d="M12 4v16"/><path class="m" d="M6 7l2-2M15 18l3-3"/>',
  ceger: '<rect class="f" x="3" y="5" width="18" height="8"/><path d="M7 9h10M6 13v8M18 13v8"/>',
  betuk: '<path class="f" d="M3 19h18v2H3z"/><path d="M6 19 11 4h2l5 15M8.3 13h7.4"/><path class="m" d="M3 8l2 1M21 8l-2 1M12 1v1.5"/>',
  'led-fal': '<rect class="f" x="3" y="4" width="18" height="12"/><path d="M9 4v12M15 4v12M3 10h18M12 16v4M8 20h8"/>',
  rendezveny: '<path class="f" d="M3 4h18v14H3z"/><path d="M3 18v3M21 18v3"/><path class="m" d="M7 8h.01M12 8h.01M17 8h.01M9.5 12h.01M14.5 12h.01"/>',
  kinalopult: '<path d="M2 8h20"/><path class="f" d="M4 8h16v12H4z"/><path d="M4 13h16"/><path class="m" d="M8 17h8"/>',
  '3d-nyomtatas': '<path class="f" d="M12 3 20 7.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5 12 12l8-4.5M12 12v9"/>',
  egyeb: '<circle class="f" cx="6" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="18" cy="12" r="2"/>',
};

export const PIKTOGRAM_TERMEK: Readonly<Record<ShopProductId, string>> = {
  molino: '<rect class="f" x="2" y="6" width="20" height="11"/><path class="m" d="M4.5 8.5h.01M12 8.5h.01M19.5 8.5h.01M4.5 14.5h.01M12 14.5h.01M19.5 14.5h.01"/>',
  rollup: '<rect class="f" x="8" y="2" width="8" height="16"/><path d="M6 18h12v2H6zM9 20l-2 2M15 20l2 2"/>',
  matrica: '<path class="f" d="M4 4h16v10l-6 6H4z"/><path d="M20 14h-6v6"/>',
  plakat: '<rect class="f" x="6" y="2" width="12" height="17"/><path d="M8.5 6h7M8.5 9h4M8.5 15h7"/><path class="m" d="M6 22h12M6 21v2M18 21v2"/>',
  tabla: '<rect class="f" x="3" y="6" width="18" height="12"/><path class="m" d="M5.5 8.5h.01M18.5 8.5h.01M5.5 15.5h.01M18.5 15.5h.01"/>',
  vaszonkep: '<rect x="4" y="4" width="16" height="16"/><path class="f" d="M4 17l5-6 4 4 3-3 4 5v3H4z"/><path class="m" d="M20 4l2 2v16l-2-2"/>',
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/tablo/grafika/piktogramok.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Stílus és komponens**

`src/tablo/grafika/piktogram.css` (globális, mert a `set:html`-lel beszúrt elemekre a scoped stílus nem hat):

```css
/* G2 pictograms: one geometry, three styles. Measuring details (class "m") take the measure color. */

.tb-pk {
  flex: none;
  color: var(--color-text);
}

.tb-pk * {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.tb-pk .m {
  stroke: var(--color-measure);
}

.tb-pk--kitoltott .f {
  fill: color-mix(in oklab, var(--color-brand) 32%, transparent);
}

.tb-pk--tervrajz {
  color: var(--color-measure);
  background-image:
    linear-gradient(color-mix(in oklab, var(--color-line) 70%, transparent) 1px, transparent 1px),
    linear-gradient(90deg, color-mix(in oklab, var(--color-line) 70%, transparent) 1px, transparent 1px);
  background-size: calc(100% / 6) calc(100% / 6);
}

.tb-pk--tervrajz * {
  stroke-width: 1;
}

.tb-pk--tervrajz .f {
  stroke-dasharray: 2 1.5;
}
```

`src/tablo/grafika/Piktogram.astro`:

```astro
---
// One pictogram of the G2 family on its 24×24 grid, in one of the three styles.
import type { PiktogramStilus } from './piktogramok';
import './piktogram.css';

interface Props {
  markup: string;
  label: string;
  stilus?: PiktogramStilus;
  size?: number;
  /** The name is printed next to it: hide the drawing from screen readers. */
  decorative?: boolean;
}

const { markup, label, stilus = 'vonal', size = 48, decorative = false } = Astro.props;
---

{
  decorative ? (
    <svg class:list={['tb-pk', `tb-pk--${stilus}`]} viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" set:html={markup} />
  ) : (
    <svg class:list={['tb-pk', `tb-pk--${stilus}`]} viewBox="0 0 24 24" width={size} height={size} role="img" aria-label={label} set:html={markup} />
  )
}
```

- [ ] **Step 6: A G2 változat**

`src/tablo/grafika/G2Piktogramok.astro`:

```astro
---
// G2: the pictogram family for service groups, quote types and shop products, in three styles and at 24 px.
import { QUOTE_TYPES, SERVICE_GROUPS, SHOP_PRODUCT_IDS, SHOP_PRODUCTS } from '@/domain/catalog';
import Piktogram from './Piktogram.astro';
import { PIKTOGRAM_CSOPORT, PIKTOGRAM_MUNKA, PIKTOGRAM_STILUSOK, PIKTOGRAM_TERMEK } from './piktogramok';

const sorok = [
  { cim: 'Szolgáltatáscsoportok', elemek: SERVICE_GROUPS.map((g) => ({ nev: g.name, markup: PIKTOGRAM_CSOPORT[g.slug] })) },
  { cim: 'Egyedi munkák', elemek: QUOTE_TYPES.map((t) => ({ nev: t.name, markup: PIKTOGRAM_MUNKA[t.id] })) },
  { cim: 'Webshop-termékek', elemek: SHOP_PRODUCT_IDS.map((id) => ({ nev: SHOP_PRODUCTS[id].name, markup: PIKTOGRAM_TERMEK[id] })) },
];
const mind = sorok.flatMap((s) => s.elemek);
---

<div class="g2">
  {
    PIKTOGRAM_STILUSOK.map((s) => (
      <section class="g2-style" aria-labelledby={`g2-${s.id}`}>
        <h4 id={`g2-${s.id}`}>{s.label}</h4>
        {sorok.map((sor) => (
          <div class="g2-row">
            <p class="g2-row__title">{sor.cim}</p>
            <ul class="g2-grid">
              {sor.elemek.map((e) => (
                <li>
                  <Piktogram markup={e.markup} label={e.nev} stilus={s.id} decorative />
                  <span>{e.nev}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    ))
  }
  <section class="g2-style" aria-labelledby="g2-kicsi">
    <h4 id="g2-kicsi">Kis méretben (24 px)</h4>
    <ul class="g2-strip">
      {
        mind.map((e) => (
          <li>
            <Piktogram markup={e.markup} label={e.nev} size={24} />
          </li>
        ))
      }
    </ul>
  </section>
</div>

<style>
  .g2 {
    display: grid;
    gap: var(--space-7);
  }

  .g2-style {
    display: grid;
    gap: var(--space-4);
  }

  .g2-style h4 {
    margin: 0;
    font-size: var(--text-md);
    font-weight: var(--weight-semibold);
  }

  .g2-row {
    display: grid;
    gap: var(--space-2);
  }

  .g2-row__title {
    margin: 0;
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-caps);
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .g2-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(7.5rem, 1fr));
    gap: var(--space-4);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .g2-grid li {
    display: grid;
    justify-items: start;
    gap: var(--space-2);
    font-size: var(--text-sm);
  }

  .g2-strip {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
    margin: 0;
    padding: 0;
    list-style: none;
  }
</style>
```

- [ ] **Step 7: Bekötés**

`src/tablo/variants.ts`: G2 → `status: 'kesz'`.
`src/tablo/Variant.astro`: a frontmatterbe `import G2Piktogramok from './grafika/G2Piktogramok.astro';`, a sablonba a G3 sor elé `{id === 'G2' && <G2Piktogramok />}`.

- [ ] **Step 8: Ellenőrzés**

Run: `npm test && npm run check`
Expected: zöld. A dev szerveren a G2 keretben 3 stílus × 19 piktogram és a 24 px-es sáv látszik; képernyőolvasó a kis sávban a neveket olvassa fel.

- [ ] **Step 9: Commit**

```bash
git add src/tablo/grafika src/tablo/variants.ts src/tablo/Variant.astro
git -c user.name=Claude -c user.email=noreply@anthropic.com commit -m "Add G2, one pictogram family in three styles, to the board" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: G1 – referencia-jelenetek

**Files:**
- Create: `src/tablo/grafika/jelenet-lista.ts`, `src/tablo/grafika/jelenet-lista.test.ts`, `src/tablo/grafika/jelenet.css`, `src/tablo/grafika/Jelenet.astro`, `src/tablo/grafika/Alak.astro`, `src/tablo/grafika/Meretvonal.astro`, `src/tablo/grafika/jelenetek/{KirakatEjjel,Kisbusz,Rollup,Fotofal,Ledfal,Uvegfolia,Kinalopult,Betuk3d}.astro`, `src/tablo/grafika/G1Jelenetek.astro`
- Modify: `src/tablo/variants.ts` (G1 `status: 'kesz'`), `src/tablo/Variant.astro`

**Interfaces:**
- Produces: `type JelenetId`; `interface JelenetInfo { id; name; desc; night; file }`; `JELENETEK: readonly JelenetInfo[]`; `Jelenet` (`info: JelenetInfo`, a jelenet SVG-elemei a slotba; `data-mode="nappal" | "ejjel"`, `data-night`); `Alak` (`x`, `ground?`: 180 cm-es alak); `Meretvonal` (`x1, y1, x2, y2, label`: méretvonal SVG-n belül). Lépték: 1 egység = 2 cm, a talaj `y = 270`, a nézet `480 × 300`. A 2–4. kör (H1, SZ3, F3, R-csoport) ezeket használja.

- [ ] **Step 1: Write the failing test**

`src/tablo/grafika/jelenet-lista.test.ts`:

```ts
import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { JELENETEK } from './jelenet-lista';

describe('the reference placeholder scenes', () => {
  it('are the eight scenes of the brief, each with a unique id, name and component', () => {
    expect(JELENETEK.map((j) => j.id)).toEqual([
      'kirakat-ejjel',
      'kisbusz',
      'rollup',
      'fotofal',
      'ledfal',
      'uvegfolia',
      'kinalopult',
      'betuk-3d',
    ]);
    expect(new Set(JELENETEK.map((j) => j.name)).size).toBe(8);
    for (const j of JELENETEK) expect(fs.existsSync(`src/tablo/grafika/jelenetek/${j.file}`), j.file).toBe(true);
  });

  it('describe what they show, and give a night view only to lit work', () => {
    for (const j of JELENETEK) expect(j.desc.length, j.id).toBeGreaterThan(30);
    expect(JELENETEK.filter((j) => j.night).map((j) => j.id)).toEqual(['kirakat-ejjel', 'ledfal', 'uvegfolia']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tablo/grafika/jelenet-lista.test.ts`
Expected: FAIL – `Failed to resolve import "./jelenet-lista"`.

- [ ] **Step 3: A jelenetlista**

`src/tablo/grafika/jelenet-lista.ts`:

```ts
// The illustrated reference placeholders (G1), from docs/brief.md ch. 7. One scale for all of them: 1 unit = 2 cm,
// so the 180 cm figure is the same size in every scene. Real portfolio photos replace them on the live site.

export type JelenetId = 'kirakat-ejjel' | 'kisbusz' | 'rollup' | 'fotofal' | 'ledfal' | 'uvegfolia' | 'kinalopult' | 'betuk-3d';

export interface JelenetInfo {
  readonly id: JelenetId;
  readonly name: string;
  /** Text alternative: what the illustration shows. */
  readonly desc: string;
  /** Lit work: the scene has a night view. */
  readonly night: boolean;
  /** Component file in src/tablo/grafika/jelenetek/. */
  readonly file: string;
}

export const JELENETEK: readonly JelenetInfo[] = [
  {
    id: 'kirakat-ejjel', name: 'Kirakat világító betűkkel', night: true, file: 'KirakatEjjel.astro',
    desc: 'Üzletportál fölött 4200 mm széles cégértábla világító betűkkel, alatta kirakat és bejárat, a járdán egy 180 cm magas alak.',
  },
  {
    id: 'kisbusz', name: 'Fóliázott kisbusz', night: false, file: 'Kisbusz.astro',
    desc: 'Oldalnézetből egy kisbusz, az oldalán átlós dekorcsík és feliratsáv, mellette egy 180 cm magas alak.',
  },
  {
    id: 'rollup', name: 'Roll-upok rendezvényen', night: false, file: 'Rollup.astro',
    desc: 'Két 85×200 cm-es roll-up egymás mellett méretvonalakkal, mellettük egy 180 cm magas alak.',
  },
  {
    id: 'fotofal', name: 'Fotófal', night: false, file: 'Fotofal.astro',
    desc: 'Mintás, 300×220 cm-es fotófal, előtte két 180 cm magas alak.',
  },
  {
    id: 'ledfal', name: 'LED-fal színpadon', night: true, file: 'Ledfal.astro',
    desc: 'Színpad fölött 500×300 cm-es, panelekből álló LED-fal, a színpadon egy 180 cm magas alak.',
  },
  {
    id: 'uvegfolia', name: 'Homokfúvott hatású üvegfólia', night: true, file: 'Uvegfolia.astro',
    desc: 'Irodai üvegfal, rajta homokfúvott hatású fóliasáv kivágott felirattal, mellette egy 180 cm magas alak.',
  },
  {
    id: 'kinalopult', name: 'Fóliázott kínálópult', night: false, file: 'Kinalopult.astro',
    desc: 'Kínálópult fóliázott előlappal, mögötte polcok és egy 180 cm magas alak.',
  },
  {
    id: 'betuk-3d', name: '3D nyomtatott betűk', night: false, file: 'Betuk3d.astro',
    desc: 'Recepciós pult fölött a falon 60 cm magas, térhatású betűk, mellettük egy 180 cm magas alak.',
  },
];
```

- [ ] **Step 4: A jelenetek közös elemei**

`src/tablo/grafika/jelenet.css` (globális, mert a jelenetfájlok elemei nem a `Jelenet.astro` scope-jába tartoznak):

```css
/* G1 reference-placeholder scenes. Colors come from the tokens; the night view lights the brand color. */

.tb-scene {
  --sc-sky: var(--color-surface);
  --sc-wall: var(--color-surface-raised);
  --sc-line: var(--color-line);
  --sc-ink: var(--color-text-muted);
  --sc-glass: color-mix(in oklab, var(--color-text) 12%, var(--sc-wall));
  --sc-frost: color-mix(in oklab, var(--color-text) 30%, var(--sc-wall));
  --sc-room: var(--sc-glass);
  --sc-led: color-mix(in oklab, var(--color-text) 8%, var(--sc-wall));
  --sc-light: color-mix(in oklab, var(--color-brand) 45%, var(--sc-wall));
  display: grid;
  gap: var(--space-2);
  margin: 0;
}

.tb-scene[data-mode='ejjel'] {
  --sc-sky: var(--color-bg);
  --sc-wall: color-mix(in oklab, var(--color-surface) 55%, var(--color-bg));
  --sc-room: color-mix(in oklab, var(--color-text) 22%, var(--color-bg));
  --sc-led: color-mix(in oklab, var(--color-brand) 70%, var(--color-bg));
  --sc-light: var(--color-brand);
}

.tb-scene__svg {
  display: block;
  width: 100%;
  height: auto;
  border-radius: var(--radius-md);
}

.tb-scene__svg * {
  transition:
    fill var(--motion-duration-slow) var(--motion-easing-standard),
    opacity var(--motion-duration-slow) var(--motion-easing-standard);
}

.sc-sky { fill: var(--sc-sky); }
.sc-wall { fill: var(--sc-wall); }
.sc-glass { fill: var(--sc-glass); }
.sc-room { fill: var(--sc-room); }
.sc-frost { fill: var(--sc-frost); }
.sc-led { fill: var(--sc-led); }
.sc-light { fill: var(--sc-light); }
.sc-ink { fill: var(--sc-ink); }
.sc-line { fill: none; stroke: var(--sc-line); stroke-width: 1.5; }
.sc-edge { fill: none; stroke: var(--sc-ink); stroke-width: 1.5; }
.sc-ground { stroke: var(--sc-ink); stroke-width: 2; }

.sc-text,
.sc-depth,
.sc-cut {
  font-family: var(--font-display);
  font-weight: var(--weight-display);
}

.sc-text { fill: var(--sc-light); }
.sc-depth { fill: var(--sc-ink); }
.sc-cut { fill: var(--sc-room); }

.sc-label {
  fill: var(--color-text);
  font-family: var(--font-mono);
  font-size: 10px;
}

.sc-measure {
  fill: none;
  stroke: var(--color-measure);
  stroke-width: 1;
}

.sc-measure-text {
  fill: var(--color-measure);
  font-family: var(--font-mono);
  font-size: 9px;
  text-anchor: middle;
}

.sc-spill {
  fill: var(--color-brand);
  opacity: 0;
}

.tb-scene[data-mode='ejjel'] .sc-spill {
  opacity: 0.18;
}

.tb-scene[data-mode='ejjel'] .sc-glow {
  filter: drop-shadow(0 0 3px var(--color-brand)) drop-shadow(0 0 10px var(--color-brand));
}

.tb-scene figcaption {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.tb-scene__ph {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-measure);
}
```

`src/tablo/grafika/Jelenet.astro`:

```astro
---
// Frame of a G1 scene: the SVG (480×300, 1 unit = 2 cm, ground at y = 270), its text alternative and caption.
import type { JelenetInfo } from './jelenet-lista';
import './jelenet.css';

interface Props {
  info: JelenetInfo;
}

const { info } = Astro.props;
const titleId = `sc-${info.id}-t`;
const descId = `sc-${info.id}-d`;
---

<figure class="tb-scene" data-mode="nappal" data-night={String(info.night)}>
  <svg class="tb-scene__svg" viewBox="0 0 480 300" role="img" aria-labelledby={`${titleId} ${descId}`}>
    <title id={titleId}>{info.name}</title>
    <desc id={descId}>{`Illusztráció, a referenciakép helye. ${info.desc}`}</desc>
    <rect class="sc-sky" width="480" height="300"></rect>
    <slot />
    <path class="sc-ground" d="M0 270H480"></path>
  </svg>
  <figcaption><span class="tb-scene__ph">Referenciakép helye</span><span>{info.name}</span></figcaption>
</figure>
```

`src/tablo/grafika/Alak.astro`:

```astro
---
// A 180 cm standing figure for scale (1 unit = 2 cm), feet on the ground line.
interface Props {
  x: number;
  ground?: number;
}

const { x, ground = 270 } = Astro.props;
---

<g class="sc-ink" transform={`translate(${x} ${ground})`} aria-hidden="true">
  <circle cx="0" cy="-83" r="6"></circle>
  <path d="M-8 -75H8L11 -45H7L5 -51V0H1L0 -38L-1 0H-5V-51L-7 -45H-11Z"></path>
</g>
```

`src/tablo/grafika/Meretvonal.astro`:

```astro
---
// A dimension line inside a scene SVG: the line, end ticks and the size, in the measure color.
interface Props {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
}

const { x1, y1, x2, y2, label } = Astro.props;
const vertical = x1 === x2;
const t = 5;
const ends = vertical ? `M${x1 - t} ${y1}h${2 * t}M${x2 - t} ${y2}h${2 * t}` : `M${x1} ${y1 - t}v${2 * t}M${x2} ${y2 - t}v${2 * t}`;
const midX = (x1 + x2) / 2;
const midY = (y1 + y2) / 2;
---

<g aria-hidden="true">
  <path class="sc-measure" d={`M${x1} ${y1}L${x2} ${y2}${ends}`}></path>
  {
    vertical ? (
      <text class="sc-measure-text" x={x1 - 8} y={midY} transform={`rotate(-90 ${x1 - 8} ${midY})`}>
        {label}
      </text>
    ) : (
      <text class="sc-measure-text" x={midX} y={y1 - 4}>
        {label}
      </text>
    )
  }
</g>
```

- [ ] **Step 5: A nyolc jelenet**

Minden jelenetfájl ugyanezzel a frontmatterrel kezdődik; a `Meretvonal` importja csak ott kell, ahol használjuk (`Uvegfolia.astro`-ban nincs):

```astro
---
import Alak from '../Alak.astro';
import Jelenet from '../Jelenet.astro';
import Meretvonal from '../Meretvonal.astro';
import type { JelenetInfo } from '../jelenet-lista';

interface Props {
  info: JelenetInfo;
}

const { info } = Astro.props;
---
```

`src/tablo/grafika/jelenetek/KirakatEjjel.astro` (a frontmatter után):

```astro
<Jelenet info={info}>
  <rect class="sc-wall" x="30" y="30" width="420" height="240"></rect>
  <ellipse class="sc-spill" cx="240" cy="110" rx="190" ry="70"></ellipse>
  <rect class="sc-edge" x="135" y="62" width="210" height="44"></rect>
  <text class="sc-text sc-glow" x="240" y="94" font-size="26" text-anchor="middle" textLength="180" lengthAdjust="spacingAndGlyphs">STILET DEKOR</text>
  <Meretvonal x1={135} y1={50} x2={345} y2={50} label="4 200 mm" />
  <rect class="sc-room" x="60" y="130" width="200" height="132"></rect>
  <path class="sc-edge" d="M60 130h200v132H60zM160 130v132"></path>
  <rect class="sc-room" x="290" y="138" width="64" height="132"></rect>
  <path class="sc-edge" d="M290 138h64v132H290z"></path>
  <circle class="sc-ink" cx="346" cy="206" r="2.5"></circle>
  <Alak x={405} />
</Jelenet>
```

`src/tablo/grafika/jelenetek/Kisbusz.astro`:

```astro
<Jelenet info={info}>
  <path class="sc-wall" d="M70 255V172Q70 165 77 165H262L300 205L330 212V255Z"></path>
  <path class="sc-light" d="M70 238L190 165H232L112 255H70Z"></path>
  <path class="sc-glass" d="M266 172H284L298 202H266Z"></path>
  <path class="sc-line" d="M118 168v86M262 165v90"></path>
  <path class="sc-edge" d="M70 255V172Q70 165 77 165H262L300 205L330 212V255Z"></path>
  <text class="sc-label" x="196" y="232" text-anchor="middle">[felirat]</text>
  <circle class="sc-ink" cx="120" cy="255" r="15"></circle>
  <circle class="sc-wall" cx="120" cy="255" r="6"></circle>
  <circle class="sc-ink" cx="285" cy="255" r="15"></circle>
  <circle class="sc-wall" cx="285" cy="255" r="6"></circle>
  <Meretvonal x1={70} y1={148} x2={330} y2={148} label="≈ 5 200 mm (példa)" />
  <Alak x={405} />
</Jelenet>
```

`src/tablo/grafika/jelenetek/Rollup.astro`:

```astro
<Jelenet info={info}>
  <rect class="sc-wall" x="0" y="60" width="480" height="210"></rect>
  <rect class="sc-glass" x="150" y="162" width="42.5" height="100"></rect>
  <rect class="sc-light" x="150" y="162" width="42.5" height="34"></rect>
  <path class="sc-line" d="M156 212h30M156 220h22M156 228h26"></path>
  <rect class="sc-edge" x="150" y="162" width="42.5" height="100"></rect>
  <rect class="sc-ink" x="146" y="262" width="50.5" height="8" rx="2"></rect>
  <rect class="sc-glass" x="230" y="162" width="42.5" height="100"></rect>
  <rect class="sc-light" x="230" y="228" width="42.5" height="34"></rect>
  <path class="sc-line" d="M236 176h30M236 184h22M236 192h26"></path>
  <rect class="sc-edge" x="230" y="162" width="42.5" height="100"></rect>
  <rect class="sc-ink" x="226" y="262" width="50.5" height="8" rx="2"></rect>
  <Meretvonal x1={136} y1={162} x2={136} y2={262} label="2 000 mm" />
  <Meretvonal x1={150} y1={150} x2={192.5} y2={150} label="850 mm" />
  <Alak x={330} />
</Jelenet>
```

`src/tablo/grafika/jelenetek/Fotofal.astro`:

```astro
<Jelenet info={info}>
  <defs>
    <pattern id="sc-fotofal-minta" width="25" height="25" patternUnits="userSpaceOnUse">
      <path class="sc-light" d="M12.5 6 19 12.5 12.5 19 6 12.5Z"></path>
    </pattern>
  </defs>
  <rect class="sc-wall" x="165" y="160" width="150" height="110"></rect>
  <rect x="165" y="160" width="150" height="110" fill="url(#sc-fotofal-minta)"></rect>
  <rect class="sc-edge" x="165" y="160" width="150" height="110"></rect>
  <Meretvonal x1={165} y1={148} x2={315} y2={148} label="3 000 mm" />
  <Meretvonal x1={336} y1={160} x2={336} y2={270} label="2 200 mm" />
  <Alak x={215} />
  <Alak x={262} />
</Jelenet>
```

`src/tablo/grafika/jelenetek/Ledfal.astro`:

```astro
<Jelenet info={info}>
  <rect class="sc-wall" x="0" y="40" width="480" height="230"></rect>
  <rect class="sc-led sc-glow" x="115" y="80" width="250" height="150"></rect>
  <path class="sc-line" d="M140 80v150M165 80v150M190 80v150M215 80v150M240 80v150M265 80v150M290 80v150M315 80v150M340 80v150M115 105h250M115 130h250M115 155h250M115 180h250M115 205h250"></path>
  <rect class="sc-edge" x="115" y="80" width="250" height="150"></rect>
  <rect class="sc-ink" x="60" y="240" width="360" height="30"></rect>
  <Meretvonal x1={115} y1={66} x2={365} y2={66} label="5 000 mm" />
  <Alak x={335} ground={240} />
</Jelenet>
```

`src/tablo/grafika/jelenetek/Uvegfolia.astro` (frontmatter `Meretvonal` import nélkül):

```astro
<Jelenet info={info}>
  <rect class="sc-wall" x="0" y="30" width="480" height="240"></rect>
  <rect class="sc-room" x="60" y="60" width="360" height="210"></rect>
  <rect class="sc-frost" x="60" y="140" width="360" height="56"></rect>
  <text class="sc-cut" x="240" y="178" font-size="26" text-anchor="middle" textLength="200" lengthAdjust="spacingAndGlyphs">STILET DEKOR</text>
  <path class="sc-edge" d="M60 60h360v210H60zM180 60v210M300 60v210"></path>
  <Alak x={448} />
</Jelenet>
```

`src/tablo/grafika/jelenetek/Kinalopult.astro`:

```astro
<Jelenet info={info}>
  <rect class="sc-wall" x="0" y="30" width="480" height="240"></rect>
  <path class="sc-line" d="M90 92h300M90 132h300"></path>
  <rect class="sc-ink" x="104" y="74" width="22" height="18"></rect>
  <rect class="sc-ink" x="134" y="80" width="16" height="12"></rect>
  <rect class="sc-ink" x="300" y="114" width="26" height="18"></rect>
  <rect class="sc-ink" x="334" y="120" width="14" height="12"></rect>
  <Alak x={240} />
  <rect class="sc-wall" x="150" y="220" width="180" height="50"></rect>
  <rect class="sc-light" x="150" y="226" width="180" height="44"></rect>
  <path class="sc-line" d="M150 252h180"></path>
  <rect class="sc-ink" x="144" y="216" width="192" height="8"></rect>
  <text class="sc-label" x="240" y="244" text-anchor="middle">[grafika]</text>
  <Meretvonal x1={150} y1={290} x2={330} y2={290} label="3 600 mm (példa)" />
</Jelenet>
```

`src/tablo/grafika/jelenetek/Betuk3d.astro`:

```astro
<Jelenet info={info}>
  <rect class="sc-wall" x="0" y="30" width="480" height="240"></rect>
  <text class="sc-depth" x="243" y="153" font-size="40" text-anchor="middle" textLength="220" lengthAdjust="spacingAndGlyphs">DEKOR</text>
  <text class="sc-text" x="240" y="150" font-size="40" text-anchor="middle" textLength="220" lengthAdjust="spacingAndGlyphs">DEKOR</text>
  <Meretvonal x1={116} y1={121} x2={116} y2={151} label="600 mm" />
  <rect class="sc-ink" x="150" y="215" width="180" height="8"></rect>
  <rect class="sc-glass" x="156" y="223" width="168" height="47"></rect>
  <rect class="sc-edge" x="156" y="223" width="168" height="47"></rect>
  <Alak x={392} />
</Jelenet>
```

- [ ] **Step 6: A G1 változat**

`src/tablo/grafika/G1Jelenetek.astro`:

```astro
---
// G1: the eight reference placeholders in one style and one scale, with a day/night switch for lit work.
import { JELENETEK, type JelenetId } from './jelenet-lista';
import Betuk3d from './jelenetek/Betuk3d.astro';
import Fotofal from './jelenetek/Fotofal.astro';
import Kinalopult from './jelenetek/Kinalopult.astro';
import KirakatEjjel from './jelenetek/KirakatEjjel.astro';
import Kisbusz from './jelenetek/Kisbusz.astro';
import Ledfal from './jelenetek/Ledfal.astro';
import Rollup from './jelenetek/Rollup.astro';
import Uvegfolia from './jelenetek/Uvegfolia.astro';

const SCENES = {
  'kirakat-ejjel': KirakatEjjel,
  kisbusz: Kisbusz,
  rollup: Rollup,
  fotofal: Fotofal,
  ledfal: Ledfal,
  uvegfolia: Uvegfolia,
  kinalopult: Kinalopult,
  'betuk-3d': Betuk3d,
} satisfies Record<JelenetId, unknown>;
---

<div class="g1">
  <div class="g1__bar">
    <div class="g1__seg" role="group" aria-label="Napszak">
      <button type="button" data-mode="nappal" aria-pressed="true">Nappal</button>
      <button type="button" data-mode="ejjel" aria-pressed="false">Éjjel</button>
    </div>
    <p class="g1__note">Egy lépték minden jeleneten: a 180 cm-es alak mindenhol ugyanakkora. A méretek példák. Éjjel csak a világító munkák változnak.</p>
  </div>
  <div class="g1__grid">
    {
      JELENETEK.map((j) => {
        const Scene = SCENES[j.id];
        return <Scene info={j} />;
      })
    }
  </div>
</div>

<script>
  // Day/night switch: changes only the scenes that have a night view.
  for (const root of document.querySelectorAll<HTMLElement>('.g1')) {
    root.querySelector('.g1__seg')?.addEventListener('click', (event) => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-mode]');
      if (!button) return;
      for (const b of root.querySelectorAll('.g1__seg button')) b.setAttribute('aria-pressed', String(b === button));
      for (const scene of root.querySelectorAll<HTMLElement>('.tb-scene[data-night="true"]')) {
        scene.dataset.mode = button.dataset.mode;
      }
    });
  }
</script>

<style>
  .g1 {
    display: grid;
    gap: var(--space-5);
  }

  .g1__bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-3) var(--space-5);
  }

  .g1__seg {
    display: inline-flex;
    overflow: hidden;
    border: 1px solid var(--color-line);
    border-radius: var(--radius-pill);
  }

  .g1__seg button {
    padding: var(--space-2) var(--space-4);
    border: 0;
    background: transparent;
    color: var(--color-text);
    font: inherit;
    font-size: var(--text-sm);
    cursor: pointer;
  }

  .g1__seg button[aria-pressed='true'] {
    background: var(--color-brand);
    color: var(--color-on-brand);
  }

  .g1__note {
    max-width: 60ch;
    margin: 0;
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }

  .g1__grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-6);
  }

  @container variant (min-width: 760px) {
    .g1__grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
```

- [ ] **Step 7: Bekötés**

`src/tablo/variants.ts`: G1 → `status: 'kesz'`.
`src/tablo/Variant.astro`: `import G1Jelenetek from './grafika/G1Jelenetek.astro';` és a sablon elejére `{id === 'G1' && <G1Jelenetek />}`.

- [ ] **Step 8: Run tests to verify they pass**

Run: `npx vitest run src/tablo`
Expected: PASS (a jelenetlista 2 tesztje is).

- [ ] **Step 9: Ellenőrzés**

Run: `npm run check`
Expected: 0 hiba. A dev szerveren a G1 keretben 8 jelenet; az „Éjjel” gomb csak a kirakatot, a LED-falat és az üvegfóliát váltja; mindkét irányban olvasható; 390 px-en egy hasáb.

- [ ] **Step 10: Commit**

```bash
git add src/tablo/grafika src/tablo/variants.ts src/tablo/Variant.astro
git -c user.name=Claude -c user.email=noreply@anthropic.com commit -m "Add G1, eight reference placeholder scenes in one scale, to the board" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: G4 – szómárka-változatok

**Files:**
- Create: `src/tablo/grafika/szomarka.ts`, `src/tablo/grafika/szomarka.test.ts`, `src/tablo/grafika/szomarka.css`, `src/tablo/grafika/Szomarka.astro`, `src/tablo/grafika/G4Szomarka.astro`
- Modify: `src/tablo/variants.ts` (G4 `status: 'kesz'`), `src/tablo/Variant.astro`

**Interfaces:**
- Produces: `type SzomarkaValtozat = 'vagott' | 'meretvonal' | 'neon' | 'illesztojel' | 'monogram'`; `SZOMARKAK: readonly { id; nev; leiras }[]`; `Szomarka` (`valtozat`, `uid`: egyedi az oldalon, `alap?: 'sotet' | 'marka'`, `size?`: csak a monogramnál, px).

- [ ] **Step 1: Write the failing test**

`src/tablo/grafika/szomarka.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { SZOMARKAK } from './szomarka';

describe('the wordmark variants', () => {
  it('are the five directions of the spec, each named and described', () => {
    expect(SZOMARKAK.map((s) => s.id)).toEqual(['vagott', 'meretvonal', 'neon', 'illesztojel', 'monogram']);
    for (const s of SZOMARKAK) {
      expect(s.nev, s.id).toBeTruthy();
      expect(s.leiras.length, s.id).toBeGreaterThan(20);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tablo/grafika/szomarka.test.ts`
Expected: FAIL – `Failed to resolve import "./szomarka"`.

- [ ] **Step 3: Write the implementation**

`src/tablo/grafika/szomarka.ts`:

```ts
// The wordmark directions of G4: the typographic sign "STILET DEKOR" until the logo exists.

export type SzomarkaValtozat = 'vagott' | 'meretvonal' | 'neon' | 'illesztojel' | 'monogram';

export const SZOMARKAK: readonly { readonly id: SzomarkaValtozat; readonly nev: string; readonly leiras: string }[] = [
  { id: 'vagott', nev: 'Vágott fólia', leiras: 'A betűk közepén vágásvonal, az alsó fél kissé elcsúszva, mint a plotteren vágott, lehúzott fólia.' },
  { id: 'meretvonal', nev: 'Méretvonallal', leiras: 'A jel fölött méretvonal M 1:1 jelöléssel: a pontos mérés ígérete.' },
  { id: 'neon', nev: 'Neoncső', leiras: 'Körvonalas betűk fénnyel, a világító reklám világa; rózsaszín alapon fény nélkül.' },
  { id: 'illesztojel', nev: 'Illesztőjellel', leiras: 'Kondenzált STILET, nyomdai illesztőjel, ritkított, írógépes DEKOR.' },
  { id: 'monogram', nev: 'SD monogram', leiras: 'Négyzetes SD jel vágójelekkel, faviconnak és kis helyekre.' },
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/tablo/grafika/szomarka.test.ts`
Expected: PASS.

- [ ] **Step 5: Stílus és komponens**

`src/tablo/grafika/szomarka.css`:

```css
/* G4 wordmarks. On the brand background everything turns to the on-brand color. */

.sm {
  --sm-ink: var(--color-text);
  --sm-accent: var(--color-brand);
  --sm-measure: var(--color-measure);
  display: block;
  width: 100%;
  max-width: 420px;
  height: auto;
}

.sm--marka {
  --sm-ink: var(--color-on-brand);
  --sm-accent: var(--color-on-brand);
  --sm-measure: var(--color-on-brand);
}

.sm text {
  fill: var(--sm-ink);
  font-family: var(--font-display);
  font-weight: var(--weight-display);
  font-size: 44px;
}

.sm .sm-accent { fill: var(--sm-accent); }

.sm-cut {
  stroke: var(--sm-measure);
  stroke-width: 1;
  stroke-dasharray: 4 3;
}

.sm-measure {
  fill: none;
  stroke: var(--sm-measure);
  stroke-width: 1;
}

.sm .sm-measure-label {
  fill: var(--sm-measure);
  font-family: var(--font-mono);
  font-weight: var(--weight-regular);
  font-size: 10px;
  text-anchor: middle;
  dominant-baseline: middle;
}

.sm .sm-neon {
  fill: none;
  stroke: var(--sm-accent);
  stroke-width: 1.6;
}

.sm--sotet .sm-neon {
  filter: drop-shadow(0 0 2px var(--sm-accent)) drop-shadow(0 0 8px var(--sm-accent));
}

.sm-reg * {
  fill: none;
  stroke: var(--sm-accent);
  stroke-width: 1.5;
}

.sm .sm-mono {
  font-family: var(--font-mono);
  font-weight: var(--weight-medium);
  font-size: 18px;
}

.sm--monogram {
  width: auto;
  max-width: none;
}

.sm-tile { fill: var(--color-brand); }
.sm .sm-gram { fill: var(--color-on-brand); font-size: 20px; }
.sm--marka .sm-tile { fill: var(--color-on-brand); }
.sm--marka .sm-gram { fill: var(--color-brand); }

.sm-cropmarks {
  fill: none;
  stroke: var(--sm-measure);
  stroke-width: 1;
}
```

`src/tablo/grafika/Szomarka.astro`:

```astro
---
// One G4 wordmark direction, drawn as SVG so it scales; `uid` keeps clip-path ids unique on the page.
import type { SzomarkaValtozat } from './szomarka';
import './szomarka.css';

interface Props {
  valtozat: SzomarkaValtozat;
  uid: string;
  alap?: 'sotet' | 'marka';
  /** Monogram only: rendered size in px (16, 32 … for the favicon test). */
  size?: number;
}

const { valtozat, uid, alap = 'sotet', size = 96 } = Astro.props;
const classes = ['sm', `sm--${alap}`, valtozat === 'monogram' && 'sm--monogram'];
---

{
  valtozat === 'monogram' ? (
    <svg class:list={classes} viewBox="0 0 48 48" width={size} height={size} role="img" aria-label="Stilet Dekor, SD monogram">
      <rect class="sm-tile" x="6" y="6" width="36" height="36"></rect>
      <text class="sm-gram" x="24" y="31" text-anchor="middle" textLength="24" lengthAdjust="spacingAndGlyphs">SD</text>
      <path class="sm-cropmarks" d="M6 0v3M0 6h3M42 0v3M45 6h3M6 45v3M0 42h3M42 45v3M45 42h3"></path>
    </svg>
  ) : (
    <svg class:list={classes} viewBox="0 0 360 80" role="img" aria-label="Stilet Dekor">
      {valtozat === 'vagott' && (
        <>
          <defs>
            <clipPath id={`${uid}-fent`}><rect x="0" y="0" width="360" height="39"></rect></clipPath>
            <clipPath id={`${uid}-lent`}><rect x="0" y="39" width="360" height="41"></rect></clipPath>
          </defs>
          <text x="20" y="56" textLength="320" lengthAdjust="spacingAndGlyphs" clip-path={`url(#${uid}-fent)`}>STILET DEKOR</text>
          <text class="sm-accent" x="23" y="57" textLength="320" lengthAdjust="spacingAndGlyphs" clip-path={`url(#${uid}-lent)`}>STILET DEKOR</text>
          <path class="sm-cut" d="M14 39H346"></path>
        </>
      )}
      {valtozat === 'meretvonal' && (
        <>
          <path class="sm-measure" d="M20 14v10M340 14v10M20 19H158M202 19H340"></path>
          <text class="sm-measure-label" x="180" y="19">M 1:1</text>
          <text x="20" y="66" textLength="320" lengthAdjust="spacingAndGlyphs">STILET DEKOR</text>
        </>
      )}
      {valtozat === 'neon' && (
        <text class="sm-neon" x="20" y="56" textLength="320" lengthAdjust="spacingAndGlyphs">STILET DEKOR</text>
      )}
      {valtozat === 'illesztojel' && (
        <>
          <text x="20" y="56" textLength="170" lengthAdjust="spacingAndGlyphs">STILET</text>
          <g class="sm-reg">
            <circle cx="214" cy="40" r="9"></circle>
            <path d="M214 24v32M198 40h32"></path>
          </g>
          <text class="sm-mono" x="242" y="47" textLength="98" lengthAdjust="spacing">DEKOR</text>
        </>
      )}
    </svg>
  )
}
```

- [ ] **Step 6: A G4 változat**

`src/tablo/grafika/G4Szomarka.astro`:

```astro
---
// G4: five wordmark directions on dark and on brand backgrounds, at header size, and the monogram as a favicon.
import Szomarka from './Szomarka.astro';
import { SZOMARKAK } from './szomarka';
---

<div class="g4">
  {
    SZOMARKAK.map((s) => (
      <section class="g4-item" aria-labelledby={`g4-${s.id}`}>
        <h4 id={`g4-${s.id}`}>{s.nev}</h4>
        <p class="g4-desc">{s.leiras}</p>
        <div class="g4-tiles">
          <div class="g4-tile g4-tile--sotet">
            <Szomarka valtozat={s.id} uid={`g4-${s.id}-sotet`} />
          </div>
          <div class="g4-tile g4-tile--marka">
            <Szomarka valtozat={s.id} uid={`g4-${s.id}-marka`} alap="marka" />
          </div>
        </div>
        {s.id === 'monogram' ? (
          <div class="g4-sizes">
            {[16, 32, 48].map((px) => (
              <figure>
                <Szomarka valtozat="monogram" uid={`g4-favicon-${px}`} size={px} />
                <figcaption>{px} px</figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <div class="g4-sizes">
            <figure class="g4-header">
              <Szomarka valtozat={s.id} uid={`g4-${s.id}-kicsi`} />
              <figcaption>Fejlécméret (140 px)</figcaption>
            </figure>
          </div>
        )}
      </section>
    ))
  }
</div>

<style>
  .g4 {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-7);
  }

  .g4-item {
    display: grid;
    gap: var(--space-3);
  }

  .g4-item h4 {
    margin: 0;
    font-size: var(--text-md);
    font-weight: var(--weight-semibold);
  }

  .g4-desc {
    max-width: 60ch;
    margin: 0;
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }

  .g4-tiles {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-3);
  }

  @container variant (min-width: 760px) {
    .g4-tiles {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  .g4-tile {
    display: grid;
    place-items: center;
    padding: var(--space-6) var(--space-4);
    border-radius: var(--radius-md);
  }

  .g4-tile--sotet {
    background: var(--color-bg);
    border: 1px solid var(--color-line);
  }

  .g4-tile--marka {
    background: var(--color-brand);
  }

  .g4-sizes {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    gap: var(--space-5);
  }

  .g4-sizes figure {
    display: grid;
    justify-items: start;
    gap: var(--space-1);
    margin: 0;
  }

  .g4-sizes figcaption {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .g4-header :global(.sm) {
    width: 140px;
  }
</style>
```

- [ ] **Step 7: Bekötés**

`src/tablo/variants.ts`: G4 → `status: 'kesz'`.
`src/tablo/Variant.astro`: `import G4Szomarka from './grafika/G4Szomarka.astro';` és a G3 sor után `{id === 'G4' && <G4Szomarka />}`.

- [ ] **Step 8: Ellenőrzés**

Run: `npm test && npm run check`
Expected: zöld. A dev szerveren mind az 5 jel látszik sötét és rózsaszín alapon; a vágott változat clip-path azonosítói csempénként különböznek; a monogram 16 px-en is felismerhető négyzet.

- [ ] **Step 9: Commit**

```bash
git add src/tablo/grafika src/tablo/variants.ts src/tablo/Variant.astro
git -c user.name=Claude -c user.email=noreply@anthropic.com commit -m "Add G4, five wordmark directions, to the board" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Az 1. kör átnézése és bemutatása

**Files:**
- Modify: a talált hibák szerint bármelyik, a 3–6. feladatban létrehozott fájl.

- [ ] **Step 1: Képernyőképek**

Indítsd a dev szervert a beépített böngészőben (`preview_start` a `dev` konfigurációval), nyisd meg a `http://localhost:4321/tablo#grafika` címet. Készíts képet a G1–G4 keretekről:
- 1440 px-en és mobilnézetben (`resize_window`, preset `mobile`);
- mindkét irányban (`?tema=neon-muhely`, `?tema=galeria-editorial`);
- a G1-nél éjjeli nézetben is.

A végén állítsd vissza a nézetet (`preset: desktop`).

- [ ] **Step 2: Kritika és hozzáférhetőség**

Futtasd a `design:design-critique`, a `design:accessibility-review` és a `web-design-guidelines` skillt a fenti képekre és a `src/tablo/` kódjára. Kötelezően ellenőrizd:
- nincs-e vízszintes görgetés 360 px-en;
- látszik-e a fókuszkeret a gombokon;
- elég-e a kontraszt a jelenetek feliratain (`sc-label`, `sc-measure-text`) és a G4 rózsaszín csempéin;
- érthető-e a jelenetek `<title>`/`<desc>` szövege;
- olvashatók-e a 24 px-es piktogramok;
- megmaradnak-e a Bodoni Moda vékony vonalai a szómárkákban (B irány).

- [ ] **Step 3: Javítás**

Minden talált hibát javíts a hozzá tartozó fájlban, majd futtasd: `npm test && npm run check && npm run build`
Expected: minden zöld.

- [ ] **Step 4: Commit (ha volt javítás)**

```bash
git add -A src/tablo
git -c user.name=Claude -c user.email=noreply@anthropic.com commit -m "Polish the first round of the board after review" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 5: Bemutatás**

Nyisd meg a felhasználónak a `/tablo#grafika` oldalt a beépített böngészőben. Írd meg magyarul:
- mi készült (G1–G4);
- hol éri el: `npm run dev` → http://localhost:4321/tablo, a B irány a `?tema=galeria-editorial` címen;
- kérd meg, hogy azonosítóval jelölje, mi tetszik és mi nem (pl. „G2 tervrajz, G4 vágott”).

A következő lépés a 2. kör (Hero) terve.
