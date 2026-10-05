# Komponenslista

A design system ezeket a komponenseket adja a weboldalnak. Prioritás: **P1** a webshop és a rendelés útja
(ez hozza az új megrendeléseket), **P2** a bemutatkozó oldalak, **P3** később.
Minden komponens tokenekből épül ([`tokens/stilet.tokens.json`](tokens/stilet.tokens.json)), és
390 px-en és 1440 px-en is hibátlan.

**Általános állapotok** (ahol értelmezhető): alap · hover · fókusz (billentyűzet) · aktív/lenyomott ·
kiválasztott · tiltott · betöltés · hiba · üres.

## Alapelemek

| Komponens | P | Változatok, állapotok | Hol |
|---|---|---|---|
| Gomb | P1 | elsődleges (márkaszín), másodlagos, szellem, link; kicsi/normál; ikonnal; betöltés | mindenhol |
| Ikongomb | P1 | kosár (darabszám-jelvénnyel), menü, bezárás, csere (szélesség↔magasság) | fejléc, konfigurátor |
| Link | P1 | szövegközi, navigációs (aktív állapottal) | mindenhol |
| Jelvény, címke | P1 | darabszám, „Expressz”, „Helyőrző”, állapotcímke (rendelés státusza) | kosár, rendelés |
| Szűrőchip | P2 | kiválasztható, lenyomott állapot | referenciák, méretsablonok |
| Értesítősáv | P1 | info, figyelmeztetés, hiba, siker; pl. „A végleges ár eltérhet a kalkulált ártól.” | rendelés, ajánlatkérés |
| Felugró üzenet (toast) | P2 | „Kosárba tettük”, „Másolva” | kosár, kapcsolat |
| Elválasztó, hajszálvonal | P1 | vízszintes, szakaszcímmel | mindenhol |

## Űrlap

| Komponens | P | Változatok, állapotok | Hol |
|---|---|---|---|
| Szövegmező | P1 | címke, súgó, hibaüzenet, kötelező jel; név, e-mail, telefon, cím | pénztár, ajánlatkérés, kapcsolat |
| Mértékegységes számmező | P1 | cm, db; a két méretmező csere gombbal; **„A méret a fájlból”** jelzés | konfigurátor |
| Méretarány-választó | P1 | 1:1, 1:10, egyéb; csak akkor jelenik meg, ha a fájl alapján indokolt | konfigurátor |
| Darabszám-léptető | P1 | −/+ gombok, kézi beírás, minimum | konfigurátor, kosár |
| Választókártya (anyag) | P1 | anyagminta-textúra, név, bruttó m²-ár, adatlap (g/m², kül/beltér, élettartam) | konfigurátor |
| Opciósor ár-előnézettel | P1 | rádió vagy jelölő; egységár és a méretre számolt összeg | szélkidolgozás, kontúrvágás, furatolás |
| Kapcsoló | P1 | Expressz (+30%) | konfigurátor |
| Jelölőnégyzet | P1 | ÁSZF elfogadás, „Helyszíni felmérést kérek” | pénztár, ajánlatkérés |
| Legördülő, dátumválasztó | P2 | határidő, átvételi mód | ajánlatkérés, pénztár |
| Fájlfeltöltő | P1 | üres, ráhúzás közben, feltöltés, felismerve, hiba; több fájl miniatűrrel | konfigurátor, ajánlatkérés |

## Webshop és rendelés

| Komponens | P | Leírás | Hol |
|---|---|---|---|
| Termékkategória-csempe | P1 | név, „-tól” bruttó ár, illusztráció | webshop |
| Méretsablon-chipek | P1 | gyakori méretek egy kattintással | konfigurátor |
| Valós léptékű előnézet | P1 | a feltöltött grafika a választott arányban, 180 cm-es emberi sziluett, mm-es méretvonalak | konfigurátor |
| Nyomdakész-lámpa | P1 | közlekedési lámpa (kiváló / megfelelő / gyenge), DPI-érték, magyarázat | konfigurátor |
| Arányeltérés-választó | P1 | „Kitöltés (vágással)” / „Illesztés (kerettel)” | konfigurátor |
| Felületlista (felületcsomag) | P1 | több oldalas PDF felületei: miniatűr, méret, darab, kihagyás; azonos felületek összevonva; készletszám | konfigurátor |
| Árbontás | P1 | tételes sorok (m² × egységár, szélkidolgozás, kedvezmény), **bruttó végösszeg**, alatta kis sorban nettó + ÁFA | konfigurátor, kosár |
| Kedvezmény-tipp | P1 | „Még 2 db és −10%” | konfigurátor |
| Várható határidő | P1 | „Várhatóan [dátum]-ra elkészül” (a befizetéstől) | konfigurátor, kosár |
| Kosárfiók | P1 | oldalról nyíló fiók, tételek (miniatűr, adatok, ár, törlés), összesítő | mindenhol |
| Pénztár-szakaszok | P1 | adatok, számlázás, átvétel (személyes / futár / telepítéssel), „Rendelés elküldése ellenőrzésre” | pénztár |
| Rendelés állapota | P2 | idővonal: Beérkezett → Ellenőrzés → Visszaigazolva → Befizetve → Gyártás → Kész | rendelés oldala, e-mailek |
| Újrarendelés | P3 | korábbi tétel egy kattintással vissza a kosárba | fiók, e-mail |

## Ajánlatkérés

| Komponens | P | Leírás |
|---|---|---|
| Lépésjelző | P1 | 4 lépés: Típus → Részletek → Helyszín és fotók → Kapcsolat; haladásjelző |
| Munkatípus-kártya | P1 | a 9 egyedi munkatípus (autófóliázás, kirakat, cégér, világító betűk, LED-fal, rendezvény, pult, 3D nyomtatás, egyéb) |
| Sikerállapot | P1 | ajánlatkérés száma, mi történik ezután (visszahívás), „A végleges árajánlat eltérhet …” |

## Tartalom és navigáció

| Komponens | P | Leírás |
|---|---|---|
| Fejléc | P1 | szómárka, menü, telefonszám, „Ajánlatkérés” gomb, kosár; tapadó; mobilmenü |
| Lábléc | P1 | elérhetőségek, ÁSZF, adatvédelem |
| Hero | P2 | fő üzenet + két belépési pont („Online rendelés”, „Egyedi ajánlat”) |
| Szakaszfejléc | P1 | felülcím (nagybetűs, ritkított), cím, bevezető |
| Szolgáltatáscsoport | P2 | a 4 csoport és elemeik, igény szerinti felmérés és telepítés |
| Folyamatlépések | P2 | Felmérés → Tervezés → Gyártás saját műhelyben → Telepítés (valódi sorrend, számozható) |
| Referenciarács és -kártya | P2 | kép, képaláírás projektadatokkal, szűrés felület szerint |
| Előtte/utána csúszka | P2 | egérrel és billentyűzettel is |
| Elérhetőség-blokk | P1 | telefon, e-mail, cím kijelölhető szövegként, másolás gombbal; nyitvatartás |
| Képhelyőrző | P2 | „Referenciakép helye” jelöléssel, amíg nincsenek valós fotók |

## Motívumok

| Motívum | P | Leírás |
|---|---|---|
| Méretvonal | P1 | vízszintes/függőleges, nyílhegyekkel, mm-értékkel; `color.measure` |
| Vonalzó | P2 | cm-beosztás |
| Rács (vágóalátét) | P3 | háttér-textúra, ha az irány használja |
| Fény (neon) | P3 | `effect.brand-glow`, csak a hero-ban és a fő gombokon, ha az irány használja |
