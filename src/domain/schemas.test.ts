import { describe, expect, it } from 'vitest';
import type { z } from 'zod';
import { QUOTE_TYPES, type QuoteType } from './catalog';
import {
  CartItemSchema,
  OrderRequestSchema,
  ProductConfigSchema,
  QuoteRequestSchema,
  createQuoteRequestSchema,
  isPlausiblePhone,
  isValidHuTaxNumber,
  validateQuoteFields,
} from './schemas';

const UUID_A = '3f8a2b6c-1d4e-4f5a-9b7c-0e1d2c3b4a59';
const UUID_B = '9c1d2e3f-4a5b-4c6d-8e7f-a0b1c2d3e4f5';

/** [path, message] pairs of a failed parse. */
function issuesOf(schema: z.ZodType, input: unknown): [string, string][] {
  const result = schema.safeParse(input);
  if (result.success) throw new Error(`expected a validation error for ${JSON.stringify(input)}`);
  // Messages may contain no-break spaces from number formatting ("1 000"); compare with plain spaces.
  return result.error.issues.map((issue) => [issue.path.join('.'), issue.message.replace(/[\u00a0\u202f]/g, ' ')]);
}

const molinoConfig = {
  productId: 'molino',
  materialId: 'standard',
  edgeFinishId: 'szeges-ringli',
  widthCm: 200,
  heightCm: 100,
  quantity: 1,
  express: false,
};

describe('ProductConfigSchema', () => {
  it.each([
    ['molinó', molinoConfig],
    ['roll-up', { productId: 'rollup', formatId: '85x200', graphicOnly: false, quantity: 2, express: true }],
    [
      'matrica',
      { productId: 'matrica', materialId: 'polimer', widthCm: 30, heightCm: 20.5, addOnIds: ['konturvagas'], quantity: 10, express: false },
    ],
    ['plakát', { productId: 'plakat', formatId: 'a2', paperFinish: 'fenyes', orientation: 'fekvo', quantity: 1, express: false }],
    ['blueback', { productId: 'plakat', formatId: 'blueback', widthCm: 500, heightCm: 238, quantity: 1, express: false }],
    [
      'tábla',
      { productId: 'tabla', materialId: 'dibond-3mm', widthCm: 60, heightCm: 40, addOnCounts: { furat: 4, tavtarto: 1 }, quantity: 1, express: false },
    ],
    ['vászonkép', { productId: 'vaszonkep', formatId: '50x70', orientation: 'allo', quantity: 1, express: false }],
    ['egyedi vászonkép', { productId: 'vaszonkep', formatId: 'egyedi', widthCm: 80, heightCm: 45, quantity: 1, express: false }],
  ])('accepts a valid %s configuration', (_name, config) => {
    expect(ProductConfigSchema.parse(config)).toEqual(config);
  });

  it('strips unknown keys (e.g. a client-side price)', () => {
    expect(ProductConfigSchema.parse({ ...molinoConfig, priceNet: 1 })).toEqual(molinoConfig);
  });

  it.each([
    [{ ...molinoConfig, widthCm: 19 }, [['widthCm', 'A szélesség 20 és 500 cm között lehet.']]],
    [{ ...molinoConfig, heightCm: 501 }, [['heightCm', 'A magasság 20 és 500 cm között lehet.']]],
    [{ ...molinoConfig, quantity: 0 }, [['quantity', 'A darabszám 1 és 999 között lehet.']]],
    [{ ...molinoConfig, quantity: '2' }, [['quantity', 'Adja meg a darabszámot.']]],
    [{ ...molinoConfig, materialId: 'arany' }, [['materialId', 'Válasszon anyagot.']]],
    [{ ...molinoConfig, widthCm: undefined }, [['widthCm', 'Adja meg a szélességet centiméterben.']]],
    [{ productId: 'polo', quantity: 1, express: false }, [['productId', 'Ismeretlen termék.']]],
    [{ productId: 'plakat', formatId: 'a5', quantity: 1, express: false }, [['formatId', 'Válasszon méretet.']]],
    [
      { productId: 'plakat', formatId: 'blueback', widthCm: 300, quantity: 1, express: false },
      [['heightCm', 'Adja meg a magasságot centiméterben.']],
    ],
    [
      { productId: 'tabla', materialId: 'pvc-3mm', widthCm: 60, heightCm: 40, addOnCounts: { furat: 51, tavtarto: 0 }, quantity: 1, express: false },
      [['addOnCounts.furat', 'Furatolás: a darabszám 0 és 50 közötti egész szám lehet.']],
    ],
  ])('rejects %j', (config, expected) => {
    expect(issuesOf(ProductConfigSchema, config)).toEqual(expected);
  });
});

describe('CartItemSchema', () => {
  const item = {
    config: molinoConfig,
    uploadIds: [UUID_A],
    preflight: { dpi: 96, rating: 'megfelelo', aspectMismatch: true, fitMode: 'fill' },
  };

  it('accepts a configured item with uploads and a preflight summary', () => {
    expect(CartItemSchema.parse(item)).toEqual(item);
    expect(CartItemSchema.parse({ config: molinoConfig })).toEqual({ config: molinoConfig, uploadIds: [] });
  });

  it('rejects bad upload ids and too many uploads', () => {
    expect(issuesOf(CartItemSchema, { ...item, uploadIds: ['../../etc/passwd'] })).toEqual([
      ['uploadIds.0', 'Érvénytelen feltöltés-azonosító.'],
    ]);
    expect(issuesOf(CartItemSchema, { ...item, uploadIds: Array.from({ length: 11 }, () => UUID_A) })).toEqual([
      ['uploadIds', 'Tételenként legfeljebb 10 fájl tölthető fel.'],
    ]);
  });

  it('reports configuration issues under config', () => {
    expect(issuesOf(CartItemSchema, { ...item, config: { ...molinoConfig, widthCm: 10 } })).toEqual([
      ['config.widthCm', 'A szélesség 20 és 500 cm között lehet.'],
    ]);
  });
});

describe('phone and tax number helpers', () => {
  it.each(['+36 70 538 5030', '+36705385030', '06-70/538-5030', '06 1 234 5678', '0036 30 123 4567', '70 538 5030', '+44 20 7946 0958', '(06 20) 123-4567'])(
    'accepts %s',
    (phone) => {
      expect(isPlausiblePhone(phone)).toBe(true);
    },
  );

  it.each(['12345', 'abc', '+36 70 538 50301', '06 70 538', '+36 70 538 503a', ''])('rejects %j', (phone) => {
    expect(isPlausiblePhone(phone)).toBe(false);
  });

  it('validates the tax number check digit and VAT code', () => {
    expect(isValidHuTaxNumber('12345676-1-42')).toBe(true);
    expect(isValidHuTaxNumber('24681353-2-13')).toBe(true);
    expect(isValidHuTaxNumber('12345678-1-12')).toBe(false); // wrong check digit
    expect(isValidHuTaxNumber('12345676-6-42')).toBe(false); // VAT code must be 1–5
    expect(isValidHuTaxNumber('1234567-1-42')).toBe(false);
  });
});

describe('OrderRequestSchema', () => {
  const order = {
    customer: {
      name: 'Minta Mária',
      email: 'maria@example.hu',
      phone: '+36 70 123 4567',
      billingAddress: { postalCode: '1061', city: 'Budapest', address: 'Minta utca 1.' },
    },
    shippingMethod: 'futar',
    items: [{ config: molinoConfig, uploadIds: [UUID_A] }],
    acceptTerms: true,
  };

  it('accepts a minimal private order and normalises optional text', () => {
    const parsed = OrderRequestSchema.parse({ ...order, note: '   ', customer: { ...order.customer, company: '', name: '  Minta Mária ' } });
    expect(parsed.customer.name).toBe('Minta Mária');
    expect(parsed.customer.company).toBeUndefined();
    expect(parsed.note).toBeUndefined();
    expect(parsed.items).toHaveLength(1);
  });

  it('accepts a company order and normalises the tax number', () => {
    const parsed = OrderRequestSchema.parse({
      ...order,
      customer: { ...order.customer, company: 'Minta Kft.', taxNumber: '12345676142' },
      shippingAddress: { postalCode: '9021', city: 'Győr', address: 'Minta tér 2.' },
      note: 'Kérem, hívjanak a kiszállítás előtt.',
    });
    expect(parsed.customer.taxNumber).toBe('12345676-1-42');
    expect(parsed.shippingAddress?.city).toBe('Győr');
  });

  it.each([
    [{ customer: { ...order.customer, email: 'maria@' } }, [['customer.email', 'Kérjük, érvényes e-mail-címet adjon meg.']]],
    [{ customer: { ...order.customer, email: '' } }, [['customer.email', 'Adja meg az e-mail-címét.']]],
    [{ customer: { ...order.customer, name: 'M' } }, [['customer.name', 'Adja meg a nevét.']]],
    [
      { customer: { ...order.customer, phone: '12345' } },
      [['customer.phone', 'Kérjük, érvényes telefonszámot adjon meg, például +36 70 123 4567.']],
    ],
    [
      { customer: { ...order.customer, billingAddress: { ...order.customer.billingAddress, postalCode: '123' } } },
      [['customer.billingAddress.postalCode', 'Az irányítószám 4 számjegyből áll.']],
    ],
    [
      { customer: { ...order.customer, billingAddress: { ...order.customer.billingAddress, postalCode: '0123' } } },
      [['customer.billingAddress.postalCode', 'Az irányítószám 4 számjegyből áll.']],
    ],
    [
      { customer: { ...order.customer, billingAddress: { ...order.customer.billingAddress, city: ' ' } } },
      [['customer.billingAddress.city', 'Adja meg a települést.']],
    ],
    [
      { customer: { ...order.customer, company: 'Minta Kft.', taxNumber: '1234567-1-42' } },
      [['customer.taxNumber', 'Az adószám formátuma: 12345678-1-12.']],
    ],
    [
      { customer: { ...order.customer, company: 'Minta Kft.', taxNumber: '12345678-1-12' } },
      [['customer.taxNumber', 'Ez az adószám nem érvényes. Kérjük, ellenőrizze.']],
    ],
    [
      { customer: { ...order.customer, taxNumber: '12345676-1-42' } },
      [['customer.company', 'Adószám megadásakor a cégnevet is adja meg.']],
    ],
    [{ shippingMethod: 'dron' }, [['shippingMethod', 'Válasszon szállítási módot.']]],
    [{ items: [] }, [['items', 'A kosár üres.']]],
    [{ items: Array.from({ length: 51 }, () => order.items[0]) }, [['items', 'Egy rendelésben legfeljebb 50 tétel lehet.']]],
    [{ note: 'x'.repeat(2001) }, [['note', 'A megjegyzés legfeljebb 2000 karakter lehet.']]],
    [{ acceptTerms: false }, [['acceptTerms', 'A rendeléshez fogadja el az Általános Szerződési Feltételeket.']]],
    [{ acceptTerms: undefined }, [['acceptTerms', 'A rendeléshez fogadja el az Általános Szerződési Feltételeket.']]],
  ])('rejects %j', (patch, expected) => {
    expect(issuesOf(OrderRequestSchema, { ...order, ...patch })).toEqual(expected);
  });

  it('accepts a 2000-character note and 50 items', () => {
    expect(OrderRequestSchema.safeParse({ ...order, note: 'x'.repeat(2000) }).success).toBe(true);
    expect(OrderRequestSchema.safeParse({ ...order, items: Array.from({ length: 50 }, () => order.items[0]) }).success).toBe(true);
  });

  it('rejects a non-object body in Hungarian', () => {
    expect(issuesOf(OrderRequestSchema, null)).toEqual([['', 'Érvénytelen rendelési adatok.']]);
  });
});

describe('QuoteRequestSchema', () => {
  // Monday, 5 October 2026, 10:00 in Budapest.
  const schema = createQuoteRequestSchema({ now: () => new Date('2026-10-05T10:00:00+02:00') });
  const contact = { name: 'Minta Mária', email: 'maria@example.hu', phone: '06 30 123 4567' };
  const kirakat = {
    quoteType: 'kirakat',
    fields: { feluletM2: 12.5, foliaTipus: ['dekor', 'one-way-vision'], kirakatFotok: [UUID_A] },
    location: 'Budapest, Minta utca 1.',
    deadline: '2026-11-15',
    budgetBand: '300e-1m',
    uploadIds: [UUID_B],
    contact,
    surveyRequest: { date: '2026-10-06', partOfDay: 'delelott' },
  };

  it('accepts a complete request with a survey on the next business day', () => {
    const parsed = schema.parse(kirakat);
    expect(parsed.fields).toEqual(kirakat.fields);
    expect(parsed.surveyRequest).toEqual({ date: '2026-10-06', partOfDay: 'delelott' });
  });

  it('accepts a request without budget band and survey, and a deadline of today', () => {
    const { budgetBand: _b, surveyRequest: _s, ...rest } = kirakat;
    expect(schema.safeParse({ ...rest, deadline: '2026-10-05' }).success).toBe(true);
  });

  it('prunes empty answers and trims text', () => {
    const parsed = schema.parse({ ...kirakat, fields: { ...kirakat.fields, meretek: '  ', kirakatFotok: [] } });
    expect(parsed.fields).toEqual({ feluletM2: 12.5, foliaTipus: ['dekor', 'one-way-vision'] });
    const egyeb = schema.parse({ ...kirakat, quoteType: 'egyeb', fields: { leiras: '  Feliratos ajtó.  ' } });
    expect(egyeb.fields).toEqual({ leiras: 'Feliratos ajtó.' });
  });

  it.each([
    [{ quoteType: 'urhajo' }, [['quoteType', 'Válassza ki a munka típusát.']]],
    [{ fields: { ...kirakat.fields, szin: 'piros' } }, [['fields.szin', 'Ismeretlen mező.']]],
    [{ fields: { foliaTipus: ['dekor'] } }, [['fields.feluletM2', 'Adja meg a felületet m²-ben, vagy írja le a méreteket.']]],
    [{ fields: { feluletM2: 12 } }, [['fields.foliaTipus', 'Kérjük, válasszon a lehetőségek közül.']]],
    [{ fields: { ...kirakat.fields, foliaTipus: ['dekor', 'neon'] } }, [['fields.foliaTipus', 'Kérjük, a felsorolt lehetőségek közül válasszon.']]],
    [{ fields: { ...kirakat.fields, foliaTipus: ['dekor', 'dekor'] } }, [['fields.foliaTipus', 'Minden lehetőség csak egyszer választható.']]],
    [{ fields: { ...kirakat.fields, feluletM2: 0.05 } }, [['fields.feluletM2', 'Az érték 0,1 és 1 000 m² között lehet.']]],
    [{ fields: { ...kirakat.fields, feluletM2: '12' } }, [['fields.feluletM2', 'Kérjük, számot adjon meg.']]],
    [{ fields: { ...kirakat.fields, kirakatFotok: ['nem-uuid'] } }, [['fields.kirakatFotok', 'Érvénytelen feltöltés-azonosító.']]],
    [
      { fields: { ...kirakat.fields, kirakatFotok: Array.from({ length: 11 }, (_, i) => `3f8a2b6c-1d4e-4f5a-9b7c-0e1d2c3b4a${String(i).padStart(2, '0')}`) } },
      [['fields.kirakatFotok', 'Legfeljebb 10 fájl tölthető fel.']],
    ],
    [{ fields: { ...kirakat.fields, feluletM2: { m2: 12 } } }, [['fields.feluletM2', 'Érvénytelen érték.']]],
    [{ location: undefined }, [['location', 'Adja meg a helyszín címét.']]],
    [{ deadline: '2026-10-04' }, [['deadline', 'A határidő nem lehet múltbeli dátum.']]],
    [{ deadline: '2026-13-01' }, [['deadline', 'Érvénytelen dátum.']]],
    [{ deadline: undefined }, [['deadline', 'Adja meg a határidőt.']]],
    [{ budgetBand: 'vegtelen' }, [['budgetBand', 'Válasszon a költségkeret-sávok közül.']]],
    [{ uploadIds: ['x'] }, [['uploadIds.0', 'Érvénytelen feltöltés-azonosító.']]],
    [{ contact: { ...contact, phone: 'nincs' } }, [['contact.phone', 'Kérjük, érvényes telefonszámot adjon meg, például +36 70 123 4567.']]],
    [
      { surveyRequest: { date: '2026-10-05', partOfDay: 'delutan' } },
      [['surveyRequest.date', 'A felmérés legkorábban a következő munkanapra (2026. október 6., kedd) kérhető.']],
    ],
    [{ surveyRequest: { date: '2026-10-10', partOfDay: 'delutan' } }, [['surveyRequest.date', 'A felmérés munkanapra kérhető.']]],
    [{ surveyRequest: { date: '2026-10-23', partOfDay: 'delelott' } }, [['surveyRequest.date', 'A felmérés munkanapra kérhető.']]],
    [{ surveyRequest: { date: '2026-10-06', partOfDay: 'este' } }, [['surveyRequest.partOfDay', 'Válasszon napszakot.']]],
  ])('rejects %j', (patch, expected) => {
    expect(issuesOf(schema, { ...kirakat, ...patch })).toEqual(expected);
  });

  it('checks required, integer and range rules of number fields', () => {
    const base = {
      ...kirakat,
      quoteType: 'autofoliazas',
      fields: { jarmuTipus: 'Ford Transit', darabszam: 2, terjedelem: 'reszleges', grafika: 'tervezes' },
    };
    expect(schema.safeParse(base).success).toBe(true);
    expect(issuesOf(schema, { ...base, fields: { ...base.fields, jarmuTipus: ' ' } })).toEqual([
      ['fields.jarmuTipus', 'Kérjük, töltse ki ezt a mezőt.'],
    ]);
    expect(issuesOf(schema, { ...base, fields: { ...base.fields, darabszam: 0 } })).toEqual([
      ['fields.darabszam', 'Az érték 1 és 500 db között lehet.'],
    ]);
    expect(issuesOf(schema, { ...base, fields: { ...base.fields, darabszam: 1.5 } })).toEqual([
      ['fields.darabszam', 'Kérjük, egész számot adjon meg.'],
    ]);
    expect(issuesOf(schema, { ...base, fields: { ...base.fields, terjedelem: 'fel' } })).toEqual([
      ['fields.terjedelem', 'Kérjük, a felsorolt lehetőségek közül válasszon.'],
    ]);
    expect(issuesOf(schema, { ...base, fields: { ...base.fields, jarmuTipus: 'x'.repeat(201) } })).toEqual([
      ['fields.jarmuTipus', 'Legfeljebb 200 karakter lehet.'],
    ]);
  });

  it('applies visibility rules: the LED-wall event date is required only for rental', () => {
    const base = {
      ...kirakat,
      quoteType: 'led-fal',
      fields: { elhelyezes: 'kulter', szelessegCm: 400, magassagCm: 250, konstrukcio: 'berles' },
    };
    expect(issuesOf(schema, base)).toEqual([['fields.rendezvenyDatuma', 'Kérjük, adja meg a dátumot.']]);
    expect(schema.safeParse({ ...base, fields: { ...base.fields, rendezvenyDatuma: '2026-12-31' } }).success).toBe(true);
    // A stale answer of a hidden field is accepted and dropped.
    const bought = schema.parse({ ...base, fields: { ...base.fields, konstrukcio: 'vasarlas', rendezvenyDatuma: '2020-01-01' } });
    expect(bought.fields).not.toHaveProperty('rendezvenyDatuma');
  });

  it('date fields cannot be in the past', () => {
    const base = {
      ...kirakat,
      quoteType: 'rendezveny',
      fields: { rendezvenyDatuma: '2026-10-04', meret: 'fotófal 3 × 2,5 m', felepitesBontas: 'mindketto' },
    };
    expect(issuesOf(schema, base)).toEqual([['fields.rendezvenyDatuma', 'A dátum nem lehet a múltban.']]);
  });

  it('3D printing needs no address unless a survey is requested', () => {
    const base = {
      quoteType: '3d-nyomtatas',
      fields: { leiras: 'Térbeli logó, 30 cm széles', anyag: 'petg', darabszam: 3 },
      deadline: '2026-11-01',
      contact,
    };
    expect(schema.safeParse(base).success).toBe(true);
    expect(issuesOf(schema, { ...base, fields: { anyag: 'pla', darabszam: 1 } })).toEqual([
      ['fields.modellFajl', 'Töltsön fel modellfájlt, vagy írja le, mit szeretne.'],
    ]);
    expect(issuesOf(schema, { ...base, surveyRequest: { date: '2026-10-06', partOfDay: 'delutan' } })).toEqual([
      ['location', 'A helyszíni felméréshez adja meg a címet.'],
    ]);
  });

  it('the default schema uses the real clock', () => {
    const far = { ...kirakat, deadline: '2099-12-31' };
    const { surveyRequest: _s, ...withoutSurvey } = far;
    expect(QuoteRequestSchema.safeParse(withoutSurvey).success).toBe(true);
    expect(issuesOf(QuoteRequestSchema, { ...withoutSurvey, deadline: '2020-01-01' })).toEqual([
      ['deadline', 'A határidő nem lehet múltbeli dátum.'],
    ]);
  });
});

describe('validateQuoteFields', () => {
  const today = '2026-10-05';

  /** A minimal valid answer for every visible required field. */
  function sampleAnswers(type: QuoteType): Record<string, unknown> {
    const answers: Record<string, unknown> = {};
    for (const field of type.fields) {
      switch (field.type) {
        case 'text':
        case 'textarea':
          answers[field.id] = 'Minta';
          break;
        case 'number':
          answers[field.id] = field.min;
          break;
        case 'select':
          answers[field.id] = field.options[0]?.value;
          break;
        case 'multiselect':
          answers[field.id] = [field.options[0]?.value];
          break;
        case 'date':
          answers[field.id] = today;
          break;
        case 'file':
          answers[field.id] = [UUID_A];
          break;
      }
    }
    return answers;
  }

  it.each(QUOTE_TYPES.map((t) => [t.id, t] as const))('a fully answered %s wizard is valid', (_id, type) => {
    expect(validateQuoteFields(type.id, sampleAnswers(type), { today })).toEqual([]);
  });

  it('every wizard reports its required fields when empty', () => {
    for (const type of QUOTE_TYPES as readonly QuoteType[]) {
      const issues = validateQuoteFields(type.id, {}, { today });
      const required = type.fields.filter((f) => f.required && !f.visibleWhen).map((f) => [f.id]);
      for (const path of required) expect(issues.map((i) => i.path)).toContainEqual(path);
    }
  });

  it('rejects an unknown quote type', () => {
    expect(validateQuoteFields('urhajo', {}, { today })).toEqual([{ path: [], message: 'Ismeretlen munkatípus.' }]);
  });
});
