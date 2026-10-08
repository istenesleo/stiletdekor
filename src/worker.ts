// The Worker's entry: Astro answers every request; the cron retries the workshop's notification e-mails.
// (wrangler.jsonc "main"; the build's prerender worker keeps the adapter's own entry.)
import { handle } from '@astrojs/cloudflare/handler';
import { d1CallbackStore } from './server/callback/d1-store';
import { deliverPendingCallbacks } from './server/callback/notify';
import { mailerFor } from './server/notify/mailer';

export default {
  fetch: handle,
  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(
      deliverPendingCallbacks({
        store: d1CallbackStore(env.DB),
        mailer: mailerFor(env),
        to: env.ORDER_NOTIFY_EMAIL,
        now: () => new Date(),
      }).then((result) => {
        if (result.sent || result.failed) console.info('Értesítések újrapróbálva:', result);
      }),
    );
  },
} satisfies ExportedHandler<Env>;
