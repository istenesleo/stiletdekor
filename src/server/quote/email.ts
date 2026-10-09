// The workshop's e-mail about a quote request: the answers as the form asked them, the customer's contacts
// clickable, and replies going straight to the customer.
import { getQuoteType, type QuoteFieldDef } from '@/domain/catalog';
import { formatNumberHu } from '@/domain/money';
import { formatReference } from '@/domain/reference';
import { budapestDateTime, emailBody, huDate, oneLine, telHref } from '../notify/format';
import type { OutgoingEmail } from '../notify/mailer';
import type { StoredQuote } from './store';

function answerText(def: QuoteFieldDef, value: string | number | string[]): string {
  const label = (v: string) => ('options' in def ? (def.options.find((o) => o.value === v)?.label ?? v) : v);
  switch (def.type) {
    case 'select':
      return label(String(value));
    case 'multiselect':
      return (Array.isArray(value) ? value : [String(value)]).map(label).join(', ');
    case 'number':
      return typeof value === 'number' ? `${formatNumberHu(value)}${def.unit ? ` ${def.unit}` : ''}` : String(value);
    case 'date':
      return huDate(String(value));
    default:
      return Array.isArray(value) ? value.join(', ') : String(value);
  }
}

export function quoteEmail(q: StoredQuote, to: string): OutgoingEmail {
  const type = getQuoteType(q.quoteType);
  const reference = formatReference('AK', q.id);
  const rows: [string, string][] = [
    ['Hivatkozási szám', reference],
    ['Munka', type.name],
  ];
  for (const def of type.fields) {
    const value = q.fields[def.id];
    if (value !== undefined && def.type !== 'file') rows.push([def.label, answerText(def, value)]);
  }
  const emailed = type.fields.filter((def) => q.emailedFiles.includes(def.id)).map((def) => def.label);
  if (emailed.length) rows.push(['E-mailben küldi', emailed.join(', ')]);
  if (q.location) rows.push([type.locationLabel ?? 'Helyszín', q.location]);
  rows.push(['Határidő', huDate(q.deadline)], ['Helyszíni felmérés', q.surveyRequested ? 'kéri' : 'nem kéri']);
  rows.push(['Név', q.contact.name], ['Telefon', q.contact.phone], ['E-mail', q.contact.email]);
  if (q.contact.company) rows.push(['Cég', q.contact.company]);
  if (q.source) rows.push(['Honnan', q.source]);
  rows.push(['Beérkezett', budapestDateTime(q.createdAt)]);
  const { text, html } = emailBody('Ajánlatkérés érkezett a weboldalon.', rows, {
    Telefon: telHref(q.contact.phone),
    'E-mail': `mailto:${q.contact.email}`,
  });
  return {
    to,
    subject: oneLine(`[${reference}] Ajánlatkérés – ${type.name} – ${q.contact.name}`),
    text,
    html,
    replyTo: q.contact.email,
  };
}
