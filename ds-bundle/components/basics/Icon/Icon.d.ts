import * as React from 'react';

/**
 * Icon — from @stiletdekor/ui@0.1.0.
 */
export interface IconProps {
  /** Which icon to draw. */
  name: "arrow-right" | "camera" | "cart" | "check" | "chevron-down" | "clock" | "close" | "copy" | "error" | "external" | "file" | "info" | "mail" | "menu" | "minus" | "phone" | "pin" | "plus" | "success" | "swap" | "trash" | "upload" | "warning";
  /** Size in px; by default the icon is 1.25× the surrounding font size. */
  size?: number;
  /** Accessible name. Without it the icon is decorative and hidden from screen readers. */
  label?: string;
  className?: string;
  id?: string;
  style?: CSSProperties;
}

export declare const Icon: React.ComponentType<IconProps>;
