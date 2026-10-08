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
 * The switcher file. It works without scripts, because previews such as OneDrive on the web or on a phone show
 * HTML but do not run it: every design sits in its own frame (srcdoc), and radio buttons with labels switch the
 * design and the view through CSS alone (arrow keys move between them, as in any radio group). Where scripts run,
 * a small script only adds comfort: the open design is kept in the address (#x1) and in the window title.
 */
export function kapcsoloFajl(tervek, generalva) {
  const radiok = tervek
    .map((t, i) => `<input class="lv-radio" type="radio" name="terv" id="t-${esc(t.id)}"${i === 0 ? ' checked' : ''}>`)
    .join('\n');
  const cimkek = tervek
    .map((t) => `<label for="t-${esc(t.id)}" aria-label="${esc(t.cim)}">${esc(t.rovid)}</label>`)
    .join('');
  const leirasok = tervek
    .map((t) => `<p class="lv-leiras" data-terv="${esc(t.id)}"><b>${esc(t.cim)}</b> – ${esc(t.leiras)}</p>`)
    .join('\n');
  const panelek = tervek
    .map(
      (t) =>
        `<section class="lv-panel" data-terv="${esc(t.id)}"><iframe title="${esc(t.cim)}" loading="lazy" srcdoc="${esc(t.html)}"></iframe></section>`,
    )
    .join('\n');
  const valtasok = tervek
    .map((t) => {
      const r = `#t-${t.id}`;
      return [
        `${r}:checked ~ .lv-szinpad .lv-panel[data-terv="${t.id}"] { display: flex; }`,
        `${r}:checked ~ .lv-bar .lv-leiras[data-terv="${t.id}"] { display: block; }`,
        `${r}:checked ~ .lv-bar label[for="t-${t.id}"] { border-color: var(--brand); background: var(--brand); color: var(--on-brand); font-weight: 700; }`,
        `${r}:focus-visible ~ .lv-bar label[for="t-${t.id}"] { outline: 2px solid var(--brand); outline-offset: 2px; }`,
      ].join('\n');
    })
    .join('\n');
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
.lv-radio { position: absolute; width: 1px; height: 1px; margin: 0; opacity: 0; pointer-events: none; }
.lv-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 14px; padding: 10px 16px; border-bottom: 1px solid var(--line); }
.lv-cim { margin: 0; font-size: 15px; font-weight: 700; white-space: nowrap; }
.lv-cim span { color: var(--muted); font-weight: 400; }
.lv-tervek, .lv-nezet { display: flex; flex-wrap: wrap; gap: 6px; }
.lv-nezet { margin-left: auto; }
label { display: inline-flex; align-items: center; min-height: 32px; padding: 4px 12px; border: 1px solid var(--line); border-radius: 999px; cursor: pointer; user-select: none; touch-action: manipulation; }
label:hover { border-color: var(--muted); }
.lv-leirasok { flex-basis: 100%; }
.lv-leiras { display: none; margin: 0; color: var(--muted); }
.lv-leiras b { color: var(--text); }
.lv-szinpad { display: flex; flex: 1; min-height: 0; background: var(--stage); }
.lv-panel { display: none; flex: 1; justify-content: center; min-height: 0; }
iframe { width: 100%; height: 100%; min-height: 70vh; border: 0; background: #fff; }
#n-asztali:checked ~ .lv-bar label[for="n-asztali"], #n-mobil:checked ~ .lv-bar label[for="n-mobil"] { border-color: var(--brand); background: var(--brand); color: var(--on-brand); font-weight: 700; }
#n-asztali:focus-visible ~ .lv-bar label[for="n-asztali"], #n-mobil:focus-visible ~ .lv-bar label[for="n-mobil"] { outline: 2px solid var(--brand); outline-offset: 2px; }
#n-mobil:checked ~ .lv-szinpad iframe { width: 390px; max-width: 100%; border-inline: 1px solid var(--line); }
${valtasok}
</style>
</head>
<body>
${radiok}
<input class="lv-radio" type="radio" name="nezet" id="n-asztali" checked>
<input class="lv-radio" type="radio" name="nezet" id="n-mobil">
<header class="lv-bar">
<p class="lv-cim">Arculati látványtervek <span>· Stilet Dekor · ${esc(generalva)}</span></p>
<nav class="lv-tervek" aria-label="Tervek">${cimkek}</nav>
<div class="lv-nezet" aria-label="Nézet"><label for="n-asztali">Asztali</label><label for="n-mobil">Mobil (390 px)</label></div>
<div class="lv-leirasok">
${leirasok}
</div>
</header>
<main class="lv-szinpad">
${panelek}
</main>
<script>
// Comfort only (the switching itself needs no script): keep the open design in the address and the window title.
(() => {
  const radiok = [...document.querySelectorAll('input[name="terv"]')];
  const mutat = (radio) => {
    const label = document.querySelector('label[for="' + radio.id + '"]');
    document.title = (label ? label.getAttribute('aria-label') : '') + ' – Arculati látványtervek';
    try { history.replaceState(null, '', '#' + radio.id.slice(2)); } catch (e) { /* cím nélkül is működik */ }
  };
  const kezdo = radiok.find((r) => '#' + r.id.slice(2) === location.hash);
  if (kezdo) kezdo.checked = true;
  radiok.forEach((r) => r.addEventListener('change', () => mutat(r)));
  mutat(radiok.find((r) => r.checked) || radiok[0]);
})();
</script>
</body>
</html>
`;
}
