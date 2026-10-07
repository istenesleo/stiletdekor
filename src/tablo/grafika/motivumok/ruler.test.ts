import { describe, expect, it } from 'vitest';
import { rulerTicks } from './ruler';

describe('rulerTicks', () => {
  it('marks every millimetre, longer at half and whole centimetres, numbering the centimetres', () => {
    const ticks = rulerTicks(2);
    expect(ticks).toHaveLength(21);
    expect(ticks[0]).toEqual({ mm: 0, kind: 'cm', label: '0' });
    expect(ticks[1]).toEqual({ mm: 1, kind: 'mm', label: null });
    expect(ticks[5]).toEqual({ mm: 5, kind: 'half', label: null });
    expect(ticks[10]).toEqual({ mm: 10, kind: 'cm', label: '1' });
    expect(ticks[20]).toEqual({ mm: 20, kind: 'cm', label: '2' });
  });

  it('can show half centimetres only', () => {
    expect(rulerTicks(1, 'half').map((t) => [t.mm, t.kind])).toEqual([
      [0, 'cm'],
      [5, 'half'],
      [10, 'cm'],
    ]);
  });

  it('rejects lengths that are not whole positive centimetres', () => {
    expect(() => rulerTicks(0)).toThrow(RangeError);
    expect(() => rulerTicks(2.5)).toThrow(RangeError);
  });
});
