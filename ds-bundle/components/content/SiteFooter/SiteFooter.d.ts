import * as React from 'react';

/**
 * SiteFooter — from @stiletdekor/ui@0.1.0.
 */
export interface SiteFooterProps {
  /** Link columns before the contact column; the site's services and ordering links by default. */
  columns?: readonly FooterColumn[];
  /** Legal pages in the bottom row: ÁSZF, Adatkezelési tájékoztató, Impresszum by default. */
  legal?: readonly NavItem[];
  /** One line about what we do, under the wordmark. */
  tagline?: React.ReactNode;
  /** Where the wordmark links, the home page by default. */
  homeHref?: string;
  /** Year in the copyright line, the current year by default. */
  year?: number;
  className?: string;
  id?: string;
  style?: CSSProperties;
  children?: React.ReactNode;
}

export declare const SiteFooter: React.ComponentType<SiteFooterProps>;
