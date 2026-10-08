// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { kapcsoloFajl } from './latvanytervek.mjs';

const tervek = [
  { id: 'a', rovid: 'A', cim: 'A · Neon műhely', leiras: 'Első terv leírása, elég hosszan.', html: '<p class="x">"ő" & <b>A</b></p><script>1</script>' },
  { id: 'x1', rovid: 'X1', cim: 'X1 · Árlista-plakát', leiras: 'Második terv leírása, elég hosszan.', html: '<p>2</p>' },
];

const dokumentum = () => new DOMParser().parseFromString(kapcsoloFajl(tervek, '2026-10-08'), 'text/html');

describe('kapcsoloFajl', () => {
  it('carries every design in its own frame, intact, without needing a script to load it', () => {
    const doc = dokumentum();
    const frames = [...doc.querySelectorAll('iframe')];
    expect(frames.map((f) => f.getAttribute('srcdoc'))).toEqual(tervek.map((t) => t.html));
    expect(frames.map((f) => f.getAttribute('title'))).toEqual(tervek.map((t) => t.cim));
  });

  it('switches with radio buttons and labels, the first design chosen, so it works where scripts do not run', () => {
    const doc = dokumentum();
    const radios = [...doc.querySelectorAll('input[type="radio"][name="terv"]')];
    expect(radios.map((r) => r.id)).toEqual(['t-a', 't-x1']);
    expect(radios.map((r) => r.hasAttribute('checked'))).toEqual([true, false]);
    for (const t of tervek) {
      const label = doc.querySelector(`label[for="t-${t.id}"]`);
      expect(label?.textContent, t.id).toBe(t.rovid);
      expect(label?.getAttribute('aria-label') ?? t.cim, t.id).toContain(t.rovid);
    }
    const css = doc.querySelector('style')?.textContent ?? '';
    expect(css).toContain('#t-x1:checked ~ .lv-szinpad .lv-panel[data-terv="x1"]');
    expect(css).toContain('#t-x1:checked ~ .lv-bar label[for="t-x1"]');
  });

  it('offers a desktop and a 390 px view, also without scripts', () => {
    const doc = dokumentum();
    expect([...doc.querySelectorAll('input[name="nezet"]')].map((r) => [r.id, r.hasAttribute('checked')])).toEqual([
      ['n-asztali', true],
      ['n-mobil', false],
    ]);
    expect(doc.querySelector('label[for="n-mobil"]')?.textContent).toBe('Mobil (390 px)');
  });

  it('describes each design and dates the file', () => {
    const doc = dokumentum();
    expect([...doc.querySelectorAll('.lv-leiras')].map((p) => p.textContent)).toEqual([
      'A · Neon műhely – Első terv leírása, elég hosszan.',
      'X1 · Árlista-plakát – Második terv leírása, elég hosszan.',
    ]);
    expect(doc.querySelector('.lv-cim')?.textContent).toContain('2026-10-08');
  });
});

describe('kapcsoloFajl, where scripts run', () => {
  it('opens the tab a link points at (#x1), also after the page loaded', async () => {
    const { JSDOM } = await import('jsdom');
    const { window } = new JSDOM(kapcsoloFajl(tervek, '2026-10-08'), { url: 'https://kapcsolo.test/#x1', runScripts: 'dangerously' });
    const radio = (id) => window.document.getElementById(`t-${id}`);
    expect(radio('x1').checked).toBe(true);
    expect(window.document.title).toBe('X1 · Árlista-plakát – Arculati látványtervek');
    window.location.hash = '#a';
    window.dispatchEvent(new window.HashChangeEvent('hashchange'));
    expect(radio('a').checked).toBe(true);
    expect(window.document.title).toBe('A · Neon műhely – Arculati látványtervek');
  });
});
