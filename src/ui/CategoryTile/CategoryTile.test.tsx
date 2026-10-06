/** @vitest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CategoryTile } from './CategoryTile';
import { PRODUCT_KINDS } from './pictograms';

describe('CategoryTile', () => {
  it('is a link with the "from" price per m² on the home page', () => {
    render(<CategoryTile name="Molinó" price={5067} unit="m2" product="molino" href="#webshop" />);
    const link = screen.getByRole('link', { name: 'Molinó 5\u00a0067\u00a0Ft/m²-től' });
    expect(link.getAttribute('href')).toBe('#webshop');
  });

  it('is a pressed button as the webshop selector', () => {
    const onClick = vi.fn();
    render(<CategoryTile name="Roll-up" price={31623} product="rollup" pressed onClick={onClick} />);
    const button = screen.getByRole('button', { name: 'Roll-up 31\u00a0623\u00a0Ft-tól' });
    expect(button.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('has a pictogram for each of the six shop products', () => {
    expect(PRODUCT_KINDS).toEqual(['molino', 'rollup', 'matrica', 'plakat', 'tabla', 'vaszon']);
  });
});
