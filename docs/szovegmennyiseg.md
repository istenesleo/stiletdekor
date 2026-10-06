# A kezdőlap szövegmennyisége – átnézés

Kérés (2026-10-06): a kezdőlapon túl sok a szöveg; egyelőre ne módosítsunk, csak nézzük át.
Ez az átnézés a két látványterv (`design/mockups/`) állapotát méri. Döntés még nincs, a terveken nem változtattunk.

**Mérés:** a betöltés után látható szavak 1440 px széles nézetben, Chromiumban. A rejtett varázslólépések, a
kosár és a tervezői jegyzetek nincsenek benne.

## Számok

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

## Ha döntés lesz

A rövidítés a valódi oldalak építésekor történik, mindkét irányban ugyanazzal a szöveggel. A látványterveket
csak akkor írjuk át, ha a döntéshez látni kell a rövidebb változatot.
