import { type HTMLAttributes, type MouseEvent, useId } from 'react';
import { COMPANY } from '@/domain/company';
import '../base.css';
import { ButtonLink } from '../ButtonLink/ButtonLink';
import { cx } from '../cx';
import { Icon } from '../Icon/Icon';
import { IconButton } from '../IconButton/IconButton';
import { MAIN_NAV, type NavItem, QUOTE_HREF } from '../navigation';
import { NavLink } from '../NavLink/NavLink';
import { Wordmark } from '../Wordmark/Wordmark';
import './SiteHeader.css';

export interface SiteHeaderProps extends HTMLAttributes<HTMLElement> {
  /** The main menu; the site's sections (MAIN_NAV) by default. */
  links?: readonly NavItem[];
  /** href of the page or section the visitor is on: that menu item is marked as current. */
  currentHref?: string;
  /** Where the wordmark links, the home page by default. */
  homeHref?: string;
  /** Phone number shown on wide screens and in the mobile menu; the workshop's by default, null hides it. */
  phone?: { display: string; href: string } | null;
  /** Target of the "Ajánlatkérés" button, the quote wizard by default. */
  quoteHref?: string;
  /** Items in the cart, shown on the cart button. */
  cartCount?: number;
  /** Opens the cart drawer. Without it there is no cart button. */
  onCartClick?: () => void;
  /**
   * Link to the cart page, when there is no onCartClick. Its item count comes from the page's small script
   * (src/scripts/cart-badge.ts), so the header stays static HTML.
   */
  cartHref?: string;
  /** Stays at the top of the window while scrolling (default). Turn it off in previews. */
  sticky?: boolean;
  /** Target of the "Ugrás a tartalomra" skip link, the page's main content; null leaves the link out. */
  skipTo?: string | null;
  /** Shows the menu open as a plain panel (previews); a real page opens it with the menu button. */
  defaultMenuOpen?: boolean;
}

/**
 * The site header: wordmark, main menu, phone number, quote button and the cart with its item count.
 * Sticky, on a translucent background. When the header is narrower than 1040 px, the menu, the phone number
 * and the "Ajánlatkérés" button move into a panel opened by the menu button: a native popover, so it works
 * without JavaScript (Escape and a click outside close it). The page's main content needs the id of `skipTo`
 * ("tartalom" by default).
 * @category content
 */
export function SiteHeader({
  links = MAIN_NAV,
  currentHref,
  homeHref = '/',
  phone = COMPANY.phone,
  quoteHref = QUOTE_HREF,
  cartCount = 0,
  onCartClick,
  cartHref,
  sticky = true,
  skipTo = '#tartalom',
  defaultMenuOpen = false,
  className,
  ...rest
}: SiteHeaderProps) {
  const panelId = `sd-menu${useId().replace(/:/g, '')}`;
  // Where scripts run, choosing an item closes the popover (a link to a section of the same page would leave it open).
  const closeMenu = (event: MouseEvent<HTMLElement>) => {
    const panel = event.currentTarget.closest<HTMLElement & { hidePopover?: () => void }>('[popover]');
    panel?.hidePopover?.();
  };
  return (
    <header
      className={cx('sd-header', sticky && 'sd-header--sticky', defaultMenuOpen && 'sd-header--menu-open', className)}
      {...rest}
    >
      {skipTo && (
        <a className="sd-header__skip" href={skipTo}>
          Ugrás a tartalomra
        </a>
      )}
      <div className="sd-header__bar">
        <Wordmark href={homeHref} />
        <nav className="sd-header__nav" aria-label="Főmenü">
          <ul>
            {links.map((link) => (
              <li key={link.href}>
                <NavLink href={link.href} current={link.href === currentHref}>
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        {phone && (
          <a className="sd-header__phone" href={phone.href}>
            <Icon name="phone" />
            {phone.display}
          </a>
        )}
        <ButtonLink className="sd-header__cta" href={quoteHref} size="sm">
          Ajánlatkérés
        </ButtonLink>
        {onCartClick ? (
          <IconButton icon="cart" label={`Kosár megnyitása, ${cartCount} tétel`} count={cartCount} aria-haspopup="dialog" onClick={onCartClick} />
        ) : cartHref ? (
          <a className="sd-iconbtn sd-header__cart" href={cartHref} aria-label="Kosár" data-cart-link="">
            <Icon name="cart" />
            <span className="sd-iconbtn__count" aria-hidden="true" data-cart-count="" hidden />
          </a>
        ) : null}
        <button type="button" className="sd-iconbtn sd-header__menubtn" aria-label="Menü" popoverTarget={panelId}>
          <Icon name="menu" className="sd-header__open" />
          <Icon name="close" className="sd-header__close" />
        </button>
      </div>
      <div className="sd-header__panel" id={panelId} popover={defaultMenuOpen ? undefined : 'auto'}>
        <nav aria-label="Főmenü">
          <ul>
            {links.map((link) => (
              <li key={link.href}>
                <a
                  className="sd-header__panellink"
                  href={link.href}
                  aria-current={link.href === currentHref ? 'page' : undefined}
                  onClick={closeMenu}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="sd-header__panelfoot">
          {phone && (
            <a className="sd-header__panelphone" href={phone.href}>
              <Icon name="phone" />
              {phone.display}
            </a>
          )}
          <ButtonLink href={quoteHref} onClick={closeMenu}>
            Ajánlatkérés
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
