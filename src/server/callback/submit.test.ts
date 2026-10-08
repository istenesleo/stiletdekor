import { describe, expect, it, vi } from 'vitest';
import type { CallbackStore, NewCallback } from './store';
import { limiterAllows, submitCallback, type SubmitDeps } from './submit';

const TOKEN = '3f8a2b6c-1d4e-4f5a-9b7c-0e1d2c3b4a59';
const NEW_TOKEN = '9c1d2e3f-4a5b-4c6d-8e7f-a0b1c2d3e4f5';
const NOW = new Date('2026-10-08T12:05:00.000Z');

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

function deps(overrides: Partial<SubmitDeps> = {}) {
  const saved: NewCallback[] = [];
  const store = {
    insert: vi.fn(async (request: NewCallback) => {
      saved.push(request);
      return 87;
    }),
  } as unknown as CallbackStore;
  return { saved, deps: { store, allow: async () => true, now: () => NOW, newToken: () => NEW_TOKEN, ...overrides } };
}

const VALID = { name: 'Kiss Péter', phone: '06 70 123 4567', jobType: 'ceger', message: '', source: '/visszahivas', token: TOKEN };

describe('submitCallback', () => {
  it('saves a valid request and sends the visitor to the thank-you page with the reference', async () => {
    const { saved, deps: d } = deps();
    expect(await submitCallback(form(VALID), d)).toEqual({ kind: 'accepted', location: '/visszahivas/koszonjuk?szam=VH-0087', id: 87 });
    expect(saved).toEqual([
      { name: 'Kiss Péter', phone: '06 70 123 4567', jobType: 'ceger', source: '/visszahivas', formToken: TOKEN, createdAt: NOW.toISOString() },
    ]);
  });

  it('gives a missing or forged token a fresh one', async () => {
    const { saved, deps: d } = deps();
    await submitCallback(form({ ...VALID, token: 'nem-uuid' }), d);
    expect(saved[0]?.formToken).toBe(NEW_TOKEN);
  });

  it('pretends to accept a filled trap field, and saves nothing', async () => {
    const { saved, deps: d } = deps();
    expect(await submitCallback(form({ ...VALID, honlap: 'http://spam.example' }), d)).toEqual({
      kind: 'accepted',
      location: '/visszahivas/koszonjuk',
      id: null,
    });
    expect(saved).toEqual([]);
  });

  it('sends the form back with the messages and what was typed', async () => {
    const { saved, deps: d } = deps();
    const result = await submitCallback(form({ ...VALID, name: '', phone: '123' }), d);
    expect(result).toEqual({
      kind: 'rejected',
      status: 400,
      values: { name: '', phone: '123', jobType: 'ceger', message: '' },
      errors: { name: 'Adja meg a nevét.', phone: 'Kérjük, érvényes telefonszámot adjon meg, például +36 70 123 4567.' },
      token: TOKEN,
      source: '/visszahivas',
    });
    expect(saved).toEqual([]);
  });

  it('refuses politely when too many requests come from one address', async () => {
    const { saved, deps: d } = deps({ allow: async () => false });
    const result = await submitCallback(form(VALID), d);
    expect(result).toMatchObject({ kind: 'rejected', status: 429, errors: {} });
    expect(result.kind === 'rejected' && result.formError).toContain('+36 70 538 5030');
    expect(saved).toEqual([]);
  });

  it('keeps what was typed and offers the phone when saving fails', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const store = { insert: vi.fn().mockRejectedValue(new Error('D1 down')) } as unknown as CallbackStore;
    const result = await submitCallback(form(VALID), { ...deps().deps, store });
    expect(result).toMatchObject({ kind: 'rejected', status: 503, values: { name: 'Kiss Péter' }, token: TOKEN });
    expect(result.kind === 'rejected' && result.formError).toBe(
      'Most nem sikerült elküldeni. Kérjük, próbálja újra, vagy hívjon: +36 70 538 5030.',
    );
    expect(error).toHaveBeenCalledOnce();
    error.mockRestore();
  });
});

describe('limiterAllows', () => {
  it('follows the limiter, and lets the request through when there is none or it fails', async () => {
    expect(await limiterAllows({ limit: async () => ({ success: false }) }, '1.2.3.4')).toBe(false);
    expect(await limiterAllows({ limit: async () => ({ success: true }) }, '1.2.3.4')).toBe(true);
    expect(await limiterAllows(undefined, '1.2.3.4')).toBe(true);
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await limiterAllows({ limit: async () => Promise.reject(new Error('x')) }, '1.2.3.4')).toBe(true);
    error.mockRestore();
  });
});
