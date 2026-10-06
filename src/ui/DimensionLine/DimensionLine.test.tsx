/** @vitest-environment jsdom */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DimensionLine } from './DimensionLine';

describe('DimensionLine', () => {
  it('prints millimetres with Hungarian grouping and names itself for screen readers', () => {
    render(<DimensionLine valueMm={4200} />);
    expect(screen.getByRole('img', { name: '4 200 mm' })).toBeTruthy();
  });

  it('can carry its own label, stand vertically and be decorative', () => {
    const { container } = render(<DimensionLine orientation="vertical" label="85 cm" decorative />);
    const root = container.firstElementChild!;
    expect(root.className).toBe('sd-dim sd-dim--vertical');
    expect(root.getAttribute('aria-hidden')).toBe('true');
    expect(root.textContent).toBe('85 cm');
  });
});
