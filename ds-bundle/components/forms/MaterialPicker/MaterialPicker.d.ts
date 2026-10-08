import * as React from 'react';

/**
 * MaterialPicker — from @stiletdekor/ui@0.1.0.
 */
export interface MaterialPickerProps {
  /** "Anyag" by default. */
  legend?: string;
  materials: readonly MaterialOption[];
  /** Selected material's id. */
  value?: string;
  onChange: (id: string) => void;
  name?: string;
  children?: React.ReactNode;
  className?: string;
  id?: string;
  style?: CSSProperties;
}

export declare const MaterialPicker: React.ComponentType<MaterialPickerProps>;
