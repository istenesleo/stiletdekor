import { type HTMLAttributes, type ReactNode, useId } from 'react';
import '../base.css';
import { cx } from '../cx';
import './SegmentedChoice.css';

export interface SegmentedOption {
  value: string;
  label: ReactNode;
  /** Optional second line, e.g. what the choice does. */
  description?: ReactNode;
  disabled?: boolean;
}

export interface SegmentedChoiceProps extends Omit<HTMLAttributes<HTMLFieldSetElement>, 'onChange'> {
  legend: string;
  options: readonly SegmentedOption[];
  value?: string;
  onChange: (value: string) => void;
  name?: string;
}

/**
 * Two to four mutually exclusive choices side by side, with optional descriptions.
 * E.g. the scale of a file (1:1, 1:10, egyéb), filling or fitting artwork. Stacks one per row when its
 * container is narrow.
 * @category forms
 */
export function SegmentedChoice({ legend, options, value, onChange, name, className, ...rest }: SegmentedChoiceProps) {
  const auto = useId();
  const group = name ?? `sd-seg${auto.replace(/:/g, '')}`;
  const compact = options.every((o) => !o.description);
  return (
    <fieldset className={cx('sd-seg', compact && 'sd-seg--compact', className)} {...rest}>
      <legend className="sd-seg__legend sd-caps">{legend}</legend>
      <div className="sd-seg__wrap">
        <div className="sd-seg__list">
          {options.map((o) => {
            const id = `${group}-${o.value}`;
            return (
              <div className="sd-seg__item" key={o.value}>
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
                <label className="sd-seg__opt" htmlFor={id}>
                  <span className="sd-seg__label">{o.label}</span>{' '}
                  {o.description && <span className="sd-seg__desc">{o.description}</span>}
                </label>
              </div>
            );
          })}
        </div>
      </div>
    </fieldset>
  );
}
