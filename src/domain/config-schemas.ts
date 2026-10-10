// Zod schemas of a product configuration and a cart item: what the shop's islands need without the rest of the site's
// schemas (schemas.ts re-exports them). Kept apart so the product pages do not load the quote and callback schemas
// with the quote catalog (the 130 KB budget, docs/superpowers/specs/2026-10-09-webshop-4a-4b-design.md, 14.).
// Range checks for product configurations live in pricing.validateConfiguration, so the schema and the price engine
// cannot disagree.

import { z } from 'zod';
import { MATRICA, MOLINO, PLAKAT, ROLLUP, TABLA, VASZONKEP } from './catalog';
import { validateConfiguration, type ProductConfig } from './pricing';

const idsOf = <T extends readonly { readonly id: string }[]>(list: T) =>
  list.map((entry) => entry.id) as unknown as readonly [T[number]['id'], ...T[number]['id'][]];

export const UploadIdSchema = z.uuid({ error: 'Érvénytelen feltöltés-azonosító.' });
export const MAX_UPLOADS_PER_ITEM = 10;
export const MAX_ORDER_ITEMS = 50;

// ─── Product configuration ───────────────────────────────────────────────────────────────────────

const quantity = z.number({ error: 'Adja meg a darabszámot.' });
const express = z.boolean({ error: 'Adja meg, kér-e expressz gyártást.' });
const widthCm = z.number({ error: 'Adja meg a szélességet centiméterben.' });
const heightCm = z.number({ error: 'Adja meg a magasságot centiméterben.' });
const orientation = z.enum(['allo', 'fekvo'], { error: 'Válasszon tájolást.' });
const materialOf = <T extends readonly { readonly id: string }[]>(list: T) =>
  z.enum(idsOf(list), { error: 'Válasszon anyagot.' });
const formatOf = <T extends readonly { readonly id: string }[]>(list: T) =>
  z.enum(idsOf(list), { error: 'Válasszon méretet.' });
const addOnCount = z.number({ error: 'Adja meg a darabszámot.' });

const MolinoConfigSchema = z.object({
  productId: z.literal('molino'),
  materialId: materialOf(MOLINO.materials),
  edgeFinishId: z.enum(idsOf(MOLINO.edgeFinishes), { error: 'Válasszon szélkidolgozást.' }),
  widthCm,
  heightCm,
  quantity,
  express,
});

const RollupConfigSchema = z.object({
  productId: z.literal('rollup'),
  formatId: formatOf(ROLLUP.formats),
  graphicOnly: z.boolean({ error: 'Adja meg, hogy teljes roll-upot vagy csak cseregrafikát kér.' }),
  quantity,
  express,
});

const MatricaConfigSchema = z.object({
  productId: z.literal('matrica'),
  materialId: materialOf(MATRICA.materials),
  widthCm,
  heightCm,
  addOnIds: z.array(z.enum(idsOf(MATRICA.areaAddOns), { error: 'Ismeretlen opció.' }), {
    error: 'Érvénytelen opciólista.',
  }),
  quantity,
  express,
});

const paperFinish = z.enum(idsOf(PLAKAT.paperFinishes), { error: 'Válasszon papírfelületet (matt vagy fényes).' });

const PlakatConfigSchema = z.discriminatedUnion(
  'formatId',
  [
    z.object({
      productId: z.literal('plakat'),
      formatId: formatOf(PLAKAT.formats),
      paperFinish,
      orientation,
      quantity,
      express,
    }),
    z.object({
      productId: z.literal('plakat'),
      formatId: z.literal(PLAKAT.blueback.id),
      widthCm,
      heightCm,
      quantity,
      express,
    }),
    z.object({
      productId: z.literal('plakat'),
      formatId: z.literal(PLAKAT.custom.id),
      paperFinish,
      widthCm,
      heightCm,
      quantity,
      express,
    }),
  ],
  { error: 'Válasszon méretet.' },
);

const TablaConfigSchema = z.object({
  productId: z.literal('tabla'),
  materialId: materialOf(TABLA.materials),
  widthCm,
  heightCm,
  addOnCounts: z.object({ furat: addOnCount, tavtarto: addOnCount }, { error: 'Érvénytelen opciók.' }),
  quantity,
  express,
});

const VaszonkepConfigSchema = z.discriminatedUnion(
  'formatId',
  [
    z.object({ productId: z.literal('vaszonkep'), formatId: formatOf(VASZONKEP.formats), orientation, quantity, express }),
    z.object({ productId: z.literal('vaszonkep'), formatId: z.literal('egyedi'), widthCm, heightCm, quantity, express }),
  ],
  { error: 'Válasszon méretet.' },
);

export const ProductConfigSchema = z
  .discriminatedUnion(
    'productId',
    [MolinoConfigSchema, RollupConfigSchema, MatricaConfigSchema, PlakatConfigSchema, TablaConfigSchema, VaszonkepConfigSchema],
    { error: 'Ismeretlen termék.' },
  )
  .superRefine((config, ctx) => {
    for (const issue of validateConfiguration(config)) {
      ctx.addIssue({ code: 'custom', path: issue.path, message: issue.message });
    }
  });

// Compile-time guard: the schema's output must be exactly the domain's ProductConfig
// (a mismatch fails `tsc`). Exported only so that unused-type lint rules stay quiet.
type Equivalent<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type Assert<T extends true> = T;
/** @internal */
export type _ProductConfigSchemaMatchesDomain = Assert<Equivalent<z.output<typeof ProductConfigSchema>, ProductConfig>>;

// ─── Cart item ───────────────────────────────────────────────────────────────────────────────────

/** Client-side preflight result, stored for the workshop; informational only (not trusted). */
export const PreflightSummarySchema = z.object({
  dpi: z.number({ error: 'Érvénytelen felbontás.' }).int('Érvénytelen felbontás.').min(0, 'Érvénytelen felbontás.').max(100_000, 'Érvénytelen felbontás.'),
  rating: z.enum(['kivalo', 'megfelelo', 'gyenge'], { error: 'Érvénytelen minősítés.' }),
  aspectMismatch: z.boolean({ error: 'Érvénytelen arányadat.' }),
  fitMode: z.enum(['fill', 'fit'], { error: 'Válassza ki, hogyan illesszük a képet.' }).optional(),
});

export const CartItemSchema = z.object(
  {
    config: ProductConfigSchema,
    uploadIds: z
      .array(UploadIdSchema, { error: 'Érvénytelen fájllista.' })
      .max(MAX_UPLOADS_PER_ITEM, `Tételenként legfeljebb ${MAX_UPLOADS_PER_ITEM} fájl tölthető fel.`)
      .default([]),
    preflight: PreflightSummarySchema.optional(),
  },
  { error: 'Érvénytelen kosártétel.' },
);

export type PreflightSummary = z.output<typeof PreflightSummarySchema>;
export type CartItem = z.output<typeof CartItemSchema>;
