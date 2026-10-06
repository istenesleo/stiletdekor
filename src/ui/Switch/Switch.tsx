import type { InputHTMLAttributes, ReactNode } from 'react';
import '../base.css';
import { cx } from '../cx';
import { useFieldIds } from '../Field/Field';
import './Switch.css';

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'role' | 'children'> {
  /** What the switch turns on, e.g. "Expressz gyártás". */
  label: ReactNode;
  /** The consequence, e.g. "1 munkanap, +30%". */
  description?: ReactNode;
}

/** On/off switch for an option that changes the result immediately: "Expressz (+30%)". */
export function Switch({ label, description, id, className, ...rest }: SwitchProps) {
  const ids = useFieldIds(id);
  return (
    <div className={cx('sd-switch', className)}>
      <label className="sd-switch__row" htmlFor={ids.id}>
        <input
          type="checkbox"
          role="switch"
          id={ids.id}
          className="sd-vh"
          aria-describedby={description ? ids.helpId : undefined}
          {...rest}
        />
        <span className="sd-switch__track" aria-hidden="true">
          <span className="sd-switch__thumb" />
        </span>
        <span className="sd-switch__label">{label}</span>
      </label>
      {description && (
        <p className="sd-switch__desc" id={ids.helpId}>
          {description}
        </p>
      )}
    </div>
  );
}
