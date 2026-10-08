// The decision sheet ("Döntőlap"): the first tab of "Arculati látványtervek.html". Every open choice of the final
// brand, its options, the tab where each can be seen, and our recommendation (design/claude-design/README.md).
// Without scripts (the OneDrive preview) it is a form to read and tick; where scripts run, the ticked options add up
// to a text to paste into the chat, and the browser remembers them.

/** The choices. `iranyok`: the full directions of the switcher ({ id, rovid, cim, leiras }), offered as options. */
export function dontesek(iranyok = []) {
  return [
    {
      id: 'irany',
      cim: 'Irány',
      kerdes: 'Melyik irányban készüljön a végleges oldal?',
      opciok: [
        { id: 'C', nev: 'C · Mérőlap', leiras: 'A B nyugodt, képes szerkezete az A mérési nyelvével; fény csak a hero cégérén és a fő gombon.', ful: 'proto-c' },
        { id: 'A', nev: 'A · Neon műhely', leiras: 'Mélyfekete, a rózsaszín neonfényként; kondenzált, nagybetűs címek, vágóalátét-rács.', ful: 'proto-a' },
        { id: 'B', nev: 'B · Galéria / editorial', leiras: 'Magazinszerű, nyugodt, prémium; antikva címek, a rózsaszín csak apró akcentus.', ful: 'proto-b' },
        ...iranyok.map((x) => ({ id: x.rovid, nev: x.cim, leiras: x.leiras, ful: x.id })),
      ],
      ajanlott: 'C',
      indok:
        'A két meglévő irány erősségét egyesíti: nyugodtabb az A-nál, és jobban mutatja a „saját műhely, helyszínen mérünk” ígéretet, mint a B. Témaként már be van építve, így az oldal egy kapcsolóval átállítható rá.',
    },
    {
      id: 'rozsaszin',
      cim: 'Márkaszín',
      kerdes: 'Melyik rózsaszín legyen a márkaszín?',
      opciok: [
        { id: '1a', nev: '1a · #FF2E8A', leiras: 'A mostani; minden eddigi anyagban ez szerepel.', szin: '#FF2E8A', ful: 'cd-ds' },
        { id: '1b', nev: '1b · #FF47A3', leiras: 'Kicsit világosabb, bíborosabb.', szin: '#FF47A3', ful: 'cd-ds' },
        { id: '1c', nev: '1c · #FF5C85', leiras: 'Korallosabb, a piros felé hajlik.', szin: '#FF5C85', ful: 'cd-ds' },
        { id: '1d', nev: '1d · #FF7AB8', leiras: 'A legvilágosabb, pasztellesebb.', szin: '#FF7AB8', ful: 'cd-ds' },
      ],
      ajanlott: '1a',
      indok: 'Feketén mind a négy olvasható, és mindegyiken fekete betű kell (fehér betű egyiken sem éri el a 4,5:1-et). Az 1a már bevált; a végleges árnyalatot a megrendelő a nyomdai színnel is egyeztetheti.',
    },
    {
      id: 'betupar',
      cim: 'Betűpár',
      kerdes: 'Milyen betűkkel készüljön (cím · szöveg · számok)?',
      opciok: [
        { id: '2c', nev: '2c · Bricolage Grotesque · Hanken Grotesk · Geist Mono', leiras: 'Karakteres, kicsit kézműves grotesk cím, mondatkezdő nagybetűvel (a C betűi).', ful: 'proto-c' },
        { id: '2e', nev: '2e · Big Shoulders Display · Archivo · JetBrains Mono', leiras: 'Kondenzált, nagybetűs, cégérbetű-hangulat (az A betűi).', ful: 'proto-a' },
        { id: '2f', nev: '2f · Bodoni Moda · Schibsted Grotesk · IBM Plex Mono', leiras: 'Szerkesztőségi antikva rögzített optikai mérettel (a B betűi).', ful: 'proto-b' },
        { id: '2a', nev: '2a · Archivo két szélességben · JetBrains Mono', leiras: 'Egy család: keskeny cím, normál szöveg; a legkevesebb betöltés.', ful: 'cd-ds' },
        { id: '2b', nev: '2b · Instrument Serif · Instrument Sans · IBM Plex Mono', leiras: 'A Bodoni utódja vastagabb hajszálvonallal.', ful: 'cd-ds' },
        { id: '2d', nev: '2d · Newsreader · Schibsted Grotesk · IBM Plex Mono', leiras: 'A mostani B-hez legközelebbi antikva.', ful: 'cd-ds' },
      ],
      ajanlott: '2c',
      indok: 'Kis méretben és 1× kijelzőn is jól olvasható, minden magyar ékezete megvan, és nyugodtabb a csupa nagybetűs címeknél.',
    },
    {
      id: 'sarok',
      cim: 'Sarkok',
      kerdes: 'Mennyire legyenek lekerekítve a gombok és a kártyák?',
      opciok: [
        { id: '6', nev: '6 px', leiras: 'Puha, de még pontos (a C).', ful: 'cd-tablo' },
        { id: '2', nev: '2 px', leiras: 'Alig lekerekített (az A).', ful: 'cd-tablo' },
        { id: '0', nev: '0 px', leiras: 'Szögletes (a B).', ful: 'cd-tablo' },
        { id: '12', nev: '12 px', leiras: 'Kerek, barátságos.', ful: 'cd-tablo' },
      ],
      ajanlott: '6',
      indok: 'A gombok és a kártyák barátságosabbak, a méretvonalak és a rács mellett mégsem hatnak játékosnak.',
    },
    {
      id: 'feny',
      cim: 'Fény',
      kerdes: 'Hol világítson a rózsaszín (neonfény)?',
      opciok: [
        { id: 'hero-gomb', nev: 'A hero cégérén és a fő gombon', leiras: 'Egy-két fénypont az oldalon (a C).', ful: 'proto-c' },
        { id: 'cimek', nev: 'A címeken és a cégéren is', leiras: 'Sok fény, éjszakai hangulat (az A).', ful: 'proto-a' },
        { id: 'nincs', nev: 'Sehol', leiras: 'Sík színek, fény nélkül (a B).', ful: 'proto-b' },
      ],
      ajanlott: 'hero-gomb',
      indok: 'A fény a világító reklámok világára utal; ha kevés van belőle, oda viszi a figyelmet, ahol dönteni kell: a fő gombra.',
    },
    {
      id: 'gomb',
      cim: 'Fő gomb',
      kerdes: 'Milyen színű legyen a fő gomb (Ajánlatkérés)?',
      opciok: [
        { id: 'rozsa', nev: 'Rózsaszín, fekete betűvel', leiras: 'A márkaszín a legfontosabb gombon.', ful: 'proto-c' },
        { id: 'krem', nev: 'Krém, sötét betűvel', leiras: 'A rózsaszín csak akcentus marad (a B).', ful: 'proto-b' },
      ],
      ajanlott: 'rozsa',
      indok: 'A fő cél az ajánlatkérés: a gombja legyen az oldal legfeltűnőbb eleme.',
    },
    {
      id: 'meroszin',
      cim: 'Mérőszín',
      kerdes: 'Milyen színűek legyenek a méretvonalak és a vonalzók?',
      opciok: [
        { id: 'sarga', nev: 'Mérőszalag-sárga · #F0C43C', leiras: 'Az A és a C.', szin: '#F0C43C', ful: 'proto-c' },
        { id: 'acel', nev: 'Acélszürke · #9EA8B2', leiras: 'A B.', szin: '#9EA8B2', ful: 'proto-b' },
      ],
      ajanlott: 'sarga',
      indok: 'A sárga azonnal mérésként olvasható, és nem keveredik a rózsaszínnel.',
    },
    {
      id: 'hero',
      cim: 'Hero',
      kerdes: 'Milyen legyen a kezdőlap első képernyője?',
      opciok: [
        { id: 'H2', nev: 'H2 · Két ajtó', leiras: 'A két belépő maga a hero: a webshop a „-tól” árakkal, az egyedi munkák a kilenc munkatípussal.', ful: 'cd-tablo' },
        { id: 'H1', nev: 'H1 · Gyártási rajz', leiras: 'A cím egy műhelyi rajz, méretvonalakkal és rajzfejjel; „A = ? mm”, mert helyszínen mérünk.', ful: 'cd-tablo' },
        { id: 'H3', nev: 'H3 · Azonnali ár', leiras: 'Molinó-gyorskalkulátor az első képernyőn.', ful: 'cd-tablo' },
        { id: 'H4', nev: 'H4 · Anyagfal', leiras: 'Anyagminták fala, a cím egy címkén.', ful: 'cd-tablo' },
        { id: 'H5', nev: 'H5 · Mérőszalag', leiras: 'Egy kihúzott mérőszalag fut át a heron.', ful: 'cd-tablo' },
        { id: 'H6', nev: 'H6 · Fóliatekercs', leiras: 'Rózsaszín fóliatekercs gördül le, rajta a cím.', ful: 'cd-tablo' },
        { id: 'H-K1', nev: 'H-K1 · Élő cégér', leiras: 'A látogató beírja a nevét, és világító betűs cégérként látja.', ful: 'cd-tablo' },
        { id: 'H-K2', nev: 'H-K2 · Fóliafelhordás', leiras: 'A cím kirakatüvegre kerül, egy simítólapát húzza fel.', ful: 'cd-tablo' },
        { id: 'H-K3', nev: 'H-K3 · Gyomlálás', leiras: 'A cím rózsaszín fóliából kivágva, a felesleg félig lehúzva.', ful: 'cd-tablo' },
        { id: 'sajat', nev: 'Az irány saját herója', leiras: 'Ahogy a választott irány prototípusán látszik.', ful: 'proto-c' },
      ],
      ajanlott: 'H2',
      indok: 'A látogató az első pillantással utat választ, a kilenc munkatípus egyenesen az ajánlatkérésbe visz. Az ajánlat-ajtó kapja a hangsúlyt, mert az a fő cél. A H-K1 a „Világító betűk” oldalára javasolt.',
    },
    {
      id: 'szolgaltatasok',
      cim: 'Szolgáltatások',
      kerdes: 'Hogyan mutassa a kezdőlap a szolgáltatásokat?',
      opciok: [
        { id: 'SZ1', nev: 'SZ1 · Mit szeretne dekorálni?', leiras: 'Belépés felület szerint, a látogató nyelvén („a kirakatomra”).', ful: 'cd-tablo' },
        { id: 'SZ2', nev: 'SZ2 · Azonnal rendelhető / Ajánlatra', leiras: 'Két sáv: webshop-termékek árral, alatta az egyedi munkák.', ful: 'cd-tablo' },
        { id: 'SZ3', nev: 'SZ3 · Utcakép', leiras: 'Utcarészlet rajzként, számozott munkákkal és mellette listával.', ful: 'cd-tablo' },
        { id: 'SZ4', nev: 'SZ4 · Tárgymutató', leiras: 'Ábécérendes mutató gépelés közbeni szűréssel.', ful: 'cd-tablo' },
        { id: 'SZ5', nev: 'SZ5 · Betűtábla', leiras: 'Árlista egy filc betűtáblán.', ful: 'cd-tablo' },
        { id: 'SZ-K1', nev: 'SZ-K1 · Kérdezzen bátran', leiras: 'Óriás beviteli mező; a szólista szolgáltatást javasol.', ful: 'cd-tablo' },
      ],
      ajanlott: 'SZ1',
      indok: 'A látogató nyelvén indul, és a munkatípushoz vezet. A /szolgaltatasok oldalra az SZ4 tárgymutatót javasoljuk.',
    },
    {
      id: 'folyamat',
      cim: 'Folyamat',
      kerdes: 'Hogyan mutassa a kezdőlap a „hogyan dolgozunk” négy lépését?',
      opciok: [
        { id: 'F2', nev: 'F2 · Vonalzó-idővonal', leiras: 'A négy lépés egy vonalzón, mint a beosztások.', ful: 'cd-tablo' },
        { id: 'F1', nev: 'F1 · Ön és mi', leiras: 'Két sáv: mit tesz a megrendelő és mit a műhely; „Nincs teendője”.', ful: 'cd-tablo' },
        { id: 'F3', nev: 'F3 · Egy munka útja', leiras: 'Ugyanaz a felirat vázlattól a világító betűig.', ful: 'cd-tablo' },
        { id: 'F4', nev: 'F4 · Két útvonal', leiras: 'Metrótérkép: a webshop és az egyedi munka útja.', ful: 'cd-tablo' },
        { id: 'F5', nev: 'F5 · Naptárcsík', leiras: 'A webshop határideje a valódi naptáron.', ful: 'cd-tablo' },
        { id: 'F-K1', nev: 'F-K1 · Munkalap pecsétekkel', leiras: 'Műhelyi munkalap, görgetéskor lecsapódó pecsétekkel.', ful: 'cd-tablo' },
      ],
      ajanlott: 'F2',
      indok: 'Rövid, és a mérés nyelvén beszél. Az F1 az ajánlatkérés oldalára, az F4 a webshop és a pénztár mellé kerülhet.',
    },
    {
      id: 'referenciak',
      cim: 'Referenciák',
      kerdes: 'Hogyan mutassuk a munkákat?',
      opciok: [
        { id: 'O3', nev: 'O3 · Szűrős aloldal', leiras: 'Felület szerinti szűrő, kiemelt munka előtte/utána csúszkával.', ful: 'cd-tablo' },
        { id: 'O3+R-K2', nev: 'O3 és R-K2 · Éjszakai séta', leiras: 'Ugyanez, a világító munkáknál éjszakai nézettel.', ful: 'cd-tablo' },
        { id: 'R-K1', nev: 'R-K1 · Mintalegyező', leiras: 'A munkák egy színmintalegyező lapjain.', ful: 'cd-tablo' },
      ],
      ajanlott: 'O3',
      indok: 'Gyorsan áttekinthető, és JavaScript nélkül is működik (felületenként saját oldal). Az éjszakai nézet később hozzáadható.',
    },
    {
      id: 'kepek',
      cim: 'Képek, amíg nincsenek fotók',
      kerdes: 'Mi álljon a referenciaképek helyén?',
      opciok: [
        { id: 'cd-g1', nev: 'Jelölt helyőrző és fotó-forgatókönyv', leiras: 'A helyőrző nem utánoz fotót; a nyolc jelenet forgatókönyve a fotózáshoz (Claude Design G1).', ful: 'cd-tablo' },
        { id: 'repo-g1', nev: 'Illusztrált jelenetek', leiras: 'Nyolc rajzolt jelenet egy léptékben, nappal és éjjel (a tabló G1-e).', ful: 'elemek-c' },
        { id: 'mindketto', nev: 'Mindkettő', leiras: 'Helyőrző a rácsban, illusztráció a kiemelt helyeken.', ful: 'elemek-c' },
      ],
      ajanlott: 'cd-g1',
      indok: 'A valódi fotók a forgatókönyv alapján készülhetnek el; addig semmi nem tűnik kitalált munkának.',
    },
    {
      id: 'piktogramok',
      cim: 'Piktogramok',
      kerdes: 'Melyik piktogramcsalád legyen?',
      opciok: [
        { id: 'cd-g2', nev: 'Egy család a 9 munkatípushoz és a 6 termékhez', leiras: '24 px-es rács, 1,5 px-es vonal (Claude Design G2).', ful: 'cd-tablo' },
        { id: 'repo-g2', nev: 'A tabló piktogramjai', leiras: 'Három stílusban (a tabló G2-e).', ful: 'elemek-c' },
      ],
      ajanlott: 'cd-g2',
      indok: 'Egy rendszer két külön készlet helyett; a „tervrajz” stílus a mérőszínnel rajzol.',
    },
    {
      id: 'szomarka',
      cim: 'Szómárka',
      kerdes: 'Mi legyen a szómárka, amíg nincs logó?',
      opciok: [
        { id: 'marad', nev: 'A mostani STILET • DEKOR', leiras: 'Tipografikus szómárka a választott irány címbetűjével.', ful: 'proto-c' },
        { id: 'cd-g4', nev: 'Claude Design G4 (a–e)', leiras: 'Vágott fólia, méretvonal, neoncső, illesztőjel, SD monogram; a betűjelet a megjegyzésbe.', ful: 'cd-tablo' },
        { id: 'repo-g4', nev: 'A tabló G4-e', leiras: 'Öt szómárka-irány; a változatot a megjegyzésbe.', ful: 'elemek-c' },
      ],
      ajanlott: 'marad',
      indok: 'A logó a megrendelő döntése; addig a mostani szómárka a legkevésbé köt meg.',
    },
    {
      id: 'mozgas',
      cim: 'Mozgás',
      kerdes: 'Melyik legyen az oldal egyetlen megkomponált mozgása?',
      opciok: [
        { id: 'neon', nev: 'A hero cégére bekapcsol', leiras: 'Egyszer, betöltéskor.', ful: 'proto-c' },
        { id: 'szalag', nev: 'A mérőszalag kifut (H5)', leiras: 'Egyszer, betöltéskor.', ful: 'cd-tablo' },
        { id: 'folia', nev: 'Fóliafelhordás (H-K2)', leiras: 'A simítólapát egyszer végighúz.', ful: 'cd-tablo' },
        { id: 'gyomlalas', nev: 'Gyomlálás (H-K3)', leiras: 'A felesleg egyszer lehúzódik.', ful: 'cd-tablo' },
        { id: 'pecset', nev: 'Pecsétek (F-K1)', leiras: 'Görgetéskor egyszer lecsapódnak.', ful: 'cd-tablo' },
        { id: 'nincs', nev: 'Nincs mozgás', leiras: 'Csak a finom átmenetek maradnak.', ful: 'proto-b' },
      ],
      ajanlott: 'neon',
      indok: 'A világító reklámra utal, illik a C fényéhez; csökkentett mozgásnál a kész, világító állapot látszik.',
    },
    {
      id: 'oldalak',
      cim: 'Pénztár, rendelés állapota, referencia-aloldal',
      kerdes: 'Ezek legyenek a kiindulás (Claude Design O1–O3)?',
      opciok: [
        { id: 'igen', nev: 'Igen, ezekből indulunk', leiras: 'A brief rendelési folyamatát követik; a „Most még nem fizet” a gomb fölött áll.', ful: 'cd-tablo' },
        { id: 'mas', nev: 'Mást szeretnék', leiras: 'Írd le a megjegyzésben, mit.', ful: 'cd-tablo' },
      ],
      ajanlott: 'igen',
      indok: 'A meglévő komponensekből épülnek, és a rendelési folyamat minden kötelező szövegét tartalmazzák.',
    },
  ];
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function opcio(dontes, o) {
  const ajanlott = o.id === dontes.ajanlott;
  const minta = o.szin ? `<span class="minta" style="background:${esc(o.szin)}" aria-hidden="true"></span>` : '';
  const megnez = o.ful ? `<a class="megnez" href="#${esc(o.ful)}" target="_top">Megnézem<span class="sr"> (${esc(o.nev)})</span> →</a>` : '';
  return (
    `<div class="op${ajanlott ? ' op--ajanlott' : ''}">` +
    `<label><input type="radio" name="${esc(dontes.id)}" value="${esc(o.id)}" data-nev="${esc(o.nev)}">` +
    `<span class="op__fej">${minta}<b>${esc(o.nev)}</b>${ajanlott ? '<span class="jel">Ajánlott</span>' : ''}</span>` +
    `<span class="op__leiras">${esc(o.leiras)}</span></label>${megnez}</div>`
  );
}

function blokk(dontes, sorszam) {
  return (
    `<fieldset data-dontes="${esc(dontes.id)}" data-cim="${esc(dontes.cim)}">` +
    `<legend><span class="sorszam">${sorszam}</span> ${esc(dontes.cim)}</legend>` +
    `<p class="kerdes">${esc(dontes.kerdes)}</p>` +
    `<div class="opciok">${dontes.opciok.map((o) => opcio(dontes, o)).join('')}</div>` +
    `<p class="indok"><b>Ajánlásunk:</b> ${esc(dontes.opciok.find((o) => o.id === dontes.ajanlott)?.nev ?? '')}. ${esc(dontes.indok)}</p>` +
    '</fieldset>'
  );
}

const STILUS = `
:root { color-scheme: dark; --bg: #0b0b0d; --card: #141417; --line: #2e2e35; --text: #f3f0ea; --muted: #a9a7ae; --brand: #ff2e8a; --on-brand: #0a0a0b; --ok: #3fd68f; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--text); font: 15px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
main { max-width: 1040px; margin: 0 auto; padding: 28px 20px 64px; }
h1 { margin: 0 0 6px; font-size: 26px; line-height: 1.2; }
.bev { margin: 0 0 8px; color: var(--muted); max-width: 70ch; }
.bev b { color: var(--text); }
fieldset { margin: 22px 0 0; padding: 18px 18px 14px; border: 1px solid var(--line); border-radius: 10px; background: var(--card); }
legend { padding: 0 6px; font-size: 18px; font-weight: 700; }
.sorszam { display: inline-grid; place-items: center; width: 26px; height: 26px; margin-right: 4px; border-radius: 50%; background: var(--line); font-size: 13px; }
.kerdes { margin: 0 0 12px; color: var(--muted); }
.opciok { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 10px; }
.op { display: flex; flex-direction: column; border: 1px solid var(--line); border-radius: 8px; background: var(--bg); }
.op--ajanlott { border-color: color-mix(in oklab, var(--brand) 55%, var(--line)); }
.op:has(input:checked) { border-color: var(--brand); box-shadow: 0 0 0 1px var(--brand); }
.op label { display: grid; grid-template-columns: auto 1fr; gap: 4px 10px; padding: 12px 12px 8px; cursor: pointer; flex: 1; }
.op input { width: 20px; height: 20px; margin: 1px 0 0; accent-color: var(--brand); grid-row: span 2; }
.op__fej { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.op__leiras { color: var(--muted); font-size: 13.5px; }
.minta { width: 16px; height: 16px; border-radius: 4px; border: 1px solid rgba(255,255,255,.25); }
.jel { padding: 1px 7px; border-radius: 999px; background: var(--brand); color: var(--on-brand); font-size: 11.5px; font-weight: 700; }
.megnez { align-self: flex-start; margin: 0 12px 10px 42px; color: var(--text); font-size: 13px; }
.indok { margin: 12px 0 0; padding-top: 10px; border-top: 1px dashed var(--line); color: var(--muted); font-size: 13.5px; }
.indok b { color: var(--text); }
textarea { width: 100%; min-height: 90px; padding: 10px; border: 1px solid var(--line); border-radius: 8px; background: var(--bg); color: var(--text); font: inherit; }
.osszegzes { margin-top: 22px; padding: 18px; border: 1px solid var(--brand); border-radius: 10px; background: var(--card); }
.osszegzes h2 { margin: 0 0 8px; font-size: 18px; }
.gombok { display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0 0; }
button { min-height: 44px; padding: 8px 16px; border: 1px solid var(--line); border-radius: 8px; background: var(--bg); color: var(--text); font: inherit; font-weight: 600; cursor: pointer; }
button.fo { border-color: var(--brand); background: var(--brand); color: var(--on-brand); }
.allapot { margin: 8px 0 0; color: var(--ok); min-height: 1.5em; }
a:focus-visible, button:focus-visible, input:focus-visible, textarea:focus-visible { outline: 2px solid var(--brand); outline-offset: 2px; }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.nojs { margin: 22px 0 0; padding: 14px 16px; border: 1px dashed var(--muted); border-radius: 10px; color: var(--muted); }
`;

// Where scripts run: the ticked options become a text to copy, remembered in the browser (localStorage, per file).
const SZKRIPT = `
(() => {
  const KULCS = 'stilet-dontolap';
  const urlap = document.querySelector('form');
  const kimenet = document.getElementById('osszegzes-szoveg');
  const allapot = document.getElementById('allapot');
  document.getElementById('osszegzes').hidden = false;
  try {
    const mentett = JSON.parse(localStorage.getItem(KULCS) || '{}');
    for (const [nev, ertek] of Object.entries(mentett)) {
      const mezo = urlap.elements.namedItem(nev);
      if (mezo && 'value' in mezo) mezo.value = ertek;
    }
  } catch (e) { /* tárhely nélkül is működik */ }
  const frissit = () => {
    const sorok = [...urlap.querySelectorAll('fieldset[data-dontes]')].map((f) => {
      const jelolt = f.querySelector('input:checked');
      return f.dataset.cim + ': ' + (jelolt ? jelolt.dataset.nev : '—');
    });
    const megjegyzes = urlap.elements.namedItem('megjegyzes').value.trim();
    kimenet.value = ['Döntőlap · Stilet Dekor arculat', ...sorok, ...(megjegyzes ? ['Megjegyzés: ' + megjegyzes] : [])].join('\\n');
    try {
      localStorage.setItem(KULCS, JSON.stringify(Object.fromEntries(new FormData(urlap))));
    } catch (e) { /* tárhely nélkül is működik */ }
  };
  urlap.addEventListener('input', frissit);
  urlap.addEventListener('change', frissit);
  document.getElementById('ajanlottak').addEventListener('click', () => {
    for (const f of urlap.querySelectorAll('fieldset[data-dontes]')) {
      const ajanlott = f.querySelector('.op--ajanlott input');
      if (ajanlott) ajanlott.checked = true;
    }
    frissit();
  });
  document.getElementById('masolas').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(kimenet.value);
      allapot.textContent = 'Másolva. Illeszd be a chatbe.';
    } catch (e) {
      kimenet.select();
      allapot.textContent = 'Jelöld ki és másold (Ctrl+C).';
    }
  });
  frissit();
})();
`;

/** The decision sheet as a full document. */
export function dontolapDokumentum({ dontesek: lista, generalva }) {
  return `<!doctype html>
<html lang="hu">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Döntőlap – Stilet Dekor arculat</title>
<style>${STILUS}</style>
</head>
<body>
<main>
<h1>Döntőlap: a végleges arculat</h1>
<p class="bev">Nézd át a füleket (prototípus A, B és C irányban, tabló keverővel, teljes irányok, elemek), aztán jelöld be itt, mit választasz. Minden pontnál ott az ajánlásunk és az indoka; a „Megnézem” a megfelelő fülre visz. <b>Az ajánlás javaslat, a döntés a tiéd és a megrendelőé.</b> Generálva: ${esc(generalva)}.</p>
<form>
${lista.map((d, i) => blokk(d, i + 1)).join('\n')}
<fieldset><legend>Megjegyzés</legend>
<p class="kerdes">Bármi, ami a jelölésekből nem derül ki (például: „a C, de a B betűivel”, „G4 c”).</p>
<label class="sr" for="megjegyzes">Megjegyzés</label>
<textarea id="megjegyzes" name="megjegyzes"></textarea>
</fieldset>
<section class="osszegzes" id="osszegzes" hidden aria-labelledby="osszegzes-cim">
<h2 id="osszegzes-cim">Összegzés a chatbe</h2>
<label class="sr" for="osszegzes-szoveg">Összegzés</label>
<textarea id="osszegzes-szoveg" readonly rows="12"></textarea>
<div class="gombok"><button type="button" class="fo" id="masolas">Összegzés másolása</button><button type="button" id="ajanlottak">Az ajánlottak bejelölése</button></div>
<p class="allapot" id="allapot" role="status"></p>
</section>
</form>
<noscript><p class="nojs">Ebben a nézetben (például a OneDrive előnézetében) a jelölések nem adódnak össze, és a fülekre sem visznek a linkek. Írd meg a chatben a választott azonosítókat, például: „Irány C, márkaszín 1a, betűpár 2c, hero H2”. Böngészőben megnyitva (dupla kattintás) az összegzés magától elkészül.</p></noscript>
</main>
<script>${SZKRIPT}</script>
</body>
</html>
`;
}
