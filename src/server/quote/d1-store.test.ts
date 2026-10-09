import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { testDatabase } from '../test-d1';
import { d1QuoteStore } from './d1-store';
import type { NewQuote } from './store';

let t: Awaited<ReturnType<typeof testDatabase>>;

beforeAll(async () => {
  t = await testDatabase();
}, 60_000);

afterAll(async () => {
  await t?.dispose();
});

beforeEach(async () => {
  await t.reset();
});

const T0 = new Date('2026-10-09T10:00:00.000Z');

function quote(token: string, extra: Partial<NewQuote> = {}): NewQuote {
  return {
    formToken: token,
    quoteType: 'betuk',
    fields: { feliratSzoveg: 'Pékség', betumagassagCm: 40, anyag: 'plexi', vilagitas: 'hatvilagitas' },
    emailedFiles: ['logo'],
    location: 'Budapest, Minta utca 1.',
    deadline: '2026-11-15',
    surveyRequested: true,
    contact: { name: 'Minta Mária', email: 'maria@example.hu', phone: '06 30 123 4567' },
    source: '/ajanlatkeres/betuk',
    createdAt: T0.toISOString(),
    ...extra,
  };
}

describe('d1QuoteStore', () => {
  it('numbers the requests and saves a resubmitted form only once', async () => {
    const store = d1QuoteStore(t.db);
    const first = await store.insert(quote('a'));
    expect(await store.insert(quote('b'))).toBe(first + 1);
    expect(await store.insert(quote('a', { deadline: '2026-12-01' }))).toBe(first);
  });

  it('reads a request back whole, with its answers and the files that come by e-mail', async () => {
    const store = d1QuoteStore(t.db);
    const { formToken: _token, ...rest } = quote('a', { contact: { name: 'Minta Mária', email: 'maria@example.hu', phone: '06 30 123 4567', company: 'Minta Kft.' } });
    const id = await store.insert(quote('a', { contact: rest.contact }));
    expect(await store.claimForNotification(id, T0)).toEqual({ id, ...rest });
  });

  it('keeps an optional address and company empty, and the survey as no', async () => {
    const store = d1QuoteStore(t.db);
    const id = await store.insert(
      quote('a', { quoteType: 'egyeb', fields: { leiras: 'Ajtófelirat' }, emailedFiles: [], location: undefined, surveyRequested: false, source: undefined }),
    );
    const stored = await store.claimForNotification(id, T0);
    expect(stored).toMatchObject({ quoteType: 'egyeb', surveyRequested: false, emailedFiles: [] });
    expect(stored?.location).toBeUndefined();
    expect(stored?.contact.company).toBeUndefined();
  });

  it('lists the requests whose e-mail has not gone out', async () => {
    const store = d1QuoteStore(t.db);
    const sent = await store.insert(quote('a'));
    const waiting = await store.insert(quote('b'));
    await store.markNotified(sent, T0);
    expect(await store.pendingNotificationIds(T0)).toEqual([waiting]);
  });
});
