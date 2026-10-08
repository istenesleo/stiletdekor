import * as React from 'react';

/**
 * OrderStatusBadge — from @stiletdekor/ui@0.1.0.
 */
export interface OrderStatusBadgeProps {
  status: "beerkezett" | "modositas" | "visszaigazolva" | "gyartas" | "elkeszult" | "teljesitve" | "elutasitva" | "lemondva" | "lejart";
  className?: string;
  id?: string;
  style?: CSSProperties;
  /** Filled background instead of an outline, for the strongest emphasis. */
  solid?: boolean;
  /** A small dot before the label, for status lists. */
  dot?: boolean;
}

export declare const OrderStatusBadge: React.ComponentType<OrderStatusBadgeProps>;
