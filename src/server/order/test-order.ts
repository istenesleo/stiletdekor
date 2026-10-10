// A saved order for the e-mail and notification tests.
import type { StoredOrder } from './store';

export const FILE_A = '9c1d2e3f-4a5b-4c6d-8e7f-a0b1c2d3e4f5';
export const FILE_B = '0b1c2d3e-4f5a-4b6c-8d7e-9f0a1b2c3d4e';
export const STATUS_TOKEN = 'AbCdEfGhIjKlMnOpQrStUv';

export const ORDER: StoredOrder = {
  id: 7,
  statusToken: STATUS_TOKEN,
  status: 'beerkezett',
  siteOrigin: 'https://stiletdekor.example',
  customer: { name: 'Minta Mária', email: 'maria@example.hu', phone: '+36 70 123 4567', company: 'Minta Kft.', taxNumber: '12345676-1-42' },
  billingAddress: { postalCode: '1061', city: 'Budapest', address: 'Minta utca 1.' },
  shippingMethod: 'telepites',
  shippingAddress: { postalCode: '9021', city: 'Győr', address: 'Minta tér 2.' },
  surveyRequested: true,
  note: 'Hívjanak <előtte>.',
  totals: { itemsNet: 20000, shippingNet: 0, shippingPriceOnRequest: true, netTotal: 20000, vatTotal: 5400, grossTotal: 25400 },
  items: [
    {
      position: 0,
      productId: 'molino',
      description: 'Molinó · Standard frontlit molinó · 200 × 100 cm · Szegés + ringli',
      quantity: 2,
      express: false,
      netTotal: 18000,
      vatTotal: 4860,
      grossTotal: 22860,
      preflight: { dpi: 150, rating: 'kivalo', aspectMismatch: false },
      files: [{ id: FILE_A, name: 'logo.pdf', sizeBytes: 1_200_000 }],
    },
    {
      position: 1,
      productId: 'plakat',
      description: 'Plakát · A2 · Matt · álló',
      quantity: 1,
      express: false,
      netTotal: 2000,
      vatTotal: 540,
      grossTotal: 2540,
      files: [],
    },
  ],
  sitePhotos: [{ id: FILE_B, name: 'helyszin.jpg', sizeBytes: 830_000 }],
  source: '/kosar',
  createdAt: '2026-10-09T10:00:00.000Z',
};
