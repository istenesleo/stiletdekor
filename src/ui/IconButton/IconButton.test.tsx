/** @vitest-environment jsdom */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { IconButton } from './IconButton';

describe('IconButton', () => {
  it('is named by its label, not by the icon', () => {
    render(<IconButton icon="close" label="Bezárás" />);
    const button = screen.getByRole('button', { name: 'Bezárás' });
    expect(button.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('shows the cart count from 1, capped at 99+', () => {
    const { container, rerender } = render(<IconButton icon="cart" label="Kosár megnyitása, 0 tétel" count={0} />);
    expect(container.querySelector('.sd-iconbtn__count')).toBeNull();
    rerender(<IconButton icon="cart" label="Kosár megnyitása, 3 tétel" count={3} />);
    expect(container.querySelector('.sd-iconbtn__count')?.textContent).toBe('3');
    rerender(<IconButton icon="cart" label="Kosár megnyitása, 120 tétel" count={120} />);
    expect(container.querySelector('.sd-iconbtn__count')?.textContent).toBe('99+');
  });

  it('can be a toggle', () => {
    render(<IconButton icon="menu" label="Menü" pressed />);
    expect(screen.getByRole('button', { name: 'Menü' }).getAttribute('aria-pressed')).toBe('true');
  });
});
