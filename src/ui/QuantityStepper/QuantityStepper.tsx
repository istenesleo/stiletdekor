import { type KeyboardEvent, type ReactNode, useEffect, useState } from 'react';
import '../base.css';
import { describedBy, Field, useFieldIds } from '../Field/Field';
import { Icon } from '../Icon/Icon';
import './QuantityStepper.css';

export interface QuantityStepperProps {
  /** Current quantity. */
  value: number;
  onChange: (value: number) => void;
  /** Smallest allowed quantity, 1 by default. */
  min?: number;
  /** Largest allowed quantity. */
  max?: number;
  /** Label above the control, "Darabszám" by default. */
  label?: ReactNode;
  /** E.g. "2–4 db: −5% · 5–9 db: −10% · 10 db-tól: −15%". */
  help?: ReactNode;
  error?: ReactNode;
  disabled?: boolean;
  id?: string;
  className?: string;
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/**
 * Quantity with minus and plus buttons and a field for typing.
 * Arrow keys step by one; the value is clamped to min…max when the field loses focus.
 * @category forms
 */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 9999,
  label = 'Darabszám',
  help,
  error,
  disabled = false,
  id,
  className,
}: QuantityStepperProps) {
  const ids = useFieldIds(id);
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);

  const commit = (n: number) => {
    const next = clamp(Number.isFinite(n) ? Math.round(n) : value, min, max);
    setDraft(String(next));
    if (next !== value) onChange(next);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      commit(value + (e.key === 'ArrowUp' ? 1 : -1));
    } else if (e.key === 'Enter') {
      commit(Number(draft));
    }
  };

  return (
    <Field label={label} htmlFor={ids.id} help={help} error={error} ids={ids} className={className}>
      <div className="sd-qty">
        <button
          type="button"
          className="sd-qty__btn"
          aria-label="Eggyel kevesebb"
          aria-controls={ids.id}
          disabled={disabled || value <= min}
          onClick={() => commit(value - 1)}
        >
          <Icon name="minus" />
        </button>
        <input
          id={ids.id}
          className="sd-input"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          value={draft}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(ids, help, error)}
          onChange={(e) => setDraft(e.target.value.replace(/\D/g, ''))}
          onBlur={() => commit(Number(draft))}
          onKeyDown={onKeyDown}
        />
        <button
          type="button"
          className="sd-qty__btn"
          aria-label="Eggyel több"
          aria-controls={ids.id}
          disabled={disabled || value >= max}
          onClick={() => commit(value + 1)}
        >
          <Icon name="plus" />
        </button>
      </div>
    </Field>
  );
}
