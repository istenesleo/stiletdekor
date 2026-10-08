import * as React from 'react';

/**
 * CheckoutSection — from @stiletdekor/ui@0.1.0.
 */
export interface CheckoutSectionProps {
  /** Step number shown in a circle (1 Adatok, 2 Számlázás, 3 Átvétel). */
  step?: number;
  title: React.ReactNode;
  /** One line under the title. */
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  id?: string;
  style?: CSSProperties;
}

export declare const CheckoutSection: React.ComponentType<CheckoutSectionProps>;
