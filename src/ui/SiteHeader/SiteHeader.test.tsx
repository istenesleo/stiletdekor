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

  it('opens the mobile menu as a popover, without any script', () => {
    const { container } = render(<SiteHeader />);
    const button = screen.getByRole('button', { name: 'Menü' });
    const panel = container.querySelector<HTMLElement>(`#${button.getAttribute('popovertarget')}`)!;
    expect(panel.getAttribute('popover')).toBe('auto');
    // A closed popover is hidden from the accessibility tree, hence `hidden: true`.
    expect(within(panel).getByRole('link', { name: 'Referenciák', hidden: true })).toBeTruthy();
    expect(within(panel).getByRole('link', { name: 'Ajánlatkérés', hidden: true }).getAttribute('href')).toBe('/#ajanlat');
  });

  it('closes the popover when an item is chosen, where scripts run', () => {
    const { container } = render(<SiteHeader />);
    const panel = container.querySelector<HTMLElement & { hidePopover: () => void }>('.sd-header__panel')!;
    panel.hidePopover = vi.fn();
    fireEvent.click(within(panel).getByRole('link', { name: 'Kapcsolat', hidden: true }));
    expect(panel.hidePopover).toHaveBeenCalledOnce();
  });

  it('shows the menu open, as a plain panel, in previews', () => {
    const { container } = render(<SiteHeader defaultMenuOpen sticky={false} skipTo={null} />);
    const panel = container.querySelector<HTMLElement>('.sd-header__panel')!;
    expect(panel.hasAttribute('popover')).toBe(false);
    expect(screen.getByRole('banner').classList.contains('sd-header--menu-open')).toBe(true);
    expect(screen.queryByRole('link', { name: 'Ugrás a tartalomra' })).toBeNull();
    expect(screen.getByRole('banner').classList.contains('sd-header--sticky')).toBe(false);
  });
});
