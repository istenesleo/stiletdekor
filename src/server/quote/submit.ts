// One POST of the quote wizard: trap field, rate limit, the shared schema, saving. A plain HTML form works: on
// success the page redirects (Post/Redirect/Get), otherwise it renders the form again with this result.
import type { QuoteTypeId } from '@/domain/catalog';
import { type QuoteFormErrors, type QuoteFormValues, quoteFieldName } from '@/domain/quote-form';
import { formatReference } from '@/domain/reference';
import { createQuoteRequestSchema } from '@/domain/schemas';
import { HONEYPOT_FIELD, isFormToken, SAVE_FAILED_MESSAGE, TOO_MANY_MESSAGE } from '../forms';
import { parseQuoteForm } from './form';
import type { QuoteStore } from './store';

export const QUOTE_THANKS_PATH = '/ajanlatkeres/koszonjuk';

export type AcceptedQuote = { kind: 'accepted'; location: string; id: number | null };
export type RejectedQuote = {
  kind: 'rejected';
  status: 400 | 429 | 503;
  values: QuoteFormValues;
  errors: QuoteFormErrors;
  formError?: string;
  token: string;
  source?: string;
};

export interface SubmitQuoteDeps {
  store: QuoteStore;
  /** False when this visitor sent too many requests (the rate limiter). */
  allow: () => Promise<boolean>;
  now: () => Date;
  newToken: () => string;
}

/** The form field a schema issue belongs to: fields.x → f_x, contact.x → x, the rest by its first key. */
export function formFieldOf(path: readonly PropertyKey[]): string {
  const [head, second] = path;
  if (head === 'fields' && typeof second === 'string') return quoteFieldName(second);
  if (head === 'contact' && typeof second === 'string') return second;
  return typeof head === 'string' ? head : 'form';
}

export async function submitQuote(
  quoteType: QuoteTypeId,
  form: FormData,
  deps: SubmitQuoteDeps,
): Promise<AcceptedQuote | RejectedQuote> {
  const tokenInput = form.get('token');
  const token = isFormToken(tokenInput) ? tokenInput : deps.newToken();
  const { request, values } = parseQuoteForm(quoteType, form);
  const rejected = (status: RejectedQuote['status'], errors: QuoteFormErrors, formError?: string): RejectedQuote => ({
    kind: 'rejected',
    status,
    values,
    errors,
    ...(formError ? { formError } : {}),
    token,
    ...(request.source ? { source: request.source } : {}),
  });

  const trap = form.get(HONEYPOT_FIELD);
  if (typeof trap === 'string' && trap) return { kind: 'accepted', location: QUOTE_THANKS_PATH, id: null };
  if (!(await deps.allow())) return rejected(429, {}, TOO_MANY_MESSAGE);

  const parsed = createQuoteRequestSchema({ now: deps.now }).safeParse({ ...request, uploadIds: [] });
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[formFieldOf(issue.path)] ??= issue.message;
    return rejected(400, errors);
  }

  const q = parsed.data;
  let id: number;
  try {
    id = await deps.store.insert({
      formToken: token,
      quoteType: q.quoteType,
      fields: q.fields,
      emailedFiles: q.emailedFiles,
      location: q.location,
      deadline: q.deadline,
      surveyRequested: q.surveyRequested,
      contact: q.contact,
      source: request.source,
      createdAt: deps.now().toISOString(),
    });
  } catch (error) {
    console.error('Az ajánlatkérés mentése nem sikerült:', error);
    return rejected(503, {}, SAVE_FAILED_MESSAGE);
  }
  const files = q.emailedFiles.length > 0 ? '&fajl=1' : '';
  return { kind: 'accepted', location: `${QUOTE_THANKS_PATH}?szam=${formatReference('AK', id)}${files}`, id };
}
