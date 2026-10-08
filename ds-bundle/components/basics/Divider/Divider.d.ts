import * as React from 'react';

/**
 * Divider — from @stiletdekor/ui@0.1.0.
 */
export interface DividerProps {
  /** Small uppercase caption at the start of the line, e.g. "Átvétel". Without it a plain hairline. */
  label?: string;
  className?: string;
  id?: string;
  style?: CSSProperties;
  children?: React.ReactNode;
}

export declare const Divider: React.ComponentType<DividerProps>;
