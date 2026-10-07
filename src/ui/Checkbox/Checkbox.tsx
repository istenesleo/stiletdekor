import type { InputHTMLAttributes, ReactNode } from 'react';
import '../base.css';
import { cx } from '../cx';
import { describedBy, useFieldIds } from '../Field/Field';
import '../Field/Field.css';
import { Icon } from '../Icon/Icon';
import './Checkbox.css';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'children'> {
  /** The statement the visitor agrees to or chooses; may contain a link ("Elfogadom az ÁSZF-et"). */
  label: ReactNode;
  /** A second, quieter line under the label. */
  description?: ReactNode;
  /** Error under the checkbox, e.g. "Az ÁSZF elfogadása nélkül nem küldhető el a rendelés.". */
  error?: ReactNode;
}

/**
 * Checkbox with a label and an optional description, e.g. for accepting the terms.
 * E.g. "Helyszíni felmérést kérek".
 * @category forms
 */
export function Checkbox({ label, description, error, id, className, ...rest }: CheckboxProps) {
  const ids = useFieldIds(id);
  return (
    <div className={cx('sd-checkbox', className)}>
      <label className="sd-checkbox__row" htmlFor={ids.id}>
        <input
          type="checkbox"
          id={ids.id}
          className="sd-vh"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(ids, description, error)}
          {...rest}
        />
        <span className="sd-tick" aria-hidden="true">
          <Icon name="check" />
        </span>
        <span className="sd-checkbox__label">{label}</span>
      </label>
      {description && (
        <p className="sd-checkbox__desc" id={ids.helpId}>
          {description}
        </p>
      )}
      {error && (
        <p className="sd-field__error" id={ids.errorId}>
          <Icon name="error" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
