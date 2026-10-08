# design/

A Stilet Dekor design systemjének otthona. A brief a gyökérben: [`../DESIGN.md`](../DESIGN.md).

| Mappa, fájl | Tartalom |
|---|---|
| `tokens/stilet.tokens.json` | A tokenek egyetlen forrása. Ebből készül a `src/styles/tokens.css` (`npm run tokens`). |
| `tokens/themes/*.tokens.json` | A két kidolgozott irány ugyanazokkal a tokennevekkel. Csak felülírják az alapot. |
| `components.md` | A komponensek listája prioritással és állapotokkal. |
| `mockups/` | A két kattintható látványterv (önálló HTML, böngészőben megnyitható). A rövid kezdőlap mellett az aloldalak is benne vannak: `#/webshop`, `#/ajanlatkeres`, `#/referenciak`, `#/kapcsolat`. |
| `mockups/mentes/` | Korábbi állapotok mentése. `2026-10-06-hosszu-szoveg/`: mindkét terv a kezdőlap szövegének rövidítése előtt. A dev oldalakon a `/mentes` címen látható. |

## Arculati látványtervek: egy fájlban, váltóval

Az `npm run latvanytervek` a projekt gyökerébe írja az **„Arculati látványtervek.html”** fájlt: dupla kattintással
megnyílik, felül gombokkal váltható, asztali vagy 390 px-es mobilnézetben. A fülek:

- **Döntőlap** (az első): pontonként a végleges arculat (irány, márkaszín, betűpár, sarkok, fény, fő gomb,
  mérőszín, hero, szolgáltatások, folyamat, referenciák, képek, piktogramok, szómárka, mozgás, pénztár és
  társai), mindegyiknél az ajánlásunkkal és az indokkal, „Megnézem” linkkel a megfelelő fülre. Minden opciónál
  ott a látványterv **képe**, a generáláskor fej nélküli Chromiummal fotózva a fülek tartalmáról
  (`scripts/kepek.mjs`, `playwright-core` 1.62.0 a gépen lévő chromium-1234-gyel, ha nincs, az Edge-dzsel); a
  színeknél, a betűpároknál, a sarkoknál, a fénynél és a gombnál élő minta. A képek a OneDrive-előnézetben is
  látszanak. Böngészőben a jelölésekből másolható összegzés lesz a chatbe, és a böngésző megjegyzi őket
  (`scripts/dontolap.mjs`).
- **Prototípus C, A és B irányban, Tabló + keverő, Design system, Komponensek**: a Claude Design fájljai
  (`design/claude-design/`, elemzésük ott a README-ben). JavaScriptet és internetet igényelnek (a React és a
  Babel az unpkg-ről jön).
- A két látványterv (A, B), a hat teljes irány (X1–X6) és a kész arculati elemek (G1–G4) A, B és C irányban.

A fájl a valódi kódból készül (build, helyi szerver, letöltés), ezért a tervek változása után újra kell
generálni. Mivel generált, nem kerül a gitbe. A betűk a Google Fonts-ról töltődnek; internet nélkül tartalék
betűkkel jelenik meg. A váltás JavaScript nélkül is működik (választógombok és CSS), mert például a OneDrive
webes és telefonos előnézete nem futtat scriptet; ott a Döntőlap sima űrlap, a Claude Design fülek és a tervek
saját interakciói (kalkulátor, nappal/éjjel, aloldalak) nem működnek, ehhez a fájlt böngészőben kell megnyitni.

**Harmadik irány: C · Mérőlap.** A Claude Design szintézise témaként is be van építve
(`design/tokens/themes/merolap.tokens.json`): a dev oldalakon `?tema=merolap` (például `/komponensek` és
`/tablo`), helyben `SITE_THEME=merolap` a `.dev.vars`-ban.

## Munkafolyamat a Claude Design-nal

1. **GitHub-hozzáférés.** A repó privát, ezért a claude.ai-ban be kell kapcsolni a GitHub-integrációt
   (Customize → Connectors → GitHub Integration → Connect), és a Claude GitHub App-nak hozzá kell férnie az
   `istenesleo/stiletdekor` repóhoz. Az alapértelmezett ág legyen a `main` (GitHub → Settings → Default branch).
2. **Bekötés.** A Claude Design-ban hozz létre egy design system projektet, kösd hozzá a repót, és add meg
   kiindulásnak a `DESIGN.md`-t.
3. **Iteráció.** Sorrend: alapok (szín, betű, skálák) → P1 komponensek → oldalsablonok (főoldal, termék
   konfigurátorral, kosár és pénztár, ajánlatkérő).
4. **A kód a forrás.** A komponensek a `src/ui/`-ban élnek (React, csak tokenekből), a dev oldalakon a
   `/komponensek` címen láthatók minden állapotban. A Claude Code `/design-sync` parancsa **innen tölti fel**
   őket a Claude Design-ba, hogy az ott készülő tervek a valódi komponensekből épüljenek; visszafelé nem
   szinkronizál. A szinkron beállítása, a komponensek előnézetei és a tervező ügynöknek szóló szabályok a
   `.design-sync/`-ban vannak. A feltöltéshez saját gépen futó Claude Code kell (lásd a gyökér README
   „Helyi munkapéldány” részét). Ami a Claude Design-ban születik (új token-érték, komponensváltozás), azt a kódban vezetjük
   át: token-érték a `tokens/stilet.tokens.json`-be vagy egy témába, utána `npm run tokens`, és a teszt
   (`npm test`) ellenőrzi a kontrasztot; komponens a `src/ui/`-ba. Utána újra `/design-sync`.

## Szabályok

- Tokennevet nem nevezünk át (a kód ezekre épül); új token felvehető.
- A `src/styles/tokens.css`-t kézzel nem szerkesztjük; a CI ellenőrzi, hogy a JSON-nal egyezik.
- Minden rózsaszín a `color.brand` tokenből származik.
- Ügyfélgrafikát (valódi megrendelők fájljait) nem teszünk a repóba.
