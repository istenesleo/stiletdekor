import * as React from 'react';

/**
 * OptionRow — from @stiletdekor/ui@0.1.0.
 */
export interface OptionRowProps {
  /** radio (default) for one-of-many groups such as edge finish; checkbox for add-ons such as contour cut. */
  type?: "radio" | "checkbox";
  label: React.ReactNode;
  /** One line about what the option is, e.g. "Megerősített, szegett szél, ringli 50 cm-enként.". */
  description?: React.ReactNode;
  /** Gross unit price in forints, shown as "+445 Ft/fm". 0 shows "felár nélkül". */
  rate?: number;
  /** Unit of the rate: "fm", "m²", "db". */
  rateUnit?: string;
  /** Gross amount for the current size and quantity, in forints. */
  amount?: number;
  /** Text instead of an amount, e.g. "egyedi" (installation is priced at confirmation). */
  amountText?: string;
  className?: string;
  id?: string;
  style?: CSSProperties;
}

export declare const OptionRow: React.ComponentType<OptionRowProps>;
