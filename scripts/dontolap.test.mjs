import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';
import { dontesek, dontolapDokumentum } from './dontolap.mjs';

const IRANYOK = [{ id: 'x1', rovid: 'X1', cim: 'X1 · Árlista-plakát', leiras: 'Egy árlista-plakát.' }];

describe('dontesek', () => {
  it('recommends one of its own options for every choice, with a reason', () => {
    const lista = dontesek(IRANYOK);
    expect(new Set(lista.map((d) => d.id)).size).toBe(lista.length);
    for (const d of lista) {
      const ids = d.opciok.map((o) => o.id);
      expect(new Set(ids).size, d.id).toBe(ids.length);
      expect(ids, d.id).toContain(d.ajanlott);
      expect(d.indok.length, d.id).toBeGreaterThan(30);
    }
  });

  it('offers the full directions of the switcher among the directions', () => {
    const irany = dontesek(IRANYOK).find((d) => d.id === 'irany');
    expect(irany.opciok.map((o) => o.id)).toEqual(['C', 'A', 'B', 'X1']);
    expect(irany.opciok.at(-1)).toMatchObject({ nev: 'X1 · Árlista-plakát', ful: 'x1' });
  });
});

function sheet({ scripts = false, saved } = {}) {
  const html = dontolapDokumentum({ dontesek: dontesek(IRANYOK), generalva: '2026-10-09' });
  return new JSDOM(html, {
    url: 'https://dontolap.test/',
    runScripts: scripts ? 'dangerously' : undefined,
    beforeParse(window) {
      if (saved) window.localStorage.setItem('stilet-dontolap', JSON.stringify(saved));
    },
  }).window;
}

describe('dontolapDokumentum', () => {
  it('is a plain form without scripts: one group of radios per choice, the recommendation marked', () => {
    const { document } = sheet();
    const groups = [...document.querySelectorAll('fieldset[data-dontes]')];
    expect(groups.map((f) => f.dataset.dontes)).toEqual(dontesek(IRANYOK).map((d) => d.id));
    const irany = groups[0];
    expect(irany.querySelector('legend').textContent).toContain('Irány');
    expect([...irany.querySelectorAll('input[type="radio"]')].map((i) => i.value)).toEqual(['C', 'A', 'B', 'X1']);
    expect(irany.querySelector('.op--ajanlott input').value).toBe('C');
    expect(irany.querySelector('.op--ajanlott .jel').textContent).toBe('Ajánlott');
    expect(irany.querySelector('a.megnez').getAttribute('href')).toBe('#proto-c');
    expect(irany.querySelector('a.megnez').getAttribute('target')).toBe('_top');
    expect(document.getElementById('osszegzes').hidden).toBe(true);
    expect(document.querySelector('noscript')).not.toBeNull();
  });

  it('adds up the ticked options and the note into a text to paste', () => {
    const window = sheet({ scripts: true });
    const { document } = window;
    expect(document.getElementById('osszegzes').hidden).toBe(false);
    const c = document.querySelector('input[name="irany"][value="C"]');
    c.checked = true;
    c.dispatchEvent(new window.Event('change', { bubbles: true }));
    const note = document.getElementById('megjegyzes');
    note.value = 'A C, de a B betűivel.';
    note.dispatchEvent(new window.Event('input', { bubbles: true }));
    const text = document.getElementById('osszegzes-szoveg').value.split('\n');
    expect(text[0]).toBe('Döntőlap · Stilet Dekor arculat');
    expect(text).toContain('Irány: C · Mérőlap');
    expect(text).toContain('Hero: —');
    expect(text.at(-1)).toBe('Megjegyzés: A C, de a B betűivel.');
    expect(JSON.parse(window.localStorage.getItem('stilet-dontolap'))).toMatchObject({ irany: 'C', megjegyzes: 'A C, de a B betűivel.' });
  });

  it('ticks every recommendation with one button, and remembers earlier choices', () => {
    const window = sheet({ scripts: true, saved: { irany: 'B', megjegyzes: 'Korábbi' } });
    const { document } = window;
    expect(document.querySelector('input[name="irany"][value="B"]').checked).toBe(true);
    expect(document.getElementById('osszegzes-szoveg').value).toContain('Megjegyzés: Korábbi');
    document.getElementById('ajanlottak').click();
    const text = document.getElementById('osszegzes-szoveg').value;
    expect(text).toContain('Irány: C · Mérőlap');
    expect(text).toContain('Hero: H2 · Két ajtó');
    expect(text).not.toContain(': —');
  });
});
