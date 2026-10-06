import type { AnchorHTMLAttributes } from 'react';
import '../base.css';
import { cx } from '../cx';
import './Wordmark.css';

export interface WordmarkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Where it links, the home page by default. */
  href?: string;
}

/** Typographic wordmark "STILET • DEKOR" until the logo exists; links home. */
export function Wordmark({ href = '/', className, ...rest }: WordmarkProps) {
  return (
    <a className={cx('sd-wordmark', className)} href={href} aria-label="Stilet Dekor, kezdőlap" {...rest}>
      <span>STILET</span>
      <span className="sd-wordmark__mark" aria-hidden="true" />
      <span>DEKOR</span>
    </a>
  );
}
