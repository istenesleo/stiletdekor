import * as React from 'react';

/**
 * Badge — from @stiletdekor/ui@0.1.0.
 */
export interface BadgeProps {
  /** neutral (default), brand ("Expressz"), ok / warn / bad (states), placeholder ("Helyőrző", dashed). */
  tone?: "neutral" | "brand" | "ok" | "warn" | "bad" | "placeholder";
  /** Filled background instead of an outline, for the strongest emphasis. */
  solid?: boolean;
  /** A small dot before the label, for status lists. */
  dot?: boolean;
  className?: string;
  id?: string;
  style?: CSSProperties;
  children?: React.ReactNode;
}

export declare const Badge: React.ComponentType<BadgeProps>;
