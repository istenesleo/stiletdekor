# A weboldal működési elvei

Dátum: 2026-10-08 · Állapot: **jóváhagyott keret**. Az alprojektek (11. fejezet) erre építve saját specet és
tervet kapnak; az első a „Keret és gyors visszahívás”.

## Cél

A teljes Stilet Dekor oldal közös működése: milyen oldalak vannak, hogyan jut el a látogató a kéréséig, hogyan
dolgozza fel a szerver az űrlapokat, milyen gyors, akadálymentes és mérhető az oldal, és milyen sorrendben épül.
Az üzleti tartalom forrása továbbra is a [brief](../../brief.md), a műszaki felépítésé az
[architecture.md](../../architecture.md); ez a dokumentum a kettő közötti működést rögzíti.

**Döntések (2026-10-08):**

| Kérdés | Döntés |
|---|---|
| Hatókör | Az egész oldal, lépésenként: előbb ez a közös keret, utána alprojektek |
| Fő üzleti cél | Egyedi munkák ajánlatkérése. A webshop a második belépő, a referenciák a bizalmat építik |
| Gyors út | Visszahívás kérése rövid űrlappal, az ajánlatkérő varázsló mellett |
| Kezdőlap | Rövid (450–600 szó), a részletek aloldalakon ([szovegmennyiseg.md](../../szovegmennyiseg.md) javaslata) |
| Időígéret | Nincs. Az oldal annyit ír: „Hamarosan visszahívjuk.” A műhely minden kérésről e-mailt kap |
| Mérés | Sütimentes: Cloudflare Web Analytics és a konverziók a saját adatbázisból |
| Építési sorrend | Az ajánlatkérés útja először; élesítés csak a webshoppal együtt |
| Design-irány | A működés független tőle: tokenek és `src/ui` komponensek. Az irány később dől el |
| Alapelv | Először HTML: ami pénzt hoz (telefon, visszahívás, ajánlatkérés), JavaScript nélkül is működik |

## 1. Oldaltérkép

„Előre generált”: buildkor készül statikus HTML, a Cloudflare hálózatáról jön, szerveroldali kód nem fut.
„Szerveren”: a Worker állítja elő (űrlap fogadása, egyedi adat).

| Cím | Előállítás | Feladat |
|---|---|---|
| `/` | Előre generált | Rövid kezdőlap: hero két belépővel (**Egyedi ajánlat** · Online rendelés), a 4 szolgáltatáscsoport, kiemelt referenciák, a folyamat 4 lépése, a végén ajánlatkérés és visszahívó blokk |
| `/szolgaltatasok` | Előre generált | A 4 csoport és a „Helyszíni felmérés és telepítés” ígéret |
| `/szolgaltatasok/[csoport]` | Előre generált | Mit vállalunk, a csoport referenciái és webshop-termékei, gombok a csoport ajánlattípusaira (3.1), visszahívó blokk |
| `/ajanlatkeres` | Előre generált | Elágazás: munkatípus-választó (9 csempe), mellette „Inkább visszahívást kérek” |
| `/ajanlatkeres/[tipus]` | Szerveren | A varázsló egy típusra; a 9 típus a `QUOTE_TYPE_IDS` szerint (`autofoliazas`, `kirakat`, `ceger`, `betuk`, `led-fal`, `rendezveny`, `kinalopult`, `3d-nyomtatas`, `egyeb`) |
| `/ajanlatkeres/koszonjuk` | Szerveren | Köszönő oldal hivatkozási számmal |
| `/visszahivas` | Szerveren | Önálló visszahívó űrlap |
| `/visszahivas/koszonjuk` | Szerveren | Köszönő oldal hivatkozási számmal |
| `/webshop`, `/webshop/[termek]` | Előre generált + sziget | Kategóriák, konfigurátor (brief 4.1) |
| `/kosar`, `/penztar` | Előre generált + sziget | Kosár, rendelés elküldése ellenőrzésre (brief 10.) |
| `/rendeles/[token]` | Szerveren | Rendelés állapota titkos linken; beküldés után köszönő nézettel ([webshop spec](2026-10-09-webshop-4a-4b-design.md)) |
| `/referenciak`, `/referenciak/[felulet]` | Előre generált | Rács, előtte/utána csúszka. A felület szerinti szűrés linkekkel, felületenként saját oldallal (például `/referenciak/jarmu`), így JavaScript nélkül is működik, és a keresők is látják |
| `/rolunk` | Előre generált | Folyamat (Felmérés → Tervezés → Gyártás saját műhelyben → Telepítés), miért mi |
| `/kapcsolat` | Előre generált | Telefon, e-mail, cím másolás gombbal, nyitvatartás, statikus térkép, visszahívó blokk |
| `/aszf`, `/adatkezeles`, `/impresszum` | Előre generált | Jogi oldalak (a menü `/adatkezeles`-t használ; az architecture.md-ben is ez lett) |
| 404 | Előre generált | Rövid szöveg, alatta a 3 fő út: ajánlatkérés, webshop, telefon |

## 2. Navigáció

- **Fejléc minden oldalon:** szómárka · menü (Szolgáltatások · Webshop · Referenciák · Rólunk · Kapcsolat) ·
  telefonszám · kosár · **Ajánlatkérés** gomb. A „Folyamat” menüpont kimarad: a kezdőlapon és a Rólunk oldalon
  szakasz.
- **Mobilmenü (1040 px alatt):** a böngésző beépített felugró paneljével (`popover` és `popovertarget`) nyílik,
  script nélkül; az Escape bezárja. A mostani `SiteHeader` (React, `useState`) ehhez átalakul, hogy hidratálás
  nélkül, statikus HTML-ként is működjön. A kosár gomb statikus oldalon link a `/kosar`-ra; a darabszámot a
  webshop alprojektje írja ki.
- **Mobilos akciósáv (720 px alatt):** alul rögzített, két gomb: **Hívás** (`tel:`) és **Ajánlatkérés**. Űrlapoldalakon
  (`/ajanlatkeres/[tipus]`, `/visszahivas`) és a pénztárban nem jelenik meg. Új komponens a `src/ui`-ban.
- **Lábléc:** kapcsolat (kijelölhető szöveg, másolás gomb), Szolgáltatások és Rendelés oszlop, nyitvatartás, jogi
  linkek.
- **Morzsamenü:** a csoport-, a termék- és a varázslóoldalakon (strukturált adattal, 9. fejezet).

**A gombok rangsora:**

1. **Ajánlatkérés:** oldalanként egyetlen kiemelt gomb.
2. **Visszahívás:** a gyors út; az ajánlatkérés elágazásában, a csoportoldalak, a kezdőlap és a Kapcsolat oldal
   alján beágyazott rövid űrlap.
3. **Telefon és e-mail:** mindig kéznél (fejléc, lábléc, akciósáv).
4. **Webshop:** másodlagos belépő (a hero második gombja, a Nyomtatás csoport).

## 3. Az utak

### 3.1 Ajánlatkérés

Belépők: fejléc gomb, akciósáv, hero, csoportoldalak, referenciák vége → `/ajanlatkeres` (típusválasztó) →
`/ajanlatkeres/[tipus]` → `/ajanlatkeres/koszonjuk`. A csoportoldalak egyenesen a típusra mutatnak:

| Csoport | Ajánlattípusok |
|---|---|
| Fóliázás | `autofoliazas` · `kirakat` · `kinalopult` · `egyeb` |
| Cégér és világító reklám | `ceger` · `betuk` · `led-fal` |
| Nyomtatás | a webshop termékei; nagy vagy egyedi munkára `egyeb` |
| Rendezvény és egyedi | `rendezveny` · `3d-nyomtatas` · `egyeb` |

### 3.2 Visszahívás

Belépők: az `/ajanlatkeres` elágazás, a beágyazott blokkok (2. fejezet), a 404 és a hibaüzenetek → `/visszahivas`
vagy helyben a blokk → `/visszahivas/koszonjuk`.

### 3.3 Webshop

A brief 4.1 és 10. fejezete szerint; a működési elvek (4–8. fejezet) itt is érvényesek. A konfigurátor
JavaScript-sziget; JavaScript nélkül a termékoldal az adatokat, az árakat és a visszahívás/ajánlatkérés utat
mutatja.

## 4. Az űrlapok közös működése

### 4.1 Egy beküldés útja

1. **Szűrés:** az `Origin` fejléc ellenőrzése; rejtett csapdamező (honeypot); beküldési korlát IP-címenként
   (Workers Rate Limiting: űrlaptípusonként 60 másodperc alatt legfeljebb 5).
2. **Ellenőrzés a szerveren** ugyanazokkal a Zod-sémákkal, mint a böngészőben (`src/domain/schemas.ts`; a
   varázslóhoz a meglévő `QuoteRequestSchema`, a visszahíváshoz új séma).
3. **Mentés a D1-be** hivatkozási számmal (4.2). A táblákat az 1. és 2. alprojekt specje rögzíti.
4. **Köszönő oldal:** 303-as átirányítás a `…/koszonjuk?szam=AK-0142` címre (Post/Redirect/Get, frissítésre
   nem küld újra). Az oldal csak a formátumában ellenőrzött számot mutatja, adatot nem tölt be. Tartalma: a szám;
   mi történik ezután (megkaptuk → visszahívjuk → felmérés vagy ajánlat), időígéret nélkül; sürgős esetre a
   telefonszám.
5. **Értesítés a műhelynek** a válasz után, a háttérben (`waitUntil`), 4.6 szerint.

Minden beküldés eltárolja a forrását (`forras`): az oldal útvonala és a gomb vagy blokk azonosítója, például
`/szolgaltatasok/foliazas#zaro-blokk`. Ebben nincs személyes adat; a méréshez kell (7. fejezet).

### 4.2 Hivatkozási szám

Rövid, telefonon kimondható: `AK-` (ajánlatkérés), `VH-` (visszahívás) vagy `R-` (webshop-rendelés), utána legalább 4 számjegyű sorszám a
D1-ből, például **AK-0142**. Megjelenik a köszönő oldalon és az értesítő e-mail tárgyában.

### 4.3 Űrlapszabályok

- Minden mező fölött látható címke; a nem kötelező mezők „(nem kötelező)” jelölést kapnak.
- Hiba beküldéskor: összesítő az űrlap tetején, linkekkel a hibás mezőkre, és a mező alatti üzenet. A fókusz az
  összesítőre kerül, a képernyőolvasó felolvassa. JavaScripttel a mező elhagyásakor is ellenőriz, gépelés közben nem.
- A beírt adat nem vész el: hibánál a szerver visszaírja; JavaScripttel a varázsló vázlata a böngésző
  `sessionStorage`-ában a lap bezárásáig megmarad.
- Kétszeres beküldés ellen: a gomb küldés közben tiltott, és minden űrlap egyszer használatos tokent kap. Ugyanazzal
  a tokennel érkező második beküldés nem ment újra, hanem az első hivatkozási számát adja vissza.
- Mobilbarát mezők: `type="tel"`, `inputmode`, `autocomplete` (`name`, `tel`, `email`, `street-address`).
  A telefonszám az `isPlausiblePhone` szerint (+36, 06, szóközök, külföldi szám).
- Az elküldés gomb alatt egy sor link az adatkezelési tájékoztatóra. Előre bejelölt jelölőnégyzet nincs.

### 4.4 A visszahívó űrlap

| Mező | Kötelező | Szabály |
|---|---|---|
| Név | igen | 2–100 karakter (a meglévő névszabály) |
| Telefonszám | igen | `isPlausiblePhone` |
| Munka típusa | nem | a 9 ajánlattípus vagy „Még nem tudom” |
| Röviden, miről van szó | nem | legfeljebb 300 karakter |

Ennél több mező nincs. A beágyazott blokk és a `/visszahivas` oldal ugyanazt az űrlapot használja; a blokk is a
`/visszahivas` címre küld, és hiba esetén ott jelenik meg az űrlap a beírt adatokkal.

### 4.5 Az ajánlatkérő varázsló

- **JavaScript nélkül:** egyetlen hosszú űrlap, a lépések `fieldset`-ekben.
- **JavaScripttel:** lépésenként, folyamatjelzővel: 1. részletek (a típus kérdései, brief 4.2) · 2. helyszín,
  határidő, fájlok · 3. kapcsolat és „Helyszíni felmérést kérek”. A típus a címből jön, ezért nem lépés.
- **Fájlok:** a feltöltéshez (`POST /api/uploads`) be kell kapcsolni az R2-t a Cloudflare-fiókban. Amíg nincs
  bekapcsolva, a varázsló fájl nélkül küldhető be, és a köszönő oldal kéri, hogy a fotókat a hivatkozási számmal
  e-mailben küldje.
- Az űrlapon jól látható: „A végleges árajánlat eltérhet a kalkulált ártól.” (brief 4.2).

### 4.6 Értesítés a műhelynek

- **Címzett:** az `ORDER_NOTIFY_EMAIL` változó (ma `stiletdekor@gmail.com`).
- **Tárgy:** „[AK-0142] Ajánlatkérés – Autófóliázás – Kiss Péter”, illetve „[VH-0087] Visszahívás – Kiss Péter”.
- **Törzs:** kattintható telefonszám, minden megadott adat táblázatban, helyszín, határidő, kért-e felmérést,
  a fájlok lejáró, aláírt linkjei, a forrás. Ha az ügyfél megadta az e-mail-címét, a `Reply-To` az övé.
- **Küldő:** egy `Notifier` interfész mögött. A megvalósítást az 1. alprojekt választja: ha a domain a
  Cloudflare-en van, a Cloudflare Email Routing `send_email` kötése (ingyenes, az ellenőrzött műhelycímre küld);
  különben tranzakciós levélküldő. Fejlesztéskor a levél a naplóba kerül.
- **Az adatbázis az igazság forrása.** A kérés mentése után az értesítés hibája nem veszít el semmit: a sor
  „értesítve” időpontja üres marad, és egy időzített feladat (Workers cron, 15 percenként) újrapróbálja. 24 óra után
  a hiba a Cloudflare naplójában (Issues) jelenik meg.
- **Az ügyfélnek** visszaigazoló e-mail a webshop alprojektjében készül (a rendelésekhez kell); onnantól az
  ajánlatkérés is kap ilyet.

### 4.7 Hibák a látogató szemével

| Helyzet | Amit lát |
|---|---|
| Hibás adat | Az űrlap a beírt adatokkal és az összesítővel |
| Szerver- vagy adatbázishiba | „Most nem sikerült elküldeni. Kérjük, próbálja újra, vagy hívjon: +36 70 538 5030.” Az adatai megmaradnak; a hiba a naplóba kerül |
| Túl sok beküldés | Udvarias üzenet a telefonszámmal |
| Kitöltött csapdamező | Látszólag sikeres beküldés; nem ment és nem értesít |

## 5. Sebesség

| Mit | Keret |
|---|---|
| Tartalmi oldalak JavaScriptje | 0 KB keretrendszer-JS; kivétel csak a mérés jeladója (7. fejezet). A fejléc script nélkül működik |
| Varázsló | Oldalanként legfeljebb ~70 KB (gzip); `client:visible` vagy `client:idle` |
| Webshop eszközoldalai (termék, kosár, pénztár) | Oldalanként legfeljebb ~130 KB (gzip), `client:idle`; a fájlelemző csak fájlválasztáskor töltődik be, nem számít bele (2026-10-09) |
| LCP (mobil, 4G, p75) | ≤ 2,0 s |
| CLS | ≤ 0,05 |
| INP | ≤ 200 ms |

- **Betűk:** saját tárhelyről (`woff2`), nem a Google Fonts-ról: gyorsabb, és nem adja át a látogató IP-címét.
  Latin és latin-ext részhalmaz, legfeljebb 2 család, a címbetű előtöltve, `font-display: swap`, a tartalék betű
  méretkiegyenlítéssel (`size-adjust`), hogy a szöveg ne ugorjon.
- **Képek:** AVIF/WebP, több méret (`srcset`), rögzített `width`/`height`; a hajtás alatt `loading="lazy"`, a
  hero képe `fetchpriority="high"`.
- **Őrzés:** build után automatikus ellenőrzés: a tartalmi oldalakon nincs nem engedélyezett script, és a
  szigetcsomagok a kereten belül vannak.

## 6. Akadálymentesség

WCAG 2.2 AA, és ennél szigorúbban: minden gomb és link érintési felülete legalább 44×44 px. Látható fókuszkeret,
„Ugrás a tartalomra” link, teljes billentyűzetes kezelés, `lang="hu"`. A hibaösszesítő `role="alert"`, a fókusz rá
kerül. `prefers-reduced-motion` esetén az animációk leállnak. A kontrasztot a tokenek tesztje ma is ellenőrzi.

## 7. Mérés

- **Cloudflare Web Analytics:** látogatások, oldalak, források, valós Core Web Vitals. Nincs süti, nincs
  személyes adat, nincs süti-banner. A jeladó csak akkor töltődik be, ha a környezetben be van állítva a token
  (`CF_BEACON_TOKEN`); a CSP ehhez engedi a `static.cloudflareinsights.com` scriptet és a `cloudflareinsights.com`
  kapcsolatot.
- **Konverziók a saját adatbázisból:** ajánlatkérések, visszahívások és rendelések hetente, a `forras` mező szerint
  bontva. Amíg nincs műhely-felület, a lekérdezések a README-ben vannak.
- **Fő mutatók:** heti ajánlatkérés és visszahívás; az `/ajanlatkeres` és a `/visszahivas` látogatóiból hányan
  küldenek be kérést.

## 8. Adatvédelem és biztonság

- A látogatónál nincs süti. A kosár a `localStorage`-ban, a varázsló vázlata a `sessionStorage`-ban marad.
- Adatminimalizálás: visszahíváshoz csak név és telefonszám kell.
- A Kapcsolat oldalon nincs beágyazott Google-térkép: statikus kép és „Megnyitás térképen” link.
- Megőrzés (javaslat, az adatkezelési tájékoztató rögzíti, jogász nézi át): a lezárt kérések adatai 12 hónapig, a
  feltöltött fájlok a lezárás után 30 napig.
- A feltöltött fájlok soha nem nyilvánosak; ár és összeg mindig a szerveren számolódik ([architecture.md](../../architecture.md)).

## 9. Megtalálhatóság

Minden oldal saját `title`, `description` és egy `h1`. A csoport- és varázslóoldalak konkrét keresésekre céloznak
(például „autófóliázás Budapest”). Strukturált adat: `LocalBusiness` (cím, telefon, nyitvatartás), `Service`,
`BreadcrumbList`. `sitemap.xml`. Éles oldal előtt minden környezet `noindex` marad, ahogy ma.

## 10. Tartalmi és design-elvek

- Magázó, közvetlen, rövid mondatok (brief 2.); oldalanként egy fő cél és egy kiemelt gomb.
- Nincs kitalált adat: ami hiányzik (ügyfélnév, vélemény, szám), az jól látható helyőrző.
- Minden oldal a `src/ui` komponensekből és a tokenekből épül. A választott irány (A, B, vagy egy X-irány
  token-témává alakítva) csak a tokeneket és a témát cseréli. A G1–G4 elemek díszítésként használhatók; a G1
  jelenetek a referenciák helyőrzői, amíg nincsenek valódi fotók.

## 11. Alprojektek sorrendje

| # | Alprojekt | Tartalom | Eredmény |
|---|---|---|---|
| 1 | Keret és gyors visszahívás | Oldalkeret (fejléc `popover` mobilmenüvel, lábléc, akciósáv, 404); `/visszahivas` és a beágyazható blokk, D1, hivatkozási szám, köszönő oldal; szűrés; `Notifier` és újrapróbálás; Web Analytics és CSP | Működő visszahívás a dev oldalon; a kezdőlapon addig a látványterv marad |
| 2 | Ajánlatkérő varázsló | `/ajanlatkeres` elágazás, a 9 típusoldal, JavaScript nélküli űrlap és lépésenkénti sziget, vázlatmentés, köszönő oldal, értesítés; fájlfeltöltés, ha az R2 be van kapcsolva | Működő ajánlatkérés |
| 3 | Tartalmi oldalak | Rövid kezdőlap a látványterv helyén, `/szolgaltatasok` és a 4 csoport, `/referenciak`, Rólunk, Kapcsolat, SEO-alapok; a választott arculati irány betűi saját tárhelyről | A teljes tartalmi oldal |
| 4 | Webshop és rendelés | Konfigurátor (először a molinó), kosár, pénztár, `POST /api/orders`, állapotoldal, visszaigazoló e-mailek az ügyfélnek, műhely-felület a visszaigazoláshoz és a díjbekérőhöz (Cloudflare Access mögött). A saját specjében valószínűleg tovább bomlik | Működő webshop |
| 5 | Jogi oldalak és élesítés | ÁSZF, adatkezelési tájékoztató, impresszum (jogásznak előkészítve); éles környezet, `stiletdekor.hu`, Google Cégprofil link | Az éles oldal |

A betűk a végleges arculati iránytól függnek, ezért a döntés után költöznek saját tárhelyre (2026-10-08).

## 12. Később, most nincs benne

Angol nyelv; statisztikai felület; névtelen lépésszámláló a varázslóhoz (Workers Analytics Engine, azonosító
nélkül); qvik-QR a díjbekérőn; „Helyszínen” előnézet (brief 5.).

## 13. Ellenőrzés

Minden alprojektben: a domainlogika egységtesztekkel (Vitest); az űrlapok böngészőben JavaScripttel és nélküle is
végigpróbálva; akadálymentességi átnézés; a sebességkeretet a build utáni ellenőrzés őrzi (5. fejezet).

## 14. Az alprojektekben eldöntendő

| Kérdés | Mikor | Ki |
|---|---|---|
| A domain a Cloudflare-en van-e (ettől függ az e-mail-küldő) | 1. alprojekt | Felhasználó |
| A Web Analytics token létrehozása a Cloudflare-ben | 1. alprojekt | Felhasználó |
| Az R2 bekapcsolása (fájlfeltöltés) | 2. alprojekt előtt | Felhasználó |
| Valódi nyitvatartás (ma helyőrző a `src/domain/company.ts`-ben) | 3. alprojekt előtt | Műhely |
| Jogi szövegek átnézése | 5. alprojekt | Jogász |
