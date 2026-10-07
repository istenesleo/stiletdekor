import type { AnchorHTMLAttributes } from 'react';
import '../base.css';
import { cx } from '../cx';
import './NavLink.css';

export interface NavLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  /** The page (or section) the visitor is on: marked with aria-current and a brand-colored bar. */
  current?: boolean;
}

/**
 * Link in the header menu or a section menu, with an active state.
 * @category basics
 */
export function NavLink({ current = false, className, children, ...rest }: NavLinkProps) {
  return (
    <a className={cx('sd-navlink', className)} aria-current={current ? 'page' : undefined} {...rest}>
      {children}
    </a>
  );
}
