import * as React from 'react';

/**
 * SurfaceList — from @stiletdekor/ui@0.1.0.
 */
export interface SurfaceListProps {
  surfaces: readonly Surface[];
  /** Number of sets (e.g. one per shop window). */
  sets: number;
  onSetsChange: (sets: number) => void;
  /** Leaves a surface out of the order, or takes it back. */
  onToggleSkip?: (id: string) => void;
  className?: string;
  id?: string;
  style?: CSSProperties;
  children?: React.ReactNode;
}

export declare const SurfaceList: React.ComponentType<SurfaceListProps>;
