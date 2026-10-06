/** @vitest-environment jsdom */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Wordmark } from './Wordmark';

describe('Wordmark', () => {
  it('links home with a readable name', () => {
    render(<Wordmark />);
    expect(screen.getByRole('link', { name: 'Stilet Dekor, kezdőlap' }).getAttribute('href')).toBe('/');
  });
});
