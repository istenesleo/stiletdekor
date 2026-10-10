// Where webshop orders are kept, as an interface: the API and the status page use the D1 version (d1-store.ts),
// handler tests a fake.
import type { ShippingMethodId, ShopProductId } from '@/domain/catalog';
import type { OrderStatus } from '@/domain/orders';
import type { CartPrice, ConfigurationPrice, ProductConfig } from '@/domain/pricing';
import type { PreflightSummary } from '@/domain/schemas';
import type { NotificationStore } from '../notify/queue';

export interface OrderAddress {
  postalCode: string;
  city: string;
  address: string;
}

export interface OrderCustomer {
  name: string;
  email: string;
  phone: string;
  company?: string | undefined;
  taxNumber?: string | undefined;
}

export interface OrderFile {
  id: string;
  name: string;
  sizeBytes: number;
}

export interface StoredOrderItem {
  position: number;
  productId: ShopProductId;
  description: string;
  quantity: number;
  express: boolean;
  netTotal: number;
  vatTotal: number;
  grossTotal: number;
  /** The browser's preflight; informational only. */
  preflight?: PreflightSummary | undefined;
  files: OrderFile[];
}

export interface OrderTotals {
  itemsNet: number;
  shippingNet: number;
  /** Installation: no list price, the workshop quotes it when confirming. */
  shippingPriceOnRequest: boolean;
  netTotal: number;
  vatTotal: number;
  grossTotal: number;
}

/** A saved order. Its reference is formatReference('R', id). */
export interface StoredOrder {
  id: number;
  statusToken: string;
  status: OrderStatus;
  /** Where the order arrived (https://…), for the e-mail's links. */
  siteOrigin: string;
  customer: OrderCustomer;
  billingAddress: OrderAddress;
  shippingMethod: ShippingMethodId;
  /** Courier or installation address; the billing address when missing. */
  shippingAddress?: OrderAddress | undefined;
  surveyRequested: boolean;
  note?: string | undefined;
  totals: OrderTotals;
  items: StoredOrderItem[];
  /** Photos of the installation site. */
  sitePhotos: OrderFile[];
  source?: string | undefined;
  /** ISO timestamp (UTC). */
  createdAt: string;
}

export interface NewOrderItem {
  config: ProductConfig;
  description: string;
  price: ConfigurationPrice;
  uploadIds: string[];
  preflight?: PreflightSummary | undefined;
}

export interface NewOrder {
  formToken: string;
  statusToken: string;
  siteOrigin: string;
  customer: OrderCustomer;
  billingAddress: OrderAddress;
  shippingMethod: ShippingMethodId;
  shippingAddress?: OrderAddress | undefined;
  surveyRequested: boolean;
  note?: string | undefined;
  /** The server's own calculation (priceCart). */
  price: CartPrice;
  items: NewOrderItem[];
  sitePhotoIds: string[];
  source?: string | undefined;
  createdAt: string;
}

export interface SavedOrder {
  id: number;
  statusToken: string;
  /** False when the form token was used before: the first order is returned, nothing new is saved. */
  created: boolean;
}

export interface OrderStore extends NotificationStore<StoredOrder> {
  /** Saves the order, its items and its first event and binds its uploads, all in one transaction. */
  insert(order: NewOrder): Promise<SavedOrder>;
  findByFormToken(formToken: string): Promise<{ id: number; statusToken: string } | null>;
  findByStatusToken(statusToken: string): Promise<StoredOrder | null>;
}
