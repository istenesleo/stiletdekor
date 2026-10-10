// The workshop's e-mail about a webshop order: the customer, every item with its files' download links, the totals,
// and the customer's status page (to paste into the manual reply). Replies go straight to the customer.
import { SHIPPING_METHODS } from '@/domain/catalog';
import { formatFileSize, formatHuf } from '@/domain/money';
import { DPI_RATINGS } from '@/domain/preflight';
import { formatReference } from '@/domain/reference';
import { budapestDateTime, escapeHtml, oneLine, telHref } from '../notify/format';
import type { OutgoingEmail } from '../notify/mailer';
import type { OrderAddress, OrderFile, StoredOrder, StoredOrderItem } from './store';
import { statusPath } from './token';

const INTRO = 'Új rendelés érkezett ellenőrzésre. Fizetési kötelezettség még nincs: visszaigazolás és díjbekérő kell.';
const NO_FILE = 'Nincs feltöltött fájl: e-mailben küldi.';

const addressText = (a: OrderAddress) => `${a.postalCode} ${a.city}, ${a.address}`;
const fileText = (file: OrderFile) => `${file.name} (${formatFileSize(file.sizeBytes)})`;
const preflightText = (item: StoredOrderItem) =>
  item.preflight
    ? `Felbontás: ${item.preflight.dpi} DPI, ${DPI_RATINGS[item.preflight.rating].label} (a böngésző mérte, tájékoztató)`
    : null;

export function orderEmail(order: StoredOrder, to: string): OutgoingEmail {
  const reference = formatReference('R', order.id);
  const method = SHIPPING_METHODS.find((m) => m.id === order.shippingMethod);
  const { customer, totals } = order;
  const fileUrl = (file: OrderFile) => `${order.siteOrigin}/api/uploads/${file.id}`;
  const statusUrl = `${order.siteOrigin}${statusPath(order.statusToken)}`;

  const rows: [string, string][] = [
    ['Rendelésszám', reference],
    ['Név', customer.name],
    ['Telefon', customer.phone],
    ['E-mail', customer.email],
  ];
  if (customer.company) rows.push(['Cég', customer.company]);
  if (customer.taxNumber) rows.push(['Adószám', customer.taxNumber]);
  rows.push(['Számlázási cím', addressText(order.billingAddress)], ['Átvétel', method?.name ?? order.shippingMethod]);
  if (method?.addressLabel) {
    rows.push([method.addressLabel, order.shippingAddress ? addressText(order.shippingAddress) : 'Ugyanaz, mint a számlázási cím']);
  }
  if (order.shippingMethod === 'telepites') rows.push(['Helyszíni felmérés', order.surveyRequested ? 'kéri' : 'nem kéri']);
  if (order.note) rows.push(['Megjegyzés', order.note]);
  if (order.source) rows.push(['Honnan', order.source]);
  rows.push(['Beérkezett', budapestDateTime(order.createdAt)]);

  const totalRows: [string, string][] = [
    ['Tételek, nettó', formatHuf(totals.itemsNet)],
    ['Átvétel, nettó', totals.shippingPriceOnRequest ? 'egyedi, a visszaigazoláskor adja meg' : formatHuf(totals.shippingNet)],
    ['Nettó', formatHuf(totals.netTotal)],
    ['ÁFA', formatHuf(totals.vatTotal)],
    ['Bruttó végösszeg', formatHuf(totals.grossTotal)],
  ];

  const text = [
    INTRO,
    '',
    ...rows.map(([label, value]) => `${label}: ${value}`),
    '',
    'Tételek',
    ...order.items.flatMap((item, index) => {
      const check = preflightText(item);
      return [
        `${index + 1}. ${item.description}`,
        `   ${item.quantity} db · ${formatHuf(item.grossTotal)}`,
        ...(item.files.length > 0 ? item.files.map((file) => `   Fájl: ${fileText(file)}: ${fileUrl(file)}`) : [`   ${NO_FILE}`]),
        ...(check ? [`   ${check}`] : []),
      ];
    }),
    ...(order.sitePhotos.length > 0
      ? ['', 'Helyszíni fotók', ...order.sitePhotos.map((file) => `   ${fileText(file)}: ${fileUrl(file)}`)]
      : []),
    '',
    'Összesen',
    ...totalRows.map(([label, value]) => `${label}: ${value}`),
    '',
    `Az ügyfél állapotoldala: ${statusUrl}`,
  ].join('\n');

  const link = (href: string, label: string) => `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`;
  const cell = (label: string, value: string) =>
    label === 'Telefon' ? link(telHref(value), value) : label === 'E-mail' ? link(`mailto:${value}`, value) : escapeHtml(value);
  const table = (list: readonly [string, string][]) =>
    '<table>' +
    list
      .map(([label, value]) => `<tr><th align="left" style="padding:4px 12px 4px 0">${escapeHtml(label)}</th><td>${cell(label, value)}</td></tr>`)
      .join('') +
    '</table>';
  const itemHtml = (item: StoredOrderItem) => {
    const files =
      item.files.length > 0 ? item.files.map((file) => `<li>${link(fileUrl(file), fileText(file))}</li>`).join('') : `<li>${NO_FILE}</li>`;
    const check = preflightText(item);
    return (
      `<li><p>${escapeHtml(item.description)}<br>${item.quantity} db · ${escapeHtml(formatHuf(item.grossTotal))}</p>` +
      `<ul>${files}${check ? `<li>${escapeHtml(check)}</li>` : ''}</ul></li>`
    );
  };
  const html = [
    `<p>${escapeHtml(INTRO)}</p>`,
    table(rows),
    `<h3>Tételek</h3><ol>${order.items.map(itemHtml).join('')}</ol>`,
    order.sitePhotos.length > 0
      ? `<h3>Helyszíni fotók</h3><ul>${order.sitePhotos.map((file) => `<li>${link(fileUrl(file), fileText(file))}</li>`).join('')}</ul>`
      : '',
    `<h3>Összesen</h3>${table(totalRows)}`,
    `<p>Az ügyfél állapotoldala: ${link(statusUrl, statusUrl)}</p>`,
  ].join('');

  return {
    to,
    subject: oneLine(`[${reference}] Rendelés ellenőrzésre – ${order.items.length} tétel, ${formatHuf(totals.grossTotal)} – ${customer.name}`),
    text,
    html,
    replyTo: customer.email,
  };
}
