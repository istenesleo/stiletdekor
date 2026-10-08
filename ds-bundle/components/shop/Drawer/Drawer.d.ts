import * as React from 'react';

/**
 * Drawer — from @stiletdekor/ui@0.1.0.
 */
export interface DrawerProps {
  open: boolean;
  /** Called on the close button, Escape and a click outside the panel. */
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  /** Sticky bottom area: totals and the main action. */
  footer?: React.ReactNode;
  className?: string;
}

export declare const Drawer: React.ComponentType<DrawerProps>;
