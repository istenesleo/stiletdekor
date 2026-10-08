// The Claude Design files (design/claude-design/*.dc.html) made ready to run inside "Arculati látványtervek.html":
// the runtime (support.js) goes inline, the files they import ride along as in-memory blobs (the runtime reads
// window.__resources and window.__resourceBlobs before it fetches a sibling), a prop's default can be set (the
// prototype's direction), and links between the files switch tabs of the switcher instead of opening a file.
// React and Babel still load from unpkg, the fonts from Google Fonts: the tabs need the internet.

const decode = (s) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const encode = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
/** A JS string literal that is safe inside a <script> element. */
const jsString = (s) => JSON.stringify(s).replace(/</g, '\\u003c');

/** Shown where scripts do not run (the OneDrive preview): the Claude Design runtime needs them. */
export const NOSCRIPT =
  '<noscript><p style="margin:24px;padding:16px 18px;border:1px dashed #a9a7ae;border-radius:10px;color:#f3f0ea;background:#0b0b0d;font:15px/1.5 system-ui,sans-serif">' +
  'Ez a fül JavaScriptet és internetet igényel (a Claude Design futtatókörnyezete). Nyisd meg a fájlt böngészőben, dupla kattintással.</p></noscript>';

/** Sets the defaults of props the file declares in its data-props attribute, e.g. { direction: 'A' }. */
export function propAlapertekek(html, ertekek) {
  const match = /data-props="([^"]*)"/.exec(html);
  if (!match) throw new Error('A fájlnak nincsenek beállítható propjai (data-props).');
  const props = JSON.parse(decode(match[1]));
  for (const [nev, ertek] of Object.entries(ertekek)) {
    if (!props[nev]) throw new Error(`Nincs ilyen prop: ${nev}`);
    props[nev].default = ertek;
  }
  return html.replace(match[0], () => `data-props="${encode(JSON.stringify(props))}"`);
}

/**
 * The file as a self-contained document. `support` is support.js; `testverek` maps an imported file's name
 * (e.g. "StiletPrototipus") to its text; `props` sets prop defaults; `linkek` maps a linked file
 * ("Stilet Tablo.dc.html") to the switcher tab that shows it ("cd-tablo").
 */
export function claudeDesignDokumentum(html, { support, testverek = {}, props = {}, linkek = {} }) {
  let out = Object.keys(props).length ? propAlapertekek(html, props) : html;
  for (const [fajl, ful] of Object.entries(linkek)) {
    out = out.split(`href="${fajl}"`).join(`href="#${ful}" target="_top"`);
  }
  const nevek = Object.keys(testverek);
  const kulcs = (nev) => `beagyazott:${nev}`;
  const eroforrasok = nevek.length
    ? '<script>' +
      `window.__resources={${nevek.map((n) => `${jsString(`./${encodeURIComponent(n)}.dc.html`)}:${jsString(kulcs(n))}`).join(',')}};` +
      `window.__resourceBlobs={${nevek.map((n) => `${jsString(kulcs(n))}:new Blob([${jsString(testverek[n])}],{type:"text/html"})`).join(',')}};` +
      '</script>'
    : '';
  const tag = '<script src="./support.js"></script>';
  if (!out.includes(tag)) throw new Error('A fájl nem a ./support.js-t tölti be.');
  out = out.replace(tag, () => `${eroforrasok}<script>${support.replace(/<\/script/gi, '<\\/script')}</script>`);
  return out.replace(/<body([^>]*)>/, (body) => body + NOSCRIPT);
}
