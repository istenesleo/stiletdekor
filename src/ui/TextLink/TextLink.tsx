import type { AnchorHTMLAttributes } from 'react';
import '../base.css';
import { cx } from '../cx';
import { Icon } from '../Icon/Icon';
import './TextLink.css';

export interface TextLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  /** Opens in a new tab (rel="noopener noreferrer") and shows a small external-link icon. */
  external?: boolean;
}

/** Link inside running text: underlined in the brand color, turns brand-colored on hover. */
export function TextLink({ external = false, className, children, ...rest }: TextLinkProps) {
  return (
    <a
      className={cx('sd-link', className)}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      {...rest}
    >
      {children}
      {external && <Icon name="external" />}
    </a>
  );
}

export interface NavLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  /** The page (or section) the visitor is on: marked with aria-current and a brand-colored bar. */
  current?: boolean;
}

/** Link in the header menu or a section menu, with an active state. */
export function NavLink({ current = false, className, children, ...rest }: NavLinkProps) {
  return (
    <a className={cx('sd-navlink', className)} aria-current={current ? 'page' : undefined} {...rest}>
      {children}
    </a>
  );
}
