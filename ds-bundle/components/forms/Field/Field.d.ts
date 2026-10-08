import * as React from 'react';

/**
 * Field — from @stiletdekor/ui@0.1.0.
 */
export interface FieldProps {
  /** The control's label. */
  label: React.ReactNode;
  /** Id of the control the label belongs to. */
  htmlFor: string;
  /** Short hint under the control, e.g. "Erre a számra küldjük az egyeztetést.". */
  help?: React.ReactNode;
  /** Error under the control; shown in the error color with an icon. */
  error?: React.ReactNode;
  /** Adds the brand-colored "*" after the label (the control itself should be `required`). */
  required?: boolean;
  ids: FieldIds;
  children: React.ReactNode;
  className?: string;
  id?: string;
  style?: CSSProperties;
}

export declare const Field: React.ComponentType<FieldProps>;
