import { describe, expect, it } from 'vitest';
import { analyticsBeacon } from './analytics';

describe('analyticsBeacon', () => {
  it('loads the Cloudflare Web Analytics beacon only when the deployment has a token', () => {
    expect(analyticsBeacon(undefined)).toBeNull();
    expect(analyticsBeacon('  ')).toBeNull();
    expect(analyticsBeacon('abc123')).toEqual({
      src: 'https://static.cloudflareinsights.com/beacon.min.js',
      config: '{"token":"abc123"}',
    });
  });
});
