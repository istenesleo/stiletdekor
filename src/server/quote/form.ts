// The quote form as the browser posts it (also without JavaScript): FormData into the input of
// QuoteRequestSchema, keeping what the visitor typed for the form to show again after an error.
import { getQuoteType, type QuoteTypeId } from '@/domain/catalog';
import { parseNumberHu } from '@/domain/money';
import { EMAILED_SUFFIX, quoteFieldName } from '@/domain/quote-form';
import { formSource, type QuoteFieldValue } from '@/domain/schemas';

export { parseNumberHu };

export interface QuoteRequestInput {
  quoteType: QuoteTypeId;
  fields: Record<string, QuoteFieldValue>;
  emailedFiles: string[];
  location: string;
  deadline: string | undefined;
  surveyRequested: boolean;
  contact: { name: string; email: string; phone: string; company: string };
  source: string | undefined;
}

export function parseQuoteForm(
  quoteType: QuoteTypeId,
  form: FormData,
): { request: QuoteRequestInput; values: Record<string, string | string[]> } {
  const type = getQuoteType(quoteType);
  const text = (name: string) => {
    const value = form.get(name);
    return typeof value === 'string' ? value : '';
  };
  const values: Record<string, string | string[]> = {};
  const fields: Record<string, QuoteFieldValue> = {};
  const emailedFiles: string[] = [];
  for (const def of type.fields) {
    const name = quoteFieldName(def.id);
    if (def.type === 'file') {
      if (text(name + EMAILED_SUFFIX)) {
        emailedFiles.push(def.id);
        values[name + EMAILED_SUFFIX] = 'on';
      }
      continue;
    }
    if (def.type === 'multiselect') {
      const chosen = form.getAll(name).filter((v): v is string => typeof v === 'string');
      values[name] = chosen;
      fields[def.id] = chosen;
      continue;
    }
    const raw = text(name);
    values[name] = raw;
    fields[def.id] = def.type === 'number' ? parseNumberHu(raw) : raw;
  }
  for (const name of ['location', 'deadline', 'name', 'email', 'phone', 'company']) values[name] = text(name);
  const surveyRequested = Boolean(text('surveyRequested'));
  if (surveyRequested) values.surveyRequested = 'on';
  return {
    request: {
      quoteType,
      fields,
      emailedFiles,
      location: text('location'),
      deadline: text('deadline') || undefined,
      surveyRequested,
      contact: { name: text('name'), email: text('email'), phone: text('phone'), company: text('company') },
      source: formSource(text('source')),
    },
    values,
  };
}
