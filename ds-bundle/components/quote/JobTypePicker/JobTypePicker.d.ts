import * as React from 'react';

/**
 * JobTypePicker — from @stiletdekor/ui@0.1.0.
 */
export interface JobTypePickerProps {
  types: readonly JobTypeOption[];
  value?: string;
  onChange: (id: string) => void;
  /** The question, "Milyen munkáról van szó?" by default. */
  legend?: string;
  name?: string;
  children?: React.ReactNode;
  className?: string;
  id?: string;
  style?: CSSProperties;
}

export declare const JobTypePicker: React.ComponentType<JobTypePickerProps>;
