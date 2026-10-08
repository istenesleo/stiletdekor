// npm run latvanytervek: builds the site, serves the build locally with wrangler, fetches every design and writes
// "Arculati látványtervek.html" in the project root, one file that switches between them (scripts/latvanytervek.mjs).
// The file is generated, so it is not committed; run this again after the designs change.
import { spawn, spawnSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { build as esbuild } from 'esbuild';
import { VARIANTS } from '../src/tablo/variants.ts';
import { claudeDesignDokumentum } from './claude-design.mjs';
import { dontesek, dontolapDokumentum } from './dontolap.mjs';
import { kepKeszites, kepTerv } from './kepek.mjs';
import { beagyazas, CD_LINKEK, kapcsoloFajl, mockupDokumentum, oldalKiigazitasa, tervLista } from './latvanytervek.mjs';

const PORT = 8790;
const BASE = `http://127.0.0.1:${PORT}`;
const KIMENET = 'Arculati látványtervek.html';
const CD_MAPPA = 'design/claude-design';

/** A Claude Design file, self-contained: runtime inline, imported files along, prop defaults set. */
async function claudeDesign({ fajl, props, testverek = [] }) {
  const olvas = (nev) => readFile(`${CD_MAPPA}/${nev}`, 'utf8');
  const testverSzovegek = Object.fromEntries(await Promise.all(testverek.map(async (n) => [n, await olvas(`${n}.dc.html`)])));
  return claudeDesignDokumentum(await olvas(fajl), { support: await olvas('support.js'), testverek: testverSzovegek, props, linkek: CD_LINKEK });
}

async function szoveg(utvonal) {
  const valasz = await fetch(new URL(utvonal, BASE));
  if (!valasz.ok) throw new Error(`${utvonal}: HTTP ${valasz.status}`);
  return valasz.text();
}

// Bundles a module script of the built site with its imports (shared chunks), fetched from the local server.
const helyiSzerver = {
  name: 'helyi-szerver',
  setup(b) {
    b.onResolve({ filter: /.*/ }, (args) => ({ path: new URL(args.path, args.importer || BASE).href, namespace: 'http' }));
    b.onLoad({ filter: /.*/, namespace: 'http' }, async (args) => ({ contents: await szoveg(args.path), loader: 'js' }));
  },
};

async function csomag(src) {
  const eredmeny = await esbuild({
    entryPoints: [src],
    bundle: true,
    format: 'esm',
    minify: true,
    write: false,
    logLevel: 'silent',
    plugins: [helyiSzerver],
  });
  return eredmeny.outputFiles[0].text;
}

async function varakozas(hatarido) {
  while (Date.now() < hatarido) {
    try {
      if ((await fetch(`${BASE}/tablo`)).ok) return;
    } catch {
      // not listening yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`A helyi szerver nem indult el: ${BASE}`);
}

function leallitas(szerver) {
  if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(szerver.pid), '/T', '/F'], { stdio: 'ignore' });
  else szerver.kill('SIGTERM');
}

console.log('1/4 Build…');
const build = spawnSync('npm', ['run', 'build'], { stdio: 'inherit', shell: true });
if (build.status !== 0) process.exit(build.status ?? 1);

console.log(`2/4 Helyi szerver: ${BASE}`);
const szerver = spawn('npx', ['wrangler', 'dev', '--ip', '127.0.0.1', '--port', String(PORT)], {
  shell: true,
  stdio: 'ignore',
});

try {
  await varakozas(Date.now() + 120_000);
  console.log('3/4 Tervek összegyűjtése…');
  const lista = tervLista(VARIANTS);
  const generalva = new Date().toISOString().slice(0, 10);
  const dokumentumok = new Map();
  for (const terv of lista.filter((t) => !t.dontolap)) {
    const html = terv.claudeDesign
      ? await claudeDesign(terv.claudeDesign)
      : terv.fajl
        ? mockupDokumentum(await readFile(terv.fajl, 'utf8'))
        : oldalKiigazitasa(await beagyazas(await szoveg(terv.utvonal), { szoveg, csomag }));
    dokumentumok.set(terv.id, html);
    console.log(`   ${terv.cim} (${Math.round(html.length / 1024)} kB)`);
  }
  console.log('4/4 Képek a Döntőlapra…');
  const valasztasok = dontesek(lista.filter((t) => t.irany));
  const kepek = await kepKeszites(kepTerv(valasztasok), dokumentumok);
  dokumentumok.set('dontolap', dontolapDokumentum({ dontesek: valasztasok, generalva, kepek }));
  const tervek = lista.map((terv) => ({ ...terv, html: dokumentumok.get(terv.id) }));
  const fajl = kapcsoloFajl(tervek, generalva);
  await writeFile(KIMENET, fajl, 'utf8');
  console.log(`Kész: ${KIMENET} (${Math.round(Buffer.byteLength(fajl) / 1024)} kB)`);
} finally {
  leallitas(szerver);
}
