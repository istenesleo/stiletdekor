// What the JSON endpoints under /api share: the origin check and the response. Astro's checkOrigin only looks at
// form posts, not at JSON or raw file uploads, so every /api POST checks the Origin header itself.

export const FORBIDDEN_MESSAGE = 'Ezt a kérést nem fogadjuk el. Töltse újra az oldalt, és próbálja újra.';

/** Whether a POST comes from the site itself or one of the comma-separated extra origins. Browsers send Origin on every POST. */
export function originAllowed(request: Request, extraOrigins: string): boolean {
  const origin = request.headers.get('Origin');
  if (!origin) return false;
  if (origin === new URL(request.url).origin) return true;
  return extraOrigins
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .includes(origin);
}

export const jsonResponse = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
