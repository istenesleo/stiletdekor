// The Worker's entry: Astro answers every request; the cron retries the workshop's notification e-mails and deletes
// the uploads no order used. (wrangler.jsonc "main"; the build's prerender worker keeps the adapter's own entry.)
import { handle } from '@astrojs/cloudflare/handler';
import { d1CallbackStore } from './server/callback/d1-store';
import { deliverPendingCallbacks } from './server/callback/notify';
import { mailerFor } from './server/notify/mailer';
import { d1OrderStore } from './server/order/d1-store';
import { deliverPendingOrders } from './server/order/notify';
import { d1QuoteStore } from './server/quote/d1-store';
import { deliverPendingQuotes } from './server/quote/notify';
import { r2BlobStore } from './server/upload/blob-store';
import { deleteOrphanUploads } from './server/upload/cleanup';
import { d1UploadStore } from './server/upload/d1-store';

export default {
  fetch: handle,
  async scheduled(_controller, env, ctx) {
    const common = { mailer: mailerFor(env), to: env.ORDER_NOTIFY_EMAIL, now: () => new Date() };
    ctx.waitUntil(
      Promise.all([
        deliverPendingCallbacks({ store: d1CallbackStore(env.DB), ...common }),
        deliverPendingQuotes({ store: d1QuoteStore(env.DB), ...common }),
        deliverPendingOrders({ store: d1OrderStore(env.DB), ...common }),
        env.UPLOADS
          ? deleteOrphanUploads({ blobs: r2BlobStore(env.UPLOADS), store: d1UploadStore(env.DB), now: common.now })
          : Promise.resolve(0),
      ]).then(([visszahivas, ajanlat, rendeles, toroltFajl]) => {
        if (visszahivas.sent || visszahivas.failed || ajanlat.sent || ajanlat.failed || rendeles.sent || rendeles.failed || toroltFajl) {
          console.info('Időzített feladatok:', { visszahivas, ajanlat, rendeles, toroltFajl });
        }
      }),
    );
  },
} satisfies ExportedHandler<Env>;
