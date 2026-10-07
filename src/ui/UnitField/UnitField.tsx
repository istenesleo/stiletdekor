import type { CSSProperties, InputHTMLAttributes, ReactNode } from 'react';
import '../base.css';
import { describedBy, Field, useFieldIds } from '../Field/Field';
import './UnitField.css';

export interface UnitFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'children' | 'className'> {
  label: ReactNode;
  /** Unit printed inside the field, e.g. "cm", "db", "mm". */
  unit: string;
  help?: ReactNode;
  error?: ReactNode;
  className?: string;
}

/**
 * Number input with its unit inside the field: sizes in cm, quantities in db.
 * A text input with a decimal keyboard, so "29,7" can be typed; parse the value yourself (comma or dot).
 * @category forms
 */
export function UnitField({ label, unit, help, error, required, id, className, style, ...rest }: UnitFieldProps) {
  const ids = useFieldIds(id);
  return (
    <Field label={label} htmlFor={ids.id} help={help} error={error} required={required} ids={ids} className={className}>
      <div className="sd-unit" style={{ '--sd-unit-w': `${Math.max(unit.length, 2)}ch`, ...style } as CSSProperties}>
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          id={ids.id}
          className="sd-input"
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(ids, help, error)}
          {...rest}
        />
        <span className="sd-unit__suffix" aria-hidden="true">
          {unit}
        </span>
      </div>
    </Field>
  );
}
