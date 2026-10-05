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

Négy fő csoport + egy mindenre érvényes ígéret.

| Csoport | slug | Elemei |
|---|---|---|
| **Fóliázás** | `foliazas` | Autófóliázás és flotta-dekor · Kirakat- és üvegfóliázás · Kínálópultok fóliázása és telepítése · Egyéb felületek fóliázása |
| **Cégér és világító reklám** | `ceger-vilagito-reklam` | Cégérkészítés · Reklámtáblák vázszerkezettel és belső LED-es világítással · Világító betűk · Plasztik betűk és logók · LED-falak |
| **Nyomtatás** | `nyomtatas` | Molinók · Feszített ponyva kihelyezéssel · Roll-upok · Táblák · Matricák · Plakátok · Vászonképek |
| **Rendezvény és egyedi** | `rendezveny-egyedi` | Rendezvény díszletezés és fóliázás · Fotófal építés · 3D nyomtatási munkák · Egyedi reklám- és díszítési megrendelések · Egyéb arculati megoldások |
| *Mindenre érvényes* | – | **Helyszíni felmérés és telepítés** |

## 4. Webshop – hibrid modell

### 4.1 Azonnal árazható, kosárba tehető termékek

Minden ár **nettó, helyőrző** (piaci átlag alapján becsülve), a megrendelő átírja. ÁFA: **27%**.
A felületen **nettó/bruttó kapcsoló**; alapértelmezés: bruttó (magánszemélyek), cégeknek egy kattintás.

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

**Táblák** (Ft/m², minimum 0,1 m²)
- PVC habtábla 3 mm: **9 990** · PVC habtábla 5 mm: **12 990** · Dibond (alu kompozit) 3 mm: **19 990** · Plexi 3 mm: **24 990**
- Opciók: furatolás **+500 Ft/furat** · távtartó csavar szett (4 db) **+1 990 Ft/szett**

**Vászonkép** (fakeretre feszítve)
- 30×40: **7 990** · 50×70: **13 990** · 60×90: **17 990** · egyedi méret: **19 990 Ft/m²**, minimum **6 990 Ft**

**Mennyiségi kedvezmény** (azonos tételből): 2–4 db **−5%** · 5–9 db **−10%** · 10+ db **−15%**

**Gyártási idő:** alapból **3 munkanap**; **Expressz (1 munkanap) +30%**. Rendelési határidő aznapi indításhoz:
**12:00** (Europe/Budapest). Hétvége és magyar munkaszüneti napok nem számítanak.

**Átvétel:** személyes átvétel a műhelyben **ingyenes** · futár **2 990 Ft** · nagy csomag (roll-up, tábla) **4 990 Ft** ·
telepítés: felmérés után, egyedi ajánlat.

### 4.2 Ajánlatkéréses (egyedi) munkák – okos varázsló

Ezeknél nincs fix ár; a varázsló összegyűjti, ami az árazáshoz kell, és **helyszíni felmérési időpontot** is kérhet.

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

Minden varázslóban: helyszín (cím), határidő, költségkeret-sáv (opcionális), fájlok/fotók feltöltése,
kapcsolattartó adatok, **felmérési időpont kérése** (dátum + napszak).

## 5. Innovációk (a látványtervekben bemutatandó)

1. **Valós léptékű előnézet:** a konfigurátorban a feltöltött grafika a választott arányban jelenik meg,
   mellette 180 cm-es emberi sziluett. Mm-pontos méretvonalak (a műhely és a felmérés nyelve).
2. **Nyomdakész-ellenőrzés feltöltéskor (preflight):** a kép pixelméretéből és a fizikai méretből becsült
   felbontás (DPI) közlekedési lámpával: ≥150 kiváló · 72–149 molinóra/nagy távolságra megfelelő · <72 gyenge.
   Arányeltérés esetén választás: „Kitöltés (vágással)” / „Illesztés (kerettel)”.
3. **Élő határidő:** „Ha ma 12:00-ig megrendeli, **[dátum]**-ra elkészül.” Expressz kapcsolóval újraszámol.
4. **Átlátható ár:** tételes bontás (anyag m² × egységár, szélkidolgozás, kedvezmény, ÁFA), nettó/bruttó kapcsoló,
   mennyiségi kedvezmény kijelzése („még 2 db és −10%”).
5. **„Helyszínen” előnézet:** a látogató feltölt egy fotót a kirakatáról/járművéről, és ráhúzza a tervet
   (nézet: perspektíva-sarkok mozgatása). A látványtervben elég jelezni és egy egyszerű demóval érzékeltetni.
6. **Nappal / éjjel kapcsoló** a világító reklámoknál: ugyanaz a cégér kikapcsolva és világítva.
7. **Felmérés-időpontfoglalás** az ajánlatkérő varázsló végén.
8. **Referenciák felület szerint szűrve** (autó, kirakat, cégér, rendezvény…), egy-egy munkánál **előtte/utána csúszka**.
9. **Anyagkártyák** valós adatokkal (g/m², kül-/beltér, várható élettartam) a webshopban.
10. **Újrarendelés:** a korábbi konfiguráció egy kattintással újra kosárba tehető (fiókos vagy e-mailes link).

## 6. Két design-irány a látványtervekhez

Mindkettő **fekete alapú**, a rózsaszín a márkaszín (`--brand`). Mindkettő ugyanazt a tartalmat mutatja,
hogy a megrendelő tisztán az irányt hasonlíthassa össze.

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
