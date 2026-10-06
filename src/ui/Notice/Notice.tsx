import type { HTMLAttributes, ReactNode } from 'react';
import '../base.css';
import { cx } from '../cx';
import { Icon, type IconName } from '../Icon/Icon';
import './Notice.css';

export type NoticeTone = 'info' | 'success' | 'warning' | 'error';

const TONE_ICON: Readonly<Record<NoticeTone, IconName>> = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  error: 'error',
};

export interface NoticeProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** info (default), success, warning or error: sets the colored edge and the icon. */
  tone?: NoticeTone;
  /** Optional bold first line. */
  title?: ReactNode;
  /**
   * For messages that appear after an action: "polite" announces them to screen readers (role="status"),
   * "assertive" interrupts (role="alert", errors only). Leave empty for text that is there from the start.
   */
  live?: 'polite' | 'assertive';
}

/**
 * A message bar: "A végleges ár eltérhet a kalkulált ártól." (info), a failed upload (error), a sent order
 * (success). Keep it to one or two sentences.
 */
export function Notice({ tone = 'info', title, live, className, children, ...rest }: NoticeProps) {
  const role = live === 'assertive' ? 'alert' : live === 'polite' ? 'status' : undefined;
  return (
    <div className={cx('sd-notice', tone !== 'info' && `sd-notice--${tone}`, className)} role={role} {...rest}>
      <Icon name={TONE_ICON[tone]} />
      <div>
        {title && <p className="sd-notice__title">{title}</p>}
        {children && <div className="sd-notice__text">{children}</div>}
      </div>
    </div>
  );
}
