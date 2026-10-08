import { describe, expect, it } from 'vitest';
import { SZOMARKAK } from './szomarka';

describe('the wordmark variants', () => {
  it('are the five directions of the spec, each named and described', () => {
    expect(SZOMARKAK.map((s) => s.id)).toEqual(['vagott', 'meretvonal', 'neon', 'illesztojel', 'monogram']);
    for (const s of SZOMARKAK) {
      expect(s.nev, s.id).toBeTruthy();
      expect(s.leiras.length, s.id).toBeGreaterThan(20);
    }
  });
});
