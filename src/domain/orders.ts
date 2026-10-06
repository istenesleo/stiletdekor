// Order lifecycle (docs/brief.md chapter 10). Sending an order is free of obligation: the workshop
// checks it, then confirms the final price and sends a proforma invoice (díjbekérő). Paying that
// invoice is the acceptance, and production starts from the payment.

import type { ShippingMethodId } from './catalog';
import { dayNumberToIso, isoToDayNumber, type IsoDate } from './leadtime';

// ─── Texts the order form must show ──────────────────────────────────────────────────────────────

/** The submit button: it must not suggest an obligation to pay. */
export const ORDER_SUBMIT_LABEL = 'Rendelés elküldése ellenőrzésre';

/** Next to the submit button and in the "we received your order" e-mail. */
export const ORDER_NO_OBLIGATION_NOTICE =
  'A rendelés elküldése még nem jár fizetési kötelezettséggel. Ellenőrizzük a fájlt, az anyagot és a határidőt, ' +
  'majd visszaigazoljuk a végleges árat, és küldjük a díjbekérőt. A megrendelést a díjbekérő befizetésével fogadja el.';

/** On the order form and next to every calculated price. */
export const FINAL_PRICE_NOTICE = 'A végleges ár eltérhet a kalkulált ártól.';

// ─── Statuses ────────────────────────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'beerkezett'
  | 'modositas'
  | 'visszaigazolva'
  | 'gyartas'
  | 'elkeszult'
  | 'teljesitve'
  | 'elutasitva'
  | 'lemondva'
  | 'lejart';

export interface OrderStatusInfo {
  readonly id: OrderStatus;
  /** Shown to the customer (order page, e-mails). */
  readonly label: string;
  /** Still in progress: someone has something to do with it. */
  readonly open: boolean;
}

export const ORDER_STATUSES: readonly OrderStatusInfo[] = [
  { id: 'beerkezett', label: 'Beérkezett, ellenőrizzük', open: true },
  { id: 'modositas', label: 'Módosítást kértünk', open: true },
  { id: 'visszaigazolva', label: 'Visszaigazolva, befizetésre vár', open: true },
  { id: 'gyartas', label: 'Gyártás alatt', open: true },
  { id: 'elkeszult', label: 'Elkészült', open: true },
  { id: 'teljesitve', label: 'Teljesítve', open: false },
  { id: 'elutasitva', label: 'Nem vállaltuk', open: false },
  { id: 'lemondva', label: 'Lemondva', open: false },
  { id: 'lejart', label: 'Lezárva, mert nem érkezett befizetés', open: false },
];

export const ORDER_STATUS_IDS = [
  'beerkezett',
  'modositas',
  'visszaigazolva',
  'gyartas',
  'elkeszult',
  'teljesitve',
  'elutasitva',
  'lemondva',
  'lejart',
] as const satisfies readonly OrderStatus[];

/** muhely: the workshop (admin) · vasarlo: the customer · rendszer: automatic (scheduled job, bank import). */
export type OrderActor = 'muhely' | 'vasarlo' | 'rendszer';

export interface OrderTransition {
  readonly from: OrderStatus;
  readonly to: OrderStatus;
  readonly by: readonly OrderActor[];
}

export const ORDER_TRANSITIONS: readonly OrderTransition[] = [
  { from: 'beerkezett', to: 'visszaigazolva', by: ['muhely'] }, // final price + proforma invoice
  { from: 'beerkezett', to: 'modositas', by: ['muhely'] }, // e.g. weak file, wrong size
  { from: 'beerkezett', to: 'elutasitva', by: ['muhely'] },
  { from: 'beerkezett', to: 'lemondva', by: ['vasarlo', 'muhely'] },
  { from: 'modositas', to: 'beerkezett', by: ['vasarlo', 'muhely'] }, // corrected file or answer received
  { from: 'modositas', to: 'visszaigazolva', by: ['muhely'] },
  { from: 'modositas', to: 'elutasitva', by: ['muhely'] },
  { from: 'modositas', to: 'lemondva', by: ['vasarlo', 'muhely'] },
  { from: 'visszaigazolva', to: 'gyartas', by: ['muhely', 'rendszer'] }, // the payment arrived
  { from: 'visszaigazolva', to: 'lemondva', by: ['vasarlo', 'muhely'] }, // the "Nem kérem" link
  { from: 'visszaigazolva', to: 'lejart', by: ['rendszer', 'muhely'] }, // not paid in time
  { from: 'lejart', to: 'gyartas', by: ['muhely'] }, // a late payment the workshop still accepts
  { from: 'gyartas', to: 'elkeszult', by: ['muhely'] },
  { from: 'elkeszult', to: 'teljesitve', by: ['muhely'] }, // picked up, delivered or installed
];

export const getOrderStatus = (id: OrderStatus): OrderStatusInfo => {
  const status = ORDER_STATUSES.find((s) => s.id === id);
  if (!status) throw new Error(`Unknown order status: ${id}`);
  return status;
};

export const canTransition = (from: OrderStatus, to: OrderStatus, by: OrderActor): boolean =>
  ORDER_TRANSITIONS.some((t) => t.from === from && t.to === to && t.by.includes(by));

/** Statuses `by` can move an order to from `from`. */
export const nextStatuses = (from: OrderStatus, by: OrderActor): OrderStatus[] =>
  ORDER_TRANSITIONS.filter((t) => t.from === from && t.by.includes(by)).map((t) => t.to);

/** What "elkészült" means for the customer, depending on how the order is handed over. */
export const READY_MESSAGES: Readonly<Record<ShippingMethodId, string>> = {
  szemelyes: 'Elkészült, átveheti a műhelyben.',
  futar: 'Elkészült, átadtuk a futárszolgálatnak.',
  telepites: 'Elkészült, egyeztetjük a telepítés időpontját.',
};

// ─── Unpaid orders ───────────────────────────────────────────────────────────────────────────────

/** Calendar days after the confirmation before an unpaid order closes (proposal; open question in the brief). */
export const UNPAID_ORDER_AUTO_CLOSE_DAYS = 8;

/** The day an order confirmed on `confirmedOn` closes if it is still unpaid. */
export const unpaidOrderClosesOn = (confirmedOn: IsoDate): IsoDate =>
  dayNumberToIso(isoToDayNumber(confirmedOn) + UNPAID_ORDER_AUTO_CLOSE_DAYS);
