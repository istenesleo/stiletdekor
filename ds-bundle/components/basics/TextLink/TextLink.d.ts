import * as React from 'react';

/**
 * TextLink — from @stiletdekor/ui@0.1.0.
 */
export interface TextLinkProps {
  href: string;
  /** Opens in a new tab (rel="noopener noreferrer") and shows a small external-link icon. */
  external?: boolean;
  className?: string;
  id?: string;
  style?: CSSProperties;
  children?: React.ReactNode;
}

export declare const TextLink: React.ComponentType<TextLinkProps>;
