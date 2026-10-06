# Komponenslista

A design system ezeket a komponenseket adja a weboldalnak. Prioritás: **P1** a webshop és a rendelés útja
(ez hozza az új megrendeléseket), **P2** a bemutatkozó oldalak, **P3** később.
Minden komponens tokenekből épül ([`tokens/stilet.tokens.json`](tokens/stilet.tokens.json)), és
390 px-en és 1440 px-en is hibátlan.

**Általános állapotok** (ahol értelmezhető): alap · hover · fókusz (billentyűzet) · aktív/lenyomott ·
kiválasztott · tiltott · betöltés · hiba · üres.

**Kód:** a komponens neve a `src/ui/`-ban (React, csak tokenekből). Minden P1 komponens elkészült; állapotaik
a dev oldalakon a `/komponensek` címen láthatók, mindkét irányban (`?tema=neon-muhely`, `?tema=galeria-editorial`).
A „—” jelű elemek még nincsenek kódban.

## Alapelemek

| Komponens | P | Változatok, állapotok | Hol | Kód |
|---|---|---|---|---|
| Gomb | P1 | elsődleges (márkaszín), másodlagos, szellem, link; kicsi/normál; ikonnal; betöltés | mindenhol | `Button`, `ButtonLink` |
| Ikongomb | P1 | kosár (darabszám-jelvénnyel), menü, bezárás, csere (szélesség↔magasság) | fejléc, konfigurátor | `IconButton` |
| Link | P1 | szövegközi, navigációs (aktív állapottal) | mindenhol | `TextLink`, `NavLink` |
| Jelvény, címke | P1 | darabszám, „Expressz”, „Helyőrző”, állapotcímke (rendelés státusza) | kosár, rendelés | `Badge`, `OrderStatusBadge` |
| Szűrőchip | P2 | kiválasztható, lenyomott állapot | referenciák, méretsablonok | — |
| Értesítősáv | P1 | info, figyelmeztetés, hiba, siker; pl. „A végleges ár eltérhet a kalkulált ártól.” | rendelés, ajánlatkérés | `Notice` |
| Felugró üzenet (toast) | P2 | „Kosárba tettük”, „Másolva” | kosár, kapcsolat | — |
| Elválasztó, hajszálvonal | P1 | vízszintes, szakaszcímmel | mindenhol | `Divider` |

## Űrlap

| Komponens | P | Változatok, állapotok | Hol | Kód |
|---|---|---|---|---|
| Szövegmező | P1 | címke, súgó, hibaüzenet, kötelező jel; név, e-mail, telefon, cím | pénztár, ajánlatkérés, kapcsolat | `TextField` (`Field`) |
| Mértékegységes számmező | P1 | cm, db; a két méretmező csere gombbal; **„A méret a fájlból”** jelzés | konfigurátor | `UnitField`, `SizeFields` |
| Méretarány-választó | P1 | 1:1, 1:10, egyéb; csak akkor jelenik meg, ha a fájl alapján indokolt | konfigurátor | `SegmentedChoice` |
| Darabszám-léptető | P1 | −/+ gombok, kézi beírás, minimum | konfigurátor, kosár | `QuantityStepper` |
| Választókártya (anyag) | P1 | anyagminta-textúra, név, bruttó m²-ár, adatlap (g/m², kül/beltér, élettartam) | konfigurátor | `MaterialPicker` |
| Opciósor ár-előnézettel | P1 | rádió vagy jelölő; egységár és a méretre számolt összeg | szélkidolgozás, kontúrvágás, furatolás | `OptionRow` |
| Kapcsoló | P1 | Expressz (+30%) | konfigurátor | `Switch` |
| Jelölőnégyzet | P1 | ÁSZF elfogadás, „Helyszíni felmérést kérek” | pénztár, ajánlatkérés | `Checkbox` |
| Legördülő, dátumválasztó | P2 | határidő, átvételi mód | ajánlatkérés, pénztár | — |
| Fájlfeltöltő | P1 | üres, ráhúzás közben, feltöltés, felismerve, hiba; több fájl miniatűrrel | konfigurátor, ajánlatkérés | `FileDrop`, `FileList` |

## Webshop és rendelés

| Komponens | P | Leírás | Hol | Kód |
|---|---|---|---|---|
| Termékkategória-csempe | P1 | név, „-tól” bruttó ár, illusztráció | webshop | `CategoryTile` |
| Méretsablon-chipek | P1 | gyakori méretek egy kattintással | konfigurátor | `ChipGroup` |
| Valós léptékű előnézet | P1 | a feltöltött grafika a választott arányban, 180 cm-es emberi sziluett, mm-es méretvonalak | konfigurátor | `ScalePreview` |
| Nyomdakész-lámpa | P1 | közlekedési lámpa (kiváló / megfelelő / gyenge), DPI-érték, magyarázat | konfigurátor | `ReadinessLight` |
| Arányeltérés-választó | P1 | „Kitöltés (vágással)” / „Illesztés (kerettel)” | konfigurátor | `FitPicker` |
| Felületlista (felületcsomag) | P1 | több oldalas PDF felületei: miniatűr, méret, darab, kihagyás; azonos felületek összevonva; készletszám | konfigurátor | `SurfaceList` |
| Árbontás | P1 | tételes sorok (m² × egységár, szélkidolgozás, kedvezmény), **bruttó végösszeg**, alatta kis sorban nettó + ÁFA | konfigurátor, kosár | `PriceBreakdown` |
| Kedvezmény-tipp | P1 | „Még 2 db és −10%” | konfigurátor | `DiscountHint` |
| Várható határidő | P1 | „Várhatóan [dátum]-ra elkészül” (a befizetéstől) | konfigurátor, kosár | `LeadTimeNote` |
| Kosárfiók | P1 | oldalról nyíló fiók, tételek (miniatűr, adatok, ár, törlés), összesítő | mindenhol | `Drawer`, `CartLine` |
| Pénztár-szakaszok | P1 | adatok, számlázás, átvétel (személyes / futár / telepítéssel), „Rendelés elküldése ellenőrzésre” | pénztár | `CheckoutSection`, `OrderSubmit` |
| Rendelés állapota | P2 | idővonal: Beérkezett → Ellenőrzés → Visszaigazolva → Befizetve → Gyártás → Kész | rendelés oldala, e-mailek | — |
| Újrarendelés | P3 | korábbi tétel egy kattintással vissza a kosárba | fiók, e-mail | — |

## Ajánlatkérés

| Komponens | P | Leírás | Kód |
|---|---|---|---|
| Lépésjelző | P1 | 4 lépés: Típus → Részletek → Helyszín és fotók → Kapcsolat; haladásjelző | `Stepper` |
| Munkatípus-kártya | P1 | a 9 egyedi munkatípus (autófóliázás, kirakat, cégér, világító betűk, LED-fal, rendezvény, pult, 3D nyomtatás, egyéb) | `JobTypePicker` |
| Sikerállapot | P1 | ajánlatkérés száma, mi történik ezután (visszahívás), „A végleges árajánlat eltérhet …” | `SuccessPanel` |

## Tartalom és navigáció

| Komponens | P | Leírás | Kód |
|---|---|---|---|
| Fejléc | P1 | szómárka, menü, telefonszám, „Ajánlatkérés” gomb, kosár; tapadó; mobilmenü | `SiteHeader`, `Wordmark` |
| Lábléc | P1 | elérhetőségek, ÁSZF, adatvédelem | `SiteFooter` |
| Hero | P2 | fő üzenet + két belépési pont („Online rendelés”, „Egyedi ajánlat”) | — |
| Szakaszfejléc | P1 | felülcím (nagybetűs, ritkított), cím, bevezető | `SectionHeader` |
| Szolgáltatáscsoport | P2 | a 4 csoport és elemeik, igény szerinti felmérés és telepítés | — |
| Folyamatlépések | P2 | Felmérés → Tervezés → Gyártás saját műhelyben → Telepítés (valódi sorrend, számozható) | — |
| Referenciarács és -kártya | P2 | kép, képaláírás projektadatokkal, szűrés felület szerint | — |
| Előtte/utána csúszka | P2 | egérrel és billentyűzettel is | — |
| Elérhetőség-blokk | P1 | telefon, e-mail, cím kijelölhető szövegként, másolás gombbal; nyitvatartás | `ContactBlock` |
| Képhelyőrző | P2 | „Referenciakép helye” jelöléssel, amíg nincsenek valós fotók | — |

## Motívumok

| Motívum | P | Leírás | Kód |
|---|---|---|---|
| Méretvonal | P1 | vízszintes/függőleges, nyílhegyekkel, mm-értékkel; `color.measure` | `DimensionLine` |
| Vonalzó | P2 | cm-beosztás | — |
| Rács (vágóalátét) | P3 | háttér-textúra, ha az irány használja | — |
| Fény (neon) | P3 | `effect.brand-glow`, csak a hero-ban és a fő gombokon, ha az irány használja | — |
