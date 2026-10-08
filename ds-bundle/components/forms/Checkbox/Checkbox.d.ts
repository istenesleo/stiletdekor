import * as React from 'react';

/**
 * Checkbox — from @stiletdekor/ui@0.1.0.
 * @replaces input[type=checkbox]
 */
export interface CheckboxProps {
  /** The statement the visitor agrees to or chooses; may contain a link ("Elfogadom az ÁSZF-et"). */
  label: React.ReactNode;
  /** A second, quieter line under the label. */
  description?: React.ReactNode;
  /** Error under the checkbox, e.g. "Az ÁSZF elfogadása nélkül nem küldhető el a rendelés.". */
  error?: React.ReactNode;
  className?: string;
  id?: string;
  style?: CSSProperties;
}

export declare const Checkbox: React.ComponentType<CheckboxProps>;
