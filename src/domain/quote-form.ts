// Names of the quote form's fields, shared by the form (src/ui/QuoteForm) and the server that reads it
// (src/server/quote/form.ts). The job type's answers carry a prefix, so they never clash with the common fields.

export const QUOTE_FIELD_PREFIX = 'f_';
/** A file field's "I send it by e-mail" checkbox: the field's name plus this suffix. */
export const EMAILED_SUFFIX = '__email';

/** The form field name of a job type's answer, e.g. "f_jarmuTipus". */
export const quoteFieldName = (fieldId: string): string => QUOTE_FIELD_PREFIX + fieldId;

/** What the visitor typed, by form field name (a multiselect has several values). */
export type QuoteFormValues = Readonly<Record<string, string | readonly string[]>>;
/** One message per form field name. */
export type QuoteFormErrors = Readonly<Record<string, string>>;
