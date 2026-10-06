import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import { describedBy, Field, useFieldIds } from '../Field/Field';

interface TextFieldOwnProps {
  label: ReactNode;
  help?: ReactNode;
  /** Error message; also marks the input invalid. */
  error?: ReactNode;
  /** Several lines (a textarea), e.g. "Megjegyzés", "Üzenet". */
  multiline?: boolean;
  /** Class for the wrapper (label + control + messages). */
  className?: string;
}

export type TextFieldProps = TextFieldOwnProps &
  Omit<InputHTMLAttributes<HTMLInputElement> & TextareaHTMLAttributes<HTMLTextAreaElement>, 'className' | 'children'>;

/**
 * Labeled text input: name, e-mail, phone, address, or several lines with `multiline`. Give it the right
 * `type` and `autoComplete` (e.g. type="tel" autoComplete="tel") so phones offer the right keyboard.
 */
export function TextField({ label, help, error, multiline = false, required, id, className, ...rest }: TextFieldProps) {
  const ids = useFieldIds(id);
  const control = {
    id: ids.id,
    className: 'sd-input',
    required,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy(ids, help, error),
  };
  return (
    <Field label={label} htmlFor={ids.id} help={help} error={error} required={required} ids={ids} className={className}>
      {multiline ? (
        <textarea rows={4} {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)} {...control} />
      ) : (
        <input type="text" {...(rest as InputHTMLAttributes<HTMLInputElement>)} {...control} />
      )}
    </Field>
  );
}
