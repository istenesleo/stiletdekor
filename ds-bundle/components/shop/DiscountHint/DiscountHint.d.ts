import * as React from 'react';

/**
 * DiscountHint — from @stiletdekor/ui@0.1.0.
 */
export interface DiscountHintProps {
  /** Pieces still needed for the next tier (the domain's nextDiscountHint().additionalQty). */
  additionalQty: number;
  /** Discount of that tier in percent. */
  pct: number;
  className?: string;
  id?: string;
  style?: CSSProperties;
  children?: React.ReactNode;
}

export declare const DiscountHint: React.ComponentType<DiscountHintProps>;
