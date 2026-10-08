// The workshop's e-mail about a callback request: everything needed to call back, the phone number clickable.
import { BUSINESS_TIME_ZONE } from '@/domain/catalog';
import { formatReference } from '@/domain/reference';
import { callbackJobTypeName } from '@/domain/schemas';
import type { OutgoingEmail } from '../notify/mailer';
import type { StoredCallback } from './store';

const PARTS = new Intl.DateTimeFormat('en-GB', {
  timeZone: BUSINESS_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** "2026. 10. 08. 14:05": the moment in Budapest, written the Hungarian way. */
export function budapestDateTime(iso: string): string {
  const part = Object.fromEntries(PARTS.formatToParts(new Date(iso)).map((p) => [p.type, p.value]));
  return `${part.year}. ${part.month}. ${part.day}. ${part.hour}:${part.minute}`;
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const oneLine = (value: string) => value.replace(/\s+/g, ' ').trim();

export function callbackEmail(request: StoredCallback, to: string): OutgoingEmail {
  const reference = formatReference('VH', request.id);
  const rows: [label: string, value: string][] = [
    ['Hivatkozási szám', reference],
    ['Név', request.name],
    ['Telefon', request.phone],
  ];
  if (request.jobType) rows.push(['Munka típusa', callbackJobTypeName(request.jobType)]);
  if (request.message) rows.push(['Röviden', request.message]);
  if (request.source) rows.push(['Honnan', request.source]);
  rows.push(['Beérkezett', budapestDateTime(request.createdAt)]);

  const telHref = `tel:${request.phone.replace(/[\s\-()./]/g, '')}`;
  const cell = (label: string, value: string) =>
    label === 'Telefon' ? `<a href="${escapeHtml(telHref)}">${escapeHtml(value)}</a>` : escapeHtml(value);
  const html =
    '<p>Visszahívást kértek a weboldalon.</p><table>' +
    rows
      .map(([label, value]) => `<tr><th align="left" style="padding:4px 12px 4px 0">${escapeHtml(label)}</th><td>${cell(label, value)}</td></tr>`)
      .join('') +
    '</table>';

  return {
    to,
    subject: oneLine(`[${reference}] Visszahívás – ${request.name}`),
    text: ['Visszahívást kértek a weboldalon.', '', ...rows.map(([label, value]) => `${label}: ${value}`)].join('\n'),
    html,
  };
}
