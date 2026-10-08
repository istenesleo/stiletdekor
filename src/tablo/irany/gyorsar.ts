// The live quick quote of X4: a standard frontlit molinó, cut to size, priced by the real pricing and
// lead-time rules of src/domain (no numbers of its own). Runs on the server and in the browser.
import { estimateOrderReadyDate, formatReadyBy } from '@/domain/leadtime';
import { formatHuf } from '@/domain/money';
import { tryPriceConfiguration } from '@/domain/pricing';

export interface GyorsArBemenet {
  readonly widthCm: number;
  readonly heightCm: number;
  readonly quantity: number;
  readonly express: boolean;
}

export type GyorsAr =
  | {
      readonly ok: true;
      readonly brutto: string;
      readonly netto: string;
      readonly afa: string;
      /** The minimum item price was applied. */
      readonly minimum: boolean;
      /** "október 13-ára, keddre" for "Várhatóan … elkészül". */
      readonly kesz: string;
    }
  | { readonly ok: false; readonly uzenet: string };

export function molinoGyorsAr(be: GyorsArBemenet, now: Date): GyorsAr {
  const result = tryPriceConfiguration({
    productId: 'molino',
    materialId: 'standard',
    edgeFinishId: 'meretre-vagas',
    widthCm: be.widthCm,
    heightCm: be.heightCm,
    quantity: be.quantity,
    express: be.express,
  });
  if (!result.ok) return { ok: false, uzenet: result.issues[0]?.message ?? 'Ellenőrizze a megadott értékeket.' };
  const { price } = result;
  return {
    ok: true,
    brutto: formatHuf(price.grossTotal),
    netto: formatHuf(price.netTotal),
    afa: formatHuf(price.vatTotal),
    minimum: price.minimumApplied,
    kesz: formatReadyBy(estimateOrderReadyDate(now, { express: be.express })),
  };
}
