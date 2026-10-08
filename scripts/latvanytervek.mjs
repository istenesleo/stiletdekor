// The local "Arculati látványtervek.html": one self-contained file that switches between the page designs (the A
// and B mockups, the full directions X1–X6) and the finished brand elements (G1–G4). These are the pure helpers;
// build-latvanytervek.mjs builds the site, serves it locally, fetches every design and writes the file.

const ELEMEK_LEIRAS =
  'A kész arculati elemek (G1–G4): referencia-jelenetek, piktogramcsalád, mérés-motívumok, szómárka-változatok';

/**
 * The designs of the file in switcher order. Each has either `fajl` (a mockup on disk) or `utvonal` (a page of the
 * built site). The full directions come from the board's variant list (src/tablo/variants.ts), finished ones only.
 */
export function tervLista(variants) {
  const iranyok = variants
    .filter((v) => v.group === 'irany' && v.status === 'kesz' && v.page)
    .map((v) => ({ id: v.page, rovid: v.id, cim: `${v.id} · ${v.name}`, leiras: v.idea, utvonal: `/tablo/irany/${v.page}` }));
  return [
    {
      id: 'a',
      rovid: 'A',
      cim: 'A · Neon műhely',
      leiras: 'Mélyfekete műhely, a rózsaszín neonfényként világít; méretvonalak, vágóalátét-rács. Teljes látványterv aloldalakkal.',
      fajl: 'design/mockups/a-neon-muhely.html',
    },
    {
      id: 'b',
      rovid: 'B',
      cim: 'B · Galéria / editorial',
      leiras: 'Magazinszerű, nyugodt, prémium: nagy képek, sok negatív tér, a rózsaszín apró akcentus. Teljes látványterv aloldalakkal.',
      fajl: 'design/mockups/b-galeria-editorial.html',
    },
    ...iranyok,
    {
      id: 'elemek-a',
      rovid: 'Elemek · A',
      cim: 'Elemek · A irány (G1–G4)',
      leiras: `${ELEMEK_LEIRAS}, a Neon műhely színeivel és betűivel.`,
      utvonal: '/tablo?csoport=grafika&csak=kesz&beagyazott=1&tema=neon-muhely',
    },
    {
      id: 'elemek-b',
      rovid: 'Elemek · B',
      cim: 'Elemek · B irány (G1–G4)',
      leiras: `${ELEMEK_LEIRAS}, a Galéria / editorial színeivel és betűivel.`,
      utvonal: '/tablo?csoport=grafika&csak=kesz&beagyazott=1&tema=galeria-editorial',
    },
  ];
}

/** A mockup file (it starts at <title>) as a full document, the way the dev sites serve it (src/site/design-preview.ts). */
export function mockupDokumentum(tartalom) {
  return [
    '<!doctype html>',
    '<html lang="hu">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    tartalom,
  ].join('\n');
}

/** A page of the site made ready to run inside the file: the back link goes, links into the site lead nowhere. */
export function oldalKiigazitasa(html) {
  return html
    .replace(/<a class="tb-back"[^>]*>[\s\S]*?<\/a>/g, '')
    .replace(/(<a\b[^>]*?\shref=")\/(?!\/)[^"]*"/g, '$1#"');
}

/**
 * Puts the site's own stylesheets and module scripts into the page, so it runs from a file. `szoveg(path)` returns a
 * file of the built site; `csomag(src)` returns a module script bundled with its imports. Remote stylesheets stay.
 */
export async function beagyazas(html, { szoveg, csomag }) {
  let out = html;
  for (const [tag, href] of [...html.matchAll(/<link rel="stylesheet" href="(\/[^"/][^"]*)"\s*\/?>/g)]) {
    const css = (await szoveg(href)).replace(/<\/style/gi, '<\\/style');
    out = out.replace(tag, () => `<style>${css}</style>`);
  }
  for (const [tag, src] of [...html.matchAll(/<script type="module" src="(\/[^"/][^"]*)"><\/script>/g)]) {
    const js = (await csomag(src)).replace(/<\/script/gi, '<\\/script');
    out = out.replace(tag, () => `<script type="module">${js}</script>`);
  }
  return out;
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

/**
 * The switcher file: a bar of buttons over one frame. The designs travel as JSON (every "<" escaped, so no design
 * can close the data block) and open as blob documents on first use; the open design is kept in the address (#a).
 */
export function kapcsoloFajl(tervek, generalva) {
  const adat = JSON.stringify(tervek.map(({ id, rovid, cim, leiras, html }) => ({ id, rovid, cim, leiras, html }))).replace(
    /</g,
    '\\u003c',
  );
  const gombok = tervek
    .map((t) => `<button type="button" data-terv="${esc(t.id)}" aria-pressed="false" aria-label="${esc(t.cim)}">${esc(t.rovid)}</button>`)
    .join('');
  return `<!doctype html>
<html lang="hu">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Arculati látványtervek – Stilet Dekor</title>
<style>
:root { color-scheme: dark; --bg: #0b0b0d; --stage: #1a1a1d; --line: #34343b; --text: #f3f0ea; --muted: #a9a7ae; --brand: #ff2e8a; --on-brand: #0a0a0b; }
* { box-sizing: border-box; }
html, body { height: 100%; margin: 0; }
body { display: flex; flex-direction: column; background: var(--bg); color: var(--text); font: 14px/1.4 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
.lv-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 14px; padding: 10px 16px; border-bottom: 1px solid var(--line); }
.lv-cim { margin: 0; font-size: 15px; font-weight: 700; white-space: nowrap; }
.lv-cim span { color: var(--muted); font-weight: 400; }
.lv-tervek, .lv-lepes, .lv-nezet { display: flex; flex-wrap: wrap; gap: 6px; }
.lv-nezet { margin-left: auto; }
button { min-height: 32px; padding: 4px 12px; border: 1px solid var(--line); border-radius: 999px; background: transparent; color: var(--text); font: inherit; cursor: pointer; touch-action: manipulation; }
button:hover { border-color: var(--muted); }
button[aria-pressed="true"] { border-color: var(--brand); background: var(--brand); color: var(--on-brand); font-weight: 700; }
button:focus-visible { outline: 2px solid var(--brand); outline-offset: 2px; }
.lv-leiras { flex-basis: 100%; margin: 0; color: var(--muted); }
.lv-leiras b { color: var(--text); }
.lv-szinpad { display: flex; flex: 1; justify-content: center; min-height: 0; background: var(--stage); }
iframe { width: 100%; height: 100%; border: 0; background: #fff; }
.lv-szinpad[data-nezet="mobil"] iframe { width: 390px; max-width: 100%; border-inline: 1px solid var(--line); }
</style>
</head>
<body>
<header class="lv-bar">
<p class="lv-cim">Arculati látványtervek <span>· Stilet Dekor · ${esc(generalva)}</span></p>
<div class="lv-lepes"><button type="button" data-lepes="-1" aria-label="Előző terv">‹</button><button type="button" data-lepes="1" aria-label="Következő terv">›</button></div>
<nav class="lv-tervek" aria-label="Tervek">${gombok}</nav>
<div class="lv-nezet" role="group" aria-label="Nézet"><button type="button" data-nezet="asztali" aria-pressed="true">Asztali</button><button type="button" data-nezet="mobil" aria-pressed="false">Mobil (390 px)</button></div>
<p class="lv-leiras" aria-live="polite"></p>
</header>
<main class="lv-szinpad" data-nezet="asztali"><iframe title="Látványterv"></iframe></main>
<script type="application/json" id="lv-adat">${adat}</script>
<script>
(() => {
  const tervek = JSON.parse(document.getElementById('lv-adat').textContent);
  const frame = document.querySelector('iframe');
  const szinpad = document.querySelector('.lv-szinpad');
  const leiras = document.querySelector('.lv-leiras');
  const gombok = [...document.querySelectorAll('button[data-terv]')];
  const nezetek = [...document.querySelectorAll('button[data-nezet]')];
  const urlek = new Map();
  let aktiv = 0;
  // Opens a design: its document is made once, on first use, so the file opens fast.
  const nyit = (index) => {
    aktiv = (index + tervek.length) % tervek.length;
    const t = tervek[aktiv];
    if (!urlek.has(t.id)) urlek.set(t.id, URL.createObjectURL(new Blob([t.html], { type: 'text/html;charset=utf-8' })));
    frame.src = urlek.get(t.id);
    frame.title = t.cim;
    gombok.forEach((g, i) => g.setAttribute('aria-pressed', String(i === aktiv)));
    const cim = document.createElement('b');
    cim.textContent = t.cim;
    leiras.replaceChildren(cim, ' – ' + t.leiras);
    document.title = t.cim + ' – Arculati látványtervek';
    try { history.replaceState(null, '', '#' + t.id); } catch (e) { /* a cím nélkül is működik */ }
  };
  gombok.forEach((g, i) => g.addEventListener('click', () => nyit(i)));
  document.querySelectorAll('button[data-lepes]').forEach((g) => g.addEventListener('click', () => nyit(aktiv + Number(g.dataset.lepes))));
  nezetek.forEach((g) => g.addEventListener('click', () => {
    szinpad.dataset.nezet = g.dataset.nezet;
    nezetek.forEach((x) => x.setAttribute('aria-pressed', String(x === g)));
  }));
  // Arrow keys switch designs while the focus is on the bar (inside a design they belong to the design).
  document.addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === 'ArrowLeft') nyit(aktiv - 1);
    else if (e.key === 'ArrowRight') nyit(aktiv + 1);
  });
  const kezdo = tervek.findIndex((t) => '#' + t.id === location.hash);
  nyit(kezdo < 0 ? 0 : kezdo);
})();
</script>
</body>
</html>
`;
}
