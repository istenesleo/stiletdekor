import type { FormHTMLAttributes } from 'react';
import {
  CALLBACK_FORM_FIELDS,
  CALLBACK_JOB_TYPE_IDS,
  type CallbackFormErrors,
  type CallbackFormValues,
  callbackJobTypeName,
  MAX_CALLBACK_MESSAGE_LENGTH,
} from '@/domain/schemas';
import '../base.css';
import { Button } from '../Button/Button';
import { cx } from '../cx';
import { describedBy, Field } from '../Field/Field';
import { CALLBACK_HREF } from '../navigation';
import { Notice } from '../Notice/Notice';
import { TextField } from '../TextField/TextField';
import './CallbackForm.css';

export interface CallbackFormProps extends Omit<FormHTMLAttributes<HTMLFormElement>, 'children' | 'method'> {
  /** One-time token (a UUID) that makes a second submit of the same form harmless. */
  token: string;
  /** Where the form was placed, for measuring, e.g. "/kapcsolat#visszahivas". */
  source?: string;
  /** What the visitor typed, after an error. */
  values?: CallbackFormValues;
  /** One message per field. */
  errors?: CallbackFormErrors;
  /** A message about the whole form, e.g. that it could not be saved. */
  formError?: string;
  /** Prefix of the field ids ("vh" by default), so two forms can share a page. */
  idPrefix?: string;
}

const LABELS: Record<(typeof CALLBACK_FORM_FIELDS)[number], string> = {
  name: 'Név',
  phone: 'Telefonszám',
  jobType: 'Munka típusa (nem kötelező)',
  message: 'Röviden, miről van szó (nem kötelező)',
};

/**
 * Short callback request form: name and phone, optionally the kind of job and one sentence.
 * A plain HTML form that works without JavaScript; posts to /visszahivas, which redirects to the thank-you page.
 * @category forms
 */
export function CallbackForm({
  token,
  source,
  values = {},
  errors = {},
  formError,
  idPrefix = 'vh',
  action = CALLBACK_HREF,
  className,
  ...rest
}: CallbackFormProps) {
  const id = (field: string) => `${idPrefix}-${field}`;
  const fieldErrors = CALLBACK_FORM_FIELDS.filter((field) => errors[field]);
  const jobTypeIds = { id: id('jobType'), helpId: `${id('jobType')}-help`, errorId: `${id('jobType')}-error` };
  return (
    <form className={cx('sd-callback', className)} method="post" action={action} {...rest}>
      {(formError || fieldErrors.length > 0) && (
        <Notice className="sd-callback__summary" tone="error" live="assertive" title={formError ?? 'Kérjük, javítsa a következőket:'} tabIndex={-1} autoFocus>
          {fieldErrors.length > 0 && (
            <ul>
              {fieldErrors.map((field) => (
                <li key={field}>
                  <a href={`#${id(field)}`}>{errors[field]}</a>
                </li>
              ))}
            </ul>
          )}
        </Notice>
      )}
      <input type="hidden" name="token" value={token} />
      {source && <input type="hidden" name="source" value={source} />}
      <TextField
        id={id('name')}
        name="name"
        label={LABELS.name}
        required
        autoComplete="name"
        maxLength={100}
        defaultValue={values.name}
        error={errors.name}
      />
      <TextField
        id={id('phone')}
        name="phone"
        label={LABELS.phone}
        type="tel"
        inputMode="tel"
        required
        autoComplete="tel"
        maxLength={30}
        defaultValue={values.phone}
        error={errors.phone}
        help="Erre a számra hívjuk vissza."
      />
      <Field label={LABELS.jobType} htmlFor={jobTypeIds.id} error={errors.jobType} ids={jobTypeIds}>
        <select
          id={jobTypeIds.id}
          name="jobType"
          className="sd-input sd-callback__select"
          defaultValue={values.jobType ?? ''}
          aria-invalid={errors.jobType ? true : undefined}
          aria-describedby={describedBy(jobTypeIds, undefined, errors.jobType)}
        >
          <option value="">Válasszon, ha tudja</option>
          {CALLBACK_JOB_TYPE_IDS.map((jobType) => (
            <option key={jobType} value={jobType}>
              {callbackJobTypeName(jobType)}
            </option>
          ))}
        </select>
      </Field>
      <TextField
        id={id('message')}
        name="message"
        label={LABELS.message}
        maxLength={MAX_CALLBACK_MESSAGE_LENGTH}
        defaultValue={values.message}
        error={errors.message}
      />
      <div className="sd-callback__trap" aria-hidden="true">
        <label htmlFor={id('honlap')}>Ezt a mezőt hagyja üresen</label>
        <input id={id('honlap')} name="honlap" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="sd-callback__send">
        <Button type="submit">Visszahívást kérek</Button>
        <p className="sd-callback__privacy">
          Az adatait csak a visszahíváshoz használjuk. <a href="/adatkezeles">Adatkezelési tájékoztató</a>
        </p>
      </div>
    </form>
  );
}
