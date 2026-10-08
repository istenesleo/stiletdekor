import { describe, expect, it } from 'vitest';
import { dontesek } from './dontolap.mjs';
import { kepTerv } from './kepek.mjs';

describe('kepTerv', () => {
  const terv = kepTerv(dontesek([{ id: 'x1', rovid: 'X1', cim: 'X1 · Árlista-plakát', leiras: 'Egy árlista-plakát.' }]));

  it('takes each tab and part once, and lists the options it serves', () => {
    expect(new Set(terv.map((f) => f.kulcs)).size).toBe(terv.length);
    expect(terv.find((f) => f.kulcs === 'proto-c|')?.opciok).toEqual(['irany/C', 'hero/sajat', 'mozgas/neon']);
    expect(terv.find((f) => f.kulcs === 'cd-tablo|#H5')?.opciok).toEqual(['hero/H5', 'mozgas/szalag']);
    expect(terv.find((f) => f.kulcs === 'x1|')).toMatchObject({ ful: 'x1', szelektor: null, opciok: ['irany/X1'] });
  });

  it('pictures the designs, and leaves the colours, type and button choices to live samples', () => {
    const kepes = new Set(terv.flatMap((f) => f.opciok.map((o) => o.split('/')[0])));
    for (const d of ['irany', 'hero', 'szolgaltatasok', 'folyamat', 'referenciak', 'kepek', 'piktogramok', 'mozgas', 'oldalak']) {
      expect(kepes.has(d), d).toBe(true);
    }
    for (const d of ['rozsaszin', 'betupar', 'sarok', 'feny', 'gomb', 'meroszin']) expect(kepes.has(d), d).toBe(false);
  });
});
