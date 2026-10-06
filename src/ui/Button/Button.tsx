import type { AnchorHTMLAttributes, ButtonHTMLAttributes, MouseEvent, ReactNode } from 'react';
import '../base.css';
import { cx } from '../cx';
import { Icon, type IconName } from '../Icon/Icon';
import './Button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'link';
export type ButtonSize = 'sm' | 'md';

interface ButtonLook {
  /** primary: brand color, the one main action of a view; secondary and ghost: other actions; link: text-like. */
  variant?: ButtonVariant;
  /** md: 44 px tall (default); sm: 36 px. */
  size?: ButtonSize;
  /** Icon before or after the label. */
  icon?: IconName;
  iconPosition?: 'start' | 'end';
  /** Stretch to the full width of the container. */
  block?: boolean;
  children?: ReactNode;
}

function lookClass({ variant = 'primary', size = 'md', block }: ButtonLook, className?: string): string {
  return cx('sd-btn', `sd-btn--${variant}`, size === 'sm' && 'sd-btn--sm', block && 'sd-btn--block', className);
}

function content({ icon, iconPosition = 'start', children }: ButtonLook) {
  const glyph = icon ? <Icon name={icon} /> : null;
  return (
    <>
      {iconPosition === 'start' && glyph}
      {children !== undefined && <span className="sd-btn__label">{children}</span>}
      {iconPosition === 'end' && glyph}
    </>
  );
}

export interface ButtonProps extends ButtonLook, Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Shows a spinner, keeps the width, ignores clicks and tells assistive tech that work is in progress. */
  loading?: boolean;
}

/**
 * Button for actions. One `primary` per view (e.g. "Kosárba", "Rendelés elküldése ellenőrzésre"); the rest are
 * `secondary` or `ghost`. Use ButtonLink when the action navigates.
 */
export function Button({
  variant,
  size,
  icon,
  iconPosition,
  block,
  loading = false,
  type = 'button',
  className,
  onClick,
  children,
  ...rest
}: ButtonProps) {
  const look = { variant, size, icon, iconPosition, block, children };
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (loading) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };
  return (
    <button
      type={type}
      className={lookClass(look, className)}
      onClick={handleClick}
      {...(loading ? { 'aria-busy': true, 'aria-disabled': true } : {})}
      {...rest}
    >
      {content(look)}
      {loading && <span className="sd-btn__spinner" aria-hidden="true" />}
    </button>
  );
}

export interface ButtonLinkProps extends ButtonLook, Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children'> {
  href: string;
}

/** A link that looks like a Button, for navigation ("Webshop megnyitása", "Ajánlatot kérek"). */
export function ButtonLink({ variant, size, icon, iconPosition, block, className, children, ...rest }: ButtonLinkProps) {
  const look = { variant, size, icon, iconPosition, block, children };
  return (
    <a className={lookClass(look, className)} {...rest}>
      {content(look)}
    </a>
  );
}
