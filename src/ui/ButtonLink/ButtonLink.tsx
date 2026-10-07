import type { AnchorHTMLAttributes } from 'react';
import '../base.css';
import { type ButtonLook, buttonClass, buttonContent } from '../Button/Button';

export interface ButtonLinkProps extends ButtonLook, Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children'> {
  href: string;
}

/**
 * A link that looks like a Button, for navigation.
 * E.g. "Webshop megnyitása", "Ajánlatot kérek".
 * @category basics
 */
export function ButtonLink({ variant, size, icon, iconPosition, block, className, children, ...rest }: ButtonLinkProps) {
  const look = { variant, size, icon, iconPosition, block, children };
  return (
    <a className={buttonClass(look, className)} {...rest}>
      {buttonContent(look)}
    </a>
  );
}
