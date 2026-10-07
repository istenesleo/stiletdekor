# Tabló: alternatív weblap-elemek és grafikák

Dátum: 2026-10-07 · Állapot: **jóváhagyott terv**, a megvalósítási terv (`writing-plans`) következik.

## Cél

A még nem kódolt P2 elemekből és a grafikákból **elemvariánsok tablója**: egy fejlesztői oldal, ahol elemenként
több, egymástól merőben eltérő, innovatív változat látszik egymás mellett. A felhasználó kiválasztja a
nyerteseket, és később megmutatja a megrendelőnek; a nyertesek egy külön lépésben kerülnek a végleges kódba.

**Döntések:**

| Kérdés | Döntés |
|---|---|
| Mi kerül a tablóra | Hero · Szolgáltatások + Folyamat · Referenciák · Grafikák és motívumok |
| Viszony a két irányhoz | Tokenes változatok A/B váltóval **és** szabad kísérletek külön, jelölt sávban |
| Ki dönt | A felhasználó; a megrendelőnek később mutatja meg |
| Technológia | Marad az Astro + TypeScript + Cloudflare (nem Python) |
| Forma | `/tablo` fejlesztői oldal a projektben |

## 1. A `/tablo` oldal

- **Cím, láthatóság:** `/tablo`, csak a dev oldalakon; élesben 404 (mint a `/komponensek`). Helyben:
  `npm run dev` → http://localhost:4321/tablo; B irány: `?tema=galeria-editorial`.
- **Felső sáv (tapadó):** A/B váltó (`?tema=neon-muhely` / `?tema=galeria-editorial`, a `Base` layout tölti a
  betűket és a `data-theme`-et), ugrómenü (Hero · Szolgáltatások és folyamat · Referenciák · Grafikák),
  jelmagyarázat (Tokenes / Kísérleti).
- **Változatkeret (`Frame.astro`):** azonosító és név; egymondatos ötlet és hogy miben új a mostani
  látványtervekhez képest; kísérletinél a megszegett szabály és a „token-javaslat” értékek; szélességváltó
  **390 px / teljes**. A változatok `container-type: inline-size` + container query alapján igazodnak a
  keretükhöz, így a mobilnézet az ablak átméretezése nélkül látszik.
- **Fájlok:**
  - `src/pages/tablo.astro`: az oldal (élesben 404).
  - `src/tablo/Frame.astro`: a változatkeret.
  - `src/tablo/variants.ts`: a változatok listája (azonosító, csoport, sáv, név, ötlet, újdonság, megszegett
    szabály); az oldal ebből épül.
  - `src/tablo/{hero,szolgaltatas,folyamat,referencia,grafika}/`: változatonként egy `.astro` fájl; az
    újrahasználható SVG-grafikák a `src/tablo/grafika/`-ban.
- **Adatok:** csak valós adat: `src/domain/company.ts`, a katalógus (`src/domain/catalog.ts`,
  `src/site/catalog-ui.ts`), az árazás és a határidő (`src/domain/pricing.ts`, `src/domain/leadtime.ts`), a
  szolgáltatások a `docs/brief.md` 3. fejezetéből. Referenciánál jelölt helyőrző: „Referenciakép helye”,
  `[ügyfél neve]`, `[méret]`, `[helyszín]`.
- **Interakciók:** kevés, sima JavaScript (Astro `<script>`), React csak ha egy változat valóban igényli.
- **Választás:** a chatben, azonosítóval (pl. „H2, SZ3, R1”). A nyertesek külön lépésben a `src/components/`-be
  (vagy ha interaktív komponens, a `src/ui/`-ba) kerülnek; a kísérleti nyertesek új értékei token-javaslatként a
  `design/tokens/`-be.

## 2. Hero

A mostani látványtervekben mindkét hero: cím („Kiszállunk, felmérjük, felszereljük.”), két belépő (Online
rendelés / Egyedi ajánlat), illusztrált cégér nappal/éjjel kapcsolóval.

| Az. | Sáv | Név | Ötlet |
|---|---|---|---|
| H1 | Tokenes | Gyártási rajz | A hero műhelyi gyártási rajz: a cím a „terv”, méretvonalak, M 1:10, rajzfej (Felület · Anyag · Méret · Helyszín); a két belépő a rajzfej sorai. Egyetlen mozgás: a méretvonalak egyszer felrajzolódnak. |
| H2 | Tokenes | Két ajtó | Két egyenrangú fél: Online rendelés (anyagminta, valós „-tól” bruttó ár) és Egyedi ajánlat (munkatípus-piktogramok); a cím átível. |
| H3 | Tokenes | Azonnali ár | Molinó-gyorskalkulátor: szélesség × magasság → bruttó ár és várható elkészülés a meglévő árazó és határidő-logikából; „Folytatás a webshopban”. |
| H4 | Tokenes | Anyagfal | Valós anyagminta-csempék (frontlit és hálós molinó, perforált fólia, plexi, dibond) textúrával és valós adatokkal (g/m², kül-/beltér); a cím rajta. |
| H-K1 | Kísérleti | Élő cégér | A látogató beírja a cégnevét, világító betűs cégérként látja nappal/éjjel, méretjelöléssel; innen „Világító betűk” ajánlatkérés a szöveggel kitöltve. Új fény- és perspektívaeffektek. |
| H-K2 | Kísérleti | Fóliafelhordás | Nagy, változó betűs cím; a „felszereljük” szót egy simítólapát húzza fel, mint a fóliát (az oldal megkomponált mozgása). Új betűtípus lehetséges. |

## 3. Szolgáltatások és folyamat

A mostani tervekben: a 4 szolgáltatáscsoport listája „Online ár” jelöléssel; a folyamat 4 számozott lépés.

| Az. | Sáv | Név | Ötlet |
|---|---|---|---|
| SZ1 | Tokenes | Mit szeretne dekorálni? | Belépés felület szerint (Autó · Kirakat és üveg · Homlokzat és cégér · Pult · Rendezvény · Nyomtatott termék); választás után a hozzá tartozó szolgáltatások, jelölve: online rendelhető vagy ajánlatra. |
| SZ2 | Tokenes | Azonnal rendelhető / Ajánlatra | Két sáv: a 6 webshop-termék valós bruttó „-tól” árral és 3 munkanapos gyártással; az egyedi munkák „Kérjen ajánlatot” gombbal. |
| SZ3 | Tokenes | Utcakép | Széles illusztrált utcarészlet (üzletportál cégérrel, fóliázott kisbusz, kirakat, rendezvénysátor) jelölőpontokkal; billentyűzettel és képernyőolvasóval sima listaként is bejárható. |
| SZ4 | Tokenes | Tárgymutató | Ábécérendes mutató az összes szolgáltatásról, gépelés közbeni szűréssel. |
| SZ-K1 | Kísérleti | Kérdezzen bátran | Nagy kereső-jellegű mező („Mit szeretne? Pl. feliratot a kisbuszra”); gépelés közben beépített szólistából javasol szolgáltatást és következő lépést. Nincs mögötte MI. |
| F1 | Tokenes | Ön és mi | Két párhuzamos sáv: lépésenként mit tesz a megrendelő és mit a műhely. |
| F2 | Tokenes | Vonalzó-idővonal | A 4 lépés egy hosszú méretvonalon, osztásokként; mobilon függőleges vonalzó. |
| F3 | Tokenes | Egy munka útja | Egy világító betűs cégér illusztrációja végigmegy a 4 lépésen: felmérési vázlat → vektoros terv → gyártás → felszerelve. |
| F4 | Tokenes | Két útvonal | A webshop-rendelés és az egyedi munka útja egymás mellett (`docs/brief.md` 10. fejezet); kiemelve, hogy az ellenőrzésre küldés még nem jár fizetési kötelezettséggel. |
| F-K1 | Kísérleti | Munkalap pecsétekkel | A folyamat műhelyi munkalap; görgetéskor egyszer lecsapódnak a pecsétek („Felmérve” · „Jóváhagyva” · „Legyártva” · „Felszerelve”). Új, pecsétszerű betű és textúra. |

## 4. Referenciák

A mostani tervekben: rács 6 munkával, aloldalon szűrőchipek, projektadatos képaláírás, előtte/utána csúszka.
Valós portfólióképek nincsenek, ezért minden változat jelölt helyőrzőkkel készül.

| Az. | Sáv | Név | Ötlet |
|---|---|---|---|
| R1 | Tokenes | Projektlap | Egyszerre egy munka teljes „munkalapon”: nagy kép, előtte/utána, méretvonal, anyagok, elvégzett lépések; lapozás és felület szerinti szűrés. |
| R2 | Tokenes | Térkép | Stilizált Budapest/Magyarország-térkép a munkák helyszínével, felület szerinti szűréssel; mellette sima lista. A jelölők helyőrzők. |
| R3 | Tokenes | Léptékfal | A munkák egymáshoz képest valós arányban a 180 cm-es sziluett mellett; a tablón a katalógus szabványos méretei „példa” jelöléssel. |
| R4 | Tokenes | Nagyító | Kör alakú „lencse” a csúszka helyett: ahol áll, ott az „utána” látszik; nyilakkal mozgatható; világító munkáknál nappal/éjjel váltás. |
| R-K1 | Kísérleti | Mintalegyező | A referenciák egy színmintalegyező lapjai, szétnyitható és forgatható; billentyűzettel és listaként is. |
| R-K2 | Kísérleti | Éjszakai séta | Éjszakai mód: a rács elsötétül, csak a világító munkák fénylenek. |

## 5. Grafikák és motívumok

A színek tokenekből (`currentColor`, CSS-változók), így minden grafika vált A és B között.

| Az. | Sáv | Név | Tartalom |
|---|---|---|---|
| G1 | Tokenes | Referencia-jelenetek | A brief 8 illusztrált helyőrzője egységes stílusban, újrahasználható SVG-ként (éjszakai kirakat világító betűkkel, fóliázott kisbusz, roll-up rendezvényen, fotófal, LED-fal, homokfúvott hatású üvegfólia, kínálópult, 3D nyomtatott betűk); ahol értelmes, nappal/éjjel; „Referenciakép helye” jelöléssel. |
| G2 | Tokenes | Piktogramcsalád | Közös család a 4 szolgáltatáscsoporthoz, a 9 munkatípushoz és a 6 webshop-termékhez (a mostani `pictograms.ts`-ek helyett); 24 px-es rács, mérésre utaló részletek; három stílus: vonalas, kitöltött, tervrajzszerű. |
| G3 | Tokenes | Mérés-motívumok | cm-es vonalzó, méretvonal-változatok, szálkereszt és illesztőjel, vágóalátét-rács háttér, vágójeles képkeret; használati szabályokkal. |
| G4 | Tokenes | Szómárka-változatok | A `STILET DEKOR` jel 4–5 változata (sablonvágott, méretvonallal, neoncső-körvonallal, kondenzált illesztőjellel), fekete és rózsaszín alapon, 16 és 32 px-es favicon-méretben is. |
| G-K1 | Kísérleti | Neoncső-betűk | Neoncső-hatású betűrendszer címekhez (cső, fény, rögzítőkapocs, kábel); a H-K1 is ezt használja. |
| G-K2 | Kísérleti | Anyagtextúrák | Gépi SVG/CSS-textúrák: szálcsiszolt alu, homokfúvott üveg, hálós molinó, perforált fólia; a H4 és később az anyagkártyák használják. |

Összesen **28 változat**: Hero 6, Szolgáltatások 5, Folyamat 5, Referenciák 6, Grafikák 6.

## 6. Minőség és ellenőrzés

- **Szabályok:**
  - A tokenes sávban csak tokenek, minden rózsaszín a `--color-brand`-ből jön.
  - A kísérleti sáv saját értékei a változat CSS-ében, a keretben „token-javaslat”-ként felsorolva.
  - Nincs kitalált tény.
  - Az árak a meglévő pénzformázóval jelennek meg (nem törhető szóköz: 12 990 Ft).
  - Magyar tipográfia: „idézőjel”, nagykötőjeles tartomány, × jel.
- **Hozzáférhetőség (WCAG 2.2 AA):**
  - kontraszt, látható fókusz;
  - minden interakció billentyűzettel is (lencse, jelölőpontok, legyező, kereső, gyorskalkulátor);
  - `prefers-reduced-motion` mellett nincs animáció;
  - az illusztrációk `role="img"`, `<title>` és `<desc>` elemekkel.
- **Képernyők:** 360–1440 px és felette, vízszintes görgetés nélkül; a keretben 390 px / teljes váltó.
- **Tesztek (vitest):**
  - a `/tablo` élesben 404;
  - a `variants.ts` konzisztens: egyedi azonosítók, csoportonként legalább 3 tokenes és 1 kísérleti változat, minden bejegyzéshez létező fájl;
  - a H3 gyorskalkulátor a meglévő árazó és határidő-függvényeket használja (a segédfüggvénye tesztelve).
  - Mindig zöld: `npm test`, `npm run check`, `npm run build`.
- **Átnézés csoportonként:**
  1. képernyőkép a beépített böngészőben 390 és 1440 px-en, mindkét irányban;
  2. `design:design-critique`, `design:accessibility-review`, `web-design-guidelines`;
  3. javítás.
  - Az alkotáshoz: `ui-ux-pro-max` (minták, stílusok), `frontend-design:frontend-design` és `taste-skill` (karakteres megjelenés).
- **Sorrend (5 kör, mindegyik végén bemutató):**
  1. Grafikák (G1–G4), mert a többi elem ezekre épül;
  2. Hero (H1–H4);
  3. Szolgáltatások és folyamat (SZ1–SZ4, F1–F4);
  4. Referenciák (R1–R4);
  5. Kísérleti változatok (H-K1, H-K2, SZ-K1, F-K1, R-K1, R-K2, G-K1, G-K2).
  - Körönként egy commit; a GitHubra a belépés rendezése után kerül fel.

## Nem része

A végleges kezdőlap összeállítása, a nyertesek véglegesítése a `src/components/`-ben, a megrendelőnek szóló
megosztás, a Claude Design-szinkron, Python.
