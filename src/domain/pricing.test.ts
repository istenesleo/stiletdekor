import { describe, expect, it } from 'vitest';
import {
  ConfigurationError,
  configDimensionsCm,
  describeConfiguration,
  discountTierFor,
  grossOf,
  nextDiscountHint,
  priceCart,
  priceConfiguration,
  tryPriceConfiguration,
  validateConfiguration,
  vatOf,
  type MatricaConfig,
  type MolinoConfig,
  type ProductConfig,
  type RollupConfig,
  type TablaConfig,
} from './pricing';

const molino = (over: Partial<MolinoConfig> = {}): MolinoConfig => ({
  productId: 'molino',
  materialId: 'standard',
  edgeFinishId: 'meretre-vagas',
  widthCm: 200,
  heightCm: 100,
  quantity: 1,
  express: false,
  ...over,
});

const rollup = (over: Partial<RollupConfig> = {}): RollupConfig => ({
  productId: 'rollup',
  formatId: '85x200',
  graphicOnly: false,
  quantity: 1,
  express: false,
  ...over,
});

const matrica = (over: Partial<MatricaConfig> = {}): MatricaConfig => ({
  productId: 'matrica',
  materialId: 'monomer',
  widthCm: 100,
  heightCm: 50,
  addOnIds: [],
  quantity: 1,
  express: false,
  ...over,
});

const tabla = (over: Partial<TablaConfig> = {}): TablaConfig => ({
  productId: 'tabla',
  materialId: 'pvc-3mm',
  widthCm: 100,
  heightCm: 50,
  addOnCounts: { furat: 0, tavtarto: 0 },
  quantity: 1,
  express: false,
  ...over,
});

/** Issues thrown by priceConfiguration, as plain messages. */
function thrownMessages(config: unknown): string[] {
  try {
    priceConfiguration(config as ProductConfig);
  } catch (error) {
    if (error instanceof ConfigurationError) return error.issues.map((issue) => issue.message);
    throw error;
  }
  throw new Error('expected a ConfigurationError');
}

describe('priceConfiguration – brief reference values', () => {
  it('molinó standard 200×100, méretre vágás, 1 db = 7 980 net / 10 135 gross', () => {
    const price = priceConfiguration(molino());
    expect(price.lines).toEqual([
      { label: 'Standard frontlit molinó', quantity: 2, unit: 'm²', unitPriceNet: 3990, amountNet: 7980 },
      { label: 'Szélkidolgozás: Méretre vágás', quantity: 6, unit: 'fm', unitPriceNet: 0, amountNet: 0 },
    ]);
    expect(price.itemNet).toBe(7980);
    expect(price.minimumApplied).toBe(false);
    expect(price.netTotal).toBe(7980);
    expect(price.vatTotal).toBe(2155);
    expect(price.grossTotal).toBe(10135);
  });

  it('+ szegés + ringli = 7 980 + 2 100 = 10 080 net', () => {
    const price = priceConfiguration(molino({ edgeFinishId: 'szeges-ringli' }));
    expect(price.lines[1]).toEqual({
      label: 'Szélkidolgozás: Szegés + ringli',
      quantity: 6,
      unit: 'fm',
      unitPriceNet: 350,
      amountNet: 2100,
    });
    expect(price.itemNet).toBe(10080);
    expect(price.netTotal).toBe(10080);
  });

  it('50×50 standard = 998 → minimum 4 990', () => {
    const price = priceConfiguration(molino({ widthCm: 50, heightCm: 50 }));
    expect(price.lines[0]?.amountNet).toBe(998);
    expect(price.lines[0]?.quantity).toBe(0.25);
    expect(price.minimumApplied).toBe(true);
    expect(price.minimumNet).toBe(4990);
    expect(price.lines.at(-1)).toEqual({
      label: 'Kiegészítés a minimális tételárig',
      quantity: 1,
      unit: 'db',
      unitPriceNet: 3992,
      amountNet: 3992,
    });
    expect(price.itemNet).toBe(4990);
    expect(price.netTotal).toBe(4990);
  });

  it('5 × 200×100 standard = 39 900 − 10% = 35 910', () => {
    const price = priceConfiguration(molino({ quantity: 5 }));
    expect(price.subtotalNet).toBe(39900);
    expect(price.discountPct).toBe(10);
    expect(price.discountNet).toBe(3990);
    expect(price.expressSurchargeNet).toBe(0);
    expect(price.netTotal).toBe(35910);
  });

  it('express on that = 35 910 + 30% = 46 683 (surcharge on the discounted net)', () => {
    const price = priceConfiguration(molino({ quantity: 5, express: true }));
    expect(price.expressSurchargeNet).toBe(10773);
    expect(price.netTotal).toBe(46683);
    expect(price.vatTotal).toBe(12604); // 46 683 × 0,27 = 12 604,41
    expect(price.grossTotal).toBe(59287);
  });

  it('roll-up standard 85×200, 1 db = 24 900 net', () => {
    const price = priceConfiguration(rollup());
    expect(price.itemNet).toBe(24900);
    expect(price.netTotal).toBe(24900);
    expect(price.grossTotal).toBe(24900 + 6723);
  });
});

describe('priceConfiguration – molinó sizes and minimum', () => {
  it('accepts the 20 cm and 500 cm boundaries', () => {
    expect(priceConfiguration(molino({ widthCm: 20, heightCm: 20 })).itemNet).toBe(4990);
    const big = priceConfiguration(molino({ widthCm: 500, heightCm: 500 }));
    expect(big.lines[0]?.quantity).toBe(25);
    expect(big.itemNet).toBe(99750);
  });

  it.each([
    [19.9, 'A szélesség 20 és 500 cm között lehet.'],
    [500.1, 'A szélesség 20 és 500 cm között lehet.'],
    [0, 'A szélesség 20 és 500 cm között lehet.'],
    [-100, 'A szélesség 20 és 500 cm között lehet.'],
  ])('rejects width %s cm', (widthCm, message) => {
    expect(thrownMessages(molino({ widthCm }))).toEqual([message]);
  });

  it('rejects heights out of range with a height-specific message', () => {
    expect(thrownMessages(molino({ heightCm: 501 }))).toEqual(['A magasság 20 és 500 cm között lehet.']);
  });

  it('accepts millimetre precision and rejects finer values', () => {
    expect(priceConfiguration(molino({ widthCm: 100.5, heightCm: 100 })).lines[0]?.quantity).toBeCloseTo(1.005, 10);
    expect(thrownMessages(molino({ widthCm: 100.05 }))).toEqual([
      'A szélesség legfeljebb milliméter pontosságú lehet (egy tizedesjegy).',
    ]);
  });

  it('applies the minimum only below 4 990', () => {
    // 125 × 100 cm = 1,25 m² × 3 990 = 4 987,5 → 4 988 < 4 990
    const below = priceConfiguration(molino({ widthCm: 125, heightCm: 100 }));
    expect(below.minimumApplied).toBe(true);
    expect(below.itemNet).toBe(4990);
    expect(below.lines.at(-1)?.amountNet).toBe(2);
    // 125,4 × 100 cm = 1,254 m² × 3 990 = 5 003,46 → 5 003
    const above = priceConfiguration(molino({ widthCm: 125.4, heightCm: 100 }));
    expect(above.minimumApplied).toBe(false);
    expect(above.itemNet).toBe(5003);
  });

  it('counts edge finishing before the minimum', () => {
    // 100 × 100: 3 990 + 4 fm × 200 = 4 790 → minimum; with szegés + ringli 3 990 + 1 400 = 5 390
    expect(priceConfiguration(molino({ widthCm: 100, heightCm: 100, edgeFinishId: 'ringli' })).itemNet).toBe(4990);
    expect(priceConfiguration(molino({ widthCm: 100, heightCm: 100, edgeFinishId: 'szeges-ringli' })).itemNet).toBe(5390);
    expect(priceConfiguration(molino({ widthCm: 100, heightCm: 100, edgeFinishId: 'alagut' })).itemNet).toBe(6390);
  });

  it('applies the minimum per piece, then quantity and discount', () => {
    const price = priceConfiguration(molino({ widthCm: 50, heightCm: 50, quantity: 5 }));
    expect(price.itemNet).toBe(4990);
    expect(price.subtotalNet).toBe(24950);
    expect(price.netTotal).toBe(22455);
  });

  it('prices every molinó material per m²', () => {
    const itemNet = (materialId: MolinoConfig['materialId']) => priceConfiguration(molino({ materialId })).itemNet;
    expect(itemNet('mesh')).toBe(8980);
    expect(itemNet('blockout')).toBe(13980);
    expect(itemNet('textil')).toBe(10980);
  });
});

describe('quantity discount tiers', () => {
  it.each([
    [1, 0, 7980],
    [2, 5, 15162],
    [4, 5, 30324],
    [5, 10, 35910],
    [9, 10, 64638],
    [10, 15, 67830],
    [999, 15, 6776217],
  ])('%i db → −%i%%, net %i', (quantity, pct, net) => {
    const price = priceConfiguration(molino({ quantity }));
    expect(price.discountPct).toBe(pct);
    expect(discountTierFor(quantity).pct).toBe(pct);
    expect(price.netTotal).toBe(net);
  });

  it.each([
    [1, { additionalQty: 1, pct: 5 }],
    [2, { additionalQty: 3, pct: 10 }],
    [3, { additionalQty: 2, pct: 10 }],
    [4, { additionalQty: 1, pct: 10 }],
    [5, { additionalQty: 5, pct: 15 }],
    [9, { additionalQty: 1, pct: 15 }],
    [10, null],
    [50, null],
  ])('next discount hint at %i db', (quantity, hint) => {
    expect(nextDiscountHint(quantity)).toEqual(hint);
    expect(priceConfiguration(molino({ quantity })).nextDiscountHint).toEqual(hint);
  });
});

describe('priceConfiguration – other products', () => {
  it('roll-up formats and replacement graphic', () => {
    expect(priceConfiguration(rollup({ formatId: '100x200' })).itemNet).toBe(34900);
    expect(priceConfiguration(rollup({ formatId: '120x200' })).itemNet).toBe(39900);
    expect(priceConfiguration(rollup({ formatId: '150x200' })).itemNet).toBe(49900);
    expect(priceConfiguration(rollup({ graphicOnly: true })).itemNet).toBe(12900);
    const replacement = priceConfiguration(rollup({ formatId: '150x200', graphicOnly: true }));
    expect(replacement.itemNet).toBe(12900);
    expect(replacement.lines[0]?.label).toBe('Csak cseregrafika, 150 × 200 cm');
    expect(priceConfiguration(rollup({ quantity: 2 })).netTotal).toBe(47310);
  });

  it('matrica: material and per-m² add-ons, no minimum', () => {
    expect(priceConfiguration(matrica()).itemNet).toBe(3495);
    const full = priceConfiguration(matrica({ addOnIds: ['uv-laminalas', 'konturvagas'] }));
    expect(full.lines.map((line) => [line.label, line.quantity, line.amountNet])).toEqual([
      ['Monomer fólia', 0.5, 3495],
      ['Kontúrvágás', 0.5, 1250],
      ['UV-laminálás', 0.5, 1000],
    ]);
    expect(full.itemNet).toBe(5745);
    expect(priceConfiguration(matrica({ materialId: 'polimer', widthCm: 100, heightCm: 100 })).itemNet).toBe(9990);
    expect(priceConfiguration(matrica({ materialId: 'one-way-vision', widthCm: 100, heightCm: 100 })).itemNet).toBe(8990);
    const tiny = priceConfiguration(matrica({ widthCm: 5, heightCm: 5 }));
    expect(tiny.minimumNet).toBeNull();
    expect(tiny.itemNet).toBe(17); // 0,0025 m² × 6 990 = 17,475
  });

  it('matrica: rejects duplicate or unknown add-ons', () => {
    expect(thrownMessages(matrica({ addOnIds: ['konturvagas', 'konturvagas'] }))).toEqual([
      'Minden opció csak egyszer választható.',
    ]);
    expect(thrownMessages({ ...matrica(), addOnIds: ['arany'] })).toEqual(['Ismeretlen opció.']);
    expect(thrownMessages(matrica({ widthCm: 4 }))).toEqual(['A szélesség 5 és 500 cm között lehet.']);
  });

  it('plakát: fixed formats and blueback per m²', () => {
    const a3 = priceConfiguration({ productId: 'plakat', formatId: 'a3', paperFinish: 'matt', orientation: 'allo', quantity: 1, express: false });
    expect(a3.itemNet).toBe(990);
    expect(a3.lines[0]?.label).toBe('Plakát A3, matt');
    const prices = (['a2', 'a1', 'a0', 'b1'] as const).map(
      (formatId) =>
        priceConfiguration({ productId: 'plakat', formatId, paperFinish: 'fenyes', orientation: 'fekvo', quantity: 1, express: false })
          .itemNet,
    );
    expect(prices).toEqual([1990, 3490, 5990, 3990]);
    const blueback = priceConfiguration({ productId: 'plakat', formatId: 'blueback', widthCm: 300, heightCm: 200, quantity: 1, express: false });
    expect(blueback.lines[0]).toMatchObject({ label: 'Blueback (utcai plakát)', quantity: 6, unitPriceNet: 2990 });
    expect(blueback.itemNet).toBe(17940);
  });

  it('plakát: blueback needs a size, formats need paper and orientation', () => {
    expect(thrownMessages({ productId: 'plakat', formatId: 'blueback', quantity: 1, express: false })).toEqual([
      'Adja meg a szélességet centiméterben.',
      'Adja meg a magasságot centiméterben.',
    ]);
    expect(thrownMessages({ productId: 'plakat', formatId: 'a3', quantity: 1, express: false })).toEqual([
      'Válasszon papírfelületet (matt vagy fényes).',
      'Válasszon tájolást.',
    ]);
    expect(thrownMessages({ productId: 'plakat', formatId: 'a5', paperFinish: 'matt', orientation: 'allo', quantity: 1, express: false })).toEqual([
      'Válasszon méretet.',
    ]);
  });

  it('tábla: per m² with a 0,1 m² billing minimum and per-piece add-ons', () => {
    expect(priceConfiguration(tabla()).itemNet).toBe(4995);
    const small = priceConfiguration(tabla({ widthCm: 20, heightCm: 20 }));
    expect(small.lines[0]).toEqual({
      label: 'PVC habtábla 3 mm (minimum 0,1 m²)',
      quantity: 0.1,
      unit: 'm²',
      unitPriceNet: 9990,
      amountNet: 999,
    });
    const exact = priceConfiguration(tabla({ widthCm: 50, heightCm: 20 }));
    expect(exact.lines[0]?.label).toBe('PVC habtábla 3 mm');
    expect(exact.itemNet).toBe(999);
    const withAddOns = priceConfiguration(tabla({ addOnCounts: { furat: 4, tavtarto: 1 } }));
    expect(withAddOns.lines.slice(1)).toEqual([
      { label: 'Furatolás', quantity: 4, unit: 'db', unitPriceNet: 500, amountNet: 2000 },
      { label: 'Távtartó csavar szett (4 db)', quantity: 1, unit: 'szett', unitPriceNet: 1990, amountNet: 1990 },
    ]);
    expect(withAddOns.itemNet).toBe(8985);
    expect(priceConfiguration(tabla({ materialId: 'pvc-5mm', widthCm: 100, heightCm: 100 })).itemNet).toBe(12990);
    expect(priceConfiguration(tabla({ materialId: 'dibond-3mm', widthCm: 100, heightCm: 100 })).itemNet).toBe(19990);
    expect(priceConfiguration(tabla({ materialId: 'plexi-3mm', widthCm: 100, heightCm: 100 })).itemNet).toBe(24990);
  });

  it('tábla: validates add-on counts', () => {
    expect(thrownMessages(tabla({ addOnCounts: { furat: 51, tavtarto: 0 } }))).toEqual([
      'Furatolás: a darabszám 0 és 50 közötti egész szám lehet.',
    ]);
    expect(thrownMessages(tabla({ addOnCounts: { furat: 0, tavtarto: -1 } }))).toEqual([
      'Távtartó csavar szett (4 db): a darabszám 0 és 25 közötti egész szám lehet.',
    ]);
    expect(thrownMessages(tabla({ addOnCounts: { furat: 1.5, tavtarto: 0 } }))).toHaveLength(1);
    expect(thrownMessages({ ...tabla(), addOnCounts: { furat: 0, tavtarto: 0, csavar: 1 } })).toEqual(['Ismeretlen opció.']);
  });

  it('vászonkép: fixed formats and custom size with a 6 990 minimum', () => {
    const format = (formatId: '30x40' | '50x70' | '60x90') =>
      priceConfiguration({ productId: 'vaszonkep', formatId, orientation: 'allo', quantity: 1, express: false }).itemNet;
    expect([format('30x40'), format('50x70'), format('60x90')]).toEqual([7990, 13990, 17990]);
    const smallCustom = priceConfiguration({ productId: 'vaszonkep', formatId: 'egyedi', widthCm: 40, heightCm: 40, quantity: 1, express: false });
    expect(smallCustom.lines[0]?.amountNet).toBe(3198);
    expect(smallCustom.minimumApplied).toBe(true);
    expect(smallCustom.itemNet).toBe(6990);
    const bigCustom = priceConfiguration({ productId: 'vaszonkep', formatId: 'egyedi', widthCm: 100, heightCm: 100, quantity: 1, express: false });
    expect(bigCustom.minimumApplied).toBe(false);
    expect(bigCustom.itemNet).toBe(19990);
    expect(thrownMessages({ productId: 'vaszonkep', formatId: 'egyedi', widthCm: 210, heightCm: 100, quantity: 1, express: false })).toEqual([
      'A szélesség 20 és 200 cm között lehet.',
    ]);
  });

  it('breakdown lines always add up to the piece price', () => {
    const configs: ProductConfig[] = [
      molino({ widthCm: 333.3, heightCm: 77.7, edgeFinishId: 'alagut' }),
      molino({ widthCm: 21, heightCm: 33 }),
      matrica({ widthCm: 33.3, heightCm: 33.3, addOnIds: ['konturvagas', 'uv-laminalas'] }),
      tabla({ widthCm: 12.3, heightCm: 45.6, addOnCounts: { furat: 3, tavtarto: 2 } }),
      { productId: 'vaszonkep', formatId: 'egyedi', widthCm: 33.3, heightCm: 44.4, quantity: 3, express: true },
    ];
    for (const config of configs) {
      const price = priceConfiguration(config);
      expect(price.lines.reduce((sum, line) => sum + line.amountNet, 0)).toBe(price.itemNet);
      expect(Number.isInteger(price.netTotal) && Number.isInteger(price.vatTotal)).toBe(true);
      expect(price.grossTotal).toBe(price.netTotal + price.vatTotal);
    }
  });
});

describe('validation of common fields', () => {
  it.each([
    [0, 'A darabszám 1 és 999 között lehet.'],
    [1000, 'A darabszám 1 és 999 között lehet.'],
    [1.5, 'A darabszám csak egész szám lehet.'],
    [Number.NaN, 'Adja meg a darabszámot.'],
  ])('quantity %s', (quantity, message) => {
    expect(thrownMessages(molino({ quantity }))).toEqual([message]);
  });

  it('rejects unknown products, materials, edges and a missing express flag', () => {
    expect(thrownMessages({ productId: 'polo', quantity: 1, express: false })).toEqual(['Ismeretlen termék.']);
    expect(thrownMessages(null)).toEqual(['Ismeretlen termék.']);
    expect(thrownMessages({ ...molino(), materialId: 'arany' })).toEqual(['Válasszon anyagot.']);
    expect(thrownMessages({ ...molino(), edgeFinishId: 'csipke' })).toEqual(['Válasszon szélkidolgozást.']);
    const { express: _express, ...noExpress } = molino();
    expect(thrownMessages(noExpress)).toEqual(['Adja meg, kér-e expressz gyártást.']);
    expect(thrownMessages({ ...molino(), widthCm: '200' })).toEqual(['Adja meg a szélességet centiméterben.']);
  });

  it('reports every issue with a field path', () => {
    const issues = validateConfiguration({ ...molino(), widthCm: 10, heightCm: 600, quantity: 0 });
    expect(issues.map((issue) => issue.path)).toEqual([['quantity'], ['widthCm'], ['heightCm']]);
  });

  it('tryPriceConfiguration returns issues instead of throwing', () => {
    const bad = tryPriceConfiguration(molino({ widthCm: 10 }));
    expect(bad).toEqual({ ok: false, issues: [{ path: ['widthCm'], message: 'A szélesség 20 és 500 cm között lehet.' }] });
    const good = tryPriceConfiguration(molino());
    expect(good.ok && good.price.netTotal).toBe(7980);
  });
});

describe('priceCart', () => {
  it('personal pickup is free', () => {
    const cart = priceCart([{ config: molino() }], 'szemelyes');
    expect(cart.shipping).toMatchObject({ methodId: 'szemelyes', net: 0, vat: 0, gross: 0, largeParcel: false });
    expect([cart.netTotal, cart.vatTotal, cart.grossTotal]).toEqual([7980, 2155, 10135]);
  });

  it('courier costs 2 990 net, or 4 990 net with a roll-up or tábla in the cart', () => {
    const small = priceCart([{ config: molino() }], 'futar');
    expect(small.shipping).toMatchObject({ net: 2990, vat: 807, gross: 3797, largeParcel: false });
    expect([small.netTotal, small.vatTotal, small.grossTotal]).toEqual([10970, 2962, 13932]);

    const large = priceCart([{ config: molino() }, { config: rollup() }], 'futar');
    expect(large.shipping).toMatchObject({ net: 4990, vat: 1347, largeParcel: true });
    expect(large.itemsNet).toBe(7980 + 24900);
    expect(large.netTotal).toBe(7980 + 24900 + 4990);

    expect(priceCart([{ config: tabla() }], 'futar').shipping.net).toBe(4990);
    expect(priceCart([{ config: rollup() }], 'szemelyes').shipping.net).toBe(0);
  });

  it('cart totals equal the sum of the lines the customer sees', () => {
    const cart = priceCart(
      [{ config: molino({ quantity: 5, express: true }) }, { config: matrica({ widthCm: 33.3, heightCm: 33.3 }) }, { config: tabla() }],
      'futar',
    );
    const itemsGross = cart.items.reduce((sum, item) => sum + item.grossTotal, 0);
    expect(cart.grossTotal).toBe(itemsGross + cart.shipping.gross);
    expect(cart.grossTotal).toBe(cart.netTotal + cart.vatTotal);
  });

  it('an empty cart costs nothing', () => {
    const cart = priceCart([], 'futar');
    expect([cart.netTotal, cart.vatTotal, cart.grossTotal, cart.shipping.net]).toEqual([0, 0, 0, 0]);
  });

  it('throws with item paths for invalid items and for an unknown shipping method', () => {
    let error: unknown;
    try {
      priceCart([{ config: molino() }, { config: molino({ widthCm: 10 }) }], 'futar');
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(ConfigurationError);
    expect((error as ConfigurationError).issues).toEqual([
      { path: ['items', 1, 'config', 'widthCm'], message: 'A szélesség 20 és 500 cm között lehet.' },
    ]);
    expect(() => priceCart([{ config: molino() }], 'drone' as 'futar')).toThrow('Válasszon szállítási módot.');
  });
});

describe('helpers', () => {
  it('vatOf / grossOf', () => {
    expect(vatOf(7980)).toBe(2155);
    expect(grossOf(7980)).toBe(10135);
    expect(grossOf(0)).toBe(0);
  });

  it('configDimensionsCm honours orientation', () => {
    expect(configDimensionsCm(molino())).toEqual({ widthCm: 200, heightCm: 100 });
    expect(configDimensionsCm(rollup())).toEqual({ widthCm: 85, heightCm: 200 });
    const a3 = { productId: 'plakat', formatId: 'a3', paperFinish: 'matt', quantity: 1, express: false } as const;
    expect(configDimensionsCm({ ...a3, orientation: 'allo' })).toEqual({ widthCm: 29.7, heightCm: 42 });
    expect(configDimensionsCm({ ...a3, orientation: 'fekvo' })).toEqual({ widthCm: 42, heightCm: 29.7 });
    expect(
      configDimensionsCm({ productId: 'vaszonkep', formatId: '30x40', orientation: 'fekvo', quantity: 1, express: false }),
    ).toEqual({ widthCm: 40, heightCm: 30 });
  });

  it('describeConfiguration gives a one-line summary', () => {
    expect(describeConfiguration(molino({ edgeFinishId: 'szeges-ringli', express: true }))).toBe(
      'Molinó · Standard frontlit molinó · 200 × 100 cm · Szegés + ringli · expressz',
    );
    expect(describeConfiguration(rollup({ graphicOnly: true }))).toBe('Roll-up · Standard 85 × 200 cm · csak cseregrafika');
    expect(describeConfiguration(tabla({ widthCm: 29.7, addOnCounts: { furat: 4, tavtarto: 0 } }))).toBe(
      'Tábla · PVC habtábla 3 mm · 29,7 × 50 cm · Furatolás × 4',
    );
  });
});
