import * as React from 'react';

/**
 * OrderSubmit — from @stiletdekor/ui@0.1.0.
 */
export interface OrderSubmitProps {
  /** Whether the terms are accepted (controlled). */
  accepted: boolean;
  onAcceptedChange: (accepted: boolean) => void;
  /** Label of the terms checkbox; may contain links to the ÁSZF and the privacy notice. */
  acceptLabel?: React.ReactNode;
  /** Error under the checkbox, e.g. when submitting without accepting. */
  error?: React.ReactNode;
  /** The small print above the button; by default what sending the order means and that the price may change. */
  terms?: React.ReactNode;
  /** Button text, "Rendelés elküldése ellenőrzésre" by default. */
  label?: string;
  loading?: boolean;
  onSubmit: () => void;
  className?: string;
}

export declare const OrderSubmit: React.ComponentType<OrderSubmitProps>;
