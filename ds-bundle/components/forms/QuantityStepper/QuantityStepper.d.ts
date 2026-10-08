import * as React from 'react';

/**
 * QuantityStepper — from @stiletdekor/ui@0.1.0.
 */
export interface QuantityStepperProps {
  /** Current quantity. */
  value: number;
  onChange: (value: number) => void;
  /** Smallest allowed quantity, 1 by default. */
  min?: number;
  /** Largest allowed quantity. */
  max?: number;
  /** Label above the control, "Darabszám" by default. */
  label?: React.ReactNode;
  /** E.g. "2–4 db: −5% · 5–9 db: −10% · 10 db-tól: −15%". */
  help?: React.ReactNode;
  error?: React.ReactNode;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export declare const QuantityStepper: React.ComponentType<QuantityStepperProps>;
