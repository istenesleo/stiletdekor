import type { ReactNode } from 'react';
import { FINAL_PRICE_NOTICE, ORDER_NO_OBLIGATION_NOTICE, ORDER_SUBMIT_LABEL } from '@/domain/orders';
import '../base.css';
import { Button } from '../Button/Button';
import { Checkbox } from '../Checkbox/Checkbox';
import { cx } from '../cx';
import './OrderSubmit.css';

export interface OrderSubmitProps {
  /** Whether the terms are accepted (controlled). */
  accepted: boolean;
  onAcceptedChange: (accepted: boolean) => void;
  /** Label of the terms checkbox; may contain links to the ÁSZF and the privacy notice. */
  acceptLabel?: ReactNode;
  /** Error under the checkbox, e.g. when submitting without accepting. */
  error?: ReactNode;
  /** The small print above the button; by default what sending the order means and that the price may change. */
  terms?: ReactNode;
  /** Button text, "Rendelés elküldése ellenőrzésre" by default. */
  label?: string;
  loading?: boolean;
  onSubmit: () => void;
  className?: string;
}

/**
 * The end of the checkout: accept the terms, read what happens next (no payment obligation yet, the final
 * price comes with the pro forma invoice), and send the order for checking.
 */
export function OrderSubmit({
  accepted,
  onAcceptedChange,
  acceptLabel = 'Elfogadom az ÁSZF-et és az adatkezelési tájékoztatót',
  error,
  terms = `${ORDER_NO_OBLIGATION_NOTICE} ${FINAL_PRICE_NOTICE}`,
  label = ORDER_SUBMIT_LABEL,
  loading = false,
  onSubmit,
  className,
}: OrderSubmitProps) {
  return (
    <div className={cx('sd-submit', className)}>
      <Checkbox label={acceptLabel} checked={accepted} onChange={(e) => onAcceptedChange(e.target.checked)} error={error} required />
      <p className="sd-submit__terms">{terms}</p>
      <Button block loading={loading} onClick={onSubmit}>
        {label}
      </Button>
    </div>
  );
}
