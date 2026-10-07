import type { HTMLAttributes } from 'react';
import '../base.css';
import { cx } from '../cx';
import './Badge.css';

export type BadgeTone = 'neutral' | 'brand' | 'ok' | 'warn' | 'bad' | 'placeholder';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** neutral (default), brand ("Expressz"), ok / warn / bad (states), placeholder ("Helyőrző", dashed). */
  tone?: BadgeTone;
  /** Filled background instead of an outline, for the strongest emphasis. */
  solid?: boolean;
  /** A small dot before the label, for status lists. */
  dot?: boolean;
}

/**
 * Short uppercase label for a status or a property of an item. Not interactive.
 * Examples: "Expressz", "Helyőrző", "Online ár".
 * @category basics
 */
export function Badge({ tone = 'neutral', solid = false, dot = false, className, children, ...rest }: BadgeProps) {
  return (
    <span className={cx('sd-badge', tone !== 'neutral' && `sd-badge--${tone}`, solid && 'sd-badge--solid', className)} {...rest}>
      {dot && <span className="sd-badge__dot" aria-hidden="true" />}
      {children}
    </span>
  );
}
