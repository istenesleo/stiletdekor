import * as React from 'react';

/**
 * Notice — from @stiletdekor/ui@0.1.0.
 */
export interface NoticeProps {
  /** info (default), success, warning or error: sets the colored edge and the icon. */
  tone?: "error" | "info" | "success" | "warning";
  /** Optional bold first line. */
  title?: React.ReactNode;
  /** For messages that appear after an action: "polite" announces them to screen readers (role="status"), "assertive" interru */
  live?: "polite" | "assertive";
  children?: React.ReactNode;
  className?: string;
  id?: string;
  style?: CSSProperties;
}

export declare const Notice: React.ComponentType<NoticeProps>;
