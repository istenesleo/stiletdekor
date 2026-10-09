import { describe, expect, it, vi } from 'vitest';
import type { NewQuote, QuoteStore } from './store';
import { formFieldOf, submitQuote, type SubmitQuoteDeps } from './submit';

const TOKEN = '3f8a2b6c-1d4e-4f5a-9b7c-0e1d2c3b4a59';
const NOW = new Date('2026-10-09T10:00:00+02:00');

function form(entries: [string, string][]): FormData {
  const data = new FormData();
  for (const [key, value] of entries) data.append(key, value);
  return data;
}

const VALID: [string, string][] = [
  ['f_betumagassagCm', '40'],
  ['f_anyag', 'plexi'],
  ['f_vilagitas', 'nincs'],
  ['f_logo__email', 'on'],
  ['location', 'Budapest, Minta utca 1.'],
  ['deadline', '2026-11-15'],
  ['name', 'Minta Mária'],
  ['email', 'maria@example.hu'],
  ['phone', '06 30 123 4567'],
  ['source', '/ajanlatkeres/betuk'],
  ['token', TOKEN],
];

function deps(overrides: Partial<SubmitQuoteDeps> = {}) {
  const saved: NewQuote[] = [];
  const store = { insert: vi.fn(async (q: NewQuote) => (saved.push(q), 142)) } as unknown as QuoteStore;
  return { saved, deps: { store, allow: async () => true, now: () => NOW, newToken: () => 'uj-token', ...overrides } };
}

describe('submitQuote', () => {
  it('saves a valid request and sends the visitor on with the reference, noting the files to e-mail', async () => {
    const { saved, deps: d } = deps();
    expect(await submitQuote('betuk', form(VALID), d)).toEqual({
      kind: 'accepted',
      location: '/ajanlatkeres/koszonjuk?szam=AK-0142&fajl=1',
      id: 142,
    });
    expect(saved[0]).toMatchObject({
      formToken: TOKEN,
      quoteType: 'betuk',
      fields: { betumagassagCm: 40, anyag: 'plexi', vilagitas: 'nincs' },
      emailedFiles: ['logo'],
      surveyRequested: false,
      contact: { name: 'Minta Mária', email: 'maria@example.hu', phone: '06 30 123 4567' },
      source: '/ajanlatkeres/betuk',
      createdAt: NOW.toISOString(),
    });
  });

  it('sends the form back with one message per field, named as the form names them', async () => {
    const { saved, deps: d } = deps();
    const entries = VALID.filter(([k]) => !['f_logo__email', 'email', 'deadline'].includes(k));
    const result = await submitQuote('betuk', form(entries), d);
    expect(result).toMatchObject({
      kind: 'rejected',
      status: 400,
      errors: {
        f_feliratSzoveg: 'Adja meg a felirat szövegét, vagy töltse fel a logót.',
        deadline: 'Adja meg a határidőt.',
        email: 'Adja meg az e-mail-címét.',
      },
      token: TOKEN,
      source: '/ajanlatkeres/betuk',
    });
    expect(result.kind === 'rejected' && result.values).toMatchObject({ f_betumagassagCm: '40', name: 'Minta Mária' });
    expect(saved).toEqual([]);
  });

  it('pretends to accept a filled trap field, refuses too many posts, and offers the phone when saving fails', async () => {
    expect(await submitQuote('betuk', form([...VALID, ['honlap', 'x']]), deps().deps)).toEqual({
      kind: 'accepted',
      location: '/ajanlatkeres/koszonjuk',
      id: null,
    });
    expect(await submitQuote('betuk', form(VALID), deps({ allow: async () => false }).deps)).toMatchObject({ status: 429 });
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const store = { insert: vi.fn().mockRejectedValue(new Error('D1')) } as unknown as QuoteStore;
    expect(await submitQuote('betuk', form(VALID), { ...deps().deps, store })).toMatchObject({ status: 503 });
    error.mockRestore();
  });
});

describe('formFieldOf', () => {
  it('names the form field of a schema issue', () => {
    expect(formFieldOf(['fields', 'anyag'])).toBe('f_anyag');
    expect(formFieldOf(['contact', 'phone'])).toBe('phone');
    expect(formFieldOf(['deadline'])).toBe('deadline');
    expect(formFieldOf([])).toBe('form');
  });
});
