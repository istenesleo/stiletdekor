# Claude Design: a 2026-10-08-i csomag és az elemzése

A Claude Design „Stiletdekor design mockups” projektjének exportja (handoff, 2026-10-08), a repó adatai és
tokenjei alapján. A fájlok böngészőben nyílnak meg, internet kell hozzájuk: a `support.js` a React-et és a
Babelt az unpkg-ről tölti, a betűket a Google Fonts adja. Kényelmesebb mindet egyszerre, váltóval nézni: az
`npm run latvanytervek` által készített **„Arculati látványtervek.html”** tartalmazza őket a Döntőlappal
együtt (lásd `design/README.md`).

| Fájl | Mi van benne |
|---|---|
| `Stilet Design System.dc.html` | Három irány (A, B és a szintézis, **C · Mérőlap**), négy rózsaszín mért kontraszttal, négy betűpár |
| `Stilet Tablo.dc.html` | A tabló 1–2. köre **keverővel** (irány, rózsaszín, betűpár, sarok, fény, gombszín, mérőszín): Ö1–Ö5 összevetés, H1–H6 hero, SZ1–SZ5 szolgáltatások, F1–F5 folyamat, G1–G4 grafikák, kísérleti sáv, O1–O3 hiányzó oldalak |
| `StiletPrototipus.dc.html` | Kattintható prototípus (kezdőlap, webshop-konfigurátor, ajánlatkérés); az irány a `direction` prop, alapból C |
| `StiletKomponensek.dc.html` | A `src/ui` komponensei minden állapotban |
| `support.js` | A Claude Design futtatókörnyezete (generált, nem szerkesztjük) |
| `HANDOFF-README.md`, `github.md` | Az export saját leírása és a szinkron jegyzete |

A csomagban lévő két régi látványterv (`a-neon-muhely.html`, `b-galeria-editorial.html`) bájtra azonos a
`design/mockups/`-ban lévőkkel, ezért nincs itt még egyszer.

## Mérlegelés

Szempontok: a működési elvek (`docs/superpowers/specs/2026-10-08-weboldal-mukodesi-elvek-design.md`): a fő cél
az ajánlatkérés, ami pénzt hoz, JavaScript nélkül is működik, nincs kitalált adat, egy megkomponált mozgás,
tokenekből épül.

| Elem | Döntés | Indok |
|---|---|---|
| **C · Mérőlap** irány | **Beépítve** harmadik témaként (`design/tokens/themes/merolap.tokens.json`, `?tema=merolap`) | A B nyugodt, képes szerkezete az A mérési nyelvével; a fény csak a hero cégérén és a fő gombon. A DESIGN.md szintézis-javaslatának kidolgozása; így a végleges oldal egy kapcsolóval átállítható rá. Eltérés: a címek sorköze 1,0 (Claude Design: 0,96), hogy a magyar nagybetűk ékezete ne érjen a fölötte lévő sorhoz. |
| Ö1 rövid kezdőlap A/B/C-ben, Ö2–Ö3 szómérő | Döntéshez használjuk | A rövid kezdőlap már eldőlt (2026-10-08); a szómérő a szövegkeretet ellenőrzi. |
| Ö4 eltérések | Nincs teendő | A Claude Design igazodott a repóhoz (betűk, színek, fény); a repó értékei a helyesek. |
| Ö5 új tokenek (`color.brand-ink`, `color.line-soft`, `tracking.display`, `font.case-display`, `font.emphasis`, `radius.lg`, `effect.neon-text`) | A választott változatokkal együtt, a 3. alprojektben | Csak akkor kellenek, ha a nyertes elemek használják őket; tokennevet nem nevezünk át. |
| H1 Gyártási rajz | Döntésre vár | Erős márkakép a mérés nyelvével, script nélkül működik. |
| **H2 Két ajtó** | **Ajánlott hero** | A két belépő maga a hero; a kilenc munkatípus egyenesen a `/ajanlatkeres/[tipus]` oldalakra vihet. Az ajánlat-ajtó legyen a hangsúlyos (a fő cél). |
| H3 Azonnali ár | A webshopra, nem a kezdőlapra | JavaScriptet igényel, és a webshopot tenné elsővé; a molinó oldalán vagy a Nyomtatás csoportnál erős. |
| H4 Anyagfal, G-K2 textúrák | A webshophoz, döntésre vár | Tapintható anyagok; csak katalógusadattal. |
| H5 Mérőszalag, H6 Fóliatekercs, H-K2, H-K3 | A „megkomponált pillanat” jelöltjei | Kezdőlapon csak egy mozgás lehet. |
| H-K1 Élő cégér | A „Világító betűk” oldalára (2.–3. alprojekt) | Interaktív, a felirattal kitöltött ajánlatkérésre vihet; a kezdőlapra túl sok. |
| **SZ1 Mit szeretne dekorálni?** | **Ajánlott** a kezdőlapra | A látogató nyelvén indul, és a munkatípusokhoz vezet. JavaScript nélkül minden felület listája látszik. |
| SZ2 Azonnal / Ajánlatra | A `/szolgaltatasok` oldalra | A hibrid modellt egy pillantásra megmagyarázza. |
| SZ3 Utcakép | Döntésre vár | Felfedezhető kép, mellette sima lista (akadálymentes). |
| **SZ4 Tárgymutató** | **Ajánlott** a `/szolgaltatasok` oldalra | Gyors út annak, aki tudja, mit keres; a szűrés csak kényelmi réteg. |
| SZ5 Betűtábla | A webshophoz, döntésre vár | Árlista műhelyhangulattal, valódi szöveggel. |
| SZ-K1 Kérdezzen bátran | Most nem | Új interakciós minta; a visszahívás és az ajánlatkérés ugyanezt egyszerűbben adja. |
| F1 Ön és mi | Az ajánlatkérés oldalára | Kimondja: „Nincs teendője”; a bizalom fő kérdése. |
| **F2 Vonalzó-idővonal** | **Ajánlott** a kezdőlapra | Rövid, a mérés nyelvén; mobilon egyszerű lista. |
| F3 Egy munka útja | A Rólunk vagy a Világító betűk oldalára | Történet egy tárgyon át; a méretek jelölt példák. |
| **F4 Két útvonal** | **Ajánlott** a webshopra és a pénztár mellé | Egy vonal mondja ki, hogy a befizetésig nincs fizetési kötelezettség. |
| F5 Naptárcsík | A webshopra | Élő dátum a `leadtime.ts` szabályával. |
| F-K1 Munkalap pecsétekkel, R-K1 Mintalegyező | Most nem | Új felületszín, kézírás, forgatás: sok új token kis nyereségért. |
| R-K2 Éjszakai séta | Döntésre vár | A világító munkák referenciáinál erős, az A és a C fényéhez illik. |
| G1 Képhelyőrzők és fotó-forgatókönyv | **Ajánlott** a forgatókönyv | A helyőrző nem utánoz fotót, a nyolc jelenet fotós forgatókönyve pedig a megrendelőnek is használható. A tabló illusztrált jelenetei (G1) díszként maradhatnak. |
| G2 Egységes piktogramcsalád | Döntésre vár | Egy rendszer a 9 munkatípushoz és a 6 termékhez; a repó G2-jével együtt dönteni. |
| G3 Mérés-motívumok és szabályok | A szabályokat átvesszük | Az „IGEN / NEM” lista a DESIGN.md-be kerül a választás után. |
| G4 Szómárka a–e | Döntésre vár | A repó G4-ével együtt; a logó a megrendelő döntése. |
| G-K1 Neoncső-betűk | Az A irányhoz, döntésre vár | Valódi neonhatás, saját betűvel (Tilt Neon). |
| O1 Pénztár, O2 Rendelés állapota, O3 Referencia-aloldal | **Alapként átvesszük** (4. és 3. alprojekt) | A brief rendelési folyamatát követik; a „Most még nem fizet” a gomb fölött áll, nem apró betűvel. |

## Javasolt végleges kivitel (a Döntőlap ajánlásai)

C · Mérőlap irány, 1a rózsaszín (`#FF2E8A`, a mostani), 2c betűpár (Bricolage Grotesque, Hanken Grotesk,
Geist Mono), 6 px-es sarok, fény csak a hero cégérén és a fő gombon, rózsaszín fő gomb, sárga mérőszín.
Kezdőlap: H2 hero, SZ1 szolgáltatások, F2 folyamat; aloldalakon SZ4, F1, F4 és O1–O3. Egyetlen mozgás: a
hero cégére „bekapcsol”. Ez javaslat; a döntés a megrendelőé.
