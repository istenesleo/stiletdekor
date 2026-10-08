// Cookie-free measuring with Cloudflare Web Analytics: no cookie, no personal data, so no cookie banner
// (docs/superpowers/specs/2026-10-08-weboldal-mukodesi-elvek-design.md, 7.). The token comes from the dashboard
// (Analytics & Logs → Web Analytics → Add a site) into the CF_BEACON_TOKEN var; without it nothing loads.

export function analyticsBeacon(token: string | undefined): { src: string; config: string } | null {
  const trimmed = token?.trim();
  if (!trimmed) return null;
  return { src: 'https://static.cloudflareinsights.com/beacon.min.js', config: JSON.stringify({ token: trimmed }) };
}
