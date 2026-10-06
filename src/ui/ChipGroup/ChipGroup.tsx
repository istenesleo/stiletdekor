import { type HTMLAttributes, useId } from 'react';
import '../base.css';
import { cx } from '../cx';
import './ChipGroup.css';

export interface ChipOption {
  value: string;
  /** Text on the chip, e.g. "A3", "60×40", "200×100 cm". */
  label: string;
  disabled?: boolean;
}

export interface ChipGroupProps extends Omit<HTMLAttributes<HTMLFieldSetElement>, 'onChange'> {
  /** Caption of the group, e.g. "Gyakori méretek". */
  legend: string;
  options: readonly ChipOption[];
  /** The selected option's value; none selected when it matches no option (e.g. a custom size). */
  value?: string;
  onChange: (value: string) => void;
  /** Radio group name; generated when omitted. */
  name?: string;
}

/** One-click choices as chips, one selectable at a time: common sizes (size presets), filters. */
export function ChipGroup({ legend, options, value, onChange, name, className, ...rest }: ChipGroupProps) {
  const auto = useId();
  const group = name ?? `sd-chips${auto.replace(/:/g, '')}`;
  return (
    <fieldset className={cx('sd-chips', className)} {...rest}>
      <legend className="sd-chips__legend sd-caps">{legend}</legend>
      <div className="sd-chips__list">
        {options.map((o) => {
          const id = `${group}-${o.value}`;
          return (
            <span key={o.value}>
              <input
                type="radio"
                className="sd-vh"
                id={id}
                name={group}
                value={o.value}
                checked={o.value === value}
                disabled={o.disabled}
                onChange={() => onChange(o.value)}
              />
              <label className="sd-chip" htmlFor={id}>
                {o.label}
              </label>
            </span>
          );
        })}
      </div>
    </fieldset>
  );
}
