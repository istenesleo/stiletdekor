import { type HTMLAttributes, type ReactNode, useId } from 'react';
import '../base.css';
import { cx } from '../cx';
import { Icon } from '../Icon/Icon';
import { IconButton } from '../IconButton/IconButton';
import { UnitField } from '../UnitField/UnitField';
import './SizeFields.css';

export interface SizeFieldsProps extends Omit<HTMLAttributes<HTMLFieldSetElement>, 'onChange'> {
  /** Current width and height as typed (strings, so "29,7" and an empty field stay as they are). */
  width: string;
  height: string;
  onWidthChange: (value: string) => void;
  onHeightChange: (value: string) => void;
  /** Swaps width and height (portrait ↔ landscape). The button is hidden without it. */
  onSwap?: () => void;
  /** Unit of both fields; "cm" by default. */
  unit?: string;
  /** Group caption, "Méret" by default. */
  legend?: string;
  /** Shows "A méret a fájlból": the sizes were read from the uploaded file. */
  fromFile?: boolean;
  /** Error for the pair, e.g. "A szélesség 10 és 500 cm között lehet.". */
  error?: ReactNode;
  disabled?: boolean;
}

/**
 * Width and height fields with a swap button between them, as in the configurator.
 * @category forms
 */
export function SizeFields({
  width,
  height,
  onWidthChange,
  onHeightChange,
  onSwap,
  unit = 'cm',
  legend = 'Méret',
  fromFile = false,
  error,
  disabled,
  className,
  ...rest
}: SizeFieldsProps) {
  const errorId = `sd${useId().replace(/:/g, '')}-error`;
  const invalid = error ? { 'aria-invalid': true, 'aria-describedby': errorId } : {};
  return (
    <fieldset className={cx('sd-size', className)} disabled={disabled} {...rest}>
      <legend className="sd-size__legend sd-caps">{legend}</legend>
      <div className="sd-size__row">
        <UnitField
          label="Szélesség"
          unit={unit}
          value={width}
          onChange={(e) => onWidthChange(e.target.value)}
          {...invalid}
        />
        {onSwap ? (
          <IconButton className="sd-size__swap" icon="swap" label="Szélesség és magasság cseréje" size="sm" onClick={onSwap} />
        ) : (
          <span aria-hidden="true" className="sd-size__swap">
            ×
          </span>
        )}
        <UnitField
          label="Magasság"
          unit={unit}
          value={height}
          onChange={(e) => onHeightChange(e.target.value)}
          {...invalid}
        />
      </div>
      {fromFile && (
        <p className="sd-size__from-file">
          <Icon name="check" />A méret a fájlból
        </p>
      )}
      {error && (
        <p className="sd-field__error sd-size__error" id={errorId} role="alert">
          <Icon name="error" />
          <span>{error}</span>
        </p>
      )}
    </fieldset>
  );
}
