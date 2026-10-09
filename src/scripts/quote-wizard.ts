// The quote page's script. The server sends the whole form (src/ui/QuoteForm), which works without JavaScript;
// this turns it into steps: one step at a time with Back and Next, each step checked before moving on (the
// browser's own checks, required multiple choices and the job type's "one of" rules), conditional fields shown
// only when their answer is chosen, and a draft kept in the browser until the form is sent. No framework: a few
// kilobytes instead of a React island (docs/superpowers/specs/2026-10-08-weboldal-mukodesi-elvek-design.md, 5.).

import { QUOTE_FIELD_PREFIX } from '@/domain/quote-form';

/**
 * The few things this script uses of an input, select or textarea. (The Workers runtime types redefine Element,
 * so the DOM's form control types do not type-check in this project; this keeps the browser code typed.)
 */
interface Control {
  name: string;
  value: string;
  type?: string;
  checked?: boolean;
  checkValidity(): boolean;
  reportValidity(): boolean;
  closest(selector: string): unknown;
  focus(): void;
}

interface OneOfRule {
  names: string[];
  message: string;
}

const NOT_SAVED = new Set(['token', 'honlap', 'source']);
const CHOOSE = 'Kérjük, válasszon a lehetőségek közül.';

export function initQuoteWizard(form: HTMLFormElement, { draftKey }: { draftKey: string }): void {
  const steps = [...form.querySelectorAll<HTMLElement>('[data-step]')];
  const stepper = form.querySelector<HTMLElement>('[data-wizard-stepper]');
  const nav = form.querySelector<HTMLElement>('[data-wizard-nav]');
  const back = form.querySelector<HTMLElement>('[data-wizard-back]');
  const next = form.querySelector<HTMLElement>('[data-wizard-next]');
  const send = form.querySelector<HTMLElement>('[data-wizard-send]');
  const errorBox = form.querySelector<HTMLElement>('[data-wizard-error]');
  const answered = form.dataset.answered === 'true';
  const controls = () => [...form.elements] as unknown as Control[];
  const shown = (el: Control) => !el.closest('[hidden]');
  const filled = (el: Control) => (el.type === 'checkbox' || el.type === 'radio' ? Boolean(el.checked) : el.value.trim() !== '');

  // Conditional fields: shown only when the controlling answer is one of the listed values.
  const conditional = [...form.querySelectorAll<HTMLElement>('[data-visible-when]')];
  const applyVisibility = () => {
    for (const wrap of conditional) {
      const rule = JSON.parse(wrap.dataset.visibleWhen ?? '{}') as { field?: string; equals?: string[] };
      const chosen = controls()
        .filter((c) => c.name === QUOTE_FIELD_PREFIX + rule.field && filled(c))
        .map((c) => c.value);
      wrap.hidden = !chosen.some((value) => rule.equals?.includes(value));
      wrap.querySelector('[data-condition]')?.setAttribute('hidden', '');
    }
  };

  const saveDraft = () => {
    try {
      const entries = [...new FormData(form)].filter(([name, value]) => !NOT_SAVED.has(name) && typeof value === 'string');
      sessionStorage.setItem(draftKey, JSON.stringify(entries));
    } catch {
      // Works without storage too.
    }
  };
  const restoreDraft = () => {
    try {
      const entries = JSON.parse(sessionStorage.getItem(draftKey) ?? '[]') as [string, string][];
      for (const [name, value] of entries) {
        for (const el of controls().filter((c) => c.name === name)) {
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
  };

  if (!answered) restoreDraft();
  applyVisibility();
  form.addEventListener('change', () => {
    applyVisibility();
    hideError();
    saveDraft();
  });
  form.addEventListener('input', () => {
    hideError();
    saveDraft();
  });
  form.addEventListener('submit', () => {
    try {
      sessionStorage.removeItem(draftKey);
    } catch {
      // Works without storage too.
    }
  });

  // After a server error every step stays visible, so all the messages can be seen at once.
  if (answered || steps.length < 2 || !stepper || !nav || !back || !next || !send) return;

  let step = 0;
  let reached = 0;
  const count = stepper.querySelector('.sd-steps__count');
  const countText = count?.firstChild;
  const now = stepper.querySelector('.sd-steps__now');
  const items = [...stepper.querySelectorAll<HTMLElement>('.sd-steps__item')];

  function hideError() {
    if (errorBox) errorBox.hidden = true;
  }
  const fail = (message: string, focus?: { focus(): void } | null): false => {
    if (errorBox) {
      errorBox.textContent = message;
      errorBox.hidden = false;
    }
    focus?.focus();
    return false;
  };

  const render = (moveFocus: boolean) => {
    steps.forEach((s, i) => {
      s.hidden = i !== step;
    });
    back.hidden = step === 0;
    next.hidden = step === steps.length - 1;
    send.hidden = step !== steps.length - 1;
    items.forEach((item, i) => {
      item.dataset.state = i === step ? 'current' : i <= reached ? 'done' : 'todo';
    });
    if (countText) countText.textContent = (countText.textContent ?? '').replace(/^\d+/, String(step + 1));
    if (now) now.textContent = ` · ${items[step]?.querySelector('.sd-steps__label')?.textContent ?? ''}`;
    if (moveFocus) steps[step]?.querySelector<HTMLElement>('legend')?.focus();
  };

  const stepIsValid = (): boolean => {
    const fieldset = steps[step];
    if (!fieldset) return true;
    const inStep = controls().filter((c) => fieldset.contains(c as unknown as Node) && shown(c));
    const invalid = inStep.find((c) => !c.checkValidity());
    if (invalid) {
      invalid.reportValidity();
      return false;
    }
    for (const group of fieldset.querySelectorAll<HTMLElement>('[data-required="true"]')) {
      if (group.closest('[hidden]')) continue;
      if (!group.querySelector('input:checked')) return fail(CHOOSE, group);
    }
    const rules = JSON.parse(fieldset.dataset.requireOneOf ?? '[]') as OneOfRule[];
    for (const rule of rules) {
      const members = controls().filter((c) => rule.names.includes(c.name) && shown(c));
      if (members.length > 0 && !members.some(filled)) return fail(rule.message, members[0]);
    }
    return true;
  };

  back.addEventListener('click', () => {
    step = Math.max(0, step - 1);
    hideError();
    render(true);
  });
  next.addEventListener('click', () => {
    if (!stepIsValid()) return;
    step = Math.min(steps.length - 1, step + 1);
    reached = Math.max(reached, step);
    hideError();
    render(true);
  });

  stepper.hidden = false;
  nav.hidden = false;
  render(false);
}
