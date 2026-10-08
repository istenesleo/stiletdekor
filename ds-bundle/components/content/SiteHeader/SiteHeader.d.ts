import * as React from 'react';

/**
 * SiteHeader — from @stiletdekor/ui@0.1.0.
 */
export interface SiteHeaderProps {
  /** The main menu; the site's sections (MAIN_NAV) by default. */
  links?: readonly NavItem[];
  /** href of the page or section the visitor is on: that menu item is marked as current. */
  currentHref?: string;
  /** Where the wordmark links, the home page by default. */
  homeHref?: string;
  /** Phone number shown on wide screens and in the mobile menu; the workshop's by default, null hides it. */
  phone?: { display: string; href: string; };
  /** Target of the "Ajánlatkérés" button, the quote wizard by default. */
  quoteHref?: string;
  /** Items in the cart, shown on the cart button. */
  cartCount?: number;
  /** Opens the cart drawer. Without it there is no cart button. */
  onCartClick?: () => void;
  /** Stays at the top of the window while scrolling (default). Turn it off in previews. */
  sticky?: boolean;
  /** Target of the "Ugrás a tartalomra" skip link, the page's main content; null leaves the link out. */
  skipTo?: string;
  /** Starts with the mobile menu open (previews). */
  defaultMenuOpen?: boolean;
  className?: string;
  id?: string;
  style?: CSSProperties;
  children?: React.ReactNode;
}

export declare const SiteHeader: React.ComponentType<SiteHeaderProps>;
