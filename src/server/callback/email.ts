// The workshop's e-mail about a callback request: everything needed to call back, the phone number clickable.
import { formatReference } from '@/domain/reference';
import { callbackJobTypeName } from '@/domain/schemas';
import { emailBody, oneLine, telHref } from '../notify/format';
import type { OutgoingEmail } from '../notify/mailer';
import type { StoredCallback } from './store';

export { budapestDateTime } from '../notify/format';
import { budapestDateTime } from '../notify/format';

export function callbackEmail(request: StoredCallback, to: string): OutgoingEmail {
  const reference = formatReference('VH', request.id);
  const rows: [string, string][] = [
    ['Hivatkozási szám', reference],
    ['Név', request.name],
    ['Telefon', request.phone],
  ];
  if (request.jobType) rows.push(['Munka típusa', callbackJobTypeName(request.jobType)]);
  if (request.message) rows.push(['Röviden', request.message]);
  if (request.source) rows.push(['Honnan', request.source]);
  rows.push(['Beérkezett', budapestDateTime(request.createdAt)]);
  const { text, html } = emailBody('Visszahívást kértek a weboldalon.', rows, { Telefon: telHref(request.phone) });
  return { to, subject: oneLine(`[${reference}] Visszahívás – ${request.name}`), text, html };
}
