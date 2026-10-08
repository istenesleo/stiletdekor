import * as React from 'react';

/**
 * TextField — from @stiletdekor/ui@0.1.0.
 * @replaces input
 */
export interface TextFieldProps {
  label: React.ReactNode;
  help?: React.ReactNode;
  /** Error message; also marks the input invalid. */
  error?: React.ReactNode;
  /** Several lines (a textarea), e.g. "Megjegyzés", "Üzenet". */
  multiline?: boolean;
  /** Class for the wrapper (label + control + messages). */
  className?: string;
  id?: string;
  style?: CSSProperties;
}

export declare const TextField: React.ComponentType<TextFieldProps>;
