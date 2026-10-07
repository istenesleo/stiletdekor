import { type HTMLAttributes, type ReactNode, useEffect, useRef } from 'react';
import '../base.css';
import { cx } from '../cx';
import { Icon } from '../Icon/Icon';
import './SuccessPanel.css';

export interface SuccessPanelProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** "Megkaptuk az ajánlatkérését", "Megkaptuk a rendelését". */
  title: string;
  /** The reference the customer can quote on the phone, e.g. "AK-2026-0142". */
  reference?: string;
  /** Label before the reference, "Azonosító" by default. */
  referenceLabel?: string;
  /** What happens next, in order ("Visszahívjuk egy munkanapon belül." …). */
  nextSteps?: readonly ReactNode[];
  /** Small print, e.g. "A végleges árajánlat eltérhet a kalkulált ártól.". */
  note?: ReactNode;
  /** Buttons or links, e.g. "Új ajánlatkérés". */
  actions?: ReactNode;
  /** Moves focus to the title when shown, so screen readers announce it after a submit. */
  autoFocus?: boolean;
  children?: ReactNode;
}

/**
 * Confirmation after a quote request or an order: what we received, its reference, and what happens next.
 * @category quote
 */
export function SuccessPanel({
  title,
  reference,
  referenceLabel = 'Azonosító',
  nextSteps,
  note,
  actions,
  autoFocus = false,
  className,
  children,
  ...rest
}: SuccessPanelProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (autoFocus) titleRef.current?.focus();
  }, [autoFocus]);
  return (
    <section className={cx('sd-success', className)} aria-label={title} {...rest}>
      <div className="sd-success__head">
        <Icon name="success" />
        <h2 className="sd-success__title" ref={titleRef} tabIndex={-1}>
          {title}
        </h2>
      </div>
      {reference && (
        <p className="sd-success__ref">
          <span className="sd-caps">{referenceLabel}</span>
          <b>{reference}</b>
        </p>
      )}
      {children && <div className="sd-success__body">{children}</div>}
      {nextSteps && nextSteps.length > 0 && (
        <div>
          <p className="sd-caps" style={{ margin: '0 0 var(--space-2)' }}>
            Mi történik ezután?
          </p>
          <ol className="sd-success__next">
            {nextSteps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
      )}
      {note && <p className="sd-success__note">{note}</p>}
      {actions && <div className="sd-success__actions">{actions}</div>}
    </section>
  );
}
