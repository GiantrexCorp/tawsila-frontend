/**
 * Types for the Import Orders feature
 */

export type ImportStep = 'upload' | 'preview' | 'submitting';

export const EXPECTED_COLUMNS = [
  'customerName',
  'customerMobile',
  'customerAddress',
  'governorate',
  'city',
  'productName',
  'quantity',
  'unitPrice',
  'paymentMethod',
  'vendorNotes',
] as const;

export type ExpectedColumn = (typeof EXPECTED_COLUMNS)[number];

export interface ImportedOrderRow {
  _id: string;
  /** Optional external order reference (e.g. Shopify order name) used to group multi-item orders */
  _orderRef: string;
  customerName: string;
  customerMobile: string;
  customerAddress: string;
  governorate: string;
  city: string;
  /** Resolved governorate ID from the database (set by resolveLocationIds) */
  _governorateId?: number | null;
  /** Resolved city ID from the database (set by resolveLocationIds) */
  _cityId?: number | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  paymentMethod: string;
  vendorNotes: string;
  _errors: Partial<Record<ExpectedColumn, string>>;
}
