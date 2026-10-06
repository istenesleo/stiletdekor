import { defineMiddleware } from 'astro:middleware';
import { env } from 'cloudflare:workers';
import { securityHeaders } from '@/server/site-policy';

// Adds the security headers and, outside production, X-Robots-Tag: noindex to every server-rendered
// response. Prerendered pages and static assets are served by Cloudflare without running this code.
export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();
  const headers = securityHeaders({ indexable: env.PUBLIC_SITE_ENV === 'production' });
  try {
    for (const [name, value] of Object.entries(headers)) {
      if (!response.headers.has(name)) response.headers.set(name, value);
    }
    return response;
  } catch {
    // Some responses (e.g. passed through from fetch) have immutable headers: copy them first.
    const copy = new Response(response.body, response);
    for (const [name, value] of Object.entries(headers)) {
      if (!copy.headers.has(name)) copy.headers.set(name, value);
    }
    return copy;
  }
});
