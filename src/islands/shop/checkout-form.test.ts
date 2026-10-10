import { describe, expect, it } from 'vitest';
import type { CartEntry } from '@/domain/cart';
import { checkOrder, EMPTY_CHECKOUT, errorsFromKeys, hasErrors, orderBody, type CheckoutValues } from './checkout-form';

const TOKEN = '3f8a2b6c-1d4e-4f5a-9b7c-0e1d2c3b4a59';
const PHOTO = '9c1d2e3f-4a5b-4c6d-8e7f-a0b1c2d3e4f5';
const ENTRY: CartEntry = {
  key: 'a1',
  config: { productId: 'molino', materialId: 'standard', edgeFinishId: 'szeges-ringli', widthCm: 200, heightCm: 100, quantity: 1, express: false },
  files: [],
  addedAt: '2026-10-09T10:00:00.000Z',
};
const FILLED: CheckoutValues = {
  ...EMPTY_CHECKOUT,
  name: 'Minta Mária',
  email: 'maria@example.hu',
  phone: '+36 70 123 4567',
  billingPostalCode: '1061',
  billingCity: 'Budapest',
  billingAddress: 'Minta utca 1.',
  shippingMethod: 'szemelyes',
  acceptTerms: true,
};
const extra = { formToken: TOKEN, sitePhotoIds: [PHOTO], source: '/kosar' };

describe('orderBody', () => {
  it('sends the order as the API takes it', () => {
    expect(orderBody(FILLED, [ENTRY], extra)).toEqual({
      formToken: TOKEN,
      honlap: '',
      source: '/kosar',
      customer: {
        name: 'Minta Mária',
        email: 'maria@example.hu',
        phone: '+36 70 123 4567',
        company: '',
        taxNumber: '',
        billingAddress: { postalCode: '1061', city: 'Budapest', address: 'Minta utca 1.' },
      },
      shippingMethod: 'szemelyes',
      surveyRequested: false,
      sitePhotoIds: [],
      items: [{ config: ENTRY.config, uploadIds: [] }],
      note: '',
      acceptTerms: true,
    });
  });

  it('adds the separate address, the survey and the site photos only where they belong', () => {
    const installation = {
      ...FILLED,
      shippingMethod: 'telepites' as const,
      sameAddress: false,
      shippingPostalCode: '9021',
      shippingCity: 'Győr',
      shippingAddress: 'Minta tér 2.',
      surveyRequested: true,
    };
    expect(orderBody(installation, [ENTRY], extra)).toMatchObject({
      shippingAddress: { postalCode: '9021', city: 'Győr', address: 'Minta tér 2.' },
      surveyRequested: true,
      sitePhotoIds: [PHOTO],
    });
    expect(orderBody({ ...installation, sameAddress: true }, [ENTRY], extra)).not.toHaveProperty('shippingAddress');
    expect(orderBody({ ...installation, shippingMethod: 'szemelyes' }, [ENTRY], extra)).toMatchObject({ surveyRequested: false, sitePhotoIds: [] });
  });
});

describe('checking the order in the browser', () => {
  it('names the missing fields with the server messages', () => {
    const errors = checkOrder(EMPTY_CHECKOUT, [ENTRY], extra);
    expect(errors.fields).toMatchObject({
      name: 'Adja meg a nevét.',
      email: 'Adja meg az e-mail-címét.',
      phone: 'Adja meg a telefonszámát.',
      billingPostalCode: 'Az irányítószám 4 számjegyből áll.',
      shippingMethod: 'Válasszon átvételi módot.',
      acceptTerms: 'A rendeléshez fogadja el az Általános Szerződési Feltételeket.',
    });
    expect(hasErrors(errors)).toBe(true);
    expect(hasErrors(checkOrder(FILLED, [ENTRY], extra))).toBe(false);
  });

  it('sorts the server keys into fields, items and the rest', () => {
    expect(
      errorsFromKeys({
        'customer.billingAddress.city': 'A',
        'shippingAddress.postalCode': 'B',
        'items.1.uploadIds': 'C',
        sitePhotoIds: 'D',
        items: 'E',
      }),
    ).toEqual({ fields: { billingCity: 'A', shippingPostalCode: 'B' }, items: { 1: 'C' }, sitePhotos: 'D', form: 'E' });
  });
});
