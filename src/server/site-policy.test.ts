import { describe, expect, it } from 'vitest';
import { robotsTxt, securityHeaders } from './site-policy';

describe('securityHeaders', () => {
  it('keeps non-production responses out of search engines', () => {
    expect(securityHeaders({ indexable: false })['X-Robots-Tag']).toBe('noindex, nofollow');
  });

  it('lets production be indexed', () => {
    expect(securityHeaders({ indexable: true })).not.toHaveProperty('X-Robots-Tag');
  });

  it('always sends the baseline protections', () => {
    for (const indexable of [true, false]) {
      const h = securityHeaders({ indexable });
      expect(h['X-Content-Type-Options']).toBe('nosniff');
      expect(h['Content-Security-Policy']).toBe("frame-ancestors 'none'");
      expect(h['X-Frame-Options']).toBe('DENY');
      expect(h['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    }
  });
});

describe('robotsTxt', () => {
  it('disallows everything outside production', () => {
    expect(robotsTxt({ indexable: false })).toBe('User-agent: *\nDisallow: /\n');
  });

  it('allows everything on production', () => {
    expect(robotsTxt({ indexable: true })).toBe('User-agent: *\nAllow: /\n');
  });
});
