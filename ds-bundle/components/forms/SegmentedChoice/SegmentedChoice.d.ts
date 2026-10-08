import * as React from 'react';

/**
 * SegmentedChoice — from @stiletdekor/ui@0.1.0.
 */
export interface SegmentedChoiceProps {
  legend: string;
  options: readonly SegmentedOption[];
  value?: string;
  onChange: (value: string) => void;
  name?: string;
  children?: React.ReactNode;
  className?: string;
  id?: string;
  style?: CSSProperties;
}

export declare const SegmentedChoice: React.ComponentType<SegmentedChoiceProps>;
