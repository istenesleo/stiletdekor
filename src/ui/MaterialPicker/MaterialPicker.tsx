import { type HTMLAttributes, useId } from 'react';
import { formatHuf } from '@/domain/money';
import '../base.css';
import { cx } from '../cx';
import { Icon } from '../Icon/Icon';
import './MaterialPicker.css';

export type MaterialTexture =
  | 'frontlit'
  | 'mesh'
  | 'blockout'
  | 'vinyl'
  | 'perforated'
  | 'paper'
  | 'foam'
  | 'dibond'
  | 'plexi'
  | 'canvas'
  | 'textile';

const UNIT_SUFFIX = { m2: '/m²', db: '/db', fm: '/fm' } as const;

export interface MaterialOption {
  id: string;
  /** E.g. "Frontlit molinó 440 g/m²". */
  name: string;
  /** Gross price in forints for one `unit`. */
  price: number;
  /** m2 (default), db or fm. */
  unit?: keyof typeof UNIT_SUFFIX;
  /** Data sheet rows, e.g. ["Felhasználás", "kül- és beltér"], ["Élettartam", "≈ 2–3 év*"]. */
  specs?: ReadonlyArray<readonly [string, string]>;
  /** Swatch drawn on the card; plain light swatch without it. */
  texture?: MaterialTexture;
  disabled?: boolean;
}

export interface MaterialPickerProps extends Omit<HTMLAttributes<HTMLFieldSetElement>, 'onChange'> {
  /** "Anyag" by default. */
  legend?: string;
  materials: readonly MaterialOption[];
  /** Selected material's id. */
  value?: string;
  onChange: (id: string) => void;
  name?: string;
}

/**
 * Material choice as cards: swatch, name, gross price per m², and a small data sheet (weight, indoor or
 * outdoor, expected lifetime). One card is selected at a time.
 */
export function MaterialPicker({ legend = 'Anyag', materials, value, onChange, name, className, ...rest }: MaterialPickerProps) {
  const auto = useId();
  const group = name ?? `sd-mats${auto.replace(/:/g, '')}`;
  return (
    <fieldset className={cx('sd-mats', className)} {...rest}>
      <legend className="sd-mats__legend sd-caps">{legend}</legend>
      <div className="sd-mats__grid">
        {materials.map((m) => {
          const id = `${group}-${m.id}`;
          const hasSpecs = m.specs !== undefined && m.specs.length > 0;
          return (
            <div className="sd-mat" key={m.id}>
              <input
                type="radio"
                className="sd-vh"
                id={id}
                name={group}
                value={m.id}
                checked={m.id === value}
                disabled={m.disabled}
                aria-describedby={hasSpecs ? `${id}-specs` : undefined}
                onChange={() => onChange(m.id)}
              />
              <label className="sd-mat__main" htmlFor={id}>
                <span className={cx('sd-swatch', m.texture && `sd-swatch--${m.texture}`)} aria-hidden="true" />
                <span className="sd-mat__head">
                  <span className="sd-mat__name">{m.name}</span>{' '}
                  <span className="sd-mat__price">
                    {formatHuf(m.price)}
                    {UNIT_SUFFIX[m.unit ?? 'm2']}
                  </span>
                </span>
              </label>
              {hasSpecs && (
                <dl className="sd-mat__specs" id={`${id}-specs`}>
                  {m.specs!.map(([k, v]) => (
                    <div key={k}>
                      <dt>{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <span className="sd-mat__check" aria-hidden="true">
                <Icon name="check" />
              </span>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
