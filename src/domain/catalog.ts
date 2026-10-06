// Catalog: service taxonomy, shop products, quote wizard definitions, shipping, tax and lead-time
// constants. Source of truth: docs/brief.md sections 3 and 4. Pure data, no framework imports.

// ═══════════════════════════════════════════════════════════════════════════════════════════════
//  HELYŐRZŐ ÁRAK – PLACEHOLDER PRICES
//  Every price in the shop comes from this one object. All amounts are NET HUF (nettó, ÁFA nélkül),
//  estimated from market averages in docs/brief.md 4.1; the client will overwrite them.
//  Change prices here only; products below reference these values.
// ═══════════════════════════════════════════════════════════════════════════════════════════════
export const PRICES_ARE_PLACEHOLDERS = true;

export const PRICES = {
  molino: {
    perM2: { standard: 3990, mesh: 4490, blockout: 6990, textil: 5490 },
    edgePerM: { 'meretre-vagas': 0, ringli: 200, 'szeges-ringli': 350, alagut: 600 },
    minimumPerItem: 4990,
  },
  rollup: {
    formats: { '85x200': 24900, '100x200': 34900, '120x200': 39900, '150x200': 49900 },
    graphicOnly: 12900,
  },
  matrica: {
    perM2: { monomer: 6990, polimer: 9990, 'one-way-vision': 8990 },
    addOnPerM2: { konturvagas: 2500, 'uv-laminalas': 2000 },
  },
  plakat: {
    formats: { a3: 990, a2: 1990, a1: 3490, a0: 5990, b1: 3990 },
    bluebackPerM2: 2990,
    customPerM2: 4990,
    customMinimum: 1990,
  },
  tabla: {
    perM2: { 'pvc-3mm': 9990, 'pvc-5mm': 12990, 'dibond-3mm': 19990, 'plexi-3mm': 24990 },
    addOnEach: { furat: 500, tavtarto: 1990 },
  },
  vaszonkep: {
    formats: { '30x40': 7990, '50x70': 13990, '60x90': 17990 },
    customPerM2: 19990,
    customMinimum: 6990,
  },
  shipping: { szemelyes: 0, futar: 2990, futarNagyCsomag: 4990 },
} as const;

// Technical size limits. Molinó (20–500 cm) and the tábla 0,1 m² billing minimum come from the brief;
// the other limits are NOT in the brief: they are sanity bounds to be confirmed with the workshop.
export const SIZE_LIMITS = {
  molino: { minCm: 20, maxCm: 500 },
  matrica: { minCm: 5, maxCm: 500 }, // placeholder
  plakatBlueback: { minCm: 20, maxCm: 500 }, // placeholder
  plakatCustom: { minCm: 10, maxCm: 150 }, // placeholder (paper roll width)
  tabla: { minCm: 5, maxCm: 300, minBillableM2: 0.1 }, // side limits are placeholders
  vaszonkepCustom: { minCm: 20, maxCm: 200 }, // placeholder
} as const;

// Material spec data (g/m², use, lifespan) beyond what the brief states is a placeholder too.
// Lifespans are rough industry estimates and must be confirmed before they are shown as facts.
export const MATERIAL_SPECS_NEED_REVIEW = true;

// ─── Tax, discounts, production ──────────────────────────────────────────────────────────────────

export const VAT_PERCENT = 27;
export const VAT_RATE = VAT_PERCENT / 100;

export const MAX_QUANTITY = 999;

export interface DiscountTier {
  readonly minQty: number;
  readonly pct: number;
  readonly label: string;
}

/** Quantity discount for identical items, ordered by minQty. */
export const QUANTITY_DISCOUNT_TIERS: readonly DiscountTier[] = [
  { minQty: 1, pct: 0, label: '1 db' },
  { minQty: 2, pct: 5, label: '2–4 db' },
  { minQty: 5, pct: 10, label: '5–9 db' },
  { minQty: 10, pct: 15, label: '10 db-tól' },
];

export const EXPRESS_SURCHARGE_PERCENT = 30;
export const STANDARD_LEAD_BUSINESS_DAYS = 3;
export const EXPRESS_LEAD_BUSINESS_DAYS = 1;
export const ORDER_CUTOFF_HOUR = 12;
/** Production starts when the proforma invoice is paid; estimates allow this much for confirmation and payment. */
export const CONFIRMATION_BUFFER_BUSINESS_DAYS = 1;
export const BUSINESS_TIME_ZONE = 'Europe/Budapest';

// ─── Shared building blocks ──────────────────────────────────────────────────────────────────────

export interface Use {
  readonly indoor: boolean;
  readonly outdoor: boolean;
}

/** Expected lifespan; always an estimate (exposure, climate and care change it a lot). */
export interface LifespanEstimate {
  readonly minYears: number;
  readonly maxYears: number;
  readonly context: 'kültéren' | 'beltéren';
  readonly isEstimate: true;
}

export interface MaterialSpec {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  /** Grammage in g/m², when meaningful and known. */
  readonly grammageGsm: { readonly min: number; readonly max: number } | null;
  readonly thicknessMm: number | null;
  readonly use: Use;
  readonly lifespan: LifespanEstimate | null;
}

export interface AreaMaterial extends MaterialSpec {
  readonly priceNetPerM2: number;
}

export interface FixedFormat {
  readonly id: string;
  readonly name: string;
  readonly widthCm: number;
  readonly heightCm: number;
  readonly priceNet: number;
}

export interface PerimeterOption {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly priceNetPerM: number;
}

export interface AreaAddOn {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly priceNetPerM2: number;
}

export interface PieceAddOn {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly unit: string;
  readonly priceNet: number;
  readonly maxCount: number;
}

export interface SizePreset {
  readonly widthCm: number;
  readonly heightCm: number;
}

export type Orientation = 'allo' | 'fekvo';
export const ORIENTATIONS: readonly { readonly id: Orientation; readonly name: string }[] = [
  { id: 'allo', name: 'Álló' },
  { id: 'fekvo', name: 'Fekvő' },
];

/** How a product is priced, for the UI: per m², fixed formats, or both. */
export type PricingModel = 'area' | 'formats' | 'formats-and-area';
/** Parcel class for courier shipping (brief: roll-up and tábla ship as a large parcel). */
export type ParcelSize = 'standard' | 'large';

const estimate = (minYears: number, maxYears: number, context: LifespanEstimate['context']): LifespanEstimate => ({
  minYears,
  maxYears,
  context,
  isEstimate: true,
});

// ─── Shop products ───────────────────────────────────────────────────────────────────────────────

export const MOLINO = {
  id: 'molino',
  name: 'Molinó',
  shortDescription: 'Nyomtatott molinó bármilyen méretben, 20 és 500 cm között oldalanként.',
  serviceItemSlug: 'molinok',
  pricingModel: 'area',
  parcel: 'standard',
  size: SIZE_LIMITS.molino,
  oversizeHint: 'Ennél nagyobb molinót toldással készítünk. Kérjen rá egyedi ajánlatot.',
  minimumNet: PRICES.molino.minimumPerItem,
  materials: [
    {
      id: 'standard',
      name: 'Standard frontlit molinó',
      description: 'Kül- és beltérre, UV-álló.',
      grammageGsm: { min: 440, max: 510 },
      thicknessMm: null,
      use: { indoor: true, outdoor: true },
      lifespan: estimate(1, 3, 'kültéren'),
      priceNetPerM2: PRICES.molino.perM2.standard,
    },
    {
      id: 'mesh',
      name: 'Hálós (mesh) molinó',
      description: 'Szélálló, kerítésre és állványra.',
      grammageGsm: null,
      thicknessMm: null,
      use: { indoor: false, outdoor: true },
      lifespan: estimate(1, 3, 'kültéren'),
      priceNetPerM2: PRICES.molino.perM2.mesh,
    },
    {
      id: 'blockout',
      name: 'Blockout molinó',
      description: 'Fényzáró anyag, kétoldalas nyomtatásra.',
      grammageGsm: null,
      thicknessMm: null,
      use: { indoor: true, outdoor: true },
      lifespan: estimate(1, 3, 'kültéren'),
      priceNetPerM2: PRICES.molino.perM2.blockout,
    },
    {
      id: 'textil',
      name: 'Textil (zászlóanyag)',
      description: 'Beltéri, gyűrődésmentes.',
      grammageGsm: null,
      thicknessMm: null,
      use: { indoor: true, outdoor: false },
      lifespan: null,
      priceNetPerM2: PRICES.molino.perM2.textil,
    },
  ],
  edgeFinishes: [
    {
      id: 'meretre-vagas',
      name: 'Méretre vágás',
      description: 'Szélkidolgozás nélkül, pontos méretre vágva.',
      priceNetPerM: PRICES.molino.edgePerM['meretre-vagas'],
    },
    {
      id: 'ringli',
      name: 'Ringli',
      description: 'Fém fűzőkarika 50 cm-enként.',
      priceNetPerM: PRICES.molino.edgePerM.ringli,
    },
    {
      id: 'szeges-ringli',
      name: 'Szegés + ringli',
      description: 'Megerősített, szegett szél, ringli 50 cm-enként.',
      priceNetPerM: PRICES.molino.edgePerM['szeges-ringli'],
    },
    {
      id: 'alagut',
      name: 'Alagútvarrás',
      description: 'Varrott alagút a szélen, rúdhoz.',
      priceNetPerM: PRICES.molino.edgePerM.alagut,
    },
  ],
  /** Quick-pick sizes for the configurator (UI convenience, any size in range is allowed). */
  suggestedSizes: [
    { widthCm: 100, heightCm: 50 },
    { widthCm: 200, heightCm: 100 },
    { widthCm: 300, heightCm: 100 },
    { widthCm: 300, heightCm: 200 },
  ],
} as const satisfies {
  materials: readonly AreaMaterial[];
  edgeFinishes: readonly PerimeterOption[];
  suggestedSizes: readonly SizePreset[];
  [key: string]: unknown;
};

export const ROLLUP = {
  id: 'rollup',
  name: 'Roll-up',
  shortDescription: 'Hordozható roll-up állvány nyomott grafikával, táskával együtt.',
  serviceItemSlug: 'roll-upok',
  pricingModel: 'formats',
  parcel: 'large',
  minimumNet: null,
  formats: [
    { id: '85x200', name: 'Standard 85 × 200 cm', widthCm: 85, heightCm: 200, priceNet: PRICES.rollup.formats['85x200'] },
    {
      id: '100x200',
      name: 'Prémium, széles talp 100 × 200 cm',
      widthCm: 100,
      heightCm: 200,
      priceNet: PRICES.rollup.formats['100x200'],
    },
    { id: '120x200', name: '120 × 200 cm', widthCm: 120, heightCm: 200, priceNet: PRICES.rollup.formats['120x200'] },
    { id: '150x200', name: '150 × 200 cm', widthCm: 150, heightCm: 200, priceNet: PRICES.rollup.formats['150x200'] },
  ],
  graphicOnly: {
    name: 'Csak cseregrafika',
    description: 'Új grafika meglévő roll-up szerkezetbe. Az ár méretfüggetlen.',
    priceNet: PRICES.rollup.graphicOnly,
  },
} as const satisfies { formats: readonly FixedFormat[]; [key: string]: unknown };

export const MATRICA = {
  id: 'matrica',
  name: 'Matrica, öntapadós fólia',
  shortDescription: 'Nyomtatott öntapadós fólia, igény szerint kontúrvágással és UV-laminálással.',
  serviceItemSlug: 'matricak',
  pricingModel: 'area',
  parcel: 'standard',
  size: SIZE_LIMITS.matrica,
  minimumNet: null,
  materials: [
    {
      id: 'monomer',
      name: 'Monomer fólia',
      description: 'Rövid távú felhasználásra.',
      grammageGsm: null,
      thicknessMm: null,
      use: { indoor: true, outdoor: true },
      lifespan: estimate(1, 3, 'kültéren'),
      priceNetPerM2: PRICES.matrica.perM2.monomer,
    },
    {
      id: 'polimer',
      name: 'Polimer fólia',
      description: 'Hosszú távra, autóra is.',
      grammageGsm: null,
      thicknessMm: null,
      use: { indoor: true, outdoor: true },
      lifespan: estimate(5, 7, 'kültéren'),
      priceNetPerM2: PRICES.matrica.perM2.polimer,
    },
    {
      id: 'one-way-vision',
      name: 'Kirakat-perforált fólia (one way vision)',
      description: 'Kívülről a grafika látszik, belülről át lehet látni rajta.',
      grammageGsm: null,
      thicknessMm: null,
      use: { indoor: false, outdoor: true },
      lifespan: estimate(1, 2, 'kültéren'),
      priceNetPerM2: PRICES.matrica.perM2['one-way-vision'],
    },
  ],
  areaAddOns: [
    {
      id: 'konturvagas',
      name: 'Kontúrvágás',
      description: 'A matricát a grafika körvonala mentén vágjuk ki.',
      priceNetPerM2: PRICES.matrica.addOnPerM2.konturvagas,
    },
    {
      id: 'uv-laminalas',
      name: 'UV-laminálás',
      description: 'Átlátszó védőréteg a nyomat felett, UV-sugárzás és kopás ellen.',
      priceNetPerM2: PRICES.matrica.addOnPerM2['uv-laminalas'],
    },
  ],
} as const satisfies { materials: readonly AreaMaterial[]; areaAddOns: readonly AreaAddOn[]; [key: string]: unknown };

export const PLAKAT = {
  id: 'plakat',
  name: 'Plakát',
  shortDescription:
    'Plakát 150 g/m²-es matt vagy fényes papírra, szabványos vagy egyedi méretben; utcai blueback plakát m²-re.',
  serviceItemSlug: 'plakatok',
  pricingModel: 'formats-and-area',
  parcel: 'standard',
  minimumNet: null,
  paper: {
    id: 'papir-150',
    name: 'Plakátpapír 150 g/m²',
    description: 'Matt vagy fényes felülettel.',
    grammageGsm: { min: 150, max: 150 },
    thicknessMm: null,
    use: { indoor: true, outdoor: false },
    lifespan: null,
  },
  paperFinishes: [
    { id: 'matt', name: 'Matt' },
    { id: 'fenyes', name: 'Fényes' },
  ],
  formats: [
    { id: 'a3', name: 'A3', widthCm: 29.7, heightCm: 42, priceNet: PRICES.plakat.formats.a3 },
    { id: 'a2', name: 'A2', widthCm: 42, heightCm: 59.4, priceNet: PRICES.plakat.formats.a2 },
    { id: 'a1', name: 'A1', widthCm: 59.4, heightCm: 84.1, priceNet: PRICES.plakat.formats.a1 },
    { id: 'a0', name: 'A0', widthCm: 84.1, heightCm: 118.9, priceNet: PRICES.plakat.formats.a0 },
    { id: 'b1', name: 'B1 (70 × 100 cm)', widthCm: 70, heightCm: 100, priceNet: PRICES.plakat.formats.b1 },
  ],
  blueback: {
    id: 'blueback',
    name: 'Blueback (utcai plakát)',
    description: 'Utcai plakát egyedi méretben, m²-ár alapján.',
    grammageGsm: null,
    thicknessMm: null,
    use: { indoor: false, outdoor: true },
    lifespan: null,
    priceNetPerM2: PRICES.plakat.bluebackPerM2,
  },
  bluebackSize: SIZE_LIMITS.plakatBlueback,
  /** Any size on the same paper, priced per m² with a per-piece minimum. */
  custom: {
    id: 'egyedi',
    name: 'Egyedi méret',
    description: 'Tetszőleges méret plakátpapírra, m²-ár alapján.',
    priceNetPerM2: PRICES.plakat.customPerM2,
    size: SIZE_LIMITS.plakatCustom,
    minimumNet: PRICES.plakat.customMinimum,
  },
} as const satisfies {
  paper: MaterialSpec;
  formats: readonly FixedFormat[];
  blueback: AreaMaterial;
  [key: string]: unknown;
};

export const TABLA = {
  id: 'tabla',
  name: 'Tábla',
  shortDescription: 'Nyomtatott tábla PVC-ből, dibondból vagy plexiből, méretre vágva.',
  serviceItemSlug: 'tablak',
  pricingModel: 'area',
  parcel: 'large',
  size: { minCm: SIZE_LIMITS.tabla.minCm, maxCm: SIZE_LIMITS.tabla.maxCm },
  minBillableM2: SIZE_LIMITS.tabla.minBillableM2,
  minimumNet: null,
  materials: [
    {
      id: 'pvc-3mm',
      name: 'PVC habtábla 3 mm',
      description: 'Könnyű, merev habosított PVC lemez.',
      grammageGsm: null,
      thicknessMm: 3,
      use: { indoor: true, outdoor: false },
      lifespan: null,
      priceNetPerM2: PRICES.tabla.perM2['pvc-3mm'],
    },
    {
      id: 'pvc-5mm',
      name: 'PVC habtábla 5 mm',
      description: 'Vastagabb, merevebb habosított PVC lemez.',
      grammageGsm: null,
      thicknessMm: 5,
      use: { indoor: true, outdoor: false },
      lifespan: null,
      priceNetPerM2: PRICES.tabla.perM2['pvc-5mm'],
    },
    {
      id: 'dibond-3mm',
      name: 'Dibond (alu kompozit) 3 mm',
      description: 'Alumínium kompozit lemez, kül- és beltérre.',
      grammageGsm: null,
      thicknessMm: 3,
      use: { indoor: true, outdoor: true },
      lifespan: null,
      priceNetPerM2: PRICES.tabla.perM2['dibond-3mm'],
    },
    {
      id: 'plexi-3mm',
      name: 'Plexi 3 mm',
      description: 'Átlátszó akril lemez, elegáns megjelenés.',
      grammageGsm: null,
      thicknessMm: 3,
      use: { indoor: true, outdoor: true },
      lifespan: null,
      priceNetPerM2: PRICES.tabla.perM2['plexi-3mm'],
    },
  ],
  pieceAddOns: [
    {
      id: 'furat',
      name: 'Furatolás',
      description: 'Rögzítőfurat a táblán.',
      unit: 'db',
      priceNet: PRICES.tabla.addOnEach.furat,
      maxCount: 50,
    },
    {
      id: 'tavtarto',
      name: 'Távtartó csavar szett (4 db)',
      description: 'Falra szereléshez, a tábla a faltól elemelve.',
      unit: 'szett',
      priceNet: PRICES.tabla.addOnEach.tavtarto,
      maxCount: 25,
    },
  ],
} as const satisfies { materials: readonly AreaMaterial[]; pieceAddOns: readonly PieceAddOn[]; [key: string]: unknown };

export const VASZONKEP = {
  id: 'vaszonkep',
  name: 'Vászonkép',
  shortDescription: 'Fakeretre feszített vászonkép szabványos vagy egyedi méretben.',
  serviceItemSlug: 'vaszonkepek',
  pricingModel: 'formats-and-area',
  parcel: 'standard',
  canvas: {
    id: 'vaszon',
    name: 'Vászon fakeretre feszítve',
    description: 'Fakeretre feszített nyomtatott vászon.',
    grammageGsm: null,
    thicknessMm: null,
    use: { indoor: true, outdoor: false },
    lifespan: null,
  },
  formats: [
    { id: '30x40', name: '30 × 40 cm', widthCm: 30, heightCm: 40, priceNet: PRICES.vaszonkep.formats['30x40'] },
    { id: '50x70', name: '50 × 70 cm', widthCm: 50, heightCm: 70, priceNet: PRICES.vaszonkep.formats['50x70'] },
    { id: '60x90', name: '60 × 90 cm', widthCm: 60, heightCm: 90, priceNet: PRICES.vaszonkep.formats['60x90'] },
  ],
  custom: {
    name: 'Egyedi méret',
    priceNetPerM2: PRICES.vaszonkep.customPerM2,
    size: SIZE_LIMITS.vaszonkepCustom,
  },
  /** Minimum price of a custom-size canvas (per piece). */
  minimumNet: PRICES.vaszonkep.customMinimum,
} as const satisfies { canvas: MaterialSpec; formats: readonly FixedFormat[]; [key: string]: unknown };

export const SHOP_PRODUCTS = {
  molino: MOLINO,
  rollup: ROLLUP,
  matrica: MATRICA,
  plakat: PLAKAT,
  tabla: TABLA,
  vaszonkep: VASZONKEP,
} as const;

export type ShopProductId = keyof typeof SHOP_PRODUCTS;
export const SHOP_PRODUCT_IDS = ['molino', 'rollup', 'matrica', 'plakat', 'tabla', 'vaszonkep'] as const satisfies readonly ShopProductId[];
export const SHOP_PRODUCT_LIST = SHOP_PRODUCT_IDS.map((id) => SHOP_PRODUCTS[id]);

export type MolinoMaterialId = (typeof MOLINO.materials)[number]['id'];
export type MolinoEdgeFinishId = (typeof MOLINO.edgeFinishes)[number]['id'];
export type RollupFormatId = (typeof ROLLUP.formats)[number]['id'];
export type MatricaMaterialId = (typeof MATRICA.materials)[number]['id'];
export type MatricaAddOnId = (typeof MATRICA.areaAddOns)[number]['id'];
export type PlakatFormatId = (typeof PLAKAT.formats)[number]['id'];
export type PaperFinishId = (typeof PLAKAT.paperFinishes)[number]['id'];
export type TablaMaterialId = (typeof TABLA.materials)[number]['id'];
export type TablaAddOnId = (typeof TABLA.pieceAddOns)[number]['id'];
export type VaszonkepFormatId = (typeof VASZONKEP.formats)[number]['id'];

export const isShopProductId = (value: unknown): value is ShopProductId =>
  typeof value === 'string' && Object.hasOwn(SHOP_PRODUCTS, value);

// ─── Shipping ────────────────────────────────────────────────────────────────────────────────────

export type ShippingMethodId = 'szemelyes' | 'futar' | 'telepites';

export interface ShippingMethod {
  readonly id: ShippingMethodId;
  readonly name: string;
  readonly description: string;
  /** null: priced individually, the workshop states the fee when it confirms the order. */
  readonly priceNet: number | null;
  /** Price when the cart holds a large-parcel product (roll-up, tábla). */
  readonly largeParcelPriceNet: number | null;
  /** What the address entered for this method is used for; null when no address is needed. */
  readonly addressLabel: string | null;
}

export const SHIPPING_METHODS: readonly ShippingMethod[] = [
  {
    id: 'szemelyes',
    name: 'Személyes átvétel a műhelyben',
    description: 'Ingyenes. Budapest, Schweidel József u. 1–3.',
    priceNet: PRICES.shipping.szemelyes,
    largeParcelPriceNet: PRICES.shipping.szemelyes,
    addressLabel: null,
  },
  {
    id: 'futar',
    name: 'Futárszolgálat',
    description: 'Nagy csomag (roll-up, tábla) esetén magasabb díjjal.',
    priceNet: PRICES.shipping.futar,
    largeParcelPriceNet: PRICES.shipping.futarNagyCsomag,
    addressLabel: 'Szállítási cím',
  },
  {
    id: 'telepites',
    name: 'Telepítéssel',
    description: 'A helyszínen felszereljük, illetve felragasztjuk. Ilyenkor nincs külön átvétel.',
    priceNet: null,
    largeParcelPriceNet: null,
    addressLabel: 'A telepítés helyszíne',
  },
];

export const SHIPPING_METHOD_IDS = ['szemelyes', 'futar', 'telepites'] as const satisfies readonly ShippingMethodId[];

/** Shown with the installation option: its fee is set when the workshop confirms the order. */
export const INSTALLATION_NOTE =
  'A telepítés díja egyedi: a rendelés visszaigazolásakor adjuk meg. Ha szükséges, a méreteket a helyszínen ellenőrizzük.';

// ─── Quote (custom work) wizard ──────────────────────────────────────────────────────────────────

export type QuoteFieldType = 'text' | 'textarea' | 'number' | 'select' | 'multiselect' | 'date' | 'file';

export interface QuoteFieldOption {
  readonly value: string;
  readonly label: string;
}

interface QuoteFieldBase {
  readonly id: string;
  readonly label: string;
  readonly required: boolean;
  readonly help?: string;
  readonly placeholder?: string;
  /** The field is shown (and validated) only when another select field has one of these values. */
  readonly visibleWhen?: { readonly field: string; readonly equals: readonly string[] };
}

export type QuoteFieldDef =
  | (QuoteFieldBase & { readonly type: 'text' | 'textarea'; readonly maxLength: number })
  | (QuoteFieldBase & {
      readonly type: 'number';
      readonly unit?: string;
      readonly min: number;
      readonly max: number;
      readonly integer: boolean;
    })
  | (QuoteFieldBase & { readonly type: 'select' | 'multiselect'; readonly options: readonly QuoteFieldOption[] })
  | (QuoteFieldBase & { readonly type: 'date' })
  | (QuoteFieldBase & { readonly type: 'file'; readonly accept: readonly string[]; readonly maxFiles: number });

/** Accept hints for file inputs. The upload API owns the real allow-list and magic-byte checks. */
export const FILE_ACCEPT = {
  photo: ['.jpg', '.jpeg', '.png', '.webp', '.heic'],
  artwork: ['.pdf', '.jpg', '.jpeg', '.png', '.tif', '.tiff', '.svg', '.eps', '.ai'],
  model3d: ['.stl', '.obj', '.3mf'],
  any: ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.heic', '.tif', '.tiff', '.svg', '.eps', '.ai'],
} as const;

const MAX_FILES_PER_FIELD = 10;

const photoField = (id: string, label: string): QuoteFieldDef => ({
  id,
  label,
  type: 'file',
  required: false,
  accept: FILE_ACCEPT.photo,
  maxFiles: MAX_FILES_PER_FIELD,
});

export interface QuoteType {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  /** Work happens on site: the address is required and a survey can be requested. */
  readonly locationRequired: boolean;
  /** Overrides the common location label when the place has a more specific meaning. */
  readonly locationLabel?: string;
  readonly fields: readonly QuoteFieldDef[];
  /** At least one field of each group must be filled. */
  readonly requireOneOf?: readonly { readonly fields: readonly string[]; readonly message: string }[];
}

export const QUOTE_TYPES = [
  {
    id: 'autofoliazas',
    name: 'Autófóliázás, flotta-dekor',
    description: 'Feliratok, részleges vagy teljes dekor egy járműre vagy egész flottára.',
    locationRequired: true,
    fields: [
      {
        id: 'jarmuTipus',
        label: 'Jármű típusa',
        type: 'text',
        required: true,
        maxLength: 200,
        placeholder: 'pl. Ford Transit, hosszított',
      },
      { id: 'darabszam', label: 'Járművek száma', type: 'number', required: true, unit: 'db', min: 1, max: 500, integer: true },
      {
        id: 'terjedelem',
        label: 'Mekkora felületet fóliázzunk?',
        type: 'select',
        required: true,
        options: [
          { value: 'teljes', label: 'Teljes fóliázás' },
          { value: 'reszleges', label: 'Részleges dekor' },
          { value: 'felirat', label: 'Csak felirat' },
        ],
      },
      photoField('jarmuFotok', 'Fotók a járműről'),
      {
        id: 'grafika',
        label: 'Van már grafikája?',
        type: 'select',
        required: true,
        options: [
          { value: 'van', label: 'Igen, feltöltöm' },
          { value: 'tervezes', label: 'Nincs, tervezést kérek' },
        ],
      },
      {
        id: 'grafikaFajlok',
        label: 'Meglévő grafika',
        type: 'file',
        required: false,
        accept: FILE_ACCEPT.artwork,
        maxFiles: MAX_FILES_PER_FIELD,
        visibleWhen: { field: 'grafika', equals: ['van'] },
      },
    ],
  },
  {
    id: 'kirakat',
    name: 'Kirakat- és üvegfóliázás',
    description: 'Dekor, homokfúvott hatású, fényvédő vagy one way vision fólia kirakatra, üvegfelületre.',
    locationRequired: true,
    fields: [
      { id: 'feluletM2', label: 'Felület', type: 'number', required: false, unit: 'm²', min: 0.1, max: 1000, integer: false },
      {
        id: 'meretek',
        label: 'Méretek',
        type: 'text',
        required: false,
        maxLength: 300,
        placeholder: 'pl. 2 db 120 × 200 cm-es üvegtábla',
      },
      {
        id: 'foliaTipus',
        label: 'Fólia típusa',
        type: 'multiselect',
        required: true,
        options: [
          { value: 'dekor', label: 'Dekor' },
          { value: 'homokfuvott', label: 'Homokfúvott hatású' },
          { value: 'fenyvedo', label: 'Fényvédő' },
          { value: 'one-way-vision', label: 'One way vision' },
        ],
      },
      photoField('kirakatFotok', 'Fotó a kirakatról'),
    ],
    requireOneOf: [
      { fields: ['feluletM2', 'meretek'], message: 'Adja meg a felületet m²-ben, vagy írja le a méreteket.' },
    ],
  },
  {
    id: 'ceger',
    name: 'Cégér, reklámtábla',
    description: 'Cégér vagy reklámtábla, igény szerint vázszerkezettel és világítással.',
    locationRequired: true,
    fields: [
      { id: 'szelessegCm', label: 'Szélesség (kb.)', type: 'number', required: true, unit: 'cm', min: 10, max: 5000, integer: true },
      { id: 'magassagCm', label: 'Magasság (kb.)', type: 'number', required: true, unit: 'cm', min: 10, max: 2000, integer: true },
      {
        id: 'vilagitas',
        label: 'Világítás',
        type: 'select',
        required: true,
        options: [
          { value: 'nincs', label: 'Nincs' },
          { value: 'belso-led', label: 'Belső LED' },
          { value: 'kulso', label: 'Külső megvilágítás' },
        ],
      },
      {
        id: 'vazszerkezet',
        label: 'Kell vázszerkezet?',
        type: 'select',
        required: true,
        options: [
          { value: 'igen', label: 'Igen' },
          { value: 'nem', label: 'Nem' },
          { value: 'nem-tudom', label: 'Nem tudom, kérem a javaslatukat' },
        ],
      },
      {
        id: 'rogzitesiFelulet',
        label: 'Rögzítési felület',
        type: 'select',
        required: false,
        options: [
          { value: 'homlokzat', label: 'Vakolt vagy burkolt homlokzat' },
          { value: 'tegla-beton', label: 'Tégla vagy beton fal' },
          { value: 'fem-fa', label: 'Fém vagy fa szerkezet' },
          { value: 'uveg', label: 'Üvegfelület' },
          { value: 'egyeb', label: 'Egyéb, nem tudom' },
        ],
      },
      photoField('homlokzatFotok', 'Fotó a homlokzatról'),
    ],
  },
  {
    id: 'betuk',
    name: 'Világító és plasztik betűk, logók',
    description: 'Térhatású betűk és logók, elő- vagy hátvilágítással, vagy világítás nélkül.',
    locationRequired: true,
    fields: [
      { id: 'feliratSzoveg', label: 'Felirat szövege', type: 'text', required: false, maxLength: 200 },
      {
        id: 'logo',
        label: 'Logó',
        type: 'file',
        required: false,
        accept: FILE_ACCEPT.artwork,
        maxFiles: MAX_FILES_PER_FIELD,
      },
      { id: 'betumagassagCm', label: 'Betűmagasság', type: 'number', required: true, unit: 'cm', min: 1, max: 500, integer: false },
      {
        id: 'anyag',
        label: 'Anyag',
        type: 'select',
        required: true,
        options: [
          { value: 'plexi', label: 'Plexi' },
          { value: 'alu', label: 'Alumínium' },
          { value: 'pvc', label: 'PVC' },
          { value: 'javaslat', label: 'Kérem a javaslatukat' },
        ],
      },
      {
        id: 'vilagitas',
        label: 'Világítás',
        type: 'select',
        required: true,
        options: [
          { value: 'elovilagitas', label: 'Elővilágítás' },
          { value: 'hatvilagitas', label: 'Hátvilágítás' },
          { value: 'nincs', label: 'Nincs' },
        ],
      },
    ],
    requireOneOf: [
      { fields: ['feliratSzoveg', 'logo'], message: 'Adja meg a felirat szövegét, vagy töltse fel a logót.' },
    ],
  },
  {
    id: 'led-fal',
    name: 'LED-fal',
    description: 'Bel- vagy kültéri LED-fal vásárlásra vagy rendezvényre bérelve.',
    locationRequired: true,
    fields: [
      {
        id: 'elhelyezes',
        label: 'Elhelyezés',
        type: 'select',
        required: true,
        options: [
          { value: 'belter', label: 'Beltér' },
          { value: 'kulter', label: 'Kültér' },
        ],
      },
      { id: 'szelessegCm', label: 'Szélesség', type: 'number', required: true, unit: 'cm', min: 20, max: 5000, integer: true },
      { id: 'magassagCm', label: 'Magasság', type: 'number', required: true, unit: 'cm', min: 20, max: 3000, integer: true },
      {
        id: 'konstrukcio',
        label: 'Vásárlás vagy bérlés?',
        type: 'select',
        required: true,
        options: [
          { value: 'vasarlas', label: 'Vásárlás' },
          { value: 'berles', label: 'Bérlés' },
        ],
      },
      {
        id: 'rendezvenyDatuma',
        label: 'Rendezvény dátuma',
        type: 'date',
        required: true,
        visibleWhen: { field: 'konstrukcio', equals: ['berles'] },
      },
    ],
  },
  {
    id: 'rendezveny',
    name: 'Rendezvény díszlet, fotófal',
    description: 'Díszlet, fotófal és rendezvénydekor, igény szerint felépítéssel és bontással.',
    locationRequired: true,
    locationLabel: 'Rendezvény helyszíne (cím)',
    fields: [
      { id: 'rendezvenyDatuma', label: 'Rendezvény dátuma', type: 'date', required: true },
      { id: 'meret', label: 'Méret', type: 'text', required: true, maxLength: 300, placeholder: 'pl. fotófal 3 × 2,5 m' },
      {
        id: 'felepitesBontas',
        label: 'Felépítés és bontás',
        type: 'select',
        required: true,
        options: [
          { value: 'mindketto', label: 'Felépítés és bontás is' },
          { value: 'felepites', label: 'Csak felépítés' },
          { value: 'nem', label: 'Nem kell, csak a legyártás' },
        ],
      },
    ],
  },
  {
    id: 'kinalopult',
    name: 'Kínálópult fóliázás és telepítés',
    description: 'Promóciós és kínálópultok fóliázása, helyszíni telepítéssel.',
    locationRequired: true,
    fields: [
      { id: 'pultokSzama', label: 'Pultok száma', type: 'number', required: true, unit: 'db', min: 1, max: 500, integer: true },
      {
        id: 'pultMeret',
        label: 'Pultok mérete',
        type: 'text',
        required: true,
        maxLength: 300,
        placeholder: 'pl. 200 × 90 × 100 cm (sz × mé × ma)',
      },
      photoField('pultFotok', 'Fotó a pultokról'),
    ],
  },
  {
    id: '3d-nyomtatas',
    name: '3D nyomtatás',
    description: 'Egyedi tárgyak, betűk és makettek 3D nyomtatással.',
    locationRequired: false,
    fields: [
      {
        id: 'modellFajl',
        label: 'Modellfájl (STL, OBJ, 3MF)',
        type: 'file',
        required: false,
        accept: FILE_ACCEPT.model3d,
        maxFiles: MAX_FILES_PER_FIELD,
      },
      { id: 'leiras', label: 'Leírás', type: 'textarea', required: false, maxLength: 4000 },
      {
        id: 'anyag',
        label: 'Anyag',
        type: 'select',
        required: true,
        options: [
          { value: 'pla', label: 'PLA' },
          { value: 'petg', label: 'PETG' },
          { value: 'javaslat', label: 'Kérem a javaslatukat' },
        ],
      },
      { id: 'meret', label: 'Méret', type: 'text', required: false, maxLength: 200, placeholder: 'pl. 20 × 10 × 5 cm' },
      { id: 'darabszam', label: 'Darabszám', type: 'number', required: true, unit: 'db', min: 1, max: 10000, integer: true },
    ],
    requireOneOf: [
      { fields: ['modellFajl', 'leiras'], message: 'Töltsön fel modellfájlt, vagy írja le, mit szeretne.' },
    ],
  },
  {
    id: 'egyeb',
    name: 'Egyéb arculati megoldás',
    description: 'Minden más egyedi reklám- és díszítési munka. Írja le, mire van szüksége.',
    locationRequired: false,
    fields: [
      { id: 'leiras', label: 'Leírás', type: 'textarea', required: true, maxLength: 4000 },
      {
        id: 'fajlok',
        label: 'Fájlok',
        type: 'file',
        required: false,
        accept: FILE_ACCEPT.any,
        maxFiles: MAX_FILES_PER_FIELD,
      },
    ],
  },
] as const satisfies readonly QuoteType[];

export type QuoteTypeId = (typeof QUOTE_TYPES)[number]['id'];
export const QUOTE_TYPE_IDS = [
  'autofoliazas',
  'kirakat',
  'ceger',
  'betuk',
  'led-fal',
  'rendezveny',
  'kinalopult',
  '3d-nyomtatas',
  'egyeb',
] as const satisfies readonly QuoteTypeId[];

export function getQuoteType(id: QuoteTypeId): QuoteType;
export function getQuoteType(id: string): QuoteType | undefined;
export function getQuoteType(id: string): QuoteType | undefined {
  return (QUOTE_TYPES as readonly QuoteType[]).find((t) => t.id === id);
}

export const MAX_QUOTE_UPLOADS = 20;

/** Labels and help for the fields every quote wizard asks (validated by QuoteRequestSchema). */
export const QUOTE_COMMON_FIELDS = {
  location: { label: 'Helyszín (cím)', help: 'Ahol a munkát el kell végezni, illetve ahová felmérni megyünk.' },
  deadline: { label: 'Határidő', help: 'Mikorra van szüksége az elkészült munkára?' },
  uploads: { label: 'Fájlok, fotók', help: 'Grafika, fotó a helyszínről, vázlat, bármi, ami segít.' },
  contact: {
    name: { label: 'Név' },
    email: { label: 'E-mail-cím' },
    phone: { label: 'Telefonszám' },
    company: { label: 'Cégnév (nem kötelező)' },
  },
  survey: {
    label: 'Helyszíni felmérést kérek',
    help: 'Kiszállunk, felmérjük, és pontos ajánlatot adunk. Az időpontot telefonon egyeztetjük.',
  },
} as const;

/** Shown on the quote form (brief 4.2). */
export const QUOTE_PRICE_NOTICE = 'A végleges árajánlat eltérhet a kalkulált ártól.';

/** The wizard's steps, in order (brief 7.5). */
export const QUOTE_WIZARD_STEPS = [
  { id: 'tipus', title: 'Munka típusa' },
  { id: 'reszletek', title: 'Részletek' },
  { id: 'helyszin', title: 'Helyszín és fotók' },
  { id: 'kapcsolat', title: 'Kapcsolat és felmérés' },
] as const;

// ─── Service taxonomy (brief 3) ──────────────────────────────────────────────────────────────────

export type ServiceGroupSlug = 'foliazas' | 'ceger-vilagito-reklam' | 'nyomtatas' | 'rendezveny-egyedi';

export interface ServiceItem {
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  /** Shop product that can be configured and ordered online, if any. */
  readonly shopProductId: ShopProductId | null;
  /** Quote wizard type for custom requests, if any. */
  readonly quoteTypeId: QuoteTypeId | null;
}

export interface ServiceGroup {
  readonly slug: ServiceGroupSlug;
  readonly name: string;
  readonly description: string;
  readonly items: readonly ServiceItem[];
}

export const SERVICE_GROUPS: readonly ServiceGroup[] = [
  {
    slug: 'foliazas',
    name: 'Fóliázás',
    description: 'Járművek, kirakatok, üvegfelületek és pultok fóliázása, felméréstől a felragasztásig.',
    items: [
      {
        slug: 'autofoliazas-flotta-dekor',
        name: 'Autófóliázás és flotta-dekor',
        description: 'Feliratok, részleges és teljes dekor egy autóra vagy egész flottára.',
        shopProductId: null,
        quoteTypeId: 'autofoliazas',
      },
      {
        slug: 'kirakat-uvegfoliazas',
        name: 'Kirakat- és üvegfóliázás',
        description: 'Dekor, homokfúvott hatású, fényvédő és one way vision fóliák.',
        shopProductId: null,
        quoteTypeId: 'kirakat',
      },
      {
        slug: 'kinalopult-foliazas',
        name: 'Kínálópultok fóliázása és telepítése',
        description: 'Promóciós pultok fóliázása, helyszíni telepítéssel.',
        shopProductId: null,
        quoteTypeId: 'kinalopult',
      },
      {
        slug: 'egyeb-feluletek-foliazasa',
        name: 'Egyéb felületek fóliázása',
        description: 'Falak, ajtók, bútorok és más felületek fóliázása.',
        shopProductId: null,
        quoteTypeId: 'egyeb',
      },
    ],
  },
  {
    slug: 'ceger-vilagito-reklam',
    name: 'Cégér és világító reklám',
    description: 'Cégérek, reklámtáblák, világító és plasztik betűk, LED-falak, saját műhelyben gyártva.',
    items: [
      {
        slug: 'cegerkeszites',
        name: 'Cégérkészítés',
        description: 'Cégérek tervezése, gyártása és felszerelése.',
        shopProductId: null,
        quoteTypeId: 'ceger',
      },
      {
        slug: 'reklamtablak-led-vilagitassal',
        name: 'Reklámtáblák vázszerkezettel és belső LED-es világítással',
        description: 'Vázszerkezetes reklámtáblák, igény szerint belső LED-es világítással.',
        shopProductId: null,
        quoteTypeId: 'ceger',
      },
      {
        slug: 'vilagito-betuk',
        name: 'Világító betűk',
        description: 'Elő- vagy hátvilágított betűk és logók.',
        shopProductId: null,
        quoteTypeId: 'betuk',
      },
      {
        slug: 'plasztik-betuk-logok',
        name: 'Plasztik betűk és logók',
        description: 'Térhatású betűk és logók plexiből, alumíniumból vagy PVC-ből.',
        shopProductId: null,
        quoteTypeId: 'betuk',
      },
      {
        slug: 'led-falak',
        name: 'LED-falak',
        description: 'Bel- és kültéri LED-falak vásárlásra vagy bérlésre.',
        shopProductId: null,
        quoteTypeId: 'led-fal',
      },
    ],
  },
  {
    slug: 'nyomtatas',
    name: 'Nyomtatás',
    description: 'Molinók, roll-upok, táblák, matricák, plakátok és vászonképek, online is megrendelhetők.',
    items: [
      {
        slug: 'molinok',
        name: 'Molinók',
        description: 'Kül- és beltéri molinók bármilyen méretben, szélkidolgozással.',
        shopProductId: 'molino',
        quoteTypeId: null,
      },
      {
        slug: 'feszitett-ponyva',
        name: 'Feszített ponyva kihelyezéssel',
        description: 'Keretre feszített ponyva, helyszíni kihelyezéssel.',
        shopProductId: null,
        quoteTypeId: 'ceger',
      },
      {
        slug: 'roll-upok',
        name: 'Roll-upok',
        description: 'Roll-up állványok grafikával, táskával; cseregrafika meglévő szerkezetbe.',
        shopProductId: 'rollup',
        quoteTypeId: null,
      },
      {
        slug: 'tablak',
        name: 'Táblák',
        description: 'PVC, dibond és plexi táblák, furatolással, távtartóval.',
        shopProductId: 'tabla',
        quoteTypeId: null,
      },
      {
        slug: 'matricak',
        name: 'Matricák',
        description: 'Öntapadós fóliák rövid és hosszú távra, kontúrvágással.',
        shopProductId: 'matrica',
        quoteTypeId: null,
      },
      {
        slug: 'plakatok',
        name: 'Plakátok',
        description: 'A3-tól A0-ig, B1, és utcai blueback plakát.',
        shopProductId: 'plakat',
        quoteTypeId: null,
      },
      {
        slug: 'vaszonkepek',
        name: 'Vászonképek',
        description: 'Fakeretre feszített vászonképek szabványos és egyedi méretben.',
        shopProductId: 'vaszonkep',
        quoteTypeId: null,
      },
    ],
  },
  {
    slug: 'rendezveny-egyedi',
    name: 'Rendezvény és egyedi',
    description: 'Rendezvénydíszlet, fotófal, 3D nyomtatás és minden, ami egyedi.',
    items: [
      {
        slug: 'rendezveny-diszletezes',
        name: 'Rendezvény díszletezés és fóliázás',
        description: 'Díszletek és rendezvénydekor, felépítéssel és bontással.',
        shopProductId: null,
        quoteTypeId: 'rendezveny',
      },
      {
        slug: 'fotofal-epites',
        name: 'Fotófal építés',
        description: 'Egyedi fotófalak rendezvényekre.',
        shopProductId: null,
        quoteTypeId: 'rendezveny',
      },
      {
        slug: '3d-nyomtatas',
        name: '3D nyomtatási munkák',
        description: 'Egyedi tárgyak, betűk, makettek 3D nyomtatással.',
        shopProductId: null,
        quoteTypeId: '3d-nyomtatas',
      },
      {
        slug: 'egyedi-megrendelesek',
        name: 'Egyedi reklám- és díszítési megrendelések',
        description: 'Ha nem találja a listában, írja le, mire van szüksége.',
        shopProductId: null,
        quoteTypeId: 'egyeb',
      },
      {
        slug: 'egyeb-arculati-megoldasok',
        name: 'Egyéb arculati megoldások',
        description: 'Arculati elemek egyedi igény szerint.',
        shopProductId: null,
        quoteTypeId: 'egyeb',
      },
    ],
  },
];

/** The promise that applies to every service group. */
export const ON_SITE_SERVICE = {
  name: 'Helyszíni felmérés és telepítés',
  description: 'Kiszállunk, felmérjük, felszereljük.',
} as const;

export const isShopOrderable = (item: ServiceItem): boolean => item.shopProductId !== null;
export const isQuoteBased = (item: ServiceItem): boolean => item.quoteTypeId !== null;

export const getServiceGroup = (slug: string): ServiceGroup | undefined => SERVICE_GROUPS.find((g) => g.slug === slug);
