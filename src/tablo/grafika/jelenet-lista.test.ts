import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { JELENETEK } from './jelenet-lista';

describe('the reference placeholder scenes', () => {
  it('are the eight scenes of the brief, each with a unique id, name and component', () => {
    expect(JELENETEK.map((j) => j.id)).toEqual([
      'kirakat-ejjel',
      'kisbusz',
      'rollup',
      'fotofal',
      'ledfal',
      'uvegfolia',
      'kinalopult',
      'betuk-3d',
    ]);
    expect(new Set(JELENETEK.map((j) => j.name)).size).toBe(8);
    for (const j of JELENETEK) expect(fs.existsSync(`src/tablo/grafika/jelenetek/${j.file}`), j.file).toBe(true);
  });

  it('describe what they show, and give a night view only to lit work', () => {
    for (const j of JELENETEK) expect(j.desc.length, j.id).toBeGreaterThan(30);
    expect(JELENETEK.filter((j) => j.night).map((j) => j.id)).toEqual(['kirakat-ejjel', 'ledfal', 'uvegfolia']);
  });
});
