import * as React from 'react';

/**
 * ChipGroup — from @stiletdekor/ui@0.1.0.
 */
export interface ChipGroupProps {
  /** Caption of the group, e.g. "Gyakori méretek". */
  legend: string;
  options: readonly ChipOption[];
  /** The selected option's value; none selected when it matches no option (e.g. a custom size). */
  value?: string;
  onChange: (value: string) => void;
  /** Radio group name; generated when omitted. */
  name?: string;
  children?: React.ReactNode;
  className?: string;
  id?: string;
  style?: CSSProperties;
}

export declare const ChipGroup: React.ComponentType<ChipGroupProps>;
