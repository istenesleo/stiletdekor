import * as React from 'react';

/**
 * ThemeRoot — from @stiletdekor/ui@0.1.0.
 */
export interface ThemeRootProps {
  /** Design direction: "neon-muhely" (A, Neon műhely) or "galeria-editorial" (B, Galéria / editorial). */
  theme?: "neon-muhely" | "galeria-editorial";
  className?: string;
  id?: string;
  style?: CSSProperties;
  children?: React.ReactNode;
}

export declare const ThemeRoot: React.ComponentType<ThemeRootProps>;
