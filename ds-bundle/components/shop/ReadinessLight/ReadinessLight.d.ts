import * as React from 'react';

/**
 * ReadinessLight — from @stiletdekor/ui@0.1.0.
 */
export interface ReadinessLightProps {
  /** kivalo / megfelelo / gyenge (from the domain's preflight); empty before a file is uploaded. */
  rating?: "kivalo" | "megfelelo" | "gyenge";
  /** Effective resolution at the chosen size. */
  dpi?: number;
  /** Vector artwork: sharp at any size, so the light is green without a dpi. */
  vector?: boolean;
  className?: string;
  id?: string;
  style?: CSSProperties;
  children?: React.ReactNode;
}

export declare const ReadinessLight: React.ComponentType<ReadinessLightProps>;
