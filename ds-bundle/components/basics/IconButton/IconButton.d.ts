import * as React from 'react';

/**
 * IconButton — from @stiletdekor/ui@0.1.0.
 */
export interface IconButtonProps {
  icon: "arrow-right" | "camera" | "cart" | "check" | "chevron-down" | "clock" | "close" | "copy" | "error" | "external" | "file" | "info" | "mail" | "menu" | "minus" | "phone" | "pin" | "plus" | "success" | "swap" | "trash" | "upload" | "warning";
  /** Accessible name, e.g. "Kosár megnyitása, 2 tétel", "Menü", "Bezárás", "Szélesség és magasság cseréje". */
  label: string;
  /** Number shown in a brand-colored badge (the cart's item count). Hidden at 0. Include it in `label` too. */
  count?: number;
  /** outlined (default) or plain: no border until hovered. */
  variant?: "outlined" | "plain";
  /** md: 44 × 44 px (default); sm: 36 × 36 px. */
  size?: "sm" | "md";
  /** For toggles (e.g. a filter): renders aria-pressed. A button that opens a panel uses aria-expanded instead. */
  pressed?: boolean;
  /** The underlying button, e.g. to return focus to it. */
  ref?: React.Ref;
  className?: string;
  id?: string;
  style?: CSSProperties;
}

export declare const IconButton: React.ComponentType<IconButtonProps>;
