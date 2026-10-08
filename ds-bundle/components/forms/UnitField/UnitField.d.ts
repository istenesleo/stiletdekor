import * as React from 'react';

/**
 * UnitField — from @stiletdekor/ui@0.1.0.
 */
export interface UnitFieldProps {
  label: React.ReactNode;
  /** Unit printed inside the field, e.g. "cm", "db", "mm". */
  unit: string;
  help?: React.ReactNode;
  error?: React.ReactNode;
  className?: string;
  id?: string;
  style?: CSSProperties;
}

export declare const UnitField: React.ComponentType<UnitFieldProps>;
