import { describe, expect, it } from 'vitest';
import {
  addBusinessDays,
  budapestDateTime,
  budapestToday,
  easterSunday,
  estimateReadyDate,
  formatHuDate,
  hungarianPublicHolidays,
  isBusinessDay,
  isValidIsoDate,
  leadTime,
  nextBusinessDay,
} from './leadtime';

// Instants are written with the Budapest UTC offset in force on that day:
// +01:00 (CET) in winter, +02:00 (CEST) from the last Sunday of March to the last Sunday of October.
const at = (isoWithOffset: string) => new Date(isoWithOffset);
const standard = (isoWithOffset: string) => estimateReadyDate(at(isoWithOffset), { express: false });
const express = (isoWithOffset: string) => estimateReadyDate(at(isoWithOffset), { express: true });

describe('estimateReadyDate – brief examples', () => {
  it('Monday 10:00 → standard Thursday, express Tuesday', () => {
    expect(standard('2026-10-05T10:00:00+02:00')).toBe('2026-10-08');
    expect(express('2026-10-05T10:00:00+02:00')).toBe('2026-10-06');
  });

  it('Monday 13:00 → standard Friday, express Wednesday', () => {
    expect(standard('2026-10-05T13:00:00+02:00')).toBe('2026-10-09');
    expect(express('2026-10-05T13:00:00+02:00')).toBe('2026-10-07');
  });

  it('formats the example ready date', () => {
    expect(formatHuDate(standard('2026-10-05T10:00:00+02:00'))).toBe('2026. október 8., csütörtök');
  });
});

describe('estimateReadyDate – 12:00 cutoff', () => {
  it('11:59:59.999 still starts today', () => {
    const lt = leadTime(at('2026-10-05T11:59:59.999+02:00'), { express: false });
    expect(lt.startsToday).toBe(true);
    expect(lt.startDate).toBe('2026-10-05');
    expect(lt.readyDate).toBe('2026-10-08');
  });

  it('exactly 12:00:00 starts the next business day', () => {
    const lt = leadTime(at('2026-10-05T12:00:00+02:00'), { express: false });
    expect(lt.startsToday).toBe(false);
    expect(lt.startDate).toBe('2026-10-06');
    expect(lt.readyDate).toBe('2026-10-09');
  });

  it('just after midnight belongs to the new Budapest day, even though UTC is still on the previous day', () => {
    const lt = leadTime(at('2026-10-05T22:30:00Z'), { express: false }); // 2026-10-06 00:30 in Budapest
    expect(lt.orderDate).toBe('2026-10-06');
    expect(lt.startsToday).toBe(true);
    expect(lt.readyDate).toBe('2026-10-09');
  });

  it('reports the number of business days', () => {
    expect(leadTime(at('2026-10-05T10:00:00+02:00'), { express: false }).businessDays).toBe(3);
    expect(leadTime(at('2026-10-05T10:00:00+02:00'), { express: true }).businessDays).toBe(1);
  });
});

describe('estimateReadyDate – weekends', () => {
  it('Friday before the cutoff counts Friday as the start day', () => {
    expect(standard('2026-10-09T10:00:00+02:00')).toBe('2026-10-14');
    expect(express('2026-10-09T10:00:00+02:00')).toBe('2026-10-12');
  });

  it('Friday afternoon, Saturday and Sunday all start on Monday', () => {
    for (const instant of ['2026-10-09T15:00:00+02:00', '2026-10-10T09:00:00+02:00', '2026-10-11T23:59:00+02:00']) {
      expect(leadTime(at(instant), { express: false }).startDate).toBe('2026-10-12');
      expect(standard(instant)).toBe('2026-10-15');
      expect(express(instant)).toBe('2026-10-13');
    }
  });
});

describe('estimateReadyDate – Hungarian holidays', () => {
  it('skips 23 October (Friday in 2026)', () => {
    expect(standard('2026-10-21T10:00:00+02:00')).toBe('2026-10-27');
    expect(express('2026-10-21T10:00:00+02:00')).toBe('2026-10-22');
    expect(leadTime(at('2026-10-22T13:00:00+02:00'), { express: false }).startDate).toBe('2026-10-26');
    expect(standard('2026-10-22T13:00:00+02:00')).toBe('2026-10-29');
    expect(express('2026-10-22T13:00:00+02:00')).toBe('2026-10-27');
  });

  it('Easter 2026: Nagypéntek (Apr 3) and Húsvéthétfő (Apr 6) are skipped', () => {
    expect(easterSunday(2026)).toBe('2026-04-05');
    expect(standard('2026-04-02T10:00:00+02:00')).toBe('2026-04-09');
    expect(express('2026-04-02T10:00:00+02:00')).toBe('2026-04-07');
    // Ordered on Good Friday itself → production starts on Tuesday.
    expect(leadTime(at('2026-04-03T09:00:00+02:00'), { express: false }).startDate).toBe('2026-04-07');
  });

  it('Easter 2027: Nagypéntek (Mar 26) and Húsvéthétfő (Mar 29) are skipped', () => {
    expect(easterSunday(2027)).toBe('2027-03-28');
    expect(standard('2027-03-25T10:00:00+01:00')).toBe('2027-04-01');
    expect(express('2027-03-25T10:00:00+01:00')).toBe('2027-03-30');
    expect(standard('2027-03-26T09:00:00+01:00')).toBe('2027-04-02');
    expect(express('2027-03-26T09:00:00+01:00')).toBe('2027-03-31');
  });

  it('Pünkösdhétfő is a holiday (May 25, 2026; May 17, 2027)', () => {
    expect(isBusinessDay('2026-05-25')).toBe(false);
    expect(isBusinessDay('2027-05-17')).toBe(false);
    expect(express('2026-05-22T10:00:00+02:00')).toBe('2026-05-26');
  });

  it('Christmas 2026: Dec 24 is a rest day by the 2026 decree, Dec 25–26 are holidays', () => {
    expect(standard('2026-12-22T10:00:00+01:00')).toBe('2026-12-29');
    expect(express('2026-12-22T10:00:00+01:00')).toBe('2026-12-23');
    expect(express('2026-12-23T13:00:00+01:00')).toBe('2026-12-29');
  });

  it('New Year: Jan 1 is skipped', () => {
    expect(standard('2026-12-31T10:00:00+01:00')).toBe('2027-01-06');
  });

  it('20 August 2026 (Thursday) plus the transferred rest day on Friday 21 August', () => {
    expect(standard('2026-08-19T10:00:00+02:00')).toBe('2026-08-26');
    expect(express('2026-08-19T10:00:00+02:00')).toBe('2026-08-24');
  });

  it('a transferred working Saturday (8 August 2026) is a business day', () => {
    const lt = leadTime(at('2026-08-07T13:00:00+02:00'), { express: false });
    expect(lt.startDate).toBe('2026-08-08');
    expect(lt.readyDate).toBe('2026-08-12');
    expect(express('2026-08-07T13:00:00+02:00')).toBe('2026-08-10');
    expect(express('2026-08-08T10:00:00+02:00')).toBe('2026-08-10');
  });
});

describe('estimateReadyDate – DST switches', () => {
  it('spring forward 2026 (Mar 29): the cutoff follows Budapest wall-clock time', () => {
    // 10:30 UTC is 11:30 CET on Friday, but 12:30 CEST on Monday.
    expect(leadTime(at('2026-03-27T10:30:00Z'), { express: false }).startsToday).toBe(true);
    expect(leadTime(at('2026-03-30T10:30:00Z'), { express: false }).startsToday).toBe(false);
    expect(leadTime(at('2026-03-30T09:59:59Z'), { express: false }).startsToday).toBe(true);
    expect(leadTime(at('2026-03-30T10:00:00Z'), { express: false }).startsToday).toBe(false);
    // Monday after the cutoff → start Tuesday Mar 31; Apr 3 and Apr 6 are Easter holidays.
    expect(estimateReadyDate(at('2026-03-30T10:30:00Z'), { express: false })).toBe('2026-04-07');
  });

  it('fall back 2026 (Oct 25)', () => {
    // 10:30 UTC is 12:30 CEST on Thursday Oct 22, but 11:30 CET on Monday Oct 26.
    expect(leadTime(at('2026-10-22T10:30:00Z'), { express: false }).startsToday).toBe(false);
    expect(leadTime(at('2026-10-26T10:30:00Z'), { express: false }).startsToday).toBe(true);
    expect(estimateReadyDate(at('2026-10-26T10:59:00Z'), { express: false })).toBe('2026-10-29');
    expect(estimateReadyDate(at('2026-10-26T11:00:00Z'), { express: false })).toBe('2026-10-30');
  });

  it('reads the repeated 02:00–03:00 hour of the autumn switch correctly', () => {
    expect(budapestDateTime(at('2026-10-25T00:30:00Z'))).toEqual({ date: '2026-10-25', hour: 2, minute: 30, second: 0 });
    expect(budapestDateTime(at('2026-10-25T01:30:00Z'))).toEqual({ date: '2026-10-25', hour: 2, minute: 30, second: 0 });
  });

  it('spring forward 2027 (Mar 28, Easter Sunday) and fall back 2027 (Oct 31)', () => {
    expect(leadTime(at('2027-03-29T10:30:00Z'), { express: false }).orderDate).toBe('2027-03-29');
    // Mar 29, 2027 is Húsvéthétfő → start Tuesday Mar 30.
    expect(estimateReadyDate(at('2027-03-29T09:00:00Z'), { express: true })).toBe('2027-03-31');
    expect(leadTime(at('2027-11-02T10:30:00Z'), { express: false }).startsToday).toBe(true); // 11:30 CET
    expect(leadTime(at('2027-10-29T10:30:00Z'), { express: false }).startsToday).toBe(false); // 12:30 CEST
  });

  it('midnight is hour 0, not 24', () => {
    expect(budapestDateTime(at('2026-10-05T22:00:00Z'))).toEqual({ date: '2026-10-06', hour: 0, minute: 0, second: 0 });
    expect(budapestToday(at('2026-12-31T23:30:00Z'))).toBe('2027-01-01');
  });
});

describe('business days and holidays', () => {
  it('lists the statutory public holidays of 2026 (Dec 24 is not one)', () => {
    expect(hungarianPublicHolidays(2026)).toEqual([
      { date: '2026-01-01', name: 'Újév' },
      { date: '2026-03-15', name: 'Nemzeti ünnep' },
      { date: '2026-04-03', name: 'Nagypéntek' },
      { date: '2026-04-06', name: 'Húsvéthétfő' },
      { date: '2026-05-01', name: 'A munka ünnepe' },
      { date: '2026-05-25', name: 'Pünkösdhétfő' },
      { date: '2026-08-20', name: 'Államalapítás ünnepe' },
      { date: '2026-10-23', name: 'Nemzeti ünnep' },
      { date: '2026-11-01', name: 'Mindenszentek' },
      { date: '2026-12-25', name: 'Karácsony' },
      { date: '2026-12-26', name: 'Karácsony' },
    ]);
  });

  it.each([
    ['2026-10-05', true], // Monday
    ['2026-10-10', false], // Saturday
    ['2026-10-11', false], // Sunday
    ['2026-10-23', false], // national holiday
    ['2026-11-02', true], // Monday after Mindenszentek (Sunday)
    ['2026-01-02', false], // transferred rest day
    ['2026-01-10', true], // transferred working Saturday
    ['2026-08-21', false], // transferred rest day
    ['2026-12-12', true], // transferred working Saturday
    ['2026-12-24', false], // rest day by the 2026 decree
    ['2027-12-24', true], // Friday; no 2027 decree yet and not a statutory holiday
    ['2028-04-14', false], // Nagypéntek 2028, computed
  ])('%s → %s', (iso, expected) => {
    expect(isBusinessDay(iso)).toBe(expected);
  });

  it.each([
    [2000, '2000-04-23'],
    [2008, '2008-03-23'],
    [2011, '2011-04-24'],
    [2019, '2019-04-21'],
    [2024, '2024-03-31'],
    [2025, '2025-04-20'],
    [2028, '2028-04-16'],
    [2038, '2038-04-25'],
    [2285, '2285-03-22'],
  ])('Easter Sunday %i is %s', (year, iso) => {
    expect(easterSunday(year)).toBe(iso);
  });

  it('addBusinessDays / nextBusinessDay', () => {
    expect(addBusinessDays('2026-10-05', 0)).toBe('2026-10-05');
    expect(addBusinessDays('2026-10-09', 1)).toBe('2026-10-12');
    expect(addBusinessDays('2026-12-23', 2)).toBe('2026-12-29');
    expect(nextBusinessDay('2026-10-22')).toBe('2026-10-26');
    expect(() => addBusinessDays('2026-10-05', -1)).toThrow(RangeError);
    expect(() => addBusinessDays('2026-10-05', 1.5)).toThrow(RangeError);
  });
});

describe('formatHuDate', () => {
  it.each([
    ['2026-10-08', '2026. október 8., csütörtök'],
    ['2027-01-01', '2027. január 1., péntek'],
    ['2026-03-29', '2026. március 29., vasárnap'],
    ['2026-12-12', '2026. december 12., szombat'],
    ['2028-02-29', '2028. február 29., kedd'],
  ])('%s → %s', (iso, text) => {
    expect(formatHuDate(iso)).toBe(text);
  });

  it('rejects malformed and impossible dates', () => {
    expect(() => formatHuDate('2026-02-30')).toThrow(RangeError);
    expect(() => formatHuDate('2026-1-5')).toThrow(RangeError);
    expect(() => formatHuDate('holnap')).toThrow(RangeError);
    expect(isValidIsoDate('2026-02-28')).toBe(true);
    expect(isValidIsoDate('2027-02-29')).toBe(false);
  });
});

describe('invalid input', () => {
  it('rejects an invalid Date', () => {
    expect(() => estimateReadyDate(new Date('nope'), { express: false })).toThrow(RangeError);
  });
});
