// POST /api/orders (src/server/order/submit.ts): the order is saved, the workshop's e-mail goes out after the response.
import type { APIRoute } from 'astro';
import { env, waitUntil } from 'cloudflare:workers';
import { FORBIDDEN_MESSAGE, jsonResponse, originAllowed } from '@/server/api';
import { limiterAllows } from '@/server/forms';
import { mailerFor } from '@/server/notify/mailer';
import { d1OrderStore } from '@/server/order/d1-store';
import { notifyOrder } from '@/server/order/notify';
import { ORDER_INVALID_MESSAGE, submitOrder } from '@/server/order/submit';
import { newStatusToken } from '@/server/order/token';
import { d1UploadStore } from '@/server/upload/d1-store';

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!originAllowed(request, env.ALLOWED_ORIGINS)) return jsonResponse(403, { error: FORBIDDEN_MESSAGE });
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return jsonResponse(400, { error: ORDER_INVALID_MESSAGE });
  }
  const store = d1OrderStore(env.DB);
  const now = () => new Date();
  const result = await submitOrder(input, {
    store,
    uploads: d1UploadStore(env.DB),
    allow: () => limiterAllows(env.FORM_LIMITER, `rendeles:${clientAddress}`),
    now,
    newStatusToken,
    siteOrigin: new URL(request.url).origin,
  });
  if (result.notifyId !== undefined) {
    waitUntil(
      notifyOrder(result.notifyId, { store, mailer: mailerFor(env), to: env.ORDER_NOTIFY_EMAIL, now }).catch((error) =>
        console.error('A rendelés értesítése hibával leállt:', error),
      ),
    );
  }
  return jsonResponse(result.status, result.body);
};
