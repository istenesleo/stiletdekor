import * as React from 'react';

/**
 * DimensionLine — from @stiletdekor/ui@0.1.0.
 */
export interface DimensionLineProps {
  /** horizontal (default) fills the container's width; vertical fills its height. */
  orientation?: "horizontal" | "vertical";
  /** The measured length in millimetres, printed as "4 200 mm". */
  valueMm?: number;
  /** Text to print instead of valueMm (e.g. "85 cm"). */
  label?: string;
  /** Hide from screen readers when the same size is already stated in text nearby. */
  decorative?: boolean;
  className?: string;
  id?: string;
  style?: CSSProperties;
  children?: React.ReactNode;
}

export declare const DimensionLine: React.ComponentType<DimensionLineProps>;
