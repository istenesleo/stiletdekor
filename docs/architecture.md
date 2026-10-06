# Műszaki felépítés

## Stack

| Réteg | Választás | Miért |
|---|---|---|
| Keretrendszer | **Astro** (szerveroldali kimenet) | Gyors, SEO-barát statikus oldalak; interaktív részek „szigetekként” |
| Interaktív szigetek | **React** | Konfigurátor, ajánlatkérő varázsló, kosár. Logika headless hookokban, a kinézet cserélhető |
| Hosting | **Cloudflare Workers** (statikus assetek + SSR) | Dev környezet ágankénti előnézeti URL-ekkel, olcsó, gyors Magyarországon is |
| Adatbázis | **Cloudflare D1** (`DB` binding) | Rendelések, ajánlatkérések, feltöltés-metaadatok |
| Fájltár | **Cloudflare R2** (`UPLOADS` binding) | Feltöltött grafikák, fotók, 3D fájlok. Nem nyilvános |
| Validáció | **Zod** | Közös sémák kliens és szerver között |
| Teszt | **Vitest** | Árazás, határidő, preflight, API-validáció |

## Könyvtárszerkezet

```
src/
  domain/          # tiszta, keretrendszer-független üzleti logika (tesztelt)
    catalog.ts     # kategóriák, termékek, anyagok, opciók, helyőrző árak (docs/brief.md 4. fejezet)
    pricing.ts     # árkalkuláció: m², kerület, opciók, mennyiségi kedvezmény, expressz, minimum, ÁFA
    leadtime.ts    # elkészülési dátum: munkanapok, 12:00-s határidő, Europe/Budapest, magyar ünnepnapok;
                   # a gyártás a befizetéstől indul, a becslés +1 munkanapot számol visszaigazolásra és fizetésre
    orders.ts      # rendelési státuszok és átmenetek, kötelező szövegek („Rendelés elküldése ellenőrzésre”)
    preflight.ts   # DPI-becslés, arányeltérés
    artwork/       # méretfelismerés a feltöltött fájlból: PDF/AI dobozok, EPS, SVG, raszter-DPI, fájlnév-jelzések,
                   # szabványformátum, azonos felületek csoportosítása (docs/brief.md 8–9. fejezet)
    money.ts       # Ft formázás (hu-HU), kerekítés
    schemas.ts     # Zod sémák: konfiguráció, kosártétel, rendelés, ajánlatkérés
  server/          # Workers-specifikus: D1 lekérdezések, R2 feltöltés, azonosítók, értesítések (interfész)
  i18n/            # hu szótár + t() segéd; angol nyelv később
  components/      # Astro komponensek (kinézet a választott design-irány szerint készül)
  islands/         # React szigetek (headless hook + alap UI)
  layouts/
  pages/           # magyar slugok, lásd lent
  pages/api/       # JSON API
migrations/        # D1 SQL migrációk
docs/              # brief, architektúra, design-döntések
design/tokens/     # design tokenek (DTCG-szerű JSON) → src/styles/tokens.css (npm run tokens)
design/mockups/    # látványtervek (önálló HTML)
scripts/           # build-tokens.mjs (token → CSS, kontrasztellenőrzés)
```

## Oldalak (magyar slugok)

`/` · `/szolgaltatasok` · `/szolgaltatasok/[csoport]` · `/webshop` · `/webshop/[termek]` · `/ajanlatkeres` ·
`/referenciak` · `/rolunk` · `/kapcsolat` · `/kosar` · `/penztar` · `/rendeles/[azonosito]` · `/aszf` · `/adatvedelem`

## API

| Végpont | Feladat |
|---|---|
| `POST /api/uploads` | Fájl feltöltése R2-be (méret- és típusellenőrzés, magic bytes), metaadat D1-be, visszaad egy feltöltés-azonosítót |
| `POST /api/price` | Szerveroldali árkalkuláció egy konfigurációra (ugyanaz a `domain/pricing.ts`) |
| `POST /api/orders` | Rendelés elküldése ellenőrzésre (fizetési kötelezettség nélkül): **a szerver újraáraz**, a kliens által küldött árat nem fogadja el |
| `POST /api/quotes` | Egyedi ajánlatkérés (varázsló), igény szerint felméréssel (időpont nélkül, a műhely visszahív) |

## Biztonsági alapelvek

- A feltöltött fájlok **soha nem publikusak**, kulcsuk véletlen UUID, a felhasználó által adott fájlnév csak metaadat.
- Méretkorlát (Workers kéréstörzs-limit alatt), engedélyezett kiterjesztések és MIME-típusok, magic-byte ellenőrzés.
- Minden POST végpont ellenőrzi az `Origin` fejlécet; opcionális Cloudflare Turnstile és rate limit.
- Ár és összeg mindig a szerveren számolódik.

## Környezetek

- **dev:** a `main` ág, Workers Builds telepíti a `stiletdekor` Workerre (`npx wrangler deploy`); D1: `stiletdekor-dev`.
- **Previews:** minden más ág saját Preview URL-t kap (`npx wrangler preview`); a `previews` blokk szerint a dev
  D1-et használják közös tesztadatbázisként. Minden nem éles oldal `noindex`.
- **production:** később, az `env.production` blokk (`stiletdekor-production`), a `stiletdekor.hu` domainre
  kötve; build `CLOUDFLARE_ENV=production` mellett.
- Az R2 (feltöltések) a fiókban még nincs bekapcsolva, ezért a kötés egyelőre ki van kommentelve.

A részletes beállítási lépések a `README.md`-ben.
