import * as React from 'react';

/**
 * Wordmark — from @stiletdekor/ui@0.1.0.
 */
export interface WordmarkProps {
  /** Where it links, the home page by default. */
  href?: string;
  className?: string;
  id?: string;
  style?: CSSProperties;
  children?: React.ReactNode;
}

export declare const Wordmark: React.ComponentType<WordmarkProps>;
