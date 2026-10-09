# Stilet Dekor – weboldal

A [www.stiletdekor.hu](https://www.stiletdekor.hu) megújuló weboldala: bemutatkozás, webshop azonnali
árkalkulátorral, egyedi ajánlatkérés. Jelenleg fejlesztési fázisban van, a dev oldal a Cloudflare-en fut.

| Dokumentum | Miről szól |
|---|---|
| [`docs/brief.md`](docs/brief.md) | Üzleti és tartalmi brief: szolgáltatások, árak, rendelési folyamat, döntések |
| [`docs/architecture.md`](docs/architecture.md) | Műszaki felépítés |
| [`DESIGN.md`](DESIGN.md) | Design system brief (Claude Design-hoz) |
| [`design/`](design/) | Tokenek, komponenslista, látványtervek |

## Gyors indítás

Node 22 kell (lásd `.nvmrc`).

```sh
npm ci
cp .dev.vars.example .dev.vars
npm run dev
```

## Parancsok

| Parancs | Mit csinál |
|---|---|
| `npm run dev` | Helyi fejlesztői szerver (helyi D1-gyel) |
| `npm run build` | Éles build a `dist/` mappába |
| `npm run preview` | Build, majd a Worker helyi futtatása `wrangler dev`-vel |
| `npm run check` | Astro- és TypeScript-ellenőrzés |
| `npm test` | Unit tesztek (árazás, határidő, sémák, tokenek, kontraszt) |
| `npm run tokens` | `src/styles/tokens.css` generálása a `design/tokens/` alapján |
| `npm run build:ui` | A komponenskönyvtár (`src/ui`) csomagja a `dist-ui/` mappába: a Claude Design-szinkron bemenete |
| `npm run tokens:check` | Ellenőrzi, hogy a generált CSS naprakész-e (a CI is futtatja) |
| `npm run cf-typegen` | Cloudflare-típusok frissítése a `wrangler.jsonc` alapján |
| `npm run db:migrate:local` | D1-migrációk a helyi adatbázison |

## Cloudflare

### Dev oldal: Workers Builds

A Cloudflare a GitHub-repóból automatikusan buildel és telepít. Beállítások
(Workers & Pages → stiletdekor → Settings → Build):

| Beállítás | Érték |
|---|---|
| Repository | `istenesleo/stiletdekor` |
| Production branch | `main` |
| Worker neve | `stiletdekor` (egyeznie kell a `wrangler.jsonc` `name` mezőjével) |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Preview command | `npx wrangler preview` |
| Preview builds | bekapcsolva |
| Root directory | `/` |
| Build variables | nem kell (a Node-verzió a `.nvmrc`-ből jön) |

A Preview-beállítások (Builds for Preview branches, Preview command) a Builds szakasz **Previews Base**
fülén vannak, a többi a **Production** fülön.

**Ami a `wrangler.jsonc`-ben van, azt minden deploy felülírja:** változók, kötések, kompatibilitási dátum és
flagek, observability (naplók és Issues). Ezeket ne a dashboardon módosítsd, hanem a fájlban. A Previews Base
változóit és kötéseit a `previews` blokk adja.

**Ágak:**

- `main` → a két dev oldal (lásd lent).
- Minden más ág → saját Preview URL. Az előnézetek a `wrangler.jsonc` `previews` blokkját használják:
  ugyanazt a dev adatbázist, csak tesztadattal, és az A irányt mutatják.

### Két dev oldal: a két design-irány

Döntés (2026-10-06): amíg nem dől el a design, mindkét irány él, saját dev oldallal. A kód és a build
ugyanaz, csak a `SITE_THEME` változó más; ez választja ki a tokenkészletet (`<html data-theme>`) és a
betűtípusokat. Amíg a kezdőlap nem készül el, a `/` a választott irány látványtervét mutatja
(`design/mockups/`). Az éles oldalon ez soha nem jelenik meg. A látványterv aloldalai a cím `#/` utáni részével
nyílnak: `/#/webshop`, `/#/ajanlatkeres`, `/#/referenciak`, `/#/kapcsolat`.

A `/mentes` cím a látványterv mentett állapotát mutatja a kezdőlap szövegének rövidítése előttről
(`design/mockups/mentes/2026-10-06-hosszu-szoveg/`), hogy a kettő összevethető legyen. A böngészőfül címe
„Mentés, 2026-10-06” előtaggal kezdődik. Az éles oldalon ez a cím 404.

| Dev oldal | Worker | `SITE_THEME` | Build |
|---|---|---|---|
| A · Neon műhely | `stiletdekor` | `neon-muhely` | `npm run build` |
| B · Galéria / editorial | `stiletdekor-galeria` | `galeria-editorial` | `CLOUDFLARE_ENV=galeria npm run build` |

**A B oldal Workerjének létrehozása (egyszer, a dashboardon):**

1. Workers & Pages → Create application → Import a repository → GitHub: `istenesleo/stiletdekor`.
2. Név: `stiletdekor-galeria`. Ennek egyeznie kell a `wrangler.jsonc` `env.galeria.name` mezőjével.
3. Build command: `CLOUDFLARE_ENV=galeria npm run build` · Deploy command: `npx wrangler deploy` ·
   Production branch: `main` · Root directory: `/`.
4. Létrehozás után: Settings → Builds → **Previews Base** fül → a „Builds for Preview branches” legyen
   kikapcsolva (az előnézeteket az A oldal készíti).

Helyben: `.dev.vars`-ban `SITE_THEME=galeria-editorial`, vagy `CLOUDFLARE_ENV=galeria npm run preview`.

**Láthatóság:** ami nem az éles oldal, azt a keresők nem indexelik: a `robots.txt` mindent tilt, a válaszokban
`X-Robots-Tag: noindex, nofollow` fejléc és `noindex` meta van (`src/server/site-policy.ts`, `PUBLIC_SITE_ENV`
alapján). A dev oldal és a Preview URL-ek viszont bárki számára elérhetők, aki ismeri a linket. Ha ez nem
kívánatos, a Worker beállításainál Cloudflare Access-szel védhetők.

### Erőforrások

| Erőforrás | Név | Állapot |
|---|---|---|
| D1 (dev és előnézetek) | `stiletdekor-dev` | Létrehozva, régió: EEUR. Migrációk még nincsenek. |
| R2 (feltöltések) | `stiletdekor-uploads-dev` | Még nincs: az R2 nincs bekapcsolva a fiókban, ezért a kötés ki van kommentelve. |
| D1 (éles) | `stiletdekor-prod` | Még nincs, az éles indulásnál kell. |

**Az R2 bekapcsolása, amikor elkészül a fájlfeltöltés:**

1. Cloudflare Dashboard → R2 → bekapcsolás.
2. `npx wrangler r2 bucket create stiletdekor-uploads-dev`
3. A `wrangler.jsonc`-ben visszaállítani a kikommentelt `r2_buckets` blokkot (felső szint, `previews`,
   `env.production`), az `src/env.d.ts`-ben az `UPLOADS` kötést újra kötelezővé tenni, majd
   `npm run cf-typegen`.

**D1-migrációk:** a Workers Builds automatikus tokenje nem kap D1-jogosultságot. A migrációkat ezért
helyből futtatjuk (`npx wrangler d1 migrations apply DB --remote`), vagy D1-jogosultsággal bővített tokennel.

### Visszahívás és értesítő e-mailek

- **Tábla:** `migrations/0001_callback_requests.sql`. Helyben `npm run db:migrate:local`; a dev adatbázisba
  push előtt `npx wrangler d1 migrations apply DB --remote` (élesben `--env production` is).
- **Beküldési korlát:** `FORM_LIMITER` (60 másodpercenként 5 beküldés IP-címenként és űrlaponként), minden környezetben.
- **Értesítő e-mailek:** amíg nincs `EMAIL` kötés, a levelek a Worker naplójába mennek, és a kérés
  „elküldöttnek” számít. Valódi küldéshez a `stiletdekor.hu` domainnek a Cloudflare-en kell lennie (most a
  register.it névszerverein van, a levelezés a webnode-on; az MX rekordokat költözéskor át kell venni):
  1. a domain felvétele a Cloudflare-be és a névszerverek átállítása a register.it-nél;
  2. Email Service → Email Routing → Destination addresses: a `stiletdekor@gmail.com` felvétele és megerősítése;
  3. a `wrangler.jsonc`-be minden környezetben
     `"send_email": [{ "name": "EMAIL", "destination_address": "stiletdekor@gmail.com" }]`, a `NOTIFY_FROM_EMAIL`
     változóba a feladó (például `ertesito@stiletdekor.hu`).
  A megerősített címre küldés minden csomagban ingyenes.
- **Újrapróbálás:** a cron (`*/15 * * * *`, csak az A dev oldalon és élesben) 24 órán át újraküldi az el nem
  ment értesítéseket; a hibák a Cloudflare naplójában (Issues) látszanak.
- **Mérés:** Web Analytics token a `CF_BEACON_TOKEN` változóba (Analytics & Logs → Web Analytics). Heti
  visszahívások forrás szerint:
  `npx wrangler d1 execute DB --remote --command "SELECT strftime('%Y-%W', created_at) AS het, COALESCE(source, '–') AS forras, COUNT(*) AS db FROM callback_requests GROUP BY het, forras ORDER BY het DESC"`

### Éles környezet (később)

Az `env.production` blokk a végleges oldalé (`stiletdekor-production` Worker, www.stiletdekor.hu).
A Cloudflare Vite-plugin miatt a környezet buildkor dől el:
`CLOUDFLARE_ENV=production npm run build`, majd `npx wrangler deploy`.

A Workers Cache (Settings → Runtime → Cache) szándékosan ki van kapcsolva. Élesben megfontolandó
(`"cache": { "enabled": true }` és oldalanként megfelelő `Cache-Control` fejléc), a dev oldalon nem kell.

## Design system

A design system a Claude Design-nal készül, a brief a [`DESIGN.md`](DESIGN.md)-ben van, a munkafolyamat a
[`design/README.md`](design/README.md)-ben. A tokenek egyetlen forrása a
`design/tokens/stilet.tokens.json`; a CSS-t ebből a `npm run tokens` állítja elő. A komponensek a `src/ui/`-ban
vannak; a Claude Design-ba a `/design-sync` tölti fel őket a `.design-sync/` beállításai alapján.

## Helyi munkapéldány (saját gépen)

A felhős Claude-munkamenetek a GitHubon keresztül dolgoznak. Saját gépen futó Claude Code (a Claude Desktop
alkalmazás Code füle, vagy terminálban a `claude` parancs) akkor kell, ha a Claude Design-ba töltünk fel: a
`/design-login` csak ott fut le.

**Hova:** a OneDrive-on kívülre, például `C:\Projektek\stiletdekor`. A OneDrive a `.git` mappát és a
`node_modules` több tízezer fájlját is szinkronizálná: ez lassú, ütközés miatti másolatokat gyárt, és a csak
online tárolt fájlok elronthatják a gitet és az npm-et. A mentést és a gépek közti szinkront a GitHub végzi. Ha
mégis a OneDrive-ba kerül, a mappán állítsd be: „Mindig maradjon ezen az eszközön”.

**Első beállítás (Windows):** telepítsd a Git for Windows-t, a Node.js 22-es (vagy újabb) LTS-t és a Claude
Desktopot, majd PowerShellben:

```powershell
New-Item -ItemType Directory -Force C:\Projektek | Out-Null
Set-Location C:\Projektek
git clone https://github.com/istenesleo/stiletdekor.git
Set-Location stiletdekor
npm ci
```

**Szinkron:** munka előtt `git pull`, utána commit és `git push` (ezt Claude is elvégzi). A közös ág a `main`;
amit egy felhős munkamenet befejez, az oda kerül, és helyben a `git pull` hozza le.

**Claude Design-szinkron:** a mappában indított Claude Code-ban egyszer `/design-login`, utána `/design-sync`.
A részletek és az eddigi tapasztalatok: [`.design-sync/NOTES.md`](.design-sync/NOTES.md).

## Mappaszerkezet

```
src/domain/     üzleti logika keretrendszer nélkül (katalógus, árazás, határidő, sémák), tesztelve
src/ui/         komponenskönyvtár (React, csak tokenekből); a dev oldalakon a /komponensek címen
src/site/       a katalógus és a komponensek közti átalakítók, a két design-irány
src/islands/    kliensoldali szigetek (a /komponensek mintaoldal)
src/styles/     tokens.css (generált) és base.css
src/layouts/    oldalváz
src/pages/      oldalak (magyar slugok)
scripts/        build-tokens.mjs (tesztelve) és build-ui.mjs
design/         tokenek, komponenslista, látványtervek
.design-sync/   a Claude Design-szinkron beállítása, előnézetei, jegyzetei
docs/           brief és architektúra
migrations/     D1-migrációk
```
