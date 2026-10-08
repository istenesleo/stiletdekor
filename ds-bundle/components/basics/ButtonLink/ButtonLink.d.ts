import * as React from 'react';

/**
 * ButtonLink — from @stiletdekor/ui@0.1.0.
 */
export interface ButtonLinkProps {
  href: string;
  /** primary: brand color, the one main action of a view; secondary and ghost: other actions; link: text-like. */
  variant?: "primary" | "secondary" | "ghost" | "link";
  /** md: 44 px tall (default); sm: 36 px. */
  size?: "sm" | "md";
  /** Icon before or after the label. */
  icon?: "arrow-right" | "camera" | "cart" | "check" | "chevron-down" | "clock" | "close" | "copy" | "error" | "external" | "file" | "info" | "mail" | "menu" | "minus" | "phone" | "pin" | "plus" | "success" | "swap" | "trash" | "upload" | "warning";
  iconPosition?: "start" | "end";
  /** Stretch to the full width of the container. */
  block?: boolean;
  children?: React.ReactNode;
  className?: string;
  id?: string;
  style?: CSSProperties;
}

export declare const ButtonLink: React.ComponentType<ButtonLinkProps>;
