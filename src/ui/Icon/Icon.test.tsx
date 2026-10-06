/** @vitest-environment jsdom */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Icon } from './Icon';
import { ICON_NAMES } from './icons';

describe('Icon', () => {
  it('is decorative unless it has a label', () => {
    const { container } = render(<Icon name="cart" />);
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    render(<Icon name="phone" label="Telefon" />);
    expect(screen.getByRole('img', { name: 'Telefon' })).toBeTruthy();
  });

  it.each(ICON_NAMES)('%s draws something', (name) => {
    const { container } = render(<Icon name={name} />);
    expect(container.querySelector('svg')!.children.length).toBeGreaterThan(0);
  });
});
