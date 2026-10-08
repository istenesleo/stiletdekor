import * as React from 'react';

/**
 * FitPicker — from @stiletdekor/ui@0.1.0.
 */
export interface FitPickerProps {
  value: "fill" | "fit";
  onChange: (value: FitMode) => void;
  /** "Ha a kép aránya eltér" by default. */
  legend?: string;
  children?: React.ReactNode;
  name?: string;
  className?: string;
  id?: string;
  style?: CSSProperties;
}

export declare const FitPicker: React.ComponentType<FitPickerProps>;
