// The checkout's state and its way to POST /api/orders: the values, the request body, the field each error key belongs
// to (the server and the browser use the same schema, so the messages are the same), and the draft kept in the tab.
import { type CartEntry, toOrderItems } from '@/domain/cart';
import type { ShippingMethodId } from '@/domain/catalog';
import { OrderRequestSchema } from '@/domain/schemas';

export interface CheckoutValues {
  name: string;
  email: string;
  phone: string;
  company: string;
  taxNumber: string;
  billingPostalCode: string;
  billingCity: string;
  billingAddress: string;
  shippingMethod: ShippingMethodId | '';
  /** The courier or installation address is the billing address. */
  sameAddress: boolean;
  shippingPostalCode: string;
  shippingCity: string;
  shippingAddress: string;
  surveyRequested: boolean;
  note: string;
  acceptTerms: boolean;
}

export type CheckoutField = keyof CheckoutValues;

export const EMPTY_CHECKOUT: CheckoutValues = {
  name: '',
  email: '',
  phone: '',
  company: '',
  taxNumber: '',
  billingPostalCode: '',
  billingCity: '',
  billingAddress: '',
  shippingMethod: '',
  sameAddress: true,
  shippingPostalCode: '',
  shippingCity: '',
  shippingAddress: '',
  surveyRequested: false,
  note: '',
  acceptTerms: false,
};

/** The fields in page order, for the error summary. */
export const CHECKOUT_FIELDS: readonly CheckoutField[] = [
  'name',
  'email',
  'phone',
  'company',
  'taxNumber',
  'billingPostalCode',
  'billingCity',
  'billingAddress',
  'shippingMethod',
  'shippingPostalCode',
  'shippingCity',
  'shippingAddress',
  'surveyRequested',
  'note',
  'acceptTerms',
];

export const CHECKOUT_DRAFT_KEY = 'stilet-penztar';
export const CHECKOUT_TOKEN_KEY = 'stilet-penztar-token';

export const needsAddress = (method: CheckoutValues['shippingMethod']): boolean => method === 'futar' || method === 'telepites';
export const fieldId = (field: CheckoutField): string => `penztar-${field}`;

export interface OrderExtras {
  formToken: string;
  sitePhotoIds: readonly string[];
  source?: string | undefined;
  /** The trap field; empty for people. */
  honlap?: string;
}

/** The body of POST /api/orders. */
export function orderBody(values: CheckoutValues, entries: readonly CartEntry[], extra: OrderExtras) {
  const separate = needsAddress(values.shippingMethod) && !values.sameAddress;
  return {
    formToken: extra.formToken,
    honlap: extra.honlap ?? '',
    ...(extra.source ? { source: extra.source } : {}),
    customer: {
      name: values.name,
      email: values.email,
      phone: values.phone,
      company: values.company,
      taxNumber: values.taxNumber,
      billingAddress: { postalCode: values.billingPostalCode, city: values.billingCity, address: values.billingAddress },
    },
    ...(separate ? { shippingAddress: { postalCode: values.shippingPostalCode, city: values.shippingCity, address: values.shippingAddress } } : {}),
    shippingMethod: values.shippingMethod,
    surveyRequested: values.shippingMethod === 'telepites' && values.surveyRequested,
    sitePhotoIds: values.shippingMethod === 'telepites' ? [...extra.sitePhotoIds] : [],
    items: toOrderItems(entries),
    note: values.note,
    acceptTerms: values.acceptTerms,
  };
}

export interface CheckoutErrors {
  fields: Partial<Record<CheckoutField, string>>;
  /** By item index. */
  items: Record<number, string>;
  sitePhotos?: string | undefined;
  /** Not tied to a field: the server's message, an empty cart. */
  form?: string | undefined;
}

export const noErrors = (): CheckoutErrors => ({ fields: {}, items: {} });

const FIELD_OF_KEY: Readonly<Record<string, CheckoutField>> = {
  'customer.name': 'name',
  'customer.email': 'email',
  'customer.phone': 'phone',
  'customer.company': 'company',
  'customer.taxNumber': 'taxNumber',
  'customer.billingAddress.postalCode': 'billingPostalCode',
  'customer.billingAddress.city': 'billingCity',
  'customer.billingAddress.address': 'billingAddress',
  shippingMethod: 'shippingMethod',
  'shippingAddress.postalCode': 'shippingPostalCode',
  'shippingAddress.city': 'shippingCity',
  'shippingAddress.address': 'shippingAddress',
  surveyRequested: 'surveyRequested',
  note: 'note',
  acceptTerms: 'acceptTerms',
};

/** Sorts the dotted error keys ("customer.email", "items.0.uploadIds") into fields, items and the rest. */
export function errorsFromKeys(errors: Readonly<Record<string, string>>): CheckoutErrors {
  const result = noErrors();
  for (const [key, message] of Object.entries(errors)) {
    const field = FIELD_OF_KEY[key];
    const item = /^items\.(\d+)/.exec(key);
    if (field) result.fields[field] ??= message;
    else if (item) result.items[Number(item[1])] ??= message;
    else if (key.startsWith('sitePhotoIds')) result.sitePhotos ??= message;
    else result.form ??= message;
  }
  return result;
}

/** The browser's check with the server's schema, before sending. */
export function checkOrder(values: CheckoutValues, entries: readonly CartEntry[], extra: OrderExtras): CheckoutErrors {
  const parsed = OrderRequestSchema.safeParse(orderBody(values, entries, extra));
  if (parsed.success) return noErrors();
  const errors: Record<string, string> = {};
  for (const issue of parsed.error.issues) errors[issue.path.map(String).join('.') || 'form'] ??= issue.message;
  return errorsFromKeys(errors);
}

export const hasErrors = (errors: CheckoutErrors): boolean =>
  Object.keys(errors.fields).length > 0 || Object.keys(errors.items).length > 0 || Boolean(errors.sitePhotos) || Boolean(errors.form);
