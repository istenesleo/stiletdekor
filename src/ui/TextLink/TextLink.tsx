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

/**
 * Link inside running text: underlined in the brand color, turns brand-colored on hover.
 * @category basics
 */
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
