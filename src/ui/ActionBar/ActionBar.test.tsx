/** @vitest-environment jsdom */
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ActionBar } from './ActionBar';

describe('ActionBar', () => {
  it('offers a call and the quote request', () => {
    render(<ActionBar />);
    const bar = screen.getByRole('navigation', { name: 'Gyors elérés' });
    const [call, quote] = within(bar).getAllByRole('link');
    expect(call!.getAttribute('href')).toBe('tel:+36705385030');
    expect(call!.getAttribute('aria-label')).toBe('Hívás: +36 70 538 5030');
    expect(call!.textContent).toBe('Hívás');
    expect(quote!.textContent).toBe('Ajánlatkérés');
    expect(quote!.getAttribute('href')).toBe('/#ajanlat');
    expect(bar.classList.contains('sd-actionbar--inline')).toBe(false);
  });

  it('can sit in the flow instead of the bottom of the screen (previews)', () => {
    render(<ActionBar fixed={false} quoteHref="/ajanlatkeres" />);
    const bar = screen.getByRole('navigation', { name: 'Gyors elérés' });
    expect(bar.classList.contains('sd-actionbar--inline')).toBe(true);
    expect(within(bar).getByRole('link', { name: 'Ajánlatkérés' }).getAttribute('href')).toBe('/ajanlatkeres');
  });
});
