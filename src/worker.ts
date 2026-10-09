// The Worker's entry: Astro answers every request; the cron retries the workshop's notification e-mails.
// (wrangler.jsonc "main"; the build's prerender worker keeps the adapter's own entry.)
import { handle } from '@astrojs/cloudflare/handler';
import { d1CallbackStore } from './server/callback/d1-store';
import { deliverPendingCallbacks } from './server/callback/notify';
import { mailerFor } from './server/notify/mailer';
import { d1QuoteStore } from './server/quote/d1-store';
import { deliverPendingQuotes } from './server/quote/notify';

export default {
  fetch: handle,
  async scheduled(_controller, env, ctx) {
    const common = { mailer: mailerFor(env), to: env.ORDER_NOTIFY_EMAIL, now: () => new Date() };
    ctx.waitUntil(
      Promise.all([
        deliverPendingCallbacks({ store: d1CallbackStore(env.DB), ...common }),
        deliverPendingQuotes({ store: d1QuoteStore(env.DB), ...common }),
      ]).then(([visszahivas, ajanlat]) => {
        if (visszahivas.sent || visszahivas.failed || ajanlat.sent || ajanlat.failed) {
          console.info('Értesítések újrapróbálva:', { visszahivas, ajanlat });
        }
      }),
    );
  },
} satisfies ExportedHandler<Env>;
