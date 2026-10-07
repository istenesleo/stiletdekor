import { type HTMLAttributes, type ReactNode, useId } from 'react';
import '../base.css';
import { cx } from '../cx';
import './CheckoutSection.css';

export interface CheckoutSectionProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** Step number shown in a circle (1 Adatok, 2 Számlázás, 3 Átvétel). */
  step?: number;
  title: ReactNode;
  /** One line under the title. */
  description?: ReactNode;
  children: ReactNode;
}

/**
 * A numbered part of the checkout: contact details, billing, delivery.
 * @category shop
 */
export function CheckoutSection({ step, title, description, children, className, ...rest }: CheckoutSectionProps) {
  const titleId = `sd-cosec${useId().replace(/:/g, '')}`;
  return (
    <section className={cx('sd-cosec', className)} aria-labelledby={titleId} {...rest}>
      <div className="sd-cosec__head">
        {step !== undefined && (
          <span className="sd-cosec__step" aria-hidden="true">
            {step}
          </span>
        )}
        <h2 className="sd-cosec__title" id={titleId}>
          {title}
        </h2>
      </div>
      {description && <p className="sd-cosec__desc">{description}</p>}
      <div className="sd-cosec__body">{children}</div>
    </section>
  );
}
