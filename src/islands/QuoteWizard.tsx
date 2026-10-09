// The quote page's island: the server sends the whole form (it works without JavaScript); after hydration this
// shows one step at a time, checks each step before moving on (the browser's own checks plus the job type's
// rules), hides the fields whose condition is not met, and keeps a draft in the browser until the form is sent.
import { useEffect, useRef, useState } from 'react';
import { EMAILED_SUFFIX, quoteFieldName } from '@/domain/quote-form';
import { validateQuoteFields } from '@/domain/schemas';
import { Button } from '@/ui/Button/Button';
import { Notice } from '@/ui/Notice/Notice';
import { QUOTE_STEPS, QuoteForm, quoteFieldDomId, type QuoteFormProps } from '@/ui/QuoteForm/QuoteForm';
import { Stepper } from '@/ui/Stepper/Stepper';

type WizardProps = Omit<QuoteFormProps, 'step' | 'answers' | 'navigation' | 'ref'>;

const NOT_SAVED = new Set(['token', 'honlap', 'source']);

/**
 * The few things this island uses of an input, select or textarea. (The Workers runtime types redefine Element,
 * so the DOM's HTMLSelectElement does not type-check here; this keeps the browser code typed.)
 */
interface FormControl {
  name: string;
  value: string;
  type?: string;
  checked?: boolean;
  checkValidity(): boolean;
  reportValidity(): boolean;
  closest(selector: string): unknown;
}

function readAnswers(form: HTMLFormElement, type: WizardProps['type']): { answers: Record<string, unknown>; emailed: string[] } {
  const data = new FormData(form);
  const answers: Record<string, unknown> = {};
  const emailed: string[] = [];
  for (const def of type.fields) {
    const name = quoteFieldName(def.id);
    if (def.type === 'file') {
      if (data.get(name + EMAILED_SUFFIX)) emailed.push(def.id);
    } else if (def.type === 'multiselect') {
      answers[def.id] = data.getAll(name);
    } else {
      const raw = data.get(name);
      const text = typeof raw === 'string' ? raw.trim() : '';
      answers[def.id] = def.type === 'number' && text ? Number(text.replace(/\s/g, '').replace(',', '.')) : text;
    }
  }
  return { answers, emailed };
}

function saveDraft(form: HTMLFormElement, key: string) {
  try {
    const entries = [...new FormData(form)].filter(([name, value]) => !NOT_SAVED.has(name) && typeof value === 'string');
    sessionStorage.setItem(key, JSON.stringify(entries));
  } catch {
    // Works without storage too.
  }
}

function restoreDraft(form: HTMLFormElement, key: string) {
  try {
    const entries = JSON.parse(sessionStorage.getItem(key) ?? '[]') as [string, string][];
    const controls = [...form.elements] as unknown as FormControl[];
    for (const [name, value] of entries) {
      for (const el of controls.filter((c) => c.name === name)) {
        if (el.type === 'radio' || el.type === 'checkbox') {
          if (el.value === value) el.checked = true;
        } else {
          el.value = value;
        }
      }
    }
  } catch {
    // Works without storage too.
  }
}

export default function QuoteWizard(props: WizardProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const draftKey = `stilet-ajanlat-${props.type.id}`;
  const serverAnswered = Boolean(props.formError) || Object.keys(props.errors ?? {}).length > 0 || Object.keys(props.values ?? {}).length > 0;
  const [wizard, setWizard] = useState(false);
  const [step, setStep] = useState(0);
  const [reached, setReached] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown> | undefined>(undefined);
  const [stepError, setStepError] = useState<string | null>(null);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    if (!serverAnswered) restoreDraft(form, draftKey);
    setAnswers(readAnswers(form, props.type).answers);
    if (!serverAnswered) setWizard(true);
  }, []);

  useEffect(() => {
    if (wizard) formRef.current?.querySelector<HTMLElement>(`[data-step="${step}"] legend`)?.focus();
  }, [step]);

  const onChange = () => {
    const form = formRef.current;
    if (!form) return;
    setAnswers(readAnswers(form, props.type).answers);
    setStepError(null);
    saveDraft(form, draftKey);
  };

  const stepIsValid = (): boolean => {
    const form = formRef.current;
    const fieldset = form?.querySelector(`[data-step="${step}"]`);
    if (!form || !fieldset) return true;
    const controls = ([...fieldset.querySelectorAll('input, textarea, select')] as unknown as FormControl[]).filter(
      (el) => !el.closest('[hidden]'),
    );
    const invalid = controls.find((el) => !el.checkValidity());
    if (invalid) {
      invalid.reportValidity();
      return false;
    }
    if (step === 0) {
      const { answers: now, emailed } = readAnswers(form, props.type);
      const [issue] = validateQuoteFields(props.type.id, now, { today: props.today, emailedFiles: emailed });
      if (issue) {
        setStepError(issue.message);
        const target = typeof issue.path[0] === 'string' ? form.querySelector<HTMLElement>(`#${quoteFieldDomId(quoteFieldName(issue.path[0]))}`) : null;
        target?.focus();
        return false;
      }
    }
    return true;
  };

  const next = () => {
    if (!stepIsValid()) return;
    const to = Math.min(step + 1, QUOTE_STEPS.length - 1);
    setStep(to);
    setReached((r) => Math.max(r, to));
    setStepError(null);
  };

  const navigation = (
    <>
      {stepError && (
        <Notice tone="error" live="assertive" className="sd-quote__steperror">
          {stepError}
        </Notice>
      )}
      {step > 0 && (
        <Button type="button" variant="secondary" onClick={() => setStep(step - 1)}>
          Vissza
        </Button>
      )}
      {step < QUOTE_STEPS.length - 1 && (
        <Button type="button" onClick={next}>
          Tovább
        </Button>
      )}
    </>
  );

  return (
    <div className="sd-wizard">
      {wizard && <Stepper steps={QUOTE_STEPS} current={step} reached={reached} onStepClick={setStep} />}
      <QuoteForm
        {...props}
        ref={formRef}
        step={wizard ? step : null}
        answers={answers}
        navigation={navigation}
        onChange={onChange}
        onInput={onChange}
        onSubmit={() => {
          try {
            sessionStorage.removeItem(draftKey);
          } catch {
            // Works without storage too.
          }
        }}
      />
    </div>
  );
}
