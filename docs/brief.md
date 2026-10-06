# Stilet Dekor – weboldal újratervezés: közös brief

Ez a dokumentum a látványtervek és a fejlesztés közös forrása. Minden tény, szöveg és ár innen jön.
Ami nincs itt, azt **nem találjuk ki** (nincs kitalált ügyfélnév, vélemény, statisztika, évszám).
Ha egy szekció ilyet igényel, jól láthatóan jelölt helyőrző kerül oda (pl. `[ügyfél neve]`).

## 1. A cég

- **Név:** Stilet Dekor
- **Mit csinál:** dekoros cég **saját műhellyel**. Fóliázás, cégér- és reklámtábla-gyártás, nyomtatás,
  rendezvénydíszlet, egyedi reklám- és díszítési munkák, mindez **helyszíni felméréssel és telepítéssel**.
- **Kapcsolat** (a jelenlegi oldal alapján, élesítés előtt ellenőrizendő):
  - Telefon: **+36 70 538 5030**
  - E-mail: **stiletdekor@gmail.com**
  - Cím (műhely): **Budapest, Schweidel József u. 1–3.**
  - Nyitvatartás: **H–P 8:00–17:00** *(helyőrző, egyeztetendő)*
- **Logó:** még nincs a kezünkben. Addig tipografikus szómárka: `STILET DEKOR`.
- **Arculati szín:** a **rózsaszín** betűszín marad (a pontos árnyalatot a megrendelő később a `/design`
  lépésben véglegesíti). Addig helyőrző token: `--brand: #ff2e8a`. Minden rózsaszín ebből az egy tokenből
  származzon, hogy egy helyen cserélhető legyen.
- **Alapszín:** fekete színvilág megmarad. Új kiegészítő színek bevezethetők, ha indokoltak.

## 2. Az oldal feladata

1. **Elérés:** a látogató 1 kattintásra telefonálhasson, írhasson, megtalálja a műhelyt.
2. **Termékrendelés:** szabványos termékek online konfigurálása, árazása, grafika feltöltése, megrendelése.
3. **Új ügyfelek bevonzása:** referenciák, szakértelem, a „mindent egy kézből” (felmérés → tervezés →
   gyártás saját műhelyben → telepítés) üzenet; egyedi munkákra gyors, kényelmes ajánlatkérés.

**Célközönség:** üzlettulajdonosok (kirakat, cégér), cégek (flotta-dekor, arculat, rendezvény),
rendezvényszervezők, magánszemélyek (matrica, vászonkép, molinó).

**Hangnem:** magázó, közvetlen, szakmai, rövid mondatok. Példák: „Kérjen ajánlatot”, „Töltse fel a grafikát”,
„Kiszállunk, felmérjük, felszereljük.”

## 3. Szolgáltatások (információs architektúra)

Négy fő csoport + egy igény szerinti szolgáltatás. A felmérés és a telepítés **igény szerint** jár (döntés, 2026-10-05);
telepítésnél a műhely dönthet úgy, hogy a méretek miatt felmérés kell.

| Csoport | slug | Elemei |
|---|---|---|
| **Fóliázás** | `foliazas` | Autófóliázás és flotta-dekor · Kirakat- és üvegfóliázás · Kínálópultok fóliázása és telepítése · Egyéb felületek fóliázása |
| **Cégér és világító reklám** | `ceger-vilagito-reklam` | Cégérkészítés · Reklámtáblák vázszerkezettel és belső LED-es világítással · Világító betűk · Plasztik betűk és logók · LED-falak |
| **Nyomtatás** | `nyomtatas` | Molinók · Feszített ponyva kihelyezéssel · Roll-upok · Táblák · Matricák · Plakátok · Vászonképek |
| **Rendezvény és egyedi** | `rendezveny-egyedi` | Rendezvény díszletezés és fóliázás · Fotófal építés · 3D nyomtatási munkák · Egyedi reklám- és díszítési megrendelések · Egyéb arculati megoldások |
| *Igény szerint* | – | **Helyszíni felmérés és telepítés** |

## 4. Webshop – hibrid modell

### 4.1 Azonnal árazható, kosárba tehető termékek

Minden ár **helyőrző** (piaci átlag alapján becsülve), a megrendelő átírja. A katalógus az árakat
**nettóban tárolja** (ÁFA-változáskor így egy helyen kell módosítani). ÁFA: **27%**.

**A felületen minden ár bruttó, kapcsoló nélkül** (döntés, 2026-10-05). A kosárban és a tételes bontásban
egy kis sor mutatja a nettó összeget és az ÁFA-t a cégeknek. A rendelési és az ajánlatkérő űrlapon jól látható:
„A végleges ár eltérhet a kalkulált ártól.” (Lásd 10. fejezet.)

**Határvonal webshop és ajánlatkérés között:** ami méretből, anyagból és opciókból kiszámolható, az webshop-termék
(például az egyedi méretű plakát is). Ami tervezést, felmérést, vázszerkezetet vagy telepítést igényel, az ajánlatkérés.

**Molinó** (Ft/m², méret cm-ben, bármilyen méret 20 cm és 500 cm között oldalanként, nagyobbat toldással)
- Standard frontlit molinó 440–510 g/m², kül- és beltéri, UV-álló: **3 990 Ft/m²**
- Hálós (mesh) molinó, szélálló, kerítésre/állványra: **4 490 Ft/m²**
- Blockout, kétoldalas nyomtatásra: **6 990 Ft/m²**
- Textil (zászlóanyag), beltéri, gyűrődésmentes: **5 490 Ft/m²**
- Szélkidolgozás (kerület folyóméterre): méretre vágás **0 Ft** · ringli 50 cm-enként **+200 Ft/fm** · szegés + ringli **+350 Ft/fm** · alagútvarrás (rúdhoz) **+600 Ft/fm**
- Minimum rendelési érték tételenként: **4 990 Ft**

**Roll-up** (darabár, táskával együtt)
- Standard 85×200 cm: **24 900 Ft** · Prémium széles talp 100×200 cm: **34 900 Ft** · 120×200 cm: **39 900 Ft** · 150×200 cm: **49 900 Ft**
- Csak cseregrafika (meglévő szerkezetbe): **12 900 Ft** (méretfüggetlen)

**Matrica / öntapadós fólia** (Ft/m²)
- Monomer fólia, rövid távra: **6 990** · Polimer fólia, hosszú távra (autóra is): **9 990** · Kirakat-perforált (one way vision): **8 990**
- Opciók: kontúrvágás **+2 500 Ft/m²** · UV-laminálás **+2 000 Ft/m²**

**Plakát** (darabár, 150 g/m² matt vagy fényes papír)
- A3: **990** · A2: **1 990** · A1: **3 490** · A0: **5 990** · B1 (70×100): **3 990** · Blueback (utcai plakát, Ft/m²): **2 990**
- Egyedi méret (döntés, 2026-10-05): m²-ár alapján, helyőrző **4 990 Ft/m²**, minimum **1 990 Ft**; a valós árat a megrendelő adja meg.
  **2026-10-06: függőben**, később döntünk róla. A számítás helyőrző árral elkészült, a webshop felületére a döntés
  után kerül.
  Ha a feltöltött fájl szabványos formátumú (±1 mm), a kalkulátor arra áll rá, különben egyedi méret.
- A „blueback” név egyelőre marad. (Kék hátoldalú, átlátszatlan utcai plakátpapír, régi plakátok fölé ragasztható.)

**Táblák** (Ft/m², minimum 0,1 m²)
- PVC habtábla 3 mm: **9 990** · PVC habtábla 5 mm: **12 990** · Dibond (alu kompozit) 3 mm: **19 990** · Plexi 3 mm: **24 990**
- Opciók: furatolás **+500 Ft/furat** · távtartó csavar szett (4 db) **+1 990 Ft/szett**

**Vászonkép** (fakeretre feszítve)
- 30×40: **7 990** · 50×70: **13 990** · 60×90: **17 990** · egyedi méret: **19 990 Ft/m²**, minimum **6 990 Ft**

**Mennyiségi kedvezmény** (azonos tételből): 2–4 db **−5%** · 5–9 db **−10%** · 10+ db **−15%**

**Gyártási idő:** alapból **3 munkanap**; **Expressz (1 munkanap) +30%** (döntés: marad). A gyártási idő
**a díjbekérő befizetésétől** számít (lásd 10. fejezet); ha a befizetés munkanapon 12:00 előtt (Europe/Budapest)
beérkezik, aznap indul a gyártás. A kalkulátor **várható** dátumot mutat, és ebbe 1 munkanapot beleszámol a
visszaigazolásra és a befizetésre. Az expressz is kérés: a visszaigazoláskor dől el, vállalható-e.
Hétvége és magyar munkaszüneti napok nem számítanak.

**Átvétel:** személyes átvétel a műhelyben **ingyenes** · futár **2 990 Ft** · nagy csomag (roll-up, tábla) **4 990 Ft** ·
**telepítéssel** (ilyenkor nincs átvétel). A telepítés díja egyedi. Telepítésnél a méreteket szükség esetén a műhely
a helyszínen ellenőrzi, mert gyakori, hogy rossz méret érkezik; ennek alapján véglegesíti az árat.

### 4.2 Ajánlatkéréses (egyedi) munkák – okos varázsló

Ezeknél nincs fix ár; a varázsló összegyűjti, ami az árazáshoz kell. Az ajánlatkérés után a műhely mindenképp
felveszi a kapcsolatot a megrendelővel, és a felmérés időpontját telefonon egyeztetik.

| Munka | Amit a varázsló kérdez |
|---|---|
| Autófóliázás / flotta-dekor | jármű típusa és darabszáma; teljes / részleges / felirat; fotók a járműről; meglévő grafika |
| Kirakat- és üvegfóliázás | felület m² (vagy méretek); típus: dekor, homokfúvott hatású, fényvédő, one way vision; fotó a kirakatról |
| Cégér, reklámtábla | méret; világítás: nincs / belső LED / külső; vázszerkezet kell-e; rögzítési felület; fotó a homlokzatról |
| Világító és plasztik betűk, logók | felirat szövege vagy logó; betűmagasság; anyag (plexi, alu, PVC); világítás: elő-, hát-, nincs |
| LED-fal | beltér / kültér; méret; vásárlás vagy bérlés; rendezvény dátuma |
| Rendezvény díszlet, fotófal | rendezvény dátuma és helyszíne; méret; felépítés és bontás kell-e |
| Kínálópult fóliázás és telepítés | pultok száma és mérete; fotó |
| 3D nyomtatás | fájl (STL/OBJ/3MF) vagy leírás; anyag (PLA, PETG); méret; darabszám |
| Egyéb arculati megoldás | szabad leírás + fájlok |

Minden varázslóban: helyszín (cím), határidő, fájlok/fotók feltöltése, kapcsolattartó adatok és egy
„Helyszíni felmérést kérek” jelölő, időpont nélkül. **Nincs költségkeret-kérdés és nincs időpontválasztó**
(döntés, 2026-10-05: a műhely úgyis visszahív, és a nap végén látja, mikor tud kimenni). Az űrlapon jól látható:
„A végleges árajánlat eltérhet a kalkulált ártól.” Ajánlás a műhelynek: az árajánlatban érdemes két változatot adni
(gazdaságos és prémium), mert látva a különbséget nem mindenki a legolcsóbbat választja.

## 5. Innovációk (a látványtervekben bemutatandó)

1. **Valós léptékű előnézet:** a konfigurátorban a feltöltött grafika a választott arányban jelenik meg,
   mellette 180 cm-es emberi sziluett. Mm-pontos méretvonalak (a műhely és a felmérés nyelve).
2. **Méretfelismerés és nyomdakész-ellenőrzés feltöltéskor:** a méretmezők a fájlból felismert méretre állnak
   (8. fejezet). Raszterképnél a pixelméretből és a fizikai méretből becsült felbontás (DPI) közlekedési lámpával:
   ≥150 kiváló · 72–149 molinóra/nagy távolságra megfelelő · <72 gyenge.
   Arányeltérés esetén választás: „Kitöltés (vágással)” / „Illesztés (kerettel)”.
3. **Várható határidő:** „Várhatóan **[dátum]**-ra elkészül” (a befizetéstől számítva, 1 munkanap ráhagyással).
   Expressz kapcsolóval újraszámol.
4. **Átlátható ár:** tételes bontás (anyag m² × egységár, szélkidolgozás, kedvezmény), bruttó végösszeg,
   alatta kis sorban nettó + ÁFA, mennyiségi kedvezmény kijelzése („még 2 db és −10%”).
5. **„Helyszínen” előnézet:** a látogató feltölt egy fotót a kirakatáról/járművéről, és ráhúzza a tervet
   (nézet: perspektíva-sarkok mozgatása). A látványtervben elég jelezni és egy egyszerű demóval érzékeltetni.
6. **Nappal / éjjel kapcsoló** a világító reklámoknál: ugyanaz a cégér kikapcsolva és világítva.
7. ~~Felmérés-időpontfoglalás az ajánlatkérő varázsló végén.~~ Elvetve (2026-10-05): időpontválasztó helyett
   „Helyszíni felmérést kérek” jelölő és telefonos egyeztetés.
8. **Referenciák felület szerint szűrve** (autó, kirakat, cégér, rendezvény…), egy-egy munkánál **előtte/utána csúszka**.
9. **Anyagkártyák** valós adatokkal (g/m², kül-/beltér, várható élettartam) a webshopban.
10. **Újrarendelés:** a korábbi konfiguráció egy kattintással újra kosárba tehető (fiókos vagy e-mailes link).
11. **Felületcsomag:** több oldalas PDF esetén (pl. kirakatfólia ablakonként) felületlista, az azonos felületek
    automatikus összevonása, készletszám (9. fejezet).
12. *Széljegyzet, később:* **qvik-QR a díjbekérőn** (10. fejezet).

## 6. Két design-irány a látványtervekhez

Mindkettő **fekete alapú**, a rózsaszín a márkaszín (`--brand`). Mindkettő ugyanazt a tartalmat mutatja,
hogy a megrendelő tisztán az irányt hasonlíthassa össze.

**Döntés (2026-10-06): egyelőre mindkét irány marad**, mindkettőnek saját dev oldala van (README, „Két dev
oldal”). Mindkét látványterv a 2026-10-05-i döntéseket mutatja (bruttó árak, telepítéses átvétel, rendelés
ellenőrzésre küldése, ajánlatkérő költségkeret és időpontválasztó nélkül).

### A) Neon műhely
Mélyfekete, a rózsaszín **neonfényként** jelenik meg (a világító betűk és cégérek világa). Vizuális nyelv:
vágóalátét-rács, cm-beosztású vonalzók, **méretvonalak** és szálkeresztek (a felmérés és a gyártás pontossága),
anyagtextúrák (fólia, plexi, alu). Merész, kondenzált display tipográfia, utility monospace az adatokhoz.
Egy jól megkomponált mozgás: a hero neonfelirata „bekapcsol”. Nappal/éjjel kapcsoló a heroban.

### B) Galéria / editorial
Magazinszerű, letisztult, prémium. Óriási referenciaképek, nagy betűs címek, sok negatív tér, szigorú rács,
képaláírások projektadatokkal (Felület · Anyag · Méret · Helyszín). A rózsaszín csak **kis, pontos akcentus**
(linkek, aktív állapot, egy-egy kiemelés). Visszafogott mozgás, finom átmenetek.

## 7. Látványterv tartalmi váz (mindkét irányban)

1. Fejléc: szómárka, menü (Szolgáltatások, Webshop, Referenciák, Folyamat, Rólunk, Kapcsolat), telefonszám,
   „Ajánlatkérés” gomb, kosár ikon.
2. Hero: fő üzenet + két belépési pont: **„Online rendelés”** (webshop) és **„Egyedi ajánlat”** (varázsló).
3. Szolgáltatások: a 4 csoport + a „Helyszíni felmérés és telepítés” ígéret.
4. Webshop: termékkategóriák + **működő konfigurátor-demó** (legalább a molinó teljesen működjön: méret, anyag,
   szélkidolgozás, darabszám, expressz, nettó/bruttó, grafika feltöltése valós előnézettel, DPI-ellenőrzés,
   határidő, árbontás, kosárba tétel egy oldalsó kosárfiókba).
5. Egyedi ajánlat varázsló: lépésenként navigálható demó (típus → részletek → helyszín és fotók → kapcsolat és felmérési időpont).
6. Referenciák: szűrőchipek, rács, előtte/utána csúszka.
7. Folyamat: Felmérés → Tervezés → Gyártás saját műhelyben → Telepítés (valódi sorrend, a számozás itt indokolt).
8. Rólunk / miért mi: saját műhely, helyszíni felmérés és telepítés, egyedi megoldások (kitalált számok nélkül).
9. Kapcsolat: telefon, e-mail, cím (kijelölhető szövegként, másolás gombbal), nyitvatartás, térkép-helyőrző, rövid üzenetküldő űrlap.
10. Lábléc.

Referenciaképek: a jelenlegi portfólió még nem elérhető ebből a környezetből, ezért a látványtervekben
**illusztrált helyőrzők** szerepelnek (SVG/CSS/canvas jelenetek: éjszakai kirakat világító betűkkel, fóliázott
kisbusz, roll-up rendezvényen, fotófal, LED-fal, homokfúvott hatású üvegfólia, kínálópult, 3D nyomtatott betűk),
„Referenciakép helye” jelöléssel. Élesben a valós portfólióképek kerülnek a helyükre.

> A 2026-10-05-i döntések (bruttó árak kapcsoló nélkül, költségkeret és időpontválasztó törlése, méretfelismerés,
> felületcsomag, új rendelési folyamat) a látványtervekben még nincsenek átvezetve. Az éles oldal ezek szerint épül.

## 8. Méretfelismerés a feltöltött fájlból

Követelmény: **nagyon pontos legyen.** Feltöltéskor a méretmezők automatikusan a fájlból felismert méretre állnak,
külön jóváhagyó gomb nélkül. Alattuk egy rövid sor jelzi a forrást, pl. „A méret a fájlból: 84,0 × 109,7 cm”.
A mezők ezután is szerkeszthetők.

**Források, pontossági sorrendben:**

1. **PDF és PDF-kompatibilis Illustrator (.ai):** oldalanként a TrimBox (vágott méret), ha nincs, akkor a
   CropBox/MediaBox; a BleedBox a kifutóhoz. Kezeljük a /Rotate elforgatást és a /UserUnit szorzót (nagy vásznas
   Illustrator-fájlok). Több oldal vagy rajztábla = több felület (9. fejezet). Pontosság: 0,1 mm.
2. **EPS:** %%HiResBoundingBox, ha nincs, %%BoundingBox (a bináris, DOS-fejléces EPS-t is).
3. **SVG:** width/height mértékegységgel (mm, cm, in, pt). Ha csak viewBox van, nem töltünk ki automatikusan.
4. **Raszterképek (TIFF, PSD, JPG, PNG, BMP):** pixelméret ÷ a fájlba írt felbontás. Ha a felbontás hiányzik, vagy
   72/96 DPI (programok alapértéke), nem töltünk ki automatikusan, csak a DPI-ellenőrzés fut. A JPG fejléce
   (JFIF) csak egész DPI-t tárol; ha a Photoshop- vagy Exif-adat ezzel egyezik, annak törtrészét használjuk
   (pl. 84,67 DPI-vel pontosan 600 mm, nem 597,6 mm). Ha ellentmond a JFIF-nek, elavultnak tekintjük.
5. **HEIC (iPhone-fotó), AVIF, WebP, GIF:** csak a pixelméretet olvassuk ki (a DPI-ellenőrzéshez), felbontást
   ezek nem tárolnak megbízhatóan.
6. **CorelDRAW (.cdr):** fogadjuk, de méretet nem olvasunk ki belőle.

**Szabályok:**

- **Ráhagyás, kifutó:** az árat a teljes nyomtatott méretre számoljuk, ráhagyással együtt (javaslat, megerősítendő).
  Ha a fájlban van TrimBox/BleedBox, a vágott méretet is megmutatjuk. Ha a fájlnév vagy a PDF címe ráhagyást
  említ (pl. „10 mm ráhagyással”), azt is jelezzük.
- **Méretarány:** alapból 1:1. Más arányt (pl. 1:10) akkor javaslunk, ha a fájlnév vagy a cím jelzi („1:10”,
  „1_10”, „M1-10”), vagy ha a felismert méret a termék minimuma alá esik. Ilyenkor a méretmezők mellett megjelenik
  egy „Méretarány” választó.
- **Szabványos formátumok:** plakátnál A/B formátumra, roll-upnál a szélesség alapján a modellre ±1 mm tűréssel
  automatikusan rááll; ha nem illik szabványra, egyedi méret.
- **Szerveroldali újraellenőrzés:** feltöltés után a szerver is kiolvassa a méretet, és a rendeléshez menti. Ha a
  megrendelt méret eltér a fájlétól, az admin felületen figyelmeztetés jelenik meg.
- **Tesztelés:** valódi ügyfélfájlok mintáján (PDF, AI, EPS, TIFF, 1:10-es molinó) automatikus tesztekkel.
  Ügyfélgrafikát nem teszünk a repóba, a tesztek szintetikus fájlokat használnak ugyanazokkal a méretekkel.

## 9. Felületcsomag: több felületből álló munka

Példa: HajWellness Szalon, „C változat, felületenként”: 22 oldalas PDF, 1:1, 10 mm ráhagyással.
**22 felület, ebből 14 különböző terv, összesen 6,46 m².** (Pl. a 4., 5., 13. és 14. oldal tartalma azonos.)

- Ha a feltöltött PDF több oldalas, a kalkulátor felületlistát mutat: előnézet, méret, darab.
- Az azonos méretű és azonos tartalmú oldalakat automatikusan összevonja (a példában a 4 azonos oldal = 4 db).
  Felület kihagyható, darabszám módosítható.
- Az anyag és az opciók a teljes csomagra vonatkoznak.
- A kosárban egy tétel lesz, pl. „Fóliacsomag – 22 felület, 6,46 m²”, egy **„Készletek száma”** mezővel
  (ha 3 üzletbe kell ugyanaz, akkor 3 készlet).
- A mennyiségi kedvezmény a **készletek számára** vonatkozik, nem a felületekre (különben 22 ablak
  automatikusan −15% lenne).
- Telepítéssel kért csomagnál felmérés javasolt (méretellenőrzés).
- A műhely gyártási listát kap: felület, oldalszám, méret, darab.

## 10. Rendelési folyamat

**Webshop-rendelés:**

1. A vásárló a **„Rendelés elküldése ellenőrzésre”** gombbal küldi el a rendelést. Ez még **nem jár fizetési
   kötelezettséggel**, és az oldal ezt egyértelműen kiírja, a „végleges ár eltérhet” figyelmeztetéssel együtt.
2. Automatikus e-mail: „Megkaptuk, ellenőrizzük” (a beérkezés visszaigazolása).
3. A műhely ellenőrzi a fájlt, az anyagot és a határidőt, majd választ:
   - **Visszaigazolom:** végleges ár (eltérés esetén indoklással) és díjbekérő;
   - **Módosítást kérek:** pl. gyenge a fájl vagy rossz a méret;
   - **Nem vállalom:** indoklással, esetleg alternatívával.
4. **A díjbekérő befizetése a megrendelés elfogadása.** Ha a vásárló nem fogadja el, nincs teendője; a rendelés
   a megadott idő után automatikusan lezárul. A levélben egy „Nem kérem” link is lehet.
   Ha a vásárló nem fizet (javaslat, 2026-10-06):
   - **A vásárlónak nincs kötelezettsége és költsége**, mert a szerződés csak a befizetéssel jön létre.
   - **A műhelynek nincs vesztesége**, mert a gyártás csak a befizetés után indul. A díjbekérő nem számla, ezért
     sztornózni sem kell.
   - A határidő előtt 2 nappal emlékeztető e-mail megy. Lejáratkor értesítő megy: a rendelést lezártuk; ha mégis
     kéri, egy kattintással újraküldheti, és az árat meg a határidőt újra ellenőrizzük.
   - Késve érkező befizetésnél a műhely dönt: legyártja (ha az ár és a kapacitás még tartható), vagy visszautalja.
   - A lezárt rendelés feltöltött fájljait egy idő után töröljük (javaslat: 30 nap; az adatkezelési tájékoztató
     rögzíti).
   - **Miért 8 nap:** a díjbekérőn és a számlán a 8 napos fizetési határidő a megszokott Magyarországon. Lefed egy
     hétvégét, és elég a cégeknek a jóváhagyásra és az utalásra. A visszaigazolt árat és gyártási kapacitást
     viszont nem érdemes ennél tovább tartani. Sürgős munkánál a vásárló úgyis hamar fizet, mert a határidő a
     befizetéstől számít.
5. A gyártás a befizetés beérkezése után indul, a gyártási idő innen számít.
6. Elkészült: átvehető, feladva vagy telepítés egyeztetése.
7. Számla automatikusan, számlázóprogramon keresztül (pl. Számlázz.hu vagy Billingo).

**Egyedi munka:** ajánlatkérő varázsló → visszahívás → felmérés (igény szerint, illetve ha a műhely szükségesnek
látja) → árajánlat → elfogadás az előleg vagy a díjbekérő befizetésével → gyártás → telepítés → végszámla.

**Fizetés:** díjbekérő, átutalással. Online kártyás fizetés nem kell.
*Széljegyzet, később:* qvik-QR a díjbekérőn és a visszaigazoló levélben. A vásárló a telefonjával beolvassa, az
összeg és a közlemény ki van töltve, az azonnali utalás másodpercek alatt megérkezik. Megvalósítható; a bevezetést
a műhely bankjával kell egyeztetni.

**Jogi:** az ÁSZF-ben rögzíteni, hogy a szerződés a visszaigazolt ajánlat elfogadásával (a befizetéssel) jön létre,
és hogy az egyedi, a vásárló kérésére gyártott termékekre nem vonatkozik a 14 napos elállási jog. A végleges
szöveget jogász nézze át.

## 11. Nyitott kérdések

- Ráhagyásos fájlnál az árat a teljes nyomtatott méretre számoljuk? (Javaslat: igen.)
- Felületcsomag: legyen felületenkénti kezelési díj (sok kis darab vágása, kezelése)? A kedvezmény a készletek
  száma vagy az összes m² szerint járjon? (Később döntünk.)
- Egyedi méretű plakát: legyen-e a webshopban, milyen áron és mérethatárral? (Függőben, 2026-10-06.)
- Hány nap után záruljon le automatikusan a visszaigazolt, de be nem fizetett rendelés? (Javaslat: 8 nap,
  indoklás a 10. fejezetben.)
- Design-irány: A, B vagy keverék. Egyelőre mindkettő marad, saját dev oldallal (2026-10-06).
- Valódi mintafájlok a méretfelismerés ellenőrzéséhez (nem kötelező): bármilyen korábbi munka nyomdai fájlja,
  ügyféladat nélkül is jó. A kalkulátor a szintetikus tesztfájlokkal már működik (8. fejezet).
