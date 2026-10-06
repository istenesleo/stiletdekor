import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { robotsTxt } from '@/server/site-policy';

export const prerender = false;

export const GET: APIRoute = () =>
  new Response(robotsTxt({ indexable: env.PUBLIC_SITE_ENV === 'production' }), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
