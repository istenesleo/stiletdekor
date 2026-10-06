/** @vitest-environment jsdom */
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MAIN_NAV } from '../navigation';
import { SiteHeader } from './SiteHeader';

describe('SiteHeader', () => {
  it('shows the main menu with the current item, the phone, the quote button and a skip link', () => {
    const { container } = render(<SiteHeader currentHref="/#webshop" />);
    const header = screen.getByRole('banner');
    expect(container.firstElementChild).toBe(header);
    const menu = within(header).getAllByRole('navigation', { name: 'Főmenü' })[0]!;
    expect(within(menu).getAllByRole('link').map((a) => a.textContent)).toEqual(MAIN_NAV.map((l) => l.label));
    expect(within(menu).getByRole('link', { name: 'Webshop' }).getAttribute('aria-current')).toBe('page');
    expect(within(header).getAllByRole('link', { name: '+36 70 538 5030' })[0]!.getAttribute('href')).toBe('tel:+36705385030');
    expect(within(header).getAllByRole('link', { name: 'Ajánlatkérés' })[0]!.getAttribute('href')).toBe('/#ajanlat');
    expect(screen.getByRole('link', { name: 'Ugrás a tartalomra' }).getAttribute('href')).toBe('#tartalom');
    expect(header.classList.contains('sd-header--sticky')).toBe(true);
  });

  it('opens the cart with its item count, and has no cart button without a handler', () => {
    const onCartClick = vi.fn();
    const { rerender } = render(<SiteHeader cartCount={2} onCartClick={onCartClick} />);
    fireEvent.click(screen.getByRole('button', { name: 'Kosár megnyitása, 2 tétel' }));
    expect(onCartClick).toHaveBeenCalledOnce();
    rerender(<SiteHeader />);
    expect(screen.queryByRole('button', { name: /Kosár/ })).toBeNull();
  });

  it('toggles the mobile menu; Escape closes it and returns focus to the menu button', () => {
    const { container } = render(<SiteHeader />);
    const button = screen.getByRole('button', { name: 'Menü' });
    const panel = container.querySelector<HTMLElement>(`#${button.getAttribute('aria-controls')}`)!;
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(panel.hidden).toBe(true);
    fireEvent.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(panel.hidden).toBe(false);
    const link = within(panel).getByRole('link', { name: 'Referenciák' });
    link.focus();
    fireEvent.keyDown(link, { key: 'Escape' });
    expect(panel.hidden).toBe(true);
    expect(document.activeElement).toBe(button);
  });

  it('closes the mobile menu when an item is chosen', () => {
    const { container } = render(<SiteHeader defaultMenuOpen sticky={false} skipTo={null} />);
    const panel = container.querySelector<HTMLElement>('.sd-header__panel')!;
    expect(panel.hidden).toBe(false);
    fireEvent.click(within(panel).getByRole('link', { name: 'Kapcsolat' }));
    expect(panel.hidden).toBe(true);
    expect(screen.queryByRole('link', { name: 'Ugrás a tartalomra' })).toBeNull();
    expect(screen.getByRole('banner').classList.contains('sd-header--sticky')).toBe(false);
  });
});
