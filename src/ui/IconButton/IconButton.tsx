import type { ButtonHTMLAttributes, Ref } from 'react';
import '../base.css';
import { cx } from '../cx';
import { Icon, type IconName } from '../Icon/Icon';
import './IconButton.css';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-label'> {
  icon: IconName;
  /** Accessible name, e.g. "Kosár megnyitása, 2 tétel", "Menü", "Bezárás", "Szélesség és magasság cseréje". */
  label: string;
  /** Number shown in a brand-colored badge (the cart's item count). Hidden at 0. Include it in `label` too. */
  count?: number;
  /** outlined (default) or plain: no border until hovered. */
  variant?: 'outlined' | 'plain';
  /** md: 44 × 44 px (default); sm: 36 × 36 px. */
  size?: 'sm' | 'md';
  /** For toggles (e.g. a filter): renders aria-pressed. A button that opens a panel uses aria-expanded instead. */
  pressed?: boolean;
  /** The underlying button, e.g. to return focus to it. */
  ref?: Ref<HTMLButtonElement>;
}

/**
 * Square button with a single icon: cart (with item count), menu, close, swap width and height.
 * @category basics
 */
export function IconButton({
  icon,
  label,
  count,
  variant = 'outlined',
  size = 'md',
  pressed,
  type = 'button',
  className,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      aria-pressed={pressed}
      className={cx('sd-iconbtn', variant === 'plain' && 'sd-iconbtn--plain', size === 'sm' && 'sd-iconbtn--sm', className)}
      {...rest}
    >
      <Icon name={icon} />
      {count !== undefined && count > 0 && (
        <span className="sd-iconbtn__count" aria-hidden="true">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}
