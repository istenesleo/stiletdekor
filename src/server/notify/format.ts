// Shared by the notification e-mails: Budapest times, Hungarian dates, HTML escaping, the plain and HTML body.
import { BUSINESS_TIME_ZONE } from '@/domain/catalog';

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

/** "2026-11-15" → "2026. 11. 15."; anything else stays as it is. */
export function huDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return match ? `${match[1]}. ${match[2]}. ${match[3]}.` : iso;
}

export const escapeHtml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const oneLine = (value: string): string => value.replace(/\s+/g, ' ').trim();

/** A tel: link for a phone number as typed. */
export const telHref = (phone: string): string => `tel:${phone.replace(/[\s\-()./]/g, '')}`;

/** The plain-text and HTML body of a notification: an intro and label–value rows; `links` turns a row into a link. */
export function emailBody(
  intro: string,
  rows: readonly (readonly [string, string])[],
  links: Readonly<Record<string, string>> = {},
): { text: string; html: string } {
  const cell = (label: string, value: string) => {
    const href = links[label];
    return href ? `<a href="${escapeHtml(href)}">${escapeHtml(value)}</a>` : escapeHtml(value);
  };
  return {
    text: [intro, '', ...rows.map(([label, value]) => `${label}: ${value}`)].join('\n'),
    html:
      `<p>${escapeHtml(intro)}</p><table>` +
      rows.map(([label, value]) => `<tr><th align="left" style="padding:4px 12px 4px 0">${escapeHtml(label)}</th><td>${cell(label, value)}</td></tr>`).join('') +
      '</table>',
  };
}
