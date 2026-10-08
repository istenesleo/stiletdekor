import * as React from 'react';

/**
 * ContactBlock — from @stiletdekor/ui@0.1.0.
 */
export interface ContactBlockProps {
  /** The workshop's number by default. */
  phone?: { display: string; href: string; };
  /** The workshop's e-mail address by default. */
  email?: string;
  /** The workshop's address by default. */
  address?: string;
  /** Map link for the address, opened in a new tab; a map search for the address by default, null hides it. */
  mapHref?: string;
  /** The workshop's opening hours by default; null hides the row. */
  openingHours?: string;
  className?: string;
  id?: string;
  style?: CSSProperties;
  children?: React.ReactNode;
}

export declare const ContactBlock: React.ComponentType<ContactBlockProps>;
