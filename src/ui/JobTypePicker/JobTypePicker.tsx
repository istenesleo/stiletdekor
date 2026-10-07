import { type HTMLAttributes, useId } from 'react';
import '../base.css';
import { cx } from '../cx';
import './JobTypePicker.css';
import { JOB_PICTOGRAMS, type JobPictogram } from './pictograms';

export interface JobTypeOption {
  /** Quote type id from the domain, e.g. "autofoliazas", "kirakat". Also picks the pictogram. */
  id: string;
  name: string;
  /** What we will ask about, e.g. "jármű, darabszám, mérték". */
  hint?: string;
}

export interface JobTypePickerProps extends Omit<HTMLAttributes<HTMLFieldSetElement>, 'onChange'> {
  types: readonly JobTypeOption[];
  value?: string;
  onChange: (id: string) => void;
  /** The question, "Milyen munkáról van szó?" by default. */
  legend?: string;
  name?: string;
}

const pictogramFor = (id: string) => (id in JOB_PICTOGRAMS ? JOB_PICTOGRAMS[id as JobPictogram] : JOB_PICTOGRAMS.egyeb);

/**
 * First step of the quote wizard: the nine custom job types as selectable cards with pictograms.
 * @category quote
 */
export function JobTypePicker({ types, value, onChange, legend = 'Milyen munkáról van szó?', name, className, ...rest }: JobTypePickerProps) {
  const auto = useId();
  const group = name ?? `sd-jobs${auto.replace(/:/g, '')}`;
  return (
    <fieldset className={cx('sd-jobs', className)} {...rest}>
      <legend className="sd-jobs__legend">{legend}</legend>
      <div className="sd-jobs__grid">
        {types.map((t) => {
          const id = `${group}-${t.id}`;
          return (
            <div key={t.id}>
              <input type="radio" className="sd-vh" id={id} name={group} value={t.id} checked={t.id === value} onChange={() => onChange(t.id)} />
              <label className="sd-job" htmlFor={id}>
                <svg className="sd-job__pict" viewBox="0 0 48 36" aria-hidden="true" dangerouslySetInnerHTML={{ __html: pictogramFor(t.id) }} />
                <span className="sd-job__name">{t.name}</span>{' '}
                {t.hint && <span className="sd-job__hint">{t.hint}</span>}
              </label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
