import * as React from 'react';

/**
 * NavLink — from @stiletdekor/ui@0.1.0.
 */
export interface NavLinkProps {
  href: string;
  /** The page (or section) the visitor is on: marked with aria-current and a brand-colored bar. */
  current?: boolean;
  className?: string;
  id?: string;
  style?: CSSProperties;
  children?: React.ReactNode;
}

export declare const NavLink: React.ComponentType<NavLinkProps>;
