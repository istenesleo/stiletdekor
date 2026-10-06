// Response headers and robots.txt for every environment. Pure functions: the Astro middleware and the
// robots.txt route apply them, the tests check them without a Worker runtime.

export interface SitePolicyOptions {
  /** Only the production site (www.stiletdekor.hu) may be indexed; the dev site and Previews may not. */
  indexable: boolean;
}

/** Headers added to every server-rendered response that does not set them itself. */
export function securityHeaders({ indexable }: SitePolicyOptions): Record<string, string> {
  const headers: Record<string, string> = {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    // Clickjacking protection only; a full content security policy follows with the final design.
    'Content-Security-Policy': "frame-ancestors 'none'",
    'X-Frame-Options': 'DENY',
  };
  if (!indexable) headers['X-Robots-Tag'] = 'noindex, nofollow';
  return headers;
}

/** robots.txt body: everything allowed on production, everything disallowed elsewhere. */
export function robotsTxt({ indexable }: SitePolicyOptions): string {
  return indexable ? 'User-agent: *\nAllow: /\n' : 'User-agent: *\nDisallow: /\n';
}
