import type { InputHTMLAttributes, ReactNode } from 'react';
import { formatHuf } from '@/domain/money';
import '../base.css';
import '../Checkbox/Checkbox.css';
import { cx } from '../cx';
import { useFieldIds } from '../Field/Field';
import { Icon } from '../Icon/Icon';
import './OptionRow.css';

export interface OptionRowProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'children'> {
  /** radio (default) for one-of-many groups such as edge finish; checkbox for add-ons such as contour cut. */
  type?: 'radio' | 'checkbox';
  label: ReactNode;
  /** One line about what the option is, e.g. "Megerősített, szegett szél, ringli 50 cm-enként.". */
  description?: ReactNode;
  /** Gross unit price in forints, shown as "+445 Ft/fm". 0 shows "felár nélkül". */
  rate?: number;
  /** Unit of the rate: "fm", "m²", "db". */
  rateUnit?: string;
  /** Gross amount for the current size and quantity, in forints. */
  amount?: number;
}

/** A selectable option with its price preview: the unit rate and what it costs for the chosen size. */
export function OptionRow({
  type = 'radio',
  label,
  description,
  rate,
  rateUnit,
  amount,
  id,
  className,
  ...rest
}: OptionRowProps) {
  const ids = useFieldIds(id);
  const rateText = rate === undefined ? null : rate === 0 ? 'felár nélkül' : `+${formatHuf(rate)}${rateUnit ? `/${rateUnit}` : ''}`;
  return (
    <label className={cx('sd-optrow', className)} htmlFor={ids.id}>
      <input type={type} id={ids.id} className="sd-vh" {...rest} />
      <span className={cx('sd-tick', type === 'radio' && 'sd-tick--radio')} aria-hidden="true">
        {type === 'checkbox' && <Icon name="check" />}
      </span>
      <span className="sd-optrow__text">
        <span className="sd-optrow__label">{label}</span>{' '}
        {description && <span className="sd-optrow__desc">{description}</span>}
      </span>
      {' '}
      {(rateText || amount !== undefined) && (
        <span className="sd-optrow__price">
          {rateText && <span className="sd-optrow__rate">{rateText}</span>}{' '}
          {amount !== undefined && <span className="sd-optrow__amount">{formatHuf(amount)}</span>}
        </span>
      )}
    </label>
  );
}
