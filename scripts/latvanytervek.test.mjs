import { describe, expect, it } from 'vitest';
import { VARIANTS } from '../src/tablo/variants';
import { beagyazas, kapcsoloFajl, mockupDokumentum, oldalKiigazitasa, tervLista } from './latvanytervek.mjs';

describe('tervLista', () => {
  it('lists the two mockups, the finished full directions and the brand elements in both directions', () => {
    const tervek = tervLista(VARIANTS);
    const kesz = VARIANTS.filter((v) => v.group === 'irany' && v.status === 'kesz').map((v) => v.page);
    expect(tervek.map((t) => t.id)).toEqual(['a', 'b', ...kesz, 'elemek-a', 'elemek-b']);
    for (const t of tervek) {
      expect(Boolean(t.fajl) !== Boolean(t.utvonal), t.id).toBe(true);
      expect(t.cim, t.id).toContain(t.rovid);
      expect(t.leiras.length, t.id).toBeGreaterThan(20);
    }
    expect(tervek.find((t) => t.id === 'x1')?.utvonal).toBe('/tablo/irany/x1');
    expect(tervek.find((t) => t.id === 'elemek-b')?.utvonal).toContain('tema=galeria-editorial');
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

describe('kapcsoloFajl', () => {
  it('has a button per design and carries every design intact', () => {
    const tervek = [
      { id: 'a', rovid: 'A', cim: 'A · Neon műhely', leiras: 'Első terv leírása, elég hosszan.', html: '<script>x</script><p>ő</p>' },
      { id: 'x1', rovid: 'X1', cim: 'X1 · Árlista-plakát', leiras: 'Második terv leírása, elég hosszan.', html: '<p>2</p>' },
    ];
    const fajl = kapcsoloFajl(tervek, '2026-10-08');
    expect(fajl.match(/data-terv="/g)).toHaveLength(2);
    expect(fajl).toContain('aria-label="X1 · Árlista-plakát"');
    expect(fajl).toContain('2026-10-08');
    const adat = fajl.match(/<script type="application\/json" id="lv-adat">([\s\S]*?)<\/script>/)?.[1] ?? '';
    expect(adat).not.toContain('<');
    expect(JSON.parse(adat)).toEqual(tervek);
  });
});
