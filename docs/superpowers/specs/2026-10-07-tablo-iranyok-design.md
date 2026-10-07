# Tabló: teljes irányok (X1–X6), 180 fokos kísérletek

Dátum: 2026-10-07 · Állapot: **jóváhagyott terv** · Kiegészíti: `2026-10-07-tablo-design.md`

## Cél

Hat merőben eltérő, teljes mini-oldal a tablón, a két meglévő irányon (A Neon műhely, B Galéria) túl.
Mindegyik ugyanazt a valós tartalmat mutatja, így csak a forma hasonlítható össze.

**Mi változhat (döntés, 2026-10-07):** a fekete alap, a rózsaszín szerepe, a szerkezet és a műfaj, a
tipográfia és a hangulat. **Ami nem változik:** valós adat (nincs kitalált tény), hozzáférhetőség (WCAG 2.2
AA), magyar nyelv és tipográfia; a rózsaszín mindig a `--color-brand`.

## Az irányok

| Az. | Név | Alap | A rózsaszín szerepe | Műfaj | Betűk (Google Fonts, latin-ext) |
|---|---|---|---|---|---|
| X1 | Árlista-plakát | papírfehér | egyetlen nagy blokk | az árlista maga a kezdőlap, óriás számokkal | Inter Tight |
| X2 | Tervrajz-sorozat | tervrajzkék | csak pecsét és jóváhagyás | rajzsorozat lapjai („1/6. lap”) rajzfejekkel | Space Grotesk, Space Mono |
| X3 | Rózsaszín áradat | teljes rózsaszín | ő a környezet, a fekete az akcentus | kampányoldal, nagy állítások | Anton, DM Sans |
| X4 | Eszköz-első | betonszürke/fehér | csak a cselekvés gombjai | az első képernyő a kalkulátor | DM Sans, DM Mono |
| X5 | Mintakönyv | kraftpapír | regiszterfülek | lapozós anyagkatalógus oldalsó fülekkel | Fraunces, DM Mono |
| X6 | Cégérfestő | krémszínű zománc | festett díszcsík és árnyék | régi cégérek nyelve: keretek, díszvonalak | Abril Fatface, Pacifico, DM Sans |

## Közös tartalom

Egy forrásból (`src/tablo/irany/tartalom.ts`), a `src/domain/`-ből:

- cégadatok (`COMPANY`), szlogen (`ON_SITE_SERVICE.description`), bevezető és a két belépő (Online
  rendelés, Egyedi ajánlat) a jóváhagyott látványtervekből;
- a 4 szolgáltatáscsoport és elemei, jelölve, melyik rendelhető online;
- három „-tól” bruttó ár (molinó, roll-up, matrica) a katalógus legkisebb nettó árából, `grossOf`-fal;
  mivel a katalógus árai helyőrzők (`PRICES_ARE_PLACEHOLDERS`), mindenhol „helyőrző ár” jelöléssel;
- a négy folyamatlépés a látványtervek szövegével;
- elérhetőségek; a nyitvatartás „helyőrző” jelöléssel.

Referenciakép: egy G1 jelenet irányonként (a meglévő jelenetek, az irány színeire hangolva), „Referenciakép
helye” jelöléssel. Mivel a G1 is ugyanazon az oldalon van, a jelenetek azonosítói egyedi előtagot kapnak.

## Megjelenítés

- Új csoport a tablón: **Teljes irányok** (`irany`), csak kísérleti sáv, 6. kör. A csoport a tabló élén áll.
- Minden X-keretben **„Teljes képernyő”** link: `/tablo/irany/x1` … `/tablo/irany/x6`. Ott az irány valódi
  oldalként, a teljes ablakszélességen látszik, „Vissza a tablóhoz” linkkel. Élesben ez is 404.
- Az irányok a saját gyökérelemükhöz igazodnak (container query), így a keretben és a teljes oldalon is
  helyesen tördelnek; a saját betűiket maguk töltik be.
- Címsorszint: a tablón a mini-oldal címei `h4`-től indulnak, a teljes oldalon `h2`-től (az oldal `h1`-e az
  irány neve).

## Minőség

- Kontraszt: szöveg 4,5:1, nagy szöveg és grafika 3:1, irányonként ellenőrizve. Világos alapon rózsaszín
  szöveg nem lehet (2,9:1), ott a rózsaszín csak felület, rajta fekete szöveg.
- 360–1440 px, vízszintes görgetés nélkül; a keretben a 390 px-es nézet is.
- Minden betűtípus rajzolja: „Árvíztűrő tükörfúrógép, ŐŰ, 12 990 Ft, 85×200 cm” (szemmel ellenőrizve).
- Tesztek: a közös tartalom a domainből jön (árak, csoportok, szlogen, helyőrző-jelölés); a változatlista
  új csoportja; a `/tablo/irany/…` útvonal csak létező, kész irányra ad oldalt.
