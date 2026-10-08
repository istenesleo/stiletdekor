import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { VARIANTS } from '../src/tablo/variants';
import { dontesek } from './dontolap.mjs';
import { beagyazas, CD_LINKEK, mockupDokumentum, oldalKiigazitasa, tervLista } from './latvanytervek.mjs';

describe('tervLista', () => {
  const tervek = tervLista(VARIANTS);
  const ids = tervek.map((t) => t.id);

  it('starts with the decision sheet, then the prototypes, mockups, Claude Design canvases, directions and elements', () => {
    const kesz = VARIANTS.filter((v) => v.group === 'irany' && v.status === 'kesz').map((v) => v.page);
    expect(ids).toEqual([
      'dontolap', 'proto-c', 'proto-a', 'proto-b', 'a', 'b', 'cd-tablo', 'cd-ds', 'cd-komp',
      ...kesz, 'elemek-a', 'elemek-b', 'elemek-c',
    ]);
    for (const t of tervek) {
      const forrasok = [t.dontolap, t.claudeDesign, t.fajl, t.utvonal].filter(Boolean);
      expect(forrasok.length, t.id).toBe(1);
      expect(t.cim, t.id).toContain(t.rovid);
      expect(t.leiras.length, t.id).toBeGreaterThan(20);
    }
    expect(tervek.find((t) => t.id === 'x1')).toMatchObject({ utvonal: '/tablo/irany/x1', irany: true });
    expect(tervek.find((t) => t.id === 'elemek-c')?.utvonal).toContain('tema=merolap');
    expect(tervek.find((t) => t.id === 'proto-a')?.claudeDesign).toEqual({ fajl: 'StiletPrototipus.dc.html', props: { direction: 'A' } });
  });

  it('points only at Claude Design files that exist, and links them to tabs that exist', () => {
    for (const t of tervek.filter((x) => x.claudeDesign)) {
      for (const nev of [t.claudeDesign.fajl, ...(t.claudeDesign.testverek ?? []).map((n) => `${n}.dc.html`)]) {
        expect(fs.existsSync(`design/claude-design/${nev}`), nev).toBe(true);
      }
    }
    for (const ful of Object.values(CD_LINKEK)) expect(ids, ful).toContain(ful);
  });

  it('sends every "Megnézem" link of the decision sheet to a tab of the file', () => {
    const iranyok = tervek.filter((t) => t.irany);
    for (const d of dontesek(iranyok)) for (const o of d.opciok) expect(ids, `${d.id}/${o.id}`).toContain(o.ful);
  });
});

describe('mockupDokumentum', () => {
  it('wraps a mockup (which starts at <title>) into a full document', () => {
    const doc = mockupDokumentum('<title>A</title><p>x</p>');
    expect(doc.startsWith('<!doctype html>')).toBe(true);
    expect(doc).toContain('<meta charset="utf-8">');
    expect(doc).toContain('<title>A</title><p>x</p>');
  });
});

describe('oldalKiigazitasa', () => {
  it('drops the back link and points links into the site nowhere, leaving other links alone', () => {
    const html =
      '<a class="tb-back" href="/tablo#v-X1">← Vissza a tablóhoz</a>' +
      '<a href="/#/webshop">Online</a><a class="x" href="/tablo">T</a>' +
      '<a href="tel:+36705385030">T</a><a href="mailto:a@b.hu">E</a><a href="#x">H</a><a href="https://x.hu">K</a>';
    const out = oldalKiigazitasa(html);
    expect(out).not.toContain('tb-back');
    expect(out).toContain('<a href="#">Online</a>');
    expect(out).toContain('<a class="x" href="#">T</a>');
    expect(out).toContain('href="tel:+36705385030"');
    expect(out).toContain('href="mailto:a@b.hu"');
    expect(out).toContain('href="#x"');
    expect(out).toContain('href="https://x.hu"');
  });
});

describe('beagyazas', () => {
  it('puts local stylesheets and module scripts into the page, keeping remote ones', async () => {
    const html =
      '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=X">' +
      '<link rel="stylesheet" href="/_astro/a.css">' +
      '<script type="module" src="/_astro/b.js"></script>';
    const out = await beagyazas(html, {
      szoveg: async (utvonal) => (utvonal === '/_astro/a.css' ? '.a::after{content:"$&"}</style>' : 'nope'),
      csomag: async (src) => (src === '/_astro/b.js' ? 'console.log("$1</script>")' : 'nope'),
    });
    expect(out).toContain('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=X">');
    expect(out).toContain('<style>.a::after{content:"$&"}<\\/style></style>');
    expect(out).toContain('<script type="module">console.log("$1<\\/script>")</script>');
    expect(out).not.toContain('/_astro/');
  });
});
