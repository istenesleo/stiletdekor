import { describe, expect, it } from 'vitest';
import type { z } from 'zod';
import { getQuoteType, QUOTE_TYPES, type QuoteType } from './catalog';
import {
  CallbackRequestSchema,
  callbackJobTypeName,
  CartItemSchema,
  formSource,
  OrderRequestSchema,
  ProductConfigSchema,
  QuoteRequestSchema,
  createQuoteRequestSchema,
  isPlausiblePhone,
  isQuoteFieldVisible,
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
      'egyedi plakát',
      { productId: 'plakat', formatId: 'egyedi', paperFinish: 'matt', widthCm: 59.4, heightCm: 120, quantity: 2, express: false },
    ],
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
      { productId: 'plakat', formatId: 'egyedi', widthCm: 50, heightCm: 70, quantity: 1, express: false },
      [['paperFinish', 'Válasszon papírfelületet (matt vagy fényes).']],
    ],
    [
      { productId: 'plakat', formatId: 'egyedi', paperFinish: 'fenyes', widthCm: 50, heightCm: 160, quantity: 1, express: false },
      [['heightCm', 'A magasság 10 és 150 cm között lehet.']],
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
    [{ shippingMethod: 'dron' }, [['shippingMethod', 'Válasszon átvételi módot.']]],
    [{ surveyRequested: true }, [['surveyRequested', 'Helyszíni felmérést telepítéssel együtt kérhet.']]],
    [{ surveyRequested: 'igen' }, [['surveyRequested', 'Érvénytelen érték.']]],
    [{ items: [] }, [['items', 'A kosár üres.']]],
    [{ items: Array.from({ length: 51 }, () => order.items[0]) }, [['items', 'Egy rendelésben legfeljebb 50 tétel lehet.']]],
    [{ note: 'x'.repeat(2001) }, [['note', 'A megjegyzés legfeljebb 2000 karakter lehet.']]],
    [{ acceptTerms: false }, [['acceptTerms', 'A rendeléshez fogadja el az Általános Szerződési Feltételeket.']]],
    [{ acceptTerms: undefined }, [['acceptTerms', 'A rendeléshez fogadja el az Általános Szerződési Feltételeket.']]],
  ])('rejects %j', (patch, expected) => {
    expect(issuesOf(OrderRequestSchema, { ...order, ...patch })).toEqual(expected);
  });

  it('accepts installation with an on-site survey; the survey defaults to not requested', () => {
    expect(OrderRequestSchema.parse(order).surveyRequested).toBe(false);
    const installed = OrderRequestSchema.parse({
      ...order,
      shippingMethod: 'telepites',
      shippingAddress: { postalCode: '1052', city: 'Budapest', address: 'Minta köz 3.' },
      surveyRequested: true,
    });
    expect(installed).toMatchObject({ shippingMethod: 'telepites', surveyRequested: true });
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
    uploadIds: [UUID_B],
    contact,
    surveyRequested: true,
  };

  it('accepts a complete request with a survey request (no date: the workshop calls back)', () => {
    const parsed = schema.parse(kirakat);
    expect(parsed.fields).toEqual(kirakat.fields);
    expect(parsed.surveyRequested).toBe(true);
  });

  it('accepts a request without a survey and a deadline of today', () => {
    const { surveyRequested: _s, ...rest } = kirakat;
    const parsed = schema.parse({ ...rest, deadline: '2026-10-05' });
    expect(parsed.surveyRequested).toBe(false);
  });

  it('drops the removed budget and survey-date fields sent by an old client', () => {
    const parsed = schema.parse({ ...kirakat, budgetBand: '300e-1m', surveyRequest: { date: '2026-10-06', partOfDay: 'delelott' } });
    expect(parsed).not.toHaveProperty('budgetBand');
    expect(parsed).not.toHaveProperty('surveyRequest');
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
    [{ uploadIds: ['x'] }, [['uploadIds.0', 'Érvénytelen feltöltés-azonosító.']]],
    [{ contact: { ...contact, phone: 'nincs' } }, [['contact.phone', 'Kérjük, érvényes telefonszámot adjon meg, például +36 70 123 4567.']]],
    [{ surveyRequested: 'holnap' }, [['surveyRequested', 'Érvénytelen érték.']]],
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
    expect(issuesOf(schema, { ...base, surveyRequested: true })).toEqual([
      ['location', 'A helyszíni felméréshez adja meg a címet.'],
    ]);
  });

  it('the default schema uses the real clock', () => {
    const far = { ...kirakat, deadline: '2099-12-31' };
    const { surveyRequested: _s, ...withoutSurvey } = far;
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

describe('CallbackRequestSchema', () => {
  it('keeps the name and phone, and drops empty optional fields', () => {
    expect(
      CallbackRequestSchema.parse({ name: ' Kiss Péter ', phone: '06 70 123 4567', jobType: '', message: '  ', source: '/visszahivas' }),
    ).toEqual({ name: 'Kiss Péter', phone: '06 70 123 4567', source: '/visszahivas' });
  });

  it('accepts a quote type or "nem-tudom" as the job type', () => {
    const base = { name: 'Kiss Péter', phone: '+36 70 123 4567' };
    expect(CallbackRequestSchema.parse({ ...base, jobType: 'autofoliazas' }).jobType).toBe('autofoliazas');
    expect(CallbackRequestSchema.parse({ ...base, jobType: 'nem-tudom' }).jobType).toBe('nem-tudom');
  });

  it('says in Hungarian what is missing or wrong', () => {
    expect(issuesOf(CallbackRequestSchema, { name: '', phone: '123', jobType: 'urhajo', message: 'x'.repeat(301) })).toEqual([
      ['name', 'Adja meg a nevét.'],
      ['phone', 'Kérjük, érvényes telefonszámot adjon meg, például +36 70 123 4567.'],
      ['jobType', 'Válasszon a listából.'],
      ['message', 'Legfeljebb 300 karakter lehet.'],
    ]);
  });

  it('drops a source that is not a path of the site', () => {
    const base = { name: 'Kiss Péter', phone: '+36701234567' };
    for (const source of ['https://example.com', '//example.com', 'javascript:alert(1)', '/a b', 42]) {
      expect(CallbackRequestSchema.parse({ ...base, source }).source).toBeUndefined();
    }
    expect(CallbackRequestSchema.parse({ ...base, source: '/kapcsolat#visszahivas' }).source).toBe('/kapcsolat#visszahivas');
  });
});

describe('callback job types', () => {
  it('names the quote types as the catalog does, and the unsure answer in the first person', () => {
    expect(callbackJobTypeName('ceger')).toBe('Cégér, reklámtábla');
    expect(callbackJobTypeName('nem-tudom')).toBe('Még nem tudom');
  });

  it('accepts only paths of the site as a form source', () => {
    expect(formSource('/visszahivas')).toBe('/visszahivas');
    expect(formSource(`/${'a'.repeat(200)}`)).toBeUndefined();
  });
});

describe('files sent by e-mail', () => {
  const today = '2026-10-05';
  const betuk = { betumagassagCm: 40, anyag: 'plexi', vilagitas: 'nincs' };

  it('count as given for a "one of" group, so a logo can come by e-mail instead of the text', () => {
    expect(validateQuoteFields('betuk', betuk, { today })).toEqual([
      { path: ['feliratSzoveg'], message: 'Adja meg a felirat szövegét, vagy töltse fel a logót.' },
    ]);
    expect(validateQuoteFields('betuk', betuk, { today, emailedFiles: ['logo'] })).toEqual([]);
  });

  it('are kept only for the visible file fields of the job type', () => {
    const schema = createQuoteRequestSchema({ now: () => new Date('2026-10-05T10:00:00+02:00') });
    const base = {
      location: 'Budapest, Minta utca 1.',
      deadline: '2026-11-15',
      contact: { name: 'Minta Mária', email: 'maria@example.hu', phone: '06 30 123 4567' },
    };
    const parsed = schema.parse({
      ...base,
      quoteType: 'autofoliazas',
      fields: { jarmuTipus: 'Ford Transit', darabszam: 2, terjedelem: 'felirat', grafika: 'tervezes' },
      emailedFiles: ['jarmuFotok', 'grafikaFajlok', 'terjedelem'],
    });
    expect(parsed.emailedFiles).toEqual(['jarmuFotok']);
    expect(schema.parse({ ...base, quoteType: 'egyeb', fields: { leiras: 'Ajtófelirat.' } }).emailedFiles).toEqual([]);
  });

  it('lets the wizard ask whether a field shows', () => {
    const def = getQuoteType('autofoliazas').fields.find((f) => f.id === 'grafikaFajlok')!;
    expect(isQuoteFieldVisible(def, { grafika: 'van' })).toBe(true);
    expect(isQuoteFieldVisible(def, { grafika: 'tervezes' })).toBe(false);
  });
});

describe('QuoteRequestSchema in one round', () => {
  it('reports the job type rules together with a wrong contact or date', () => {
    const schema = createQuoteRequestSchema({ now: () => new Date('2026-10-05T10:00:00+02:00') });
    const issues = issuesOf(schema, {
      quoteType: 'betuk',
      fields: { betumagassagCm: 40, anyag: 'plexi', vilagitas: 'nincs' },
      location: 'Budapest, Minta utca 1.',
      contact: { name: 'Minta Mária', email: '', phone: '06 30 123 4567' },
    });
    expect(issues).toEqual([
      ['deadline', 'Adja meg a határidőt.'],
      ['contact.email', 'Adja meg az e-mail-címét.'],
      ['fields.feliratSzoveg', 'Adja meg a felirat szövegét, vagy töltse fel a logót.'],
    ]);
  });
});
