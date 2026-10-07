import type { HTMLAttributes } from 'react';
import '../base.css';
import { cx } from '../cx';
import './DiscountHint.css';

export interface DiscountHintProps extends HTMLAttributes<HTMLParagraphElement> {
  /** Pieces still needed for the next tier (the domain's nextDiscountHint().additionalQty). */
  additionalQty: number;
  /** Discount of that tier in percent. */
  pct: number;
}

/**
 * Nudge toward the next quantity discount. Renders nothing at the top tier.
 * E.g. "Még 2 db és −10%".
 * @category shop
 */
export function DiscountHint({ additionalQty, pct, className, ...rest }: DiscountHintProps) {
  return (
    <p className={cx('sd-discount', className)} {...rest}>
      <span>Még {additionalQty} db és</span>
      <span className="sd-discount__pct">−{pct}%</span>
    </p>
  );
}
