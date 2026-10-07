import { type HTMLAttributes, type KeyboardEvent, useId, useRef, useState } from 'react';
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
  /** Stays at the top of the window while scrolling (default). Turn it off in previews. */
  sticky?: boolean;
  /** Target of the "Ugrás a tartalomra" skip link, the page's main content; null leaves the link out. */
  skipTo?: string | null;
  /** Starts with the mobile menu open (previews). */
  defaultMenuOpen?: boolean;
}

/**
 * The site header: wordmark, main menu, phone number, quote button and the cart with its item count.
 * Sticky, on a translucent background. When the header is narrower than 1040 px, the menu, the phone number
 * and the "Ajánlatkérés" button move into a panel opened by the menu button; Escape closes it. The page's main
 * content needs the id of `skipTo` ("tartalom" by default).
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
  sticky = true,
  skipTo = '#tartalom',
  defaultMenuOpen = false,
  className,
  onKeyDown,
  ...rest
}: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(defaultMenuOpen);
  const menuButton = useRef<HTMLButtonElement>(null);
  const panelId = `sd-menu${useId().replace(/:/g, '')}`;
  const closeMenu = () => setMenuOpen(false);
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    onKeyDown?.(event);
    if (event.key === 'Escape' && menuOpen) {
      closeMenu();
      menuButton.current?.focus();
    }
  };
  return (
    <header className={cx('sd-header', sticky && 'sd-header--sticky', className)} onKeyDown={handleKeyDown} {...rest}>
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
        {onCartClick && (
          <IconButton icon="cart" label={`Kosár megnyitása, ${cartCount} tétel`} count={cartCount} aria-haspopup="dialog" onClick={onCartClick} />
        )}
        <IconButton
          ref={menuButton}
          className="sd-header__menubtn"
          icon={menuOpen ? 'close' : 'menu'}
          label="Menü"
          aria-expanded={menuOpen}
          aria-controls={panelId}
          onClick={() => setMenuOpen((open) => !open)}
        />
      </div>
      <div className="sd-header__panel" id={panelId} hidden={!menuOpen}>
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
