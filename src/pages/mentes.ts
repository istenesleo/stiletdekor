import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { designPreviewHtml } from '@/site/design-preview';
import { siteThemeOf } from '@/site/themes';

export const prerender = false;

// The dev sites keep the home page mockup as it was before its text was shortened, for comparison with "/".
// Production has no such page.
export const GET: APIRoute = () => {
  if (env.PUBLIC_SITE_ENV === 'production') return new Response(null, { status: 404 });
  return new Response(designPreviewHtml(siteThemeOf(env.SITE_THEME), 'backup'), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
};
