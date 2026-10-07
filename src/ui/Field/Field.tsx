import { type HTMLAttributes, type ReactNode, useId } from 'react';
import '../base.css';
import { cx } from '../cx';
import { Icon } from '../Icon/Icon';
import './Field.css';

/** Ids a form control needs to connect to its label, help text and error message. */
export interface FieldIds {
  id: string;
  helpId: string;
  errorId: string;
}

/** Stable ids for a field; pass `id` to choose the control's id yourself. */
export function useFieldIds(id?: string): FieldIds {
  const auto = useId();
  const base = id ?? `sd${auto.replace(/:/g, '')}`;
  return { id: base, helpId: `${base}-help`, errorId: `${base}-error` };
}

/** The aria-describedby value for a control: its help and error, when present. */
export function describedBy(ids: FieldIds, help?: ReactNode, error?: ReactNode): string | undefined {
  const parts = [help ? ids.helpId : '', error ? ids.errorId : ''].filter(Boolean);
  return parts.length ? parts.join(' ') : undefined;
}

export interface FieldProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** The control's label. */
  label: ReactNode;
  /** Id of the control the label belongs to. */
  htmlFor: string;
  /** Short hint under the control, e.g. "Erre a számra küldjük az egyeztetést.". */
  help?: ReactNode;
  /** Error under the control; shown in the error color with an icon. */
  error?: ReactNode;
  /** Adds the brand-colored "*" after the label (the control itself should be `required`). */
  required?: boolean;
  ids: FieldIds;
  children: ReactNode;
}

/**
 * Label, control, help text and error in the library's layout, for wrapping a custom control.
 * TextField and the other inputs use it. To wrap your own control, get ids with useFieldIds and pass
 * describedBy(...) to the control.
 * @category forms
 */
export function Field({ label, htmlFor, help, error, required, ids, className, children, ...rest }: FieldProps) {
  return (
    <div className={cx('sd-field', className)} {...rest}>
      <label className="sd-field__label" htmlFor={htmlFor}>
        {label}
        {required && (
          <span className="sd-field__req" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {help && (
        <p className="sd-field__help" id={ids.helpId}>
          {help}
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
