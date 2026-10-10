import { describe, expect, it } from 'vitest';
import { jsonResponse, originAllowed } from './api';

const post = (origin?: string) =>
  new Request('https://stiletdekor.example/api/orders', { method: 'POST', headers: origin ? { Origin: origin } : {} });

describe('originAllowed', () => {
  it('lets the site itself and the extra origins in', () => {
    expect(originAllowed(post('https://stiletdekor.example'), '')).toBe(true);
    expect(originAllowed(post('http://localhost:4321'), 'http://localhost:4321, https://x.test')).toBe(true);
  });

  it('refuses other sites and a missing Origin', () => {
    expect(originAllowed(post('https://evil.example'), 'http://localhost:4321')).toBe(false);
    expect(originAllowed(post(), '')).toBe(false);
  });
});

describe('jsonResponse', () => {
  it('sends JSON that is never cached', async () => {
    const response = jsonResponse(422, { errors: { a: 'b' } });
    expect(response.status).toBe(422);
    expect(response.headers.get('Content-Type')).toBe('application/json; charset=utf-8');
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(await response.json()).toEqual({ errors: { a: 'b' } });
  });
});
