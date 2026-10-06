import type { HTMLAttributes, ReactNode } from 'react';
import '../base.css';
import { cx } from '../cx';
import './SectionHeader.css';

export interface SectionHeaderProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** Small uppercase line above the title, e.g. "Webshop · azonnali ár". */
  eyebrow?: string;
  title: ReactNode;
  /** One short sentence under the title. */
  lead?: ReactNode;
  /** Heading level of the title (2 by default: sections under the page's h1). */
  level?: 1 | 2 | 3;
  /** lg (default) for page sections, sm for blocks inside a section. */
  size?: 'lg' | 'sm';
  /** id for the title, to label the section with aria-labelledby. */
  titleId?: string;
}

/** Eyebrow, title and lead at the top of a page section. */
export function SectionHeader({
  eyebrow,
  title,
  lead,
  level = 2,
  size = 'lg',
  titleId,
  className,
  ...rest
}: SectionHeaderProps) {
  const Heading = `h${level}` as const;
  return (
    <header className={cx('sd-sechead', size === 'sm' && 'sd-sechead--sm', className)} {...rest}>
      {eyebrow && <p className="sd-caps">{eyebrow}</p>}
      <Heading id={titleId} className="sd-sechead__title">
        {title}
      </Heading>
      {lead && <p className="sd-sechead__lead">{lead}</p>}
    </header>
  );
}
