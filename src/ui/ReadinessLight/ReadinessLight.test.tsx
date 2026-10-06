/** @vitest-environment jsdom */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DPI_RATINGS } from '@/domain/preflight';
import { READINESS_SCALE, ReadinessLight } from './ReadinessLight';

describe('ReadinessLight', () => {
  it('asks for a file before there is one', () => {
    const { container } = render(<ReadinessLight />);
    expect(container.firstElementChild?.getAttribute('data-tone')).toBe('none');
    expect(screen.getByText(/Töltse fel a grafikát/)).toBeTruthy();
  });

  it.each([
    ['kivalo', 'ok'],
    ['megfelelo', 'warn'],
    ['gyenge', 'bad'],
  ] as const)('%s lights %s with the dpi and the explanation', (rating, tone) => {
    const { container } = render(<ReadinessLight rating={rating} dpi={142.4} />);
    expect(container.firstElementChild?.getAttribute('data-tone')).toBe(tone);
    expect(screen.getByText(DPI_RATINGS[rating].label)).toBeTruthy();
    expect(container.querySelector('.sd-ready__dpi')?.textContent).toBe('142\u00a0dpi');
  });

  it('is green for vector artwork, without a dpi', () => {
    const { container } = render(<ReadinessLight vector rating="gyenge" dpi={10} />);
    expect(container.firstElementChild?.getAttribute('data-tone')).toBe('ok');
    expect(screen.queryByText('10 dpi')).toBeNull();
  });

  it('states the thresholds for help texts', () => {
    expect(READINESS_SCALE).toBe('≥150 kiváló · 72–149 megfelelő · <72 gyenge');
  });
});
