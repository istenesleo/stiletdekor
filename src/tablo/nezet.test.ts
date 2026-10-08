import { describe, expect, it } from 'vitest';
import { boardView } from './nezet';
import { VARIANT_GROUPS } from './variants';

const view = (query: string) => boardView(new URLSearchParams(query));

describe('boardView', () => {
  it('shows every group with planned variants and the top bar by default', () => {
    expect(view('')).toEqual({ groups: VARIANT_GROUPS.map((g) => g.id), onlyFinished: false, embedded: false });
  });

  it('narrows to one known group, hides planned variants and drops the bar on request', () => {
    expect(view('csoport=grafika&csak=kesz&beagyazott=1')).toEqual({
      groups: ['grafika'],
      onlyFinished: true,
      embedded: true,
    });
  });

  it('ignores an unknown group', () => {
    expect(view('csoport=nincs').groups).toEqual(VARIANT_GROUPS.map((g) => g.id));
  });
});
