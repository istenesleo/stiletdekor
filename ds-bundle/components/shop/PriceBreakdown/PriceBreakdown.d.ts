import * as React from 'react';

/**
 * PriceBreakdown — from @stiletdekor/ui@0.1.0.
 */
export interface PriceBreakdownProps {
  rows: readonly PriceRow[];
  /** Gross total in forints. */
  total: number;
  /** "Kalkulált ár, bruttó" by default. */
  totalLabel?: string;
  /** Net amount and VAT for the small line under the total. */
  net?: number;
  vat?: number;
  /** Small print under the total, e.g. "A végleges ár eltérhet a kalkulált ártól.". */
  note?: React.ReactNode;
  /** Hidden table caption, "Tételes árbontás" by default. */
  caption?: string;
  className?: string;
  id?: string;
  style?: CSSProperties;
  children?: React.ReactNode;
}

export declare const PriceBreakdown: React.ComponentType<PriceBreakdownProps>;
