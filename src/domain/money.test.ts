import { describe, expect, it } from 'vitest';
import { formatHuf, formatNumberHu, percentOf, roundHuf } from './money';

/** Intl uses U+00A0 / U+202F as group and currency separators; compare with plain spaces. */
const norm = (s: string) => s.replace(/[  ]/g, ' ');

describe('formatHuf', () => {
  it('formats whole forints the hu-HU way', () => {
    expect(norm(formatHuf(12990))).toBe('12 990 Ft');
    expect(norm(formatHuf(1234567))).toBe('1 234 567 Ft');
    expect(norm(formatHuf(990))).toBe('990 Ft');
    expect(norm(formatHuf(0))).toBe('0 Ft');
  });

  it('groups four-digit amounts like the brief does', () => {
    expect(norm(formatHuf(1990))).toBe('1 990 Ft');
    expect(norm(formatHuf(4990))).toBe('4 990 Ft');
  });

  it('uses no-break spaces so amounts do not wrap', () => {
    expect(formatHuf(12990)).not.toContain(' ');
  });

  it('rounds fractions and formats negatives', () => {
    expect(norm(formatHuf(997.5))).toBe('998 Ft');
    expect(norm(formatHuf(-3990)).replace('−', '-')).toBe('-3 990 Ft');
  });

  it('rejects non-finite amounts', () => {
    expect(() => formatHuf(Number.NaN)).toThrow(RangeError);
    expect(() => formatHuf(Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});

describe('roundHuf / percentOf', () => {
  it('rounds halves away from zero', () => {
    expect(roundHuf(997.5)).toBe(998);
    expect(roundHuf(997.4999)).toBe(997);
    expect(roundHuf(-997.5)).toBe(-998);
    expect(roundHuf(2154.6)).toBe(2155);
  });

  it('never returns negative zero', () => {
    expect(Object.is(roundHuf(-0.4), 0)).toBe(true);
  });

  it('computes percentages of integer amounts exactly', () => {
    expect(percentOf(39900, 10)).toBe(3990);
    expect(percentOf(7980, 27)).toBe(2155);
    expect(percentOf(35910, 30)).toBe(10773);
    expect(percentOf(150, 27)).toBe(41); // 40.5 → 41
  });
});

describe('formatNumberHu', () => {
  it('uses a decimal comma and grouping', () => {
    expect(formatNumberHu(0.25)).toBe('0,25');
    expect(norm(formatNumberHu(1234.5))).toBe('1 234,5');
    expect(formatNumberHu(2)).toBe('2');
    expect(formatNumberHu(0.110889)).toBe('0,11');
    expect(formatNumberHu(29.75, 1)).toBe('29,8');
  });
});
