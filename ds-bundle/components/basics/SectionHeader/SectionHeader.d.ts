import * as React from 'react';

/**
 * SectionHeader — from @stiletdekor/ui@0.1.0.
 */
export interface SectionHeaderProps {
  /** Small uppercase line above the title, e.g. "Webshop · azonnali ár". */
  eyebrow?: string;
  title: React.ReactNode;
  /** One short sentence under the title. */
  lead?: React.ReactNode;
  /** Heading level of the title (2 by default: sections under the page's h1). */
  level?: 1 | 2 | 3;
  /** lg (default) for page sections, sm for blocks inside a section. */
  size?: "sm" | "lg";
  /** id for the title, to label the section with aria-labelledby. */
  titleId?: string;
  children?: React.ReactNode;
  className?: string;
  id?: string;
  style?: CSSProperties;
}

export declare const SectionHeader: React.ComponentType<SectionHeaderProps>;
