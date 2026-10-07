import type { HTMLAttributes, ReactNode } from 'react';
import { formatReadyBy, type IsoDate } from '@/domain/leadtime';
import { Badge } from '../Badge/Badge';
import '../base.css';
import { cx } from '../cx';
import { Icon } from '../Icon/Icon';
import './LeadTimeNote.css';

export interface LeadTimeNoteProps extends HTMLAttributes<HTMLDivElement> {
  /** Estimated ready date (the domain's estimateOrderReadyDate), "YYYY-MM-DD". */
  readyBy: IsoDate;
  /** Express production: adds an "Expressz" badge and says 1 business day. */
  express?: boolean;
  /** Production time in business days without express; 3 by default. */
  productionDays?: number;
  /** Replaces the small line under the date. */
  detail?: ReactNode;
}

/**
 * Expected completion date of an order, with the rules in small type.
 * E.g. "Várhatóan október 13-ára, keddre elkészül." Production counts from the payment, the date includes one
 * business day for confirmation and payment, weekends and holidays don't count.
 * @category shop
 */
export function LeadTimeNote({ readyBy, express = false, productionDays = 3, detail, className, ...rest }: LeadTimeNoteProps) {
  const days = express ? 1 : productionDays;
  return (
    <div className={cx('sd-lead', className)} {...rest}>
      <Icon name="clock" />
      <p className="sd-lead__main" aria-live="polite">
        Várhatóan <strong>{formatReadyBy(readyBy)}</strong> elkészül.{' '}
        {express && <Badge tone="brand">Expressz</Badge>}
      </p>
      <p className="sd-lead__sub">
        {detail ??
          `Gyártási idő: ${days} munkanap a díjbekérő befizetésétől · a dátumban 1 munkanap a visszaigazolásra és a befizetésre · hétvége és munkaszüneti nap nem számít`}
      </p>
    </div>
  );
}
