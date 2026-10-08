// One POST of the callback form: trap field, rate limit, the shared schema, saving. Works for plain HTML forms:
// on success the page redirects (Post/Redirect/Get), otherwise it renders the form again with this result.
import { COMPANY } from '@/domain/company';
import { formatReference } from '@/domain/reference';
import {
  CALLBACK_FORM_FIELDS,
  CallbackRequestSchema,
  type CallbackFormErrors,
  type CallbackFormValues,
  formSource,
} from '@/domain/schemas';
import type { CallbackStore } from './store';

/** A field people never see; bots fill it in. */
export const HONEYPOT_FIELD = 'honlap';
export const THANKS_PATH = '/visszahivas/koszonjuk';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TOO_MANY = `Túl sok kérés érkezett erről a címről. Kérjük, próbálja újra egy perc múlva, vagy hívjon: ${COMPANY.phone.display}.`;
const SAVE_FAILED = `Most nem sikerült elküldeni. Kérjük, próbálja újra, vagy hívjon: ${COMPANY.phone.display}.`;

export type AcceptedCallback = { kind: 'accepted'; location: string; id: number | null };
export type RejectedCallback = {
  kind: 'rejected';
  status: 400 | 429 | 503;
  values: CallbackFormValues;
  errors: CallbackFormErrors;
  formError?: string;
  token: string;
  source?: string;
};
export type CallbackSubmission = AcceptedCallback | RejectedCallback;

export interface SubmitDeps {
  store: CallbackStore;
  /** False when this visitor sent too many requests (the rate limiter). */
  allow: () => Promise<boolean>;
  now: () => Date;
  newToken: () => string;
}

export async function submitCallback(form: FormData, deps: SubmitDeps): Promise<CallbackSubmission> {
  const text = (key: string) => {
    const value = form.get(key);
    return typeof value === 'string' ? value : undefined;
  };
  const values: CallbackFormValues = Object.fromEntries(CALLBACK_FORM_FIELDS.map((field) => [field, text(field) ?? '']));
  const tokenInput = text('token');
  const token = tokenInput && UUID.test(tokenInput) ? tokenInput : deps.newToken();
  const source = formSource(text('source'));
  const rejected = (status: RejectedCallback['status'], errors: CallbackFormErrors, formError?: string): RejectedCallback => ({
    kind: 'rejected',
    status,
    values,
    errors,
    ...(formError ? { formError } : {}),
    token,
    ...(source ? { source } : {}),
  });

  if (text(HONEYPOT_FIELD)) return { kind: 'accepted', location: THANKS_PATH, id: null };
  if (!(await deps.allow())) return rejected(429, {}, TOO_MANY);

  const parsed = CallbackRequestSchema.safeParse({ ...values, source });
  if (!parsed.success) {
    const errors: CallbackFormErrors = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === 'string' && (CALLBACK_FORM_FIELDS as readonly string[]).includes(field)) {
        errors[field as keyof CallbackFormErrors] ??= issue.message;
      }
    }
    return rejected(400, errors);
  }

  let id: number;
  try {
    id = await deps.store.insert({ ...parsed.data, formToken: token, createdAt: deps.now().toISOString() });
  } catch (error) {
    console.error('A visszahívás-kérés mentése nem sikerült:', error);
    return rejected(503, {}, SAVE_FAILED);
  }
  return { kind: 'accepted', location: `${THANKS_PATH}?szam=${formatReference('VH', id)}`, id };
}

/** Asks the rate limiter about this visitor; lets the request through when there is no limiter or it fails. */
export async function limiterAllows(limiter: Pick<RateLimit, 'limit'> | undefined, key: string): Promise<boolean> {
  if (!limiter) return true;
  try {
    return (await limiter.limit({ key })).success;
  } catch (error) {
    console.error('A beküldési korlát nem elérhető:', error);
    return true;
  }
}
