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
(`design/mockups/`). Az éles oldalon ez soha nem jelenik meg.

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

### Éles környezet (később)

Az `env.production` blokk a végleges oldalé (`stiletdekor-production` Worker, www.stiletdekor.hu).
A Cloudflare Vite-plugin miatt a környezet buildkor dől el:
`CLOUDFLARE_ENV=production npm run build`, majd `npx wrangler deploy`.

A Workers Cache (Settings → Runtime → Cache) szándékosan ki van kapcsolva. Élesben megfontolandó
(`"cache": { "enabled": true }` és oldalanként megfelelő `Cache-Control` fejléc), a dev oldalon nem kell.

## Design system

A design system a Claude Design-nal készül, a brief a [`DESIGN.md`](DESIGN.md)-ben van, a munkafolyamat a
[`design/README.md`](design/README.md)-ben. A tokenek egyetlen forrása a
`design/tokens/stilet.tokens.json`; a CSS-t ebből a `npm run tokens` állítja elő.

## Mappaszerkezet

```
src/domain/     üzleti logika keretrendszer nélkül (katalógus, árazás, határidő, sémák), tesztelve
src/styles/     tokens.css (generált) és base.css
src/layouts/    oldalváz
src/pages/      oldalak (magyar slugok)
scripts/        build-tokens.mjs és tesztje
design/         tokenek, komponenslista, látványtervek
docs/           brief és architektúra
migrations/     D1-migrációk
```
