// Ready-date estimation in Europe/Budapest business days.
//
// Rules (docs/brief.md 4.1). Production starts when the proforma invoice is paid:
//   start day = the payment day, if it is a business day and Budapest local time is before 12:00;
//               otherwise the next business day.
//   ready day = the Nth business day after the start day (N = 3 standard, 1 express).
//   e.g. paid Monday 10:00 → standard Thursday, express Tuesday; paid Monday 13:00 → standard Friday.
// Before payment (calculator, order confirmation) the estimate allows CONFIRMATION_BUFFER_BUSINESS_DAYS
// more for the workshop's confirmation and the payment: ordered Monday 10:00 → standard Friday.
//
// Dates are handled as ISO calendar dates ("YYYY-MM-DD") and day numbers (days since 1970-01-01, UTC).
// The only time-zone conversion is reading "now" in Budapest via Intl, so DST and the host's
// time zone do not matter.

import {
  BUSINESS_TIME_ZONE,
  CONFIRMATION_BUFFER_BUSINESS_DAYS,
  EXPRESS_LEAD_BUSINESS_DAYS,
  ORDER_CUTOFF_HOUR,
  STANDARD_LEAD_BUSINESS_DAYS,
} from './catalog';

export type IsoDate = string;

// ─── Hungarian holidays and work-schedule changes ────────────────────────────────────────────────

/**
 * Public holidays (munkaszüneti napok) with a fixed date, Mt. (2012. évi I. tv.) 102. § (1).
 * December 24 is NOT one as of 2026-10: a bill to make it one was only submitted on 2026-09-23.
 * TODO: if that bill is adopted, add ['12-24', 'Szenteste'] here. Until then, Dec 24 is a rest day
 * only in years whose work-schedule decree says so (see WORK_SCHEDULE_CHANGES, 2026).
 */
const FIXED_HOLIDAYS: readonly (readonly [monthDay: string, name: string])[] = [
  ['01-01', 'Újév'],
  ['03-15', 'Nemzeti ünnep'],
  ['05-01', 'A munka ünnepe'],
  ['08-20', 'Államalapítás ünnepe'],
  ['10-23', 'Nemzeti ünnep'],
  ['11-01', 'Mindenszentek'],
  ['12-25', 'Karácsony'],
  ['12-26', 'Karácsony'],
];

/**
 * Transferred working days and rest days (áthelyezett munkanapok / pihenőnapok), from the yearly
 * NGM decree on the work schedule around public holidays.
 */
const WORK_SCHEDULE_CHANGES: Readonly<Record<number, { readonly workdays: readonly IsoDate[]; readonly restDays: readonly IsoDate[] }>> = {
  // 10/2025. (IV. 30.) NGM rendelet: Jan 10 (Sat) worked for Jan 2 (Fri); Aug 8 (Sat) for Aug 21 (Fri);
  // Dec 12 (Sat) for Dec 24 (Thu).
  2026: {
    workdays: ['2026-01-10', '2026-08-08', '2026-12-12'],
    restDays: ['2026-01-02', '2026-08-21', '2026-12-24'],
  },
  // TODO 2027: the decree had not been published as of 2026-10. Add it here once it appears in the
  // Magyar Közlöny. (Dec 24, 2027 is a Friday; a bridge day is possible.)
};

const MS_PER_DAY = 86_400_000;
const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parses "YYYY-MM-DD" into a day number. Throws RangeError for malformed or impossible dates. */
export function isoToDayNumber(iso: IsoDate): number {
  const match = ISO_DATE_RE.exec(iso);
  if (!match) throw new RangeError(`Invalid ISO date: ${iso}`);
  const [, y, m, d] = match.map(Number) as [number, number, number, number];
  const ms = Date.UTC(y, m - 1, d);
  const check = new Date(ms);
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== m - 1 || check.getUTCDate() !== d) {
    throw new RangeError(`Invalid ISO date: ${iso}`);
  }
  return ms / MS_PER_DAY;
}

export function dayNumberToIso(dayNumber: number): IsoDate {
  return new Date(dayNumber * MS_PER_DAY).toISOString().slice(0, 10);
}

export function isValidIsoDate(value: string): boolean {
  try {
    isoToDayNumber(value);
    return true;
  } catch {
    return false;
  }
}

/** 0 = Sunday … 6 = Saturday. */
const weekdayOf = (dayNumber: number): number => new Date(dayNumber * MS_PER_DAY).getUTCDay();

/** Gregorian Easter Sunday (anonymous Gregorian / Meeus–Jones–Butcher algorithm). */
export function easterSunday(year: number): IsoDate {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return dayNumberToIso(Date.UTC(year, month - 1, day) / MS_PER_DAY);
}

export interface Holiday {
  date: IsoDate;
  name: string;
}

const holidayCache = new Map<number, ReadonlyMap<IsoDate, string>>();

function holidayMap(year: number): ReadonlyMap<IsoDate, string> {
  let map = holidayCache.get(year);
  if (!map) {
    const easter = isoToDayNumber(easterSunday(year));
    const entries: [IsoDate, string][] = [
      ...FIXED_HOLIDAYS.map(([monthDay, name]): [IsoDate, string] => [`${year}-${monthDay}`, name]),
      // Easter Sunday and Whit Sunday are holidays too, but always fall on a Sunday.
      [dayNumberToIso(easter - 2), 'Nagypéntek'],
      [dayNumberToIso(easter + 1), 'Húsvéthétfő'],
      [dayNumberToIso(easter + 50), 'Pünkösdhétfő'],
    ];
    map = new Map(entries.sort(([a], [b]) => a.localeCompare(b)));
    holidayCache.set(year, map);
  }
  return map;
}

/** Statutory public holidays of a year, sorted by date (Easter Sunday and Whit Sunday omitted: always Sundays). */
export function hungarianPublicHolidays(year: number): Holiday[] {
  return [...holidayMap(year)].map(([date, name]) => ({ date, name }));
}

/** Workshop business day: Mon–Fri, not a public holiday, honouring transferred work/rest days. */
export function isBusinessDay(iso: IsoDate): boolean {
  const dayNumber = isoToDayNumber(iso);
  const changes = WORK_SCHEDULE_CHANGES[Number(iso.slice(0, 4))];
  if (changes?.workdays.includes(iso)) return true;
  if (changes?.restDays.includes(iso)) return false;
  const weekday = weekdayOf(dayNumber);
  if (weekday === 0 || weekday === 6) return false;
  return !holidayMap(Number(iso.slice(0, 4))).has(iso);
}

/** The first business day strictly after `iso`. */
export function nextBusinessDay(iso: IsoDate): IsoDate {
  return addBusinessDays(iso, 1);
}

/** The `count`-th business day after `iso` (`iso` itself is not counted). */
export function addBusinessDays(iso: IsoDate, count: number): IsoDate {
  if (!Number.isInteger(count) || count < 0) throw new RangeError(`count must be a non-negative integer, got ${count}`);
  let dayNumber = isoToDayNumber(iso);
  let remaining = count;
  while (remaining > 0) {
    dayNumber += 1;
    if (isBusinessDay(dayNumberToIso(dayNumber))) remaining -= 1;
  }
  return dayNumberToIso(dayNumber);
}

// ─── "Now" in Budapest ───────────────────────────────────────────────────────────────────────────

const budapestFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: BUSINESS_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

export interface BudapestDateTime {
  date: IsoDate;
  hour: number;
  minute: number;
  second: number;
}

/** Wall-clock date and time in Europe/Budapest for an instant. */
export function budapestDateTime(now: Date): BudapestDateTime {
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) throw new RangeError('now must be a valid Date');
  const parts: Record<string, string> = {};
  for (const part of budapestFormatter.formatToParts(now)) parts[part.type] = part.value;
  const year = (parts.year ?? '').padStart(4, '0');
  // Some engines print midnight as "24" even with h23; treat it as 0.
  const hour = Number(parts.hour) % 24;
  return {
    date: `${year}-${parts.month}-${parts.day}`,
    hour,
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

/** Today's date in Budapest. */
export const budapestToday = (now: Date): IsoDate => budapestDateTime(now).date;

// ─── Lead time ───────────────────────────────────────────────────────────────────────────────────

export interface LeadTimeOptions {
  express: boolean;
  /** Business days added before production can start, e.g. for confirmation and payment. Default 0. */
  bufferBusinessDays?: number;
}

export interface LeadTime {
  /** Budapest calendar date of `now`. */
  orderDate: IsoDate;
  /** True if the day of `now` counts as the first day (business day, before the 12:00 cutoff). */
  countsToday: boolean;
  /** Day production starts, after the buffer. */
  startDate: IsoDate;
  readyDate: IsoDate;
  businessDays: number;
  bufferBusinessDays: number;
}

/** Lead time from `now`; with no buffer, `now` is the moment the payment arrives. */
export function leadTime(now: Date, { express, bufferBusinessDays = 0 }: LeadTimeOptions): LeadTime {
  const { date, hour } = budapestDateTime(now);
  const countsToday = isBusinessDay(date) && hour < ORDER_CUTOFF_HOUR;
  const startDate = addBusinessDays(countsToday ? date : nextBusinessDay(date), bufferBusinessDays);
  const businessDays = express ? EXPRESS_LEAD_BUSINESS_DAYS : STANDARD_LEAD_BUSINESS_DAYS;
  return {
    orderDate: date,
    countsToday,
    startDate,
    readyDate: addBusinessDays(startDate, businessDays),
    businessDays,
    bufferBusinessDays,
  };
}

/** Ready date (ISO, Budapest calendar) when the payment arrives at `paidAt`: production starts from it. */
export function estimateReadyDate(paidAt: Date, options: LeadTimeOptions): IsoDate {
  return leadTime(paidAt, options).readyDate;
}

/**
 * The date the calculator and the order confirmation show ("Várhatóan … elkészül") for an order placed
 * at `orderedAt`: allows CONFIRMATION_BUFFER_BUSINESS_DAYS for the confirmation and the payment.
 */
export function estimateOrderReadyDate(orderedAt: Date, { express }: { express: boolean }): IsoDate {
  return leadTime(orderedAt, { express, bufferBusinessDays: CONFIRMATION_BUFFER_BUSINESS_DAYS }).readyDate;
}

// ─── Formatting ──────────────────────────────────────────────────────────────────────────────────

const HU_MONTHS = [
  'január',
  'február',
  'március',
  'április',
  'május',
  'június',
  'július',
  'augusztus',
  'szeptember',
  'október',
  'november',
  'december',
] as const;
const HU_WEEKDAYS = ['vasárnap', 'hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat'] as const;

/** "2026. október 8., csütörtök". Built by hand so it does not depend on the engine's ICU data. */
export function formatHuDate(iso: IsoDate): string {
  const dayNumber = isoToDayNumber(iso);
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  return `${y}. ${HU_MONTHS[m - 1]} ${d}., ${HU_WEEKDAYS[weekdayOf(dayNumber)]}`;
}

// "-ra/-re" on a day of the month follows its ordinal (elsejére, másodikára, tizedikére, huszadikára …).
const DAY_SUBLATIVE = [
  '', 'jére', 'ára', 'ára', 'ére', 'ére', 'ára', 'ére', 'ára', 'ére', 'ére',
  'ére', 'ére', 'ára', 'ére', 'ére', 'ára', 'ére', 'ára', 'ére', 'ára',
  'ére', 'ére', 'ára', 'ére', 'ére', 'ára', 'ére', 'ára', 'ére', 'ára', 'ére',
] as const;
const HU_WEEKDAYS_SUBLATIVE = ['vasárnapra', 'hétfőre', 'keddre', 'szerdára', 'csütörtökre', 'péntekre', 'szombatra'] as const;

/** "október 13-ára, keddre": the date a job will be ready by, for "Várhatóan … elkészül". No year. */
export function formatReadyBy(iso: IsoDate): string {
  const dayNumber = isoToDayNumber(iso);
  const [, m, d] = iso.split('-').map(Number) as [number, number, number];
  return `${HU_MONTHS[m - 1]} ${d}-${DAY_SUBLATIVE[d]}, ${HU_WEEKDAYS_SUBLATIVE[weekdayOf(dayNumber)]}`;
}
