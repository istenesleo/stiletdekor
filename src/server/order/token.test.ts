import { describe, expect, it } from 'vitest';
import { isStatusToken, newStatusToken, statusPath } from './token';

describe('status tokens', () => {
  it('are 128 random bits in 22 URL-safe characters', () => {
    const tokens = new Set(Array.from({ length: 50 }, newStatusToken));
    expect(tokens.size).toBe(50);
    for (const token of tokens) expect(isStatusToken(token)).toBe(true);
  });

  it('refuses anything else, and builds the status path', () => {
    for (const value of ['', 'abc', 'x'.repeat(23), 'aaaaaaaaaaaaaaaaaaaa+/', null, 42]) expect(isStatusToken(value)).toBe(false);
    expect(statusPath('AbCdEfGhIjKlMnOpQrStUv')).toBe('/rendeles/AbCdEfGhIjKlMnOpQrStUv');
  });
});
