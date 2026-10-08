import type { HTMLAttributes } from 'react';
import { COMPANY } from '@/domain/company';
import '../base.css';
import { ButtonLink } from '../ButtonLink/ButtonLink';
import { cx } from '../cx';
import { QUOTE_HREF } from '../navigation';
import './ActionBar.css';

export interface ActionBarProps extends HTMLAttributes<HTMLElement> {
  /** The number to call, the workshop's by default. */
  phone?: { display: string; href: string };
  /** Target of "Ajánlatkérés", the quote wizard by default. */
  quoteHref?: string;
  /** Fixed to the bottom of narrow screens (default). Off: in the flow at any width (previews). */
  fixed?: boolean;
}

/**
 * Bar at the bottom of narrow screens with the two quickest actions: call the workshop, ask for a quote.
 * Shown below 720 px. Leave it out on form pages and in the checkout, so it never covers a field.
 * @category content
 */
export function ActionBar({ phone = COMPANY.phone, quoteHref = QUOTE_HREF, fixed = true, className, ...rest }: ActionBarProps) {
  return (
    <nav className={cx('sd-actionbar', !fixed && 'sd-actionbar--inline', className)} aria-label="Gyors elérés" {...rest}>
      <ButtonLink href={phone.href} variant="secondary" icon="phone" block aria-label={`Hívás: ${phone.display}`}>
        Hívás
      </ButtonLink>
      <ButtonLink href={quoteHref} block>
        Ajánlatkérés
      </ButtonLink>
    </nav>
  );
}
