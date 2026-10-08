import * as React from 'react';

/**
 * Stepper — from @stiletdekor/ui@0.1.0.
 */
export interface StepperProps {
  /** Step names, e.g. ["Típus", "Részletek", "Helyszín és fotók", "Kapcsolat"]. */
  steps: readonly string[];
  /** Index of the current step, from 0. */
  current: number;
  /** Furthest step reached; earlier steps can be revisited. Defaults to `current`. */
  reached?: number;
  /** Makes reached steps clickable (going back to change an answer). */
  onStepClick?: (index: number) => void;
  /** Accessible name of the step list, "Lépések" by default. */
  label?: string;
  children?: React.ReactNode;
  className?: string;
  id?: string;
  style?: CSSProperties;
}

export declare const Stepper: React.ComponentType<StepperProps>;
