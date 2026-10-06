# Stilet Dekor – design system brief

Ez a fájl a design system munka belépési pontja (Claude Design és bármely tervező számára).
A tartalmi és üzleti háttér a [`docs/brief.md`](docs/brief.md)-ben van; ez a fájl a vizuális rendszerről szól.

## 1. A feladat

A Stilet Dekor arculati design systemjének **megalapozása és optimalizálása**, a megújuló weboldalhoz
(bemutatkozás, webshop azonnali árkalkulátorral, egyedi ajánlatkérés).

Elvárt eredmény:

1. **Véglegesített tokenek** a [`design/tokens/stilet.tokens.json`](design/tokens/stilet.tokens.json) szerkezetében
   (szín, betű, típusskála, tér, sarkok, elrendezés, mozgás, effektek). A tokennevek szerződésként maradnak,
   az értékek változnak (5. fejezet).
2. **Komponensek** a [`design/components.md`](design/components.md) listája szerint, minden állapottal.
3. **Használati szabályok:** mikor és hol jelenik meg a márkaszín, a fény, a méretvonal-motívum; hogyan
   kezeljük a referenciafotókat; mit nem csinálunk.

## 2. A márka röviden

- **Ki:** dekoros cég **saját műhellyel**, Budapesten. Fóliázás (autó, kirakat, üveg, pult), cégér és
  világító reklám (reklámtábla belső LED-del, világító és plasztik betűk, LED-fal), nyomtatás (molinó,
  feszített ponyva, roll-up, tábla, matrica, plakát, vászonkép), rendezvénydíszlet, fotófal, 3D nyomtatás,
  igény szerint helyszíni felméréssel és telepítéssel.
- **Kinek:** üzlettulajdonosok, cégek (flotta, arculat), rendezvényszervezők, magánszemélyek.
- **Amit az oldalnak el kell érnie:** gyors elérés, kényelmes online rendelés, új ügyfelek bizalma.
- **Személyiség:** precíz (milliméterre mér), kézműves (saját műhely), látványos (fény, nagy felületek),
  megbízható (felmér, legyárt, felszerel). Közvetlen, magázó, rövid mondatokban beszél.

## 3. Kötött döntések

| Terület | Döntés |
|---|---|
| Alapszín | **Fekete** alap. |
| Márkaszín | A **rózsaszín** marad. A pontos árnyalatot ez a munka véglegesíti. Egyetlen token: `color.brand`; minden rózsaszín ebből származik. Feketén legalább **4,5:1** kontraszt (a mostani helyőrző `#ff2e8a`: 5,66:1). |
| Logó | Még nincs. Addig tipografikus szómárka: `STILET DEKOR`. |
| Árak | Mindenhol **bruttó** ár, kapcsoló nélkül; a nettó és az ÁFA csak kis kiegészítő sorban. |
| Nyelv | Magyar, magázó. Magyar tipográfia: ő ű Ő Ű minden betűtípusban (Latin Extended), „idézőjel”, ezres tagolás nem törhető szóközzel (12 990 Ft), nagykötőjeles tartomány (8:00–17:00), méret × jellel (85×200 cm). |
| Hozzáférhetőség | WCAG 2.2 AA: szöveg 4,5:1, nagy szöveg és UI-elem 3:1, látható fókusz, `prefers-reduced-motion` tisztelete, billentyűzettel minden kezelhető. |
| Képernyők | Hibátlan 360 px-től 1440 px-ig és felette; vízszintes görgetés soha. |
| Tartalom | Nincs kitalált tény: ügyfélnév, vélemény, csillag, statisztika csak valós adatból. |

## 4. Kiindulópont: két kidolgozott irány

A megrendelőnek **mindkét irány tetszik**. Mindkettő kattintható látványterv, működő konfigurátorral.

| | A) Neon műhely | B) Galéria / editorial |
|---|---|---|
| Látványterv | [`design/mockups/a-neon-muhely.html`](design/mockups/a-neon-muhely.html) | [`design/mockups/b-galeria-editorial.html`](design/mockups/b-galeria-editorial.html) |
| Tokenek | [`themes/neon-muhely.tokens.json`](design/tokens/themes/neon-muhely.tokens.json) | [`themes/galeria-editorial.tokens.json`](design/tokens/themes/galeria-editorial.tokens.json) |
| Hangulat | Mélyfekete műhely; a rózsaszín neonfényként világít (világító betűk, cégérek világa) | Magazinszerű, nyugodt, prémium; óriási képek, sok negatív tér |
| Motívumok | Vágóalátét-rács, cm-vonalzó, méretvonal mm-értékkel, szálkereszt; mérőszalag-sárga csak a méréshez | 12 hasábos szerkesztőségi rács, hajszálvonalak, képaláírás projektadatokkal (Felület · Anyag · Méret · Helyszín) |
| Betűk | Big Shoulders Display, Archivo, JetBrains Mono | Bodoni Moda, Schibsted Grotesk, IBM Plex Mono |
| A rózsaszín | Fény: a hero cégérén és a fő gombokon; máshol visszafogott | Csak apró, pontos akcentus |
| Mozgás | Egyetlen jelenet: a neonfelirat egyszer „bekapcsol”; nappal/éjjel kapcsoló | Finom átmenetek |

**Tanulságok az eddigi munkából:**

- A **mérés nyelve** (méretvonal, vonalzó, milliméter) a márka legegyedibb eleme, mert a cég fő ígérete a
  pontos felmérés és a saját gyártás. Bármelyik irány legyen, ezt érdemes megtartani.
- A **Bodoni Moda** nagy optikai méretnél (opsz 20 fölött) 1× kijelzőn elveszíti a hajszálvonalait
  („felszereljük” helyett „fclszcrcljük” látszik). Ha marad, az `opsz` értékét rögzíteni kell: kb. 30 px-ig
  12, nagy címeknél 20.
- Egy árcímke egyszer kimaradt a nettó/bruttó váltásból; azóta döntés, hogy minden ár bruttó.
- Érdemes megvizsgálni egy **szintézist** is: B nyugodt, fotóközpontú szerkezete A mérési nyelvével és a
  neonfénnyel, ami csak a hero-ban és a fő gombokon jelenik meg. Ez javaslat, a döntés a design munkáé.

## 5. Token-szerződés

- Forrás: [`design/tokens/stilet.tokens.json`](design/tokens/stilet.tokens.json), DTCG-szerű formátum
  (`$value`, `$type`, `$description`), hivatkozás `{color.brand}` alakban.
- **A nevek fixek, az értékek változnak.** Új token felvehető, ha a komponensek igénylik; a meglévőket ne
  nevezzük át, mert a kód ezekre épül.
- A CSS-t a generátor állítja elő: `npm run tokens` → `src/styles/tokens.css` (`--color-brand`,
  `--font-display`, `--text-xl` …). Kézzel nem szerkesztjük.
- `npm test` ellenőrzi a kontrasztot (szöveg, másodlagos szöveg, márkaszín, gombszöveg) minden témára.
- Mindkét irány benne van a generált CSS-ben: az alapértékek a `:root`-on, az irányok felülírásai a
  `:root[data-theme="neon-muhely"]` és `:root[data-theme="galeria-editorial"]` szabályokban. Az oldal a
  `SITE_THEME` változóból állítja be a `data-theme`-et; mindkét iránynak saját dev oldala van (README).

| Csoport | Tartalom |
|---|---|
| `color` | `brand`, `on-brand`, `bg`, `surface`, `surface-raised`, `line`, `text`, `text-muted`, `focus`, `measure`, `signal.ok/warn/bad` |
| `font` | `display`, `body`, `mono` (Google Fonts, Latin Extended) |
| `weight`, `text`, `leading`, `tracking` | betűvastagság, típusskála (`xs`…`hero`, a nagyok fluidak), sorköz, nagybetűs ritkítás |
| `space`, `radius`, `layout` | térköz-skála, sarkok, margó (`gutter`), konténer, fejléc, szakaszköz |
| `motion`, `effect` | időtartamok, görbe, a márkaelemek fénye (`brand-glow`) |

## 6. Komponensek

A teljes lista prioritással és állapotokkal: [`design/components.md`](design/components.md).
Az első kör (P1) a webshop konfigurátora és a rendelés útja, mert ez hozza az új megrendeléseket.

## 7. Elfogadási feltételek

- [ ] Minden szín token; a rózsaszín csak a `color.brand`-ből származik.
- [ ] A kontrasztteszt zöld (`npm test`), a fókusz minden interaktív elemen látható.
- [ ] Minden betűtípus helyesen rajzolja: „Árvíztűrő tükörfúrógép, ŐŰ, 12 990 Ft, 85×200 cm”.
- [ ] A komponensek 390 px-en és 1440 px-en is hibátlanok, minden állapottal (alap, hover, fókusz, aktív,
      tiltott, betöltés, hiba, üres).
- [ ] A mozgás egyetlen, megkomponált pillanat; csökkentett mozgásnál nincs animáció.
- [ ] A hangnem magázó, a szöveg rövid és konkrét.

## 8. Fájltérkép

| Hol | Mi |
|---|---|
| `DESIGN.md` | ez a brief |
| `design/tokens/` | tokenek: alap (`stilet.tokens.json`) és a két irány témaként |
| `design/components.md` | komponenslista |
| `design/mockups/` | a két látványterv (önálló HTML) |
| `design/README.md` | a mappa és a Claude Design munkafolyamat |
| `src/styles/tokens.css` | generált CSS-változók |
| `src/styles/base.css` | elemszintű alapstílusok (csak tokenekből) |
| `docs/brief.md` | üzleti és tartalmi brief, rendelési folyamat |

## 9. Munkafolyamat

A lépések a [`design/README.md`](design/README.md)-ben vannak: repó bekötése a Claude Design-ba,
iteráció, majd visszahozás a kódba a Claude Code `/design-sync` parancsával.
