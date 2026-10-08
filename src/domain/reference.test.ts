import { describe, expect, it } from 'vitest';
import { formatReference, parseReference } from './reference';

describe('formatReference', () => {
  it('pads the id to four digits and keeps longer ids whole', () => {
    expect(formatReference('VH', 87)).toBe('VH-0087');
    expect(formatReference('AK', 142)).toBe('AK-0142');
    expect(formatReference('AK', 12345)).toBe('AK-12345');
  });

  it('rejects ids that cannot come from the database', () => {
    for (const id of [0, -1, 1.5, Number.NaN]) expect(() => formatReference('VH', id)).toThrow(RangeError);
  });
});

describe('parseReference', () => {
  it('accepts its own prefix, trims, and normalizes the padding', () => {
    expect(parseReference('VH-0087', 'VH')).toBe('VH-0087');
    expect(parseReference(' VH-00087 ', 'VH')).toBe('VH-0087');
    expect(parseReference('VH-12345', 'VH')).toBe('VH-12345');
  });

  it('rejects other prefixes, zero, short numbers and non-strings', () => {
    for (const value of ['AK-0087', 'VH-0000', 'VH-87', 'vh-0087', 'VH-0087x', '', null, 87]) {
      expect(parseReference(value, 'VH')).toBeNull();
    }
  });
});
