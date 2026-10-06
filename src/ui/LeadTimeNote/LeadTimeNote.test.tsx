/** @vitest-environment jsdom */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LeadTimeNote } from './LeadTimeNote';

describe('LeadTimeNote', () => {
  it('states the ready date with Hungarian suffixes and the rules', () => {
    const { container } = render(<LeadTimeNote readyBy="2026-10-13" />);
    expect(container.querySelector('.sd-lead__main')?.textContent).toBe('Várhatóan október 13-ára, keddre elkészül. ');
    expect(screen.getByText(/Gyártási idő: 3 munkanap a díjbekérő befizetésétől/)).toBeTruthy();
  });

  it('marks express and says one business day', () => {
    render(<LeadTimeNote readyBy="2026-10-09" express />);
    expect(screen.getByText('Expressz')).toBeTruthy();
    expect(screen.getByText(/Gyártási idő: 1 munkanap/)).toBeTruthy();
  });
});
