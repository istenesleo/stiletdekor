# design/

A Stilet Dekor design systemjének otthona. A brief a gyökérben: [`../DESIGN.md`](../DESIGN.md).

| Mappa, fájl | Tartalom |
|---|---|
| `tokens/stilet.tokens.json` | A tokenek egyetlen forrása. Ebből készül a `src/styles/tokens.css` (`npm run tokens`). |
| `tokens/themes/*.tokens.json` | A két kidolgozott irány ugyanazokkal a tokennevekkel. Csak felülírják az alapot. |
| `components.md` | A komponensek listája prioritással és állapotokkal. |
| `mockups/` | A két kattintható látványterv (önálló HTML, böngészőben megnyitható). |
| `mockups/mentes/` | Korábbi állapotok mentése. `2026-10-06-hosszu-szoveg/`: mindkét terv a kezdőlap szövegének rövidítése előtt. A dev oldalakon a `/mentes` címen látható. |

## Munkafolyamat a Claude Design-nal

1. **GitHub-hozzáférés.** A repó privát, ezért a claude.ai-ban be kell kapcsolni a GitHub-integrációt
   (Customize → Connectors → GitHub Integration → Connect), és a Claude GitHub App-nak hozzá kell férnie az
   `istenesleo/stiletdekor` repóhoz. Az alapértelmezett ág legyen a `main` (GitHub → Settings → Default branch).
2. **Bekötés.** A Claude Design-ban hozz létre egy design system projektet, kösd hozzá a repót, és add meg
   kiindulásnak a `DESIGN.md`-t.
3. **Iteráció.** Sorrend: alapok (szín, betű, skálák) → P1 komponensek → oldalsablonok (főoldal, termék
   konfigurátorral, kosár és pénztár, ajánlatkérő).
4. **Vissza a kódba.** A Claude Code `/design-sync` parancsa komponensenként szinkronizálja a kész design
   systemet a repóval. A véglegesített token-értékek a `tokens/stilet.tokens.json`-be kerülnek, utána
   `npm run tokens`, és a teszt (`npm test`) ellenőrzi a kontrasztot.

## Szabályok

- Tokennevet nem nevezünk át (a kód ezekre épül); új token felvehető.
- A `src/styles/tokens.css`-t kézzel nem szerkesztjük; a CI ellenőrzi, hogy a JSON-nal egyezik.
- Minden rózsaszín a `color.brand` tokenből származik.
- Ügyfélgrafikát (valódi megrendelők fájljait) nem teszünk a repóba.
