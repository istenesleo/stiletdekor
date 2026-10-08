import * as React from 'react';

/**
 * Switch — from @stiletdekor/ui@0.1.0.
 */
export interface SwitchProps {
  /** What the switch turns on, e.g. "Expressz gyártás". */
  label: React.ReactNode;
  /** The consequence, e.g. "1 munkanap, +30%". */
  description?: React.ReactNode;
  className?: string;
  id?: string;
  style?: CSSProperties;
}

export declare const Switch: React.ComponentType<SwitchProps>;
