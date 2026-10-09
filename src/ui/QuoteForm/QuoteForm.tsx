import type { FormHTMLAttributes, ReactNode, Ref } from 'react';
import type { QuoteFieldDef, QuoteType } from '@/domain/catalog';
import { COMPANY } from '@/domain/company';
import { EMAILED_SUFFIX, type QuoteFormErrors, type QuoteFormValues, quoteFieldName } from '@/domain/quote-form';
import { isQuoteFieldVisible } from '@/domain/schemas';
import '../base.css';
import { Button } from '../Button/Button';
import { Checkbox } from '../Checkbox/Checkbox';
import { cx } from '../cx';
import { describedBy, Field } from '../Field/Field';
import { Notice } from '../Notice/Notice';
import '../SegmentedChoice/SegmentedChoice.css';
import { TextField } from '../TextField/TextField';
import { UnitField } from '../UnitField/UnitField';
import './QuoteForm.css';

/** The wizard's steps, in order. */
export const QUOTE_STEPS = ['Részletek', 'Helyszín és határidő', 'Kapcsolat'] as const;

const COMMON_LABELS: Readonly<Record<string, string>> = {
  location: 'Helyszín',
  deadline: 'Határidő',
  name: 'Név',
  email: 'E-mail',
  phone: 'Telefonszám',
  company: 'Cégnév',
};

/** The id of a form field's control, for labels and the error summary: "f_anyag" → "ak-anyag", "email" → "ak-email". */
export const quoteFieldDomId = (fieldName: string): string => `ak-${fieldName.replace(/^f_/, '')}`;

export interface QuoteFormProps extends Omit<FormHTMLAttributes<HTMLFormElement>, 'children' | 'method'> {
  /** The job type, from the catalog (QUOTE_TYPES): its questions make the first step. */
  type: QuoteType;
  /** One-time token (a UUID) that makes a second submit of the same form harmless. */
  token: string;
  /** Where the form was placed, for measuring, e.g. "/ajanlatkeres/ceger". */
  source?: string;
  /** What the visitor typed, by form field name, after an error. */
  values?: QuoteFormValues;
  /** One message per form field name. */
  errors?: QuoteFormErrors;
  /** A message about the whole form, e.g. that it could not be saved. */
  formError?: string;
  /** Today in Budapest (YYYY-MM-DD): the earliest date the date fields offer. */
  today: string;
  /** Wizard mode (the island): show only this step. Without it every step shows (no JavaScript). */
  step?: number | null;
  /** The answers so far (the island): fields whose condition is not met are hidden. Without it they show with their condition. */
  answers?: Readonly<Record<string, unknown>>;
  /** The island's Back and Next buttons, shown in wizard mode. */
  navigation?: ReactNode;
  ref?: Ref<HTMLFormElement>;
}

const textOf = (values: QuoteFormValues, name: string): string | undefined => {
  const value = values[name];
  return typeof value === 'string' ? value : undefined;
};
const listOf = (values: QuoteFormValues, name: string): readonly string[] => {
  const value = values[name];
  return Array.isArray(value) ? value : typeof value === 'string' ? [value] : [];
};

function conditionHint(type: QuoteType, def: QuoteFieldDef): string | undefined {
  if (!def.visibleWhen) return undefined;
  const controller = type.fields.find((f) => f.id === def.visibleWhen?.field);
  if (!controller) return undefined;
  const labels = def.visibleWhen.equals.map((v) => ('options' in controller ? controller.options.find((o) => o.value === v)?.label : v) ?? v);
  return `Csak akkor töltse ki, ha erre: „${controller.label}” a válasza: ${labels.join(' vagy ')}.`;
}

function TypeField({ type, def, values, errors, today, answers }: {
  type: QuoteType;
  def: QuoteFieldDef;
  values: QuoteFormValues;
  errors: QuoteFormErrors;
  today: string;
  answers?: Readonly<Record<string, unknown>>;
}) {
  const name = quoteFieldName(def.id);
  const id = quoteFieldDomId(name);
  const error = errors[name];
  const label = def.required || def.type === 'file' ? def.label : `${def.label} (nem kötelező)`;
  const visible = answers ? isQuoteFieldVisible(def, answers) : true;
  const hint = answers ? undefined : conditionHint(type, def);
  const help = [def.help, hint].filter(Boolean).join(' ') || undefined;
  let control: ReactNode;
  switch (def.type) {
    case 'text':
    case 'textarea':
      control = (
        <TextField
          id={id}
          name={name}
          label={label}
          required={def.required}
          maxLength={def.maxLength}
          placeholder={def.placeholder}
          multiline={def.type === 'textarea'}
          defaultValue={textOf(values, name)}
          help={help}
          error={error}
        />
      );
      break;
    case 'number':
      control = def.unit ? (
        <UnitField id={id} name={name} label={label} unit={def.unit} required={def.required} defaultValue={textOf(values, name)} help={help} error={error} />
      ) : (
        <TextField id={id} name={name} label={label} inputMode="decimal" required={def.required} defaultValue={textOf(values, name)} help={help} error={error} />
      );
      break;
    case 'date':
      control = <TextField id={id} name={name} label={label} type="date" min={today} required={def.required} defaultValue={textOf(values, name)} help={help} error={error} />;
      break;
    case 'select':
      if (def.options.length <= 4) {
        control = (
          <fieldset className="sd-seg sd-quote__choice" id={id} aria-describedby={error ? `${id}-error` : undefined}>
            <legend className="sd-seg__legend">
              {label}
              {def.required && <span className="sd-field__req" aria-hidden="true">*</span>}
            </legend>
            {help && <p className="sd-field__help">{help}</p>}
            <div className="sd-seg__wrap">
              <div className="sd-seg__list">
                {def.options.map((o) => (
                  <div className="sd-seg__item" key={o.value}>
                    <input
                      type="radio"
                      className="sd-vh"
                      id={`${id}-${o.value}`}
                      name={name}
                      value={o.value}
                      required={def.required}
                      defaultChecked={textOf(values, name) === o.value}
                      aria-invalid={error ? true : undefined}
                    />
                    <label className="sd-seg__opt" htmlFor={`${id}-${o.value}`}>
                      <span className="sd-seg__label">{o.label}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
            {error && <p className="sd-field__error" id={`${id}-error`}>{error}</p>}
          </fieldset>
        );
      } else {
        const ids = { id, helpId: `${id}-help`, errorId: `${id}-error` };
        control = (
          <Field label={label} htmlFor={id} help={help} error={error} required={def.required} ids={ids}>
            <select
              id={id}
              name={name}
              className="sd-input sd-quote__select"
              required={def.required}
              defaultValue={textOf(values, name) ?? ''}
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy(ids, help, error)}
            >
              <option value="">Válasszon</option>
              {def.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
        );
      }
      break;
    case 'multiselect':
      control = (
        <fieldset className="sd-quote__multi" id={id} data-required={def.required ? 'true' : undefined}>
          <legend className="sd-field__label">
            {label}
            {def.required && <span className="sd-field__req" aria-hidden="true">*</span>}
          </legend>
          {help && <p className="sd-field__help">{help}</p>}
          {def.options.map((o) => (
            <Checkbox key={o.value} id={`${id}-${o.value}`} name={name} value={o.value} label={o.label} defaultChecked={listOf(values, name).includes(o.value)} />
          ))}
          {error && <p className="sd-field__error" id={`${id}-error`}>{error}</p>}
        </fieldset>
      );
      break;
    case 'file':
      control = (
        <Checkbox
          id={id}
          name={name + EMAILED_SUFFIX}
          label={`${def.label}: e-mailben küldöm`}
          description={`A beküldés után a hivatkozási számmal a ${COMPANY.email} címre. ${hint ?? ''}`.trim()}
          defaultChecked={textOf(values, name + EMAILED_SUFFIX) === 'on'}
          error={error}
        />
      );
      break;
  }
  return (
    <div className="sd-quote__field" data-field={def.id} hidden={!visible}>
      {control}
    </div>
  );
}

/**
 * The quote wizard's form for one job type: its questions, the place and the deadline, then the contact details.
 * A plain HTML form that works without JavaScript (all steps at once); the quote page's island turns it into steps.
 * @category quote
 */
export function QuoteForm({
  type,
  token,
  source,
  values = {},
  errors = {},
  formError,
  today,
  step = null,
  answers,
  navigation,
  ref,
  className,
  ...rest
}: QuoteFormProps) {
  const wizard = step !== null;
  const last = QUOTE_STEPS.length - 1;
  const summary = Object.entries(errors);
  const stepAttrs = (index: number) => ({ 'data-step': String(index), hidden: wizard && step !== index });
  const legend = (index: number) => (
    <legend className="sd-quote__legend" tabIndex={-1}>
      {index + 1}. {QUOTE_STEPS[index]}
    </legend>
  );
  const fieldLabel = (name: string) => COMMON_LABELS[name] ?? type.fields.find((f) => quoteFieldName(f.id) === name)?.label ?? name;
  return (
    <form ref={ref} className={cx('sd-quote', className)} method="post" {...rest}>
      {(formError || summary.length > 0) && (
        <Notice className="sd-quote__summary" tone="error" live="assertive" title={formError ?? 'Kérjük, javítsa a következőket:'} tabIndex={-1} autoFocus>
          {summary.length > 0 && (
            <ul>
              {summary.map(([name, message]) => (
                <li key={name}>
                  <a href={`#${quoteFieldDomId(name)}`}>{message}</a>
                  <span className="sd-vh"> ({fieldLabel(name)})</span>
                </li>
              ))}
            </ul>
          )}
        </Notice>
      )}
      <input type="hidden" name="token" value={token} />
      {source && <input type="hidden" name="source" value={source} />}

      <fieldset className="sd-quote__step" {...stepAttrs(0)}>
        {legend(0)}
        {type.requireOneOf?.map((group) => (
          <p className="sd-quote__note" key={group.fields.join()}>
            {group.message}
          </p>
        ))}
        {type.fields.map((def) => (
          <TypeField key={def.id} type={type} def={def} values={values} errors={errors} today={today} answers={answers} />
        ))}
      </fieldset>

      <fieldset className="sd-quote__step" {...stepAttrs(1)}>
        {legend(1)}
        <TextField
          id={quoteFieldDomId('location')}
          name="location"
          label={type.locationRequired ? (type.locationLabel ?? 'A munka helyszíne') : `${type.locationLabel ?? 'Helyszín'} (nem kötelező)`}
          required={type.locationRequired}
          autoComplete="street-address"
          maxLength={300}
          defaultValue={textOf(values, 'location')}
          help="Cím, ahol a munka készül, illetve ahol felszereljük."
          error={errors.location}
        />
        <TextField
          id={quoteFieldDomId('deadline')}
          name="deadline"
          label="Mikorra van szüksége rá?"
          type="date"
          min={today}
          required
          defaultValue={textOf(values, 'deadline')}
          help="Ha nincs pontos határidő, a legkésőbbi napot adja meg."
          error={errors.deadline}
        />
      </fieldset>

      <fieldset className="sd-quote__step" {...stepAttrs(2)}>
        {legend(2)}
        <TextField id={quoteFieldDomId('name')} name="name" label="Név" required autoComplete="name" maxLength={100} defaultValue={textOf(values, 'name')} error={errors.name} />
        <TextField id={quoteFieldDomId('email')} name="email" label="E-mail" type="email" required autoComplete="email" maxLength={254} defaultValue={textOf(values, 'email')} help="Ide küldjük az árajánlatot." error={errors.email} />
        <TextField id={quoteFieldDomId('phone')} name="phone" label="Telefonszám" type="tel" inputMode="tel" required autoComplete="tel" maxLength={30} defaultValue={textOf(values, 'phone')} help="Ezen hívjuk vissza." error={errors.phone} />
        <TextField id={quoteFieldDomId('company')} name="company" label="Cégnév (nem kötelező)" autoComplete="organization" maxLength={150} defaultValue={textOf(values, 'company')} error={errors.company} />
        <Checkbox
          id={quoteFieldDomId('surveyRequested')}
          name="surveyRequested"
          label="Helyszíni felmérést kérek"
          description="Az időpontot telefonon egyeztetjük."
          defaultChecked={textOf(values, 'surveyRequested') === 'on'}
          error={errors.surveyRequested}
        />
      </fieldset>

      <div className="sd-quote__trap" aria-hidden="true">
        <label htmlFor="ak-honlap">Ezt a mezőt hagyja üresen</label>
        <input id="ak-honlap" name="honlap" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {wizard && <div className="sd-quote__nav">{navigation}</div>}
      {(!wizard || step === last) && (
        <div className="sd-quote__send">
          <Button type="submit">Ajánlatkérés elküldése</Button>
          <p className="sd-quote__privacy">
            A beküldés nem jár kötelezettséggel. Az adatait csak az ajánlathoz használjuk.{' '}
            <a href="/adatkezeles">Adatkezelési tájékoztató</a>
          </p>
        </div>
      )}
    </form>
  );
}
