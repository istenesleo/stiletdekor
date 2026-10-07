# A kezdőlap szövegmennyisége – átnézés

Kérés (2026-10-06): a kezdőlapon túl sok a szöveg; egyelőre ne módosítsunk, csak nézzük át.
Az átnézés a két látványterv (`design/mockups/`) 2026-10-06-i állapotát méri; ez az állapot a dev oldalakon a
`/mentes` címen látható. 2026-10-07: a javasolt rövidítést megnézésre beépítettük mindkét tervbe
([lent](#a-rövidített-változat-a-látványtervekben-2026-10-07)). Döntés még nincs.

**Mérés:** a betöltés után látható szavak 1440 px széles nézetben, Chromiumban. A rejtett varázslólépések, a
kosár és a tervezői jegyzetek nincsenek benne.

## Számok a rövidítés előtt (2026-10-06)

| Szakasz | A · Neon (szó) | B · Galéria (szó) | Mi adja a mennyiséget |
|---|---:|---:|---|
| Fejléc | 14 | 16 | menü |
| Hero | 76 | 85 | cím, 23 szavas bevezető, két belépő leírással, „felmérés → … → telepítés” lánc |
| Szolgáltatások | 159 | 151 | négy csoport minden tétellel és címkével, ígéretsáv |
| Webshop | 498 | 386 | a teljes konfigurátor a kezdőlapon: anyagkártyák adatokkal, árbontás, határidő, helyszíni előnézet, újrarendelés |
| Ajánlatkérés | 118 | 117 | a varázsló első lépése, kilenc munkatípus rövid leírással |
| Referenciák | 210 | 193 | kilenc képaláírás (átlagosan 12 szó), előtte–utána magyarázat |
| Folyamat | 105 | 85 | négy lépés leírással |
| Rólunk | 98 | 141 | három pillér, csapat- vagy anyagsáv |
| Kapcsolat | 87 | 63 | elérhetőségek, üzenetküldő |
| Lábléc | 61 | 56 | linkek |
| **Összesen** | **1 449** | **1 298** | kb. 6–7 perc olvasás |

A webshop szakasz egyedül az A-ban a szöveg harmada. A konfigurátoron belül (A): árdoboz 89, anyagkártyák 77,
anyagadatok 58, munkaasztal 59, helyszíni előnézet 56, újrarendelés 41 szó. A B-ben a beállítómezők 146, a
vásárlódoboz 109 szó.

**Ismétlés:** a fő ígéret szinte minden szakaszban újra elhangzik. A „felmér…” szótő az A-ban 15-ször, a B-ben
14-szer szerepel; a „saját műhely” 7-szer, illetve 6-szor; a „telepít…” 8-szor, illetve 9-szer.

**Csak a látványtervben van:** „helyőrző” címkék (6, illetve 7) és „Demó”/„Élesben” magyarázatok. Ezek az éles
oldalról eleve kimaradnak, de a mostani benyomást növelik.

**Hosszú bekezdés kevés van** (22 szónál hosszabb blokk szakaszonként legfeljebb 1–2). A sok szöveg nem
bekezdésekből, hanem a sok apró elemből (címke, adat, képaláírás, súgó) adódik.

## Javaslat (döntésre vár)

A kezdőlap legyen áttekintés, a részletek kerüljenek az aloldalakra. Ezek az aloldalak a tervben már
szerepelnek: `/webshop`, `/ajanlatkeres`, `/referenciak`, `/kapcsolat`. Célérték: **450–600 szó** a kezdőlapon.

| Szakasz | Javaslat a kezdőlapra | Cél (szó) |
|---|---|---:|
| Hero | Cím, egy mondat (legfeljebb 20 szó), két gomb: webshop és ajánlatkérés. A lánc maradhat ikonsorként. | 30–40 |
| Szolgáltatások | Csoportnév és a tételek neve, leírás nélkül. Az ígéretsáv elhagyható, mert a hero már elmondja. | 80–100 |
| Webshop | A hat termék „-tól” árral és egy gomb. A teljes konfigurátor a `/webshop` oldalra kerül. | 50–70 |
| Ajánlatkérés | A kilenc munkatípus neve és egy gomb. A varázsló az `/ajanlatkeres` oldalon fut. | 40–60 |
| Referenciák | 4–6 kép, aláírás: felület · helyszín (3–5 szó), „Összes munka” link. | 40–60 |
| Folyamat | Négy lépés, lépésenként egy sor (legfeljebb 12 szó). | 40–50 |
| Rólunk | Három pillér, egy-egy rövid mondattal. | 40–60 |
| Kapcsolat | Telefon, e-mail, cím, nyitvatartás, térkép. Az üzenetküldő a `/kapcsolat` oldalon. | 30–50 |
| Fejléc, lábléc | Marad. | 65 |

**A fő ígéretet egyszer mondjuk ki:** a heroban, és egyszer megmutatjuk a folyamatsávban. A többi szakasz már
nem ismétli.

**A `/webshop` oldalon is lehet rövidíteni:**
- az anyagadatok egy „Adatok” nyitógomb mögé kerülhetnek;
- az árbontás alapból csak a végösszeget mutatja, „Részletek” gombbal nyitható;
- a határidő alatti sor rövidebb lehet: „3 munkanap a befizetéstől”;
- a helyszíni előnézetnek elég egy sor súgó.

## A rövidített változat a látványtervekben (2026-10-07)

Kérés: nézzük meg a javasolt változatot. Mindkét látványterv kezdőlapja rövid áttekintés lett, ugyanazzal a
szöveggel. A régi változat a dev oldalakon a `/mentes` címen látható, így a kettő összevethető.

**Aloldalak a látványtervben.** A látványterv egyetlen HTML-fájl, ezért az aloldalakat a cím `#/` utáni része
nyitja meg: `/#/webshop`, `/#/ajanlatkeres`, `/#/referenciak`, `/#/kapcsolat`. A menü, a gombok és a kezdőlapi
ajánlók ezekre mutatnak; a böngésző vissza gombja oda viszi vissza a látogatót, ahol a kezdőlapon járt. Élesben
ezek valódi oldalak lesznek (`/webshop` stb.).

| Szakasz | A · Neon (szó) | B · Galéria (szó) | Ami a kezdőlapon maradt |
|---|---:|---:|---|
| Fejléc | 14 | 16 | menü |
| Hero | 51 | 46 | cím, egymondatos bevezető, két belépő, a négylépéses lánc |
| Vonalzó (csak A) | 18 | – | díszítés, számok |
| Szolgáltatások | 96 | 72 | négy csoport a tételek nevével; „Online ár” címke a webshopos tételeken. Az A-ban a mérőszalag 30 száma is itt van. |
| Webshop | 45 | 51 | hat termék „-tól” árral, „Webshop megnyitása” |
| Egyedi ajánlat | 42 | 42 | a kilenc munkatípus, „Ajánlatot kérek” |
| Referenciák | 19 | 19 | hat kép rövid címmel, „Összes munka” |
| Folyamat | 52 | 44 | négy lépés, lépésenként egy mondat |
| Rólunk | 49 | 47 | három pillér, egy-egy mondattal |
| Kapcsolat | 58 | 55 | elérhetőségek, térkép, „Üzenetet írok” |
| Lábléc | 61 | 56 | linkek |
| **Összesen** | **510** | **453** | előtte 1 449, illetve 1 298 |

Mérés ugyanúgy, mint fent. Az A-ban a vonalzó és a mérőszalag számai nélkül kb. 460 szó.

**Ismétlés:** a „felmér…” szótő 8-szor, illetve 7-szer szerepel (előtte 15 és 14), a „saját műhely” 4-szer
(előtte 7 és 6), a „telepít…” 6-szor, illetve 5-ször (előtte 8 és 9).

**Ami átkerült az aloldalakra:**
- Webshop: a teljes konfigurátor, az árbontás, a határidő és az újrarendelés. A B-ben ide került az
  anyagminta-sáv is, eddig a Rólunk alatt volt.
- Ajánlatkérés: a varázsló. A kezdőlapi munkatípusok és szolgáltatások a kiválasztott típussal, a második
  lépésnél nyitják meg.
- Referenciák: a kilenc munka szűrővel, az előtte–utána csúszka. A kezdőlapi képek a saját kategóriájukra
  szűrve nyitják meg.
- Kapcsolat: az üzenetküldő. Az elérhetőségek és a térkép a kezdőlapon is megmaradt.

**Szövegváltozások a kezdőlapon:**
- Rövidebb szolgáltatásnevek, néhol összevonva. „Cégérek és reklámtáblák” (eddig: Cégérkészítés; Reklámtáblák
  vázszerkezettel és belső LED-es világítással), „Díszletek és fotófalak” (Rendezvény díszletezés és fóliázás;
  Fotófal építés), „Egyedi reklám- és díszítési munkák” (Egyedi reklám- és díszítési megrendelések; Egyéb arculati
  megoldások), „Kínálópultok fóliázása” (… és telepítése), „3D nyomtatás” (3D nyomtatási munkák). A teljes lista
  a szolgáltatásoldalakra való.
- Elmaradt: a szakaszbevezetők (a webshop és az ajánlatkérés kivételével), az ígéretsáv, a képaláírások
  projektadatai, a folyamat „Eredmény” sorai.
- A két irány szövege azonos, csak a tipográfia más (a B dőlt kiemelései és záró pontjai). Egy kivétel: az
  utolsó referenciakép aláírása a rajzhoz igazodik (A: „Molinó építési kerítésen”, B: „Hálós molinó állványon”).
- A webshop-ajánló a terv saját konfigurátorának „-tól” árait mutatja; ezek helyőrzők, ezért a két tervben
  eltérhetnek (roll-up: A 12 900, B 24 900 Ft-tól). A valódi árak a katalógusban vannak.

### Ha a rövid kezdőlap marad

- A valódi oldalak a látványterv szerint épülnek: `/` (áttekintés), `/webshop`, `/ajanlatkeres`, `/referenciak`,
  `/kapcsolat`.
- A UI-könyvtár menüje (`src/ui/navigation.ts`) a horgonyok helyett ezekre mutat: Webshop, Referenciák,
  Kapcsolat és az „Ajánlatkérés” gomb. A Szolgáltatások, a Folyamat és a Rólunk kezdőlapi horgony marad.
- A `/webshop` oldal rövidítése (fent: adatok nyitógomb mögött, árbontás „Részletek” mögött) külön döntés.
