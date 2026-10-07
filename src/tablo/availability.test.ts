import { describe, expect, it } from 'vitest';
import { boardAvailable } from './availability';

describe('boardAvailable', () => {
  it('hides the board on production only', () => {
    expect(boardAvailable('production')).toBe(false);
    expect(boardAvailable('dev')).toBe(true);
    expect(boardAvailable('preview')).toBe(true);
    expect(boardAvailable(undefined)).toBe(true);
  });
});
