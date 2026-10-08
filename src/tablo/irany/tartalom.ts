// The shared, real content of the full-direction sketches (X1–X6), so the directions differ only in form.
// Facts come from src/domain; the intro and process texts are the approved copy of the mockups. Nothing invented.
import {
  ON_SITE_SERVICE,
  PRICES,
  PRICES_ARE_PLACEHOLDERS,
  SERVICE_GROUPS,
  STANDARD_LEAD_BUSINESS_DAYS,
  isShopOrderable,
} from '@/domain/catalog';
import { COMPANY } from '@/domain/company';
import { formatNumberHu } from '@/domain/money';
import { grossOf } from '@/domain/pricing';

export interface IranyBelepo {
  readonly cim: string;
  readonly leiras: string;
  readonly href: string;
}

export interface IranyCsoport {
  readonly nev: string;
  readonly elemek: readonly { readonly nev: string; readonly online: boolean }[];
}

export interface IranyAr {
  readonly termek: string;
  /** Gross forints. */
  readonly osszeg: number;
  readonly egyseg: 'Ft/m²-től' | 'Ft-tól';
}

export interface IranyLepes {
  readonly cim: string;
  readonly leiras: string;
}

export interface IranyTartalom {
  readonly ceg: typeof COMPANY;
  readonly szlogen: string;
  readonly bevezeto: string;
  readonly belepok: readonly IranyBelepo[];
  readonly csoportok: readonly IranyCsoport[];
  readonly arak: readonly IranyAr[];
  /** True while the catalog prices are placeholders: every price is labelled so. */
  readonly arakHelyorzok: boolean;
  readonly gyartasiIdo: string;
  readonly folyamat: readonly IranyLepes[];
}

const lowest = (prices: Readonly<Record<string, number>>): number => Math.min(...Object.values(prices));

export const TARTALOM: IranyTartalom = {
  ceg: COMPANY,
  szlogen: ON_SITE_SERVICE.description,
  bevezeto:
    'Fóliázás, cégér és világító reklám, nyomtatás, rendezvénydíszlet: a felméréstől a telepítésig egy csapat, saját műhellyel.',
  belepok: [
    { cim: 'Online rendelés', leiras: 'Azonnali ár, grafikafeltöltés.', href: '/#/webshop' },
    { cim: 'Egyedi ajánlat', leiras: 'Négy lépésben, kérésre helyszíni felméréssel.', href: '/#/ajanlatkeres' },
  ],
  csoportok: SERVICE_GROUPS.map((g) => ({
    nev: g.name,
    elemek: g.items.map((i) => ({ nev: i.name, online: isShopOrderable(i) })),
  })),
  arak: [
    { termek: 'Molinó', osszeg: grossOf(lowest(PRICES.molino.perM2)), egyseg: 'Ft/m²-től' },
    { termek: 'Roll-up', osszeg: grossOf(lowest(PRICES.rollup.formats)), egyseg: 'Ft-tól' },
    { termek: 'Matrica', osszeg: grossOf(lowest(PRICES.matrica.perM2)), egyseg: 'Ft/m²-től' },
  ],
  arakHelyorzok: PRICES_ARE_PLACEHOLDERS,
  gyartasiIdo: `${STANDARD_LEAD_BUSINESS_DAYS} munkanap`,
  folyamat: [
    { cim: 'Felmérés', leiras: 'Kimegyünk, lemérjük a felületet, és megbeszéljük, mire van szüksége.' },
    { cim: 'Tervezés', leiras: 'Látványtervet küldünk, és a jóváhagyásig finomítjuk.' },
    { cim: 'Gyártás saját műhelyben', leiras: 'Nyomtatás, fóliavágás, táblák és betűk egy helyen.' },
    { cim: 'Telepítés', leiras: 'Kiszállítjuk, felszereljük, és átadás előtt együtt ellenőrizzük.' },
  ],
};

/** "5 067": the amount of a price, grouped with a no-break space, without its unit. */
export const arSzam = (ar: IranyAr): string => formatNumberHu(ar.osszeg);

/** "5 067 Ft/m²-től". */
export const arTeljes = (ar: IranyAr): string => `${arSzam(ar)} ${ar.egyseg}`;
