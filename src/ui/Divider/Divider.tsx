import type { HTMLAttributes } from 'react';
import '../base.css';
import { cx } from '../cx';
import './Divider.css';

export interface DividerProps extends HTMLAttributes<HTMLElement> {
  /** Small uppercase caption at the start of the line, e.g. "Átvétel". Without it a plain hairline. */
  label?: string;
}

/** Hairline that separates groups of content; with a `label` it also names the group that follows. */
export function Divider({ label, className, ...rest }: DividerProps) {
  if (!label) return <hr className={cx('sd-divider', className)} {...rest} />;
  return (
    <div className={cx('sd-divider', 'sd-divider--labelled', className)} {...rest}>
      <span className="sd-caps">{label}</span>
    </div>
  );
}
