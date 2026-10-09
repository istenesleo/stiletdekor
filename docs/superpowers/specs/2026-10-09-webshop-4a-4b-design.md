# Webshop és rendelés: termékoldalak, kosár, pénztár (4a + 4b)

Dátum: 2026-10-09 · Állapot: **tervezet, átnézésre vár**. A 4. alprojekt első köre. Keret:
[működési elvek](2026-10-08-weboldal-mukodesi-elvek-design.md) (3.3, 4–8. és 11. fejezet); üzleti tartalom:
[brief](../../brief.md) 4.1, 8. és 10. fejezet; műszaki felépítés: [architecture.md](../../architecture.md).

**Döntések (2026-10-09):**

| Kérdés | Döntés |
|---|---|
| Hatókör | 4a termékoldalak és konfigurátor + 4b kosár, pénztár, rendelés mentése. A műhely-felület (4c) később |
| Fájlfeltöltés | Ebben a körben, R2-be. Az R2-t a felhasználó kapcsolja be (17. fejezet) |
| A vásárló értesítése | Állapotoldal titkos linkkel; a műhely kézzel ír e-mailt. Automatikus vásárlói levél nincs |
| Megvalósítás | React-sziget a termék-, a kosár- és a pénztároldalon, közös csomagokkal |
| Sebességkeret | Ezeken az oldalakon legfeljebb ~130 KB JavaScript (gzip); a keret 5. fejezete ennek megfelelően módosul |
| E-mail-teszt | Kódban és naplóban. Ha valódi levél kell, a műhely címe a teszthez `leonardistenes@gmail.com` |

## 1. Oldalak és végpontok

| Cím | Előállítás | Feladat |
|---|---|---|
| `/webshop` | Előre generált | A 6 termék csempéje (`CategoryTile`): név, egy mondat, „…-tól” bruttó ár, link a termékoldalra |
| `/webshop/[termek]` | Előre generált + sziget | A 6 termék (`SHOP_PRODUCT_IDS`). Szerveroldali HTML: leírás, anyagok, ártáblázat, gyártási idő, átvétel. Alatta a konfigurátor |
| `/kosar` | Előre generált + sziget | Tételek, módosítás, törlés, összesítő, tovább a pénztárba |
| `/penztar` | Előre generált + sziget | Egyoldalas pénztár, 4 szakasz (5. fejezet). Akciósáv nélkül |
| `/rendeles/[token]` | Szerveren | Állapotoldal (10. fejezet); beküldés után köszönő nézettel |
| `POST /api/uploads` | Szerveren | Fájl feltöltése (6. fejezet) |
| `GET /api/uploads/[id]` | Szerveren | Rendeléshez kötött fájl letöltése a műhelynek (6. fejezet) |
| `POST /api/orders` | Szerveren | Rendelés elküldése ellenőrzésre (7. fejezet) |

- A menü és a lábléc „Webshop” pontja a `/webshop` oldalra visz (`WEBSHOP_HREF`).
- **A fejléc kosárlinkje** a `/kosar` oldalra mutat, és minden oldalon látszik. A darabszámot egy kis script írja
  ki a `localStorage`-ból, és a többi lapon történt változást is követi (`storage` esemény). JavaScript nélkül a
  link szám nélkül működik.
- **A köszönő oldal az állapotoldal első nézete.** Beküldés után a sziget a `/rendeles/<token>?uj=1` címre lép,
  így a vásárló rögtön azt a linket látja, amelyet elmenthet. Különálló `/rendeles/koszonjuk` oldal nincs.
- **A `POST /api/price` végpont nem kell:** a sziget ugyanazzal a `domain/pricing.ts` kóddal számol, a szerver
  a rendeléskor újraáraz. Az architecture.md ennek megfelelően frissül.
- **JavaScript nélkül** a termékoldal az adatokat és az árakat mutatja. A konfigurátor helyén egy rövid szöveg
  áll: a rendeléshez JavaScript kell, addig kérjen ajánlatot vagy visszahívást (két link).
- **Helyőrző árak:** amíg `PRICES_ARE_PLACEHOLDERS` vagy `MATERIAL_SPECS_NEED_REVIEW` igaz, a dev oldalakon a
  termékoldal tetején jelzés áll erről. Élesítés előtt a műhely átírja az árakat (az 5. alprojekt
  ellenőrzőlistája).

## 2. A vásárló útja

1. A `/webshop` oldalon terméket választ.
2. A termékoldalon beállítja a terméket. Ha feltölt egy fájlt, a méret abból töltődik ki, és látja az élő bruttó
   árat meg a várható elkészülést.
3. A „Kosárba” gombra a kosár fiókja (`Drawer`) nyílik. Innen vásárolhat tovább, vagy a pénztárba léphet.
4. A pénztárban megadja az adatait és az átvételt, majd elküldi a rendelést: **„Rendelés elküldése
   ellenőrzésre”**.
5. Az állapotoldalra kerül: köszönő panel, az **R-0001** rendelésszám és a menthető link.
6. A műhely e-mailt kap (9. fejezet), ellenőrzi a rendelést, és kézzel válaszol (végleges ár, díjbekérő).

## 3. Termékoldal és konfigurátor

**Termékek és beállítások** (a mai `ProductConfig` szerint):

| Termék | Beállítás |
|---|---|
| Molinó | méret (20–500 cm), anyag (4), szélkidolgozás (4) |
| Roll-up | modell (4) vagy csak cseregrafika |
| Matrica | méret, anyag (3), kontúrvágás, UV-laminálás |
| Plakát | formátum (A3–A0, B1), papír (matt vagy fényes), tájolás; blueback m²-re. **Az egyedi méret kimarad** (függőben, brief 4.1) |
| Tábla | méret, anyag (4), furatok és távtartó szettek száma |
| Vászonkép | formátum (3) és tájolás, vagy egyedi méret |

Minden terméknél van darabszám és expressz gyártás.

**Közös működés:**

- **Méret:** kézzel, a termék előre megadott méreteiből, vagy a fájlból.
- **Ár:** élő bruttó ár bontással (`PriceBreakdown`). Egy kis sor mutatja a nettót és az ÁFA-t, alatta a
  következő kedvezménysáv javaslata (`DiscountHint`) és a „A végleges ár eltérhet a kalkulált ártól.” felirat.
  Hibás beállításnál ár helyett a mező alatti üzenet látszik (`tryPriceConfiguration`).
- **Várható elkészülés:** `LeadTimeNote`, az `estimateOrderReadyDate` szerint (benne 1 munkanap a
  visszaigazolásra).
- **Fájl** (nem kötelező, legfeljebb 10 tételenként):
  1. Kiválasztásra (`FileDrop`) a böngésző megvizsgálja (`analyzeArtwork`, brief 8).
  2. A méretmezők a fájlból töltődnek ki: „A méret a fájlból: 84,0 × 109,7 cm”.
  3. Megjelenik a felbontás minősítése (`ReadinessLight`) és a méretarányos előnézet (`ScalePreview`).
     Arányeltérésnél az illesztés módját is kéri (`FitPicker`).
  4. A meglévő elemző szabályai érvényesek: méretarány-javaslat, ráfutás a szabványos formátumra
     (plakát, roll-up).
  5. Közben a fájl a háttérben feltöltődik, folyamatjelzővel (`FileList`).
- **Több oldalas fájl:** a konfigurátor az első oldal méretét használja, és kiírja, hogy a többi oldalt a műhely
  egyezteti. A felületcsomag később jön (brief 9).
- **Kosárba:** a tétel a kosárba kerül, és a kosár fiókja kinyílik. A gomb csak hibátlan beállításnál aktív, és
  akkor, ha egyik fájl sincs épp feltöltés alatt.
- **Módosítás a kosárból:** a `/webshop/<termek>#tetel=<kulcs>` cím betölti a tétel beállítását. A gomb ilyenkor
  „Tétel frissítése”.

## 4. Kosár

- **Tárolás:** a böngésző `localStorage`-ában, a `stilet-kosar` kulcson: `{ v: 1, items: [{ key, config, files:
  [{ uploadId, name, size }], preflight?, addedAt }] }`. Személyes adat nincs benne. Árat nem tárol: azt mindig a
  konfigurációból számolja (`priceCart`).
- **Ellenőrzés betöltéskor:** minden tételt a `CartItemSchema` ellenőriz. A sérült vagy már nem érvényes tétel
  kikerül, és egy üzenet jelzi: „Egy tétel már nem rendelhető így, ezért kikerült a kosárból.” Az ismeretlen
  verziójú tároló üres kosárnak számít.
- **Oldal:** tételenként egy `CartLine`: leírás (`describeConfiguration`), fájlnevek vagy „Grafika: e-mailben
  küldi”, darabszám-léptető, bruttó ár, módosítás, törlés.
- **Összesítő:** a tételek bruttó összege, alatta a nettó és az ÁFA. Az átvételt a pénztárban választja.
- Üres kosárban a webshopra és az ajánlatkérésre mutató link áll.

## 5. Pénztár

Egyoldalas, 4 szakasz (`CheckoutSection`, a Claude Design O1 mintájára):

1. **Kapcsolat:** név, e-mail, telefon, cégnév (nem kötelező), adószám (nem kötelező; ha megadja, a cégnév
   kötelező).
2. **Számlázási cím:** irányítószám, település, utca és házszám.
3. **Átvétel:** a 3 mód (`SHIPPING_METHODS`) a díjával.
   - Futárnál és telepítésnél cím kell. Alapból „Ugyanaz, mint a számlázási cím”, kikapcsolva külön mezők.
   - Telepítésnél a díj „egyedi” (`INSTALLATION_NOTE`). A vásárló kérhet helyszíni felmérést, és feltölthet
     helyszíni fotót (nem kötelező, legfeljebb 10, ugyanazzal a feltöltéssel). Ehhez az `OrderRequestSchema` új
     mezőt kap: `sitePhotoIds`, csak telepítésnél.
4. **Összesítő és elküldés:**
   - **Az összesítő:** tételek, átvételi díj, nettó, ÁFA, bruttó, várható elkészülés.
   - **Megjegyzés** (nem kötelező).
   - **ÁSZF:** jelölőnégyzet, nincs előre bejelölve. Az ÁSZF az 5. alprojektben készül; addig a link a még
     hiányzó `/aszf` oldalra mutat.
   - **Figyelmeztetések:** `ORDER_NO_OBLIGATION_NOTICE` és `FINAL_PRICE_NOTICE`.
   - **Gomb:** „Rendelés elküldése ellenőrzésre” (`OrderSubmit`), alatta az adatkezelési tájékoztató linkje.

**Űrlapszabályok** (keret 4.3):

- Minden mező fölött látható címke.
- A mező elhagyásakor ellenőriz, beküldéskor összesítőt mutat linkekkel. A fókusz az összesítőre kerül.
- A mobilbarát mezők `autocomplete` és `inputmode` beállítással.
- A beírt adat a `sessionStorage`-ban megmarad a lap bezárásáig.
- A csapdamező (`honlap`) itt is ott van.
- **Egyszer használatos token:** a sziget betöltéskor készít egy UUID-t, és sikerig a `sessionStorage`-ban tartja.
- **Küldés közben** a gomb tiltott.
- **Siker után** a kosár és a vázlat törlődik, és a sziget az állapotoldalra lép.

## 6. Fájlfeltöltés

**`POST /api/uploads`**

**Kérés:** a törzs maga a fájl (`application/octet-stream`). A fájlnév URI-kódolva az `X-File-Name` fejlécben
jön, a méret a `Content-Length` fejlécből derül ki.

**Ellenőrzés, sorrendben:**

1. **Eredet:** az `Origin` fejléc az oldal saját címe vagy az `ALLOWED_ORIGINS` egyike.
2. **Beküldési korlát:** új kötés, `UPLOAD_LIMITER`. Látogatónként (IP) percenként 20 fájl, a kulcs
   `feltoltes:<ip>`.
3. **Tárhely:** ha nincs `UPLOADS` kötés, a válasz 503, és jelzi az e-mailes kerülőutat.
4. **Méret:** a `Content-Length` kötelező, legfeljebb 95 MB (`MAX_UPLOAD_BYTES`). Ennél nagyobbra 413.
5. **Típus:** a kiterjesztés szerepel az `ARTWORK_FILE_TYPES` listában. Az első 4 KB-ból a `detectArtworkFormat`
   megállapítja a valódi formátumot, és ennek egyeznie kell a kiterjesztéssel (az AI, PDF és EPS rokonságát
   kezeli). Eltérésnél 415.

**Tárolás:**

- **Az R2-be:** véletlen kulccsal (`feltoltes/<uuid>`), a felismert tartalomtípussal. A törzset nem tölti
  egészében a memóriába: az első bájtok ellenőrzése után továbbfolyatja (`FixedLengthStream`).
- **A D1 `uploads` táblájába:** a sor a metaadatokkal. A vásárló fájlneve csak metaadat, legfeljebb 200
  karakterre vágva.
- **A válasz:** `201 { id, name, size, format }`.

**A böngésző oldalán:**

- A feltöltés folyamatjelzőt mutat (`XMLHttpRequest`, mert a `fetch` nem jelzi a feltöltés haladását).
- Megszakadás esetén a fájl sorában „Újra” gomb jelenik meg.

**`GET /api/uploads/[id]`** (a műhely levelének linkjei)

- **Mit ad ki:** csak rendeléshez kötött fájlt, a rendelés beérkezésétől 90 napig (`UPLOAD_LINK_DAYS`).
  Egyébként 404.
- **Fejlécek:**
  - `Content-Disposition: attachment` az eredeti fájlnévvel;
  - `X-Content-Type-Options: nosniff`;
  - `Content-Security-Policy: sandbox`, hogy egy SVG se futtathasson scriptet;
  - `Cache-Control: private, no-store`.
- **Miért nem kell külön titkos kulcs:** az azonosító véletlen UUID, amit kitalálni nem lehet.

## 7. Rendelés beküldése: `POST /api/orders`

**Kérés:** JSON, az `OrderRequestSchema` mezői (`sitePhotoIds`-szal), mellettük `formToken`, `honlap` és
`source` (az a cím, ahonnan a vásárló a pénztárba lépett).

**A feldolgozás lépései:**

1. **Eredet:** ugyanaz az ellenőrzés, mint a feltöltésnél.
2. **Csapdamező:** ha ki van töltve, a válasz látszólag sikeres (`201 { reference: null, statusPath: null }`, a
   sziget ilyenkor általános köszönő szöveget mutat), de semmi nem mentődik és nem megy értesítés.
3. **Beküldési korlát:** `FORM_LIMITER`, kulcs `rendeles:<ip>`.
4. **Token:** a `formToken` UUID. Ha már van rendelés ezzel a tokennel, a válasz annak a száma és linkje
   (`200`). Új rendelés nem keletkezik.
5. **Ellenőrzés:** az `OrderRequestSchema`. Hibánál `422 { errors: { "customer.email": "…", "items.0.config.widthCm": "…" } }`;
   a pénztár a mezőkhöz írja ki, a tételek hibáit az összesítőben a tételnél.
6. **Fájlok:** minden hivatkozott feltöltés létezik, és nincs más rendeléshez kötve. Ha nem így van, a tételnél
   ez áll: „A(z) logo.pdf már nem érhető el. Töltse fel újra, vagy küldje e-mailben.”
7. **Újraárazás:** a `priceCart` számol. A böngésző árat nem küld, a szerver ára számít.
8. **Mentés egy tranzakcióban** (D1 `batch`):
   - a rendelés, a tételek és az első esemény (`beerkezett`, vásárló);
   - a fájlok a rendeléshez és a tételhez kötődnek.
   - Két egyszerre érkező, azonos tokenű kérésből az egyedi index miatt csak az egyik ment. A másik a mentett
     rendelést adja vissza.
9. **Válasz:** `201 { reference: "R-0001", statusPath: "/rendeles/<token>" }`.
10. **Értesítés:** a válasz után, a háttérben (`waitUntil`) megy a műhely levele (9. fejezet).

**Hibák:**

- `429`: a `TOO_MANY_MESSAGE` szövegével;
- `500`: a `SAVE_FAILED_MESSAGE` szövegével, a hiba a naplóba kerül.

**Rendelésszám:** `R-` és a rendelés sorszáma, legalább 4 jeggyel (a `ReferencePrefix` bővül az `R`-rel).

**Állapotlink tokenje:** 16 véletlen bájt base64url alakban (22 karakter). Nyílt szövegként mentjük, hogy a
műhely a kézi levelébe bemásolhassa.

## 8. Adatbázis (`migrations/0003_orders.sql`)

| Tábla | Tartalom |
|---|---|
| `uploads` | `id` (UUID), `r2_key`, `file_name`, `size_bytes`, `format`, `content_type`, `created_at`, `order_id`, `order_item_id` (helyszíni fotónál üres). Index a gazdátlan sorokra (`created_at`, ahol `order_id` üres) |
| `orders` | `form_token` és `status_token` (egyediek), `status` (alapból `beerkezett`) · a vásárló adatai · számlázási cím · átvétel módja és címe · `survey_requested` · `note` · az összegek (`items_net`, `shipping_net`, `shipping_price_on_request`, `net_total`, `vat_total`, `gross_total`) · `price_json` (a teljes `CartPrice`) · `source` · `created_at` · az értesítés oszlopai, mint a `quote_requests` táblában |
| `order_items` | `order_id`, `position`, `product_id`, `description`, `config_json`, `quantity`, `express`, a tétel nettó/ÁFA/bruttó összege, `price_json`, `preflight_json` (a böngésző mérése, csak tájékoztató) |
| `order_events` | `order_id`, `created_at`, `status_from` (létrehozáskor üres), `status_to`, `actor` (`vasarlo`, `muhely`, `rendszer`), `note`. A műhely-felület (4c) előzménylistája ebből épül |

A migráció helyben és a dev D1-en is lefut, utóbbin a korábbiak módján (Cloudflare MCP és a `d1_migrations` sora).

## 9. A műhely levele

**Fejléc:**

- **Tárgy:** „[R-0001] Rendelés ellenőrzésre – 2 tétel, 24 990 Ft – Kiss Péter”.
- **Címzett:** `ORDER_NOTIFY_EMAIL`.
- **`Reply-To`:** a vásárló e-mail-címe.

**Törzs:**

- **Bevezető:** „Új rendelés érkezett ellenőrzésre. Fizetési kötelezettség még nincs: visszaigazolás és díjbekérő
  kell.”
- **A vásárló adatai:** név, kattintható telefonszám, e-mail, cég, adószám, számlázási cím. Az átvétel módja és
  címe, kért-e felmérést, megjegyzés, forrás, beérkezés ideje.
- **Tételenként:**
  - leírás, darabszám, expressz, bruttó ár;
  - a fájlok neve, mérete és letöltő linkje, vagy „Nincs feltöltött fájl: e-mailben küldi”;
  - a felbontás minősítése, ha van („a böngésző mérte, tájékoztató”).
- **Telepítésnél:** a helyszíni fotók linkjei.
- **Összegek:** a tételek nettó összege, az átvételi díj (vagy „egyedi, a visszaigazoláskor”), nettó, ÁFA és
  bruttó végösszeg.
- **Link a vásárló állapotoldalára,** hogy a műhely a kézi levelébe bemásolhassa.

**Küldés:** a meglévő értesítési sor viszi (`d1NotificationQueue`, `deliverPending`), ugyanazzal a kölcsönzési
idővel és 24 órás újrapróbálással, mint a visszahívást és az ajánlatkérést. Amíg a domain nincs a Cloudflare-en,
a levél a naplóba kerül (`logMailer`).

## 10. Állapotoldal: `/rendeles/[token]`

- **Biztonság:**
  - szerveroldali, `noindex`;
  - fejlécek: `Cache-Control: private, no-store`, `Referrer-Policy: no-referrer`;
  - nincs rajta a mérés jeladója, így a token nem kerül a mérésbe;
  - ismeretlen vagy hibás alakú token esetén 404.
- **Tartalom:**
  - **A rendelés:** rendelésszám, beküldés napja és állapot (`OrderStatusBadge`, az `ORDER_STATUSES` szövegével).
  - **Mi jön most:** rövid szöveg az állapothoz. Beérkezett rendelésnél: „Ellenőrizzük a fájlt, az anyagot és a
    határidőt, majd e-mailben visszaigazoljuk a végleges árat és küldjük a díjbekérőt. Fizetni csak a díjbekérő
    alapján kell.”
  - **A tételek:** leírás, darabszám, bruttó ár, fájlnevek.
  - **Átvétel és összegek:** az átvétel módja, nettó, ÁFA és bruttó, a „végleges ár eltérhet” felirattal.
  - **Fájl nélküli tételnél:** „Küldje el a grafikát e-mailben: …, a tárgyban: R-0001”.
  - **Kérdés esetén:** a telefonszám.
- **Személyes adat** (név, telefon, cím) nincs az oldalon, így egy továbbküldött link nem fed fel semmit.
- **`?uj=1`:** köszönő panel (`SuccessPanel`): „Köszönjük, megkaptuk a rendelését.” és „Mentse el ezt az oldalt,
  itt követheti a rendelés állapotát.”
- **Állapotváltás** ebben a körben csak kézzel történik a D1-ben (a 4c építi meg a felületét). Az oldal mindig a
  `status` mezőt mutatja.

## 11. Időzített feladatok

A meglévő 15 perces cron két feladattal bővül:

- **A rendelések levelei:** a `deliverPendingOrders` újrapróbálja az el nem ment értesítéseket.
- **Gazdátlan fájlok törlése:** a 3 napnál régebbi, rendeléshez nem kötött feltöltéseket törli az R2-ből és a
  D1-ből, futásonként legfeljebb 100-at. A kosár ezért jelzi a 3 napnál régebbi fájlokat: „Ez a fájl lejárt,
  töltse fel újra.”

## 12. Hibák a vásárló szemével

| Helyzet | Amit lát |
|---|---|
| A fájl túl nagy (95 MB fölött) | „A fájl túl nagy, legfeljebb 95 MB lehet.” A tétel fájl nélkül is kosárba tehető; a fájlt a rendelés után e-mailben küldheti, a rendelésszámmal |
| Nem fogadott fájltípus, vagy a tartalom nem egyezik a kiterjesztéssel | „Ezt a fájlt nem tudjuk fogadni.” Alatta az elfogadott típusok és az e-mailes út |
| A tárhely nem elérhető (503) | „A fájlfeltöltés most nem működik. Tegye kosárba fájl nélkül, és a rendelés után küldje el e-mailben.” |
| Megszakadt feltöltés | A fájl sorában „Újra” gomb |
| Lejárt vagy már nem létező fájl a beküldéskor | A pénztár a tételnél jelzi: töltse fel újra, vagy küldje e-mailben |
| Hibás adat | Összesítő a pénztár tetején, üzenet a mező alatt |
| Szerver- vagy adatbázishiba | A `SAVE_FAILED_MESSAGE` a telefonszámmal; az adatai megmaradnak |
| Túl sok beküldés | A `TOO_MANY_MESSAGE` |
| Dupla kattintás vagy újraküldés | A gomb küldés közben tiltott; ugyanaz a token ugyanazt a rendelést adja vissza |
| A szerver más árat számol | A szerver ára számít, és az állapotoldal azt mutatja |
| Sérült vagy régi kosár | A hibás tétel kikerül, üzenettel |
| Nincs JavaScript | A termékoldal az adatokat és az árakat mutatja, mellette ajánlatkérés és visszahívás |

## 13. Biztonság és adatvédelem

- **A feltöltött fájlok soha nem nyilvánosak.** Az R2-kulcs véletlen, a fájlnév csak metaadat, és a letöltés
  csak a 6. fejezet szerint, csatolmányként működik.
- **Ár és összeg** mindig a szerveren számolódik.
- **Eredet-ellenőrzés:** minden `/api/*` POST maga ellenőrzi az `Origin` fejlécet. Az Astro `checkOrigin` csak az
  űrlap-tartalomtípusokat nézi, a JSON-t és a nyers fájlt nem.
- **Az állapotlink:** 128 bites véletlen token. Az oldal nem mutat személyes adatot, és nem adja tovább a címét
  (`no-referrer`).
- **A böngészőben:**
  - a `localStorage`-ban csak a kosár van (beállítás, fájlazonosító és -név);
  - a pénztár vázlata a `sessionStorage`-ban marad.
- **Megőrzés:**
  - A gazdátlan fájlok 3 napig maradnak meg.
  - A rendelés fájljai a lezárás után 30 napig (keret 8. fejezet). Ennek törlése a 4c-vel jön, mert rendelést
    lezárni csak ott lehet.

## 14. Sebesség

- **A termék-, a kosár- és a pénztároldal:** legfeljebb ~130 KB JavaScript (gzip), `client:idle`. A React és a
  domainkód közös csomag, a három oldal között a böngésző gyorsítótárából jön.
- **A fájlelemző** (`pdf-lib`) külön csomag. Csak az első fájlválasztáskor töltődik be, ezért a keretbe nem
  számít bele.
- **A `/webshop` és a többi tartalmi oldal:** 0 KB keretrendszer-JS. Csak a kosár darabszámát kiíró script fut
  (~1 KB).
- **A keret módosul:** az 5. fejezet táblázata külön sort kap: a varázsló ~70 KB-os, a webshop eszközoldalai
  ~130 KB-os keretet.
- **A build utáni csomagméret-ellenőrzés** (keret 5. fejezet, „Őrzés”) most készül el: egy script a build után
  összeméri az oldalankénti JavaScriptet a kerettel, és túllépésnél hibával áll le.

## 15. Akadálymentesség

A keret 6. fejezete szerint, és ezen felül:

- **A konfigurátor élő ára** `aria-live="polite"` területen frissül, a gépelés után kis késleltetéssel.
- **A kosár fiókja** fókuszcsapdás párbeszédablak. Az Escape bezárja, és a fókusz visszakerül a „Kosárba”
  gombra.
- **A feltöltés haladása** szövegként is olvasható („logo.pdf: 45%”).
- **Minden állapot** szövegesen is megjelenik, nem csak színnel (felbontás-minősítés, állapotjelvény).

## 16. Tesztek

- **Domain (Vitest):**
  - a kosártároló olvasása (sérült, régi verzió, lejárt fájl);
  - az `R` rendelésszám;
  - a feltöltés ellenőrzése: méret, kiterjesztés és tartalom egyezése;
  - az állapotoldal szövegei.
- **Szerver** (Vitest, a helyi D1-gyel `test-d1.ts` és helyi R2-vel):
  - a feltöltés és a letöltés szabályai;
  - a rendelés mentése: tranzakció, azonos token, fájlok kötése, foglalt fájl;
  - a gazdátlan fájlok törlése;
  - a műhely levelének formája és az értesítési sor.
- **Szigetek (jsdom):**
  - konfigurátor: méretből ár, a fájlelemzés eredményének kitöltése, Kosárba;
  - kosár: betöltés, kidobás, módosítás, törlés;
  - pénztár: hibaösszesítő és fókusz, a mezőhibák visszaírása, sikeres beküldés után az állapotoldalra lépés.
- **Böngészőben,** a lefordított Workerrel:
  - a teljes út asztali és mobil (375 px) méretben;
  - csak billentyűzettel;
  - a termékoldal JavaScript nélkül;
  - feltöltés valódi PDF-fel és nagy fájllal.
- **E-mail:** a napló és az egységtesztek elegendők. Ha mégis valódi levél kell, `ORDER_NOTIFY_EMAIL` a
  `.dev.vars`-ban: `leonardistenes@gmail.com`.

## 17. Előfeltételek és környezet

- **R2 bekapcsolása** (a felhasználó, a Cloudflare Dashboardon). Utána:
  1. Létrejön a `stiletdekor-uploads-dev` tároló (a két dev oldal és a Preview-k közös tárolója). A
     `stiletdekor-uploads-prod` az élesítéskor készül.
  2. Az `UPLOADS` kötés visszakerül a `wrangler.jsonc` minden blokkjába.
  3. Az `env.d.ts`-ben a kötés újra kötelező lesz.
- **Amíg az R2 nincs bekapcsolva:** a kötés nincs a konfigurációban, és a kód ezt az 503-as ágon kezeli (a dev
  oldalakon a feltöltés helyett az e-mailes út látszik). A tesztek és a helyi böngészős próba a helyi
  R2-szimulációval futnak.
- **Új beküldési korlát:** `UPLOAD_LIMITER` (20 kérés 60 másodperc alatt, saját névtér) minden környezetben, mert
  a `ratelimits` nem öröklődik.
- **Migráció:** a `0003_orders.sql` helyben és a dev D1-en.

## 18. Kimarad ebből a körből

- **A műhely-felület (4c, Cloudflare Access mögött):** állapotváltás, visszaigazolás, díjbekérő, módosításkérés,
  a fájlméret-eltérés figyelmeztetése.
- **Automatikus vásárlói e-mailek:** megkaptuk, visszaigazolás, emlékeztető, lejárat. Ehhez kell a domain
  levélküldése.
- **Automatikus lezárás 8 nap után:** a visszaigazolás része, ezért a 4c-vel jön.
- **A lezárt rendelések fájljainak törlése 30 nap után:** a 4c-vel jön, mert csak ott lehet lezárni.
- **Szerveroldali méret-újraellenőrzés** (brief 8): a Workers CPU-kerete miatt külön döntést kíván. Addig a
  böngésző mérése tájékoztató, és a műhely a fájlt maga nézi meg.
- **Felületcsomag** (brief 9).
- **Egyedi méretű plakát** (függőben, brief 4.1).
- **A táblák rögzítési módja** (brief 11): addig a mai furat- és távtartó-darabszám marad.
- **Egyéb:** számlázóprogram, qvik-QR. Kártyás fizetés nem kell.
