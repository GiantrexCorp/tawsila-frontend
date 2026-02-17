import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import 'xlsx/dist/cpexcel.full.mjs';
import {
  EXPECTED_COLUMNS,
  type ExpectedColumn,
  type ImportedOrderRow,
} from '@/lib/types/import-orders';
import type { Governorate, City } from '@/lib/services/vendors';

// ---------------------------------------------------------------------------
// Header synonyms — maps common header variations (EN, AR, Shopify) to our
// expected column names.
// ---------------------------------------------------------------------------

const HEADER_SYNONYMS: Record<string, ExpectedColumn> = {
  // --- customerName ---
  'customer name': 'customerName',
  'customer': 'customerName',
  'name': 'customerName',
  'billing name': 'customerName',
  'shipping name': 'customerName',
  'اسم العميل': 'customerName',
  'العميل': 'customerName',
  'الاسم': 'customerName',

  // --- customerMobile ---
  'mobile': 'customerMobile',
  'phone': 'customerMobile',
  'customer mobile': 'customerMobile',
  'customer phone': 'customerMobile',
  'phone number': 'customerMobile',
  'mobile number': 'customerMobile',
  'shipping phone': 'customerMobile',
  'billing phone': 'customerMobile',
  'رقم الموبايل': 'customerMobile',
  'الموبايل': 'customerMobile',
  'رقم الهاتف': 'customerMobile',
  'الهاتف': 'customerMobile',

  // --- customerAddress ---
  'address': 'customerAddress',
  'customer address': 'customerAddress',
  'delivery address': 'customerAddress',
  'shipping address1': 'customerAddress',
  'shipping street': 'customerAddress',
  'العنوان': 'customerAddress',
  'عنوان العميل': 'customerAddress',
  'عنوان التوصيل': 'customerAddress',

  // --- governorate ---
  'governorate': 'governorate',
  'province': 'governorate',
  'state': 'governorate',
  'shipping province': 'governorate',
  'shipping province name': 'governorate',
  'المحافظة': 'governorate',

  // --- city ---
  'city': 'city',
  'shipping city': 'city',
  'المدينة': 'city',
  'المنطقة': 'city',

  // --- productName ---
  'product': 'productName',
  'product name': 'productName',
  'item': 'productName',
  'item name': 'productName',
  'lineitem name': 'productName',
  'المنتج': 'productName',
  'اسم المنتج': 'productName',

  // --- quantity ---
  'quantity': 'quantity',
  'qty': 'quantity',
  'lineitem quantity': 'quantity',
  'الكمية': 'quantity',

  // --- unitPrice ---
  'price': 'unitPrice',
  'unit price': 'unitPrice',
  'price per unit': 'unitPrice',
  'lineitem price': 'unitPrice',
  'السعر': 'unitPrice',
  'سعر الوحدة': 'unitPrice',

  // --- paymentMethod ---
  'payment': 'paymentMethod',
  'payment method': 'paymentMethod',
  'financial status': 'paymentMethod',
  'طريقة الدفع': 'paymentMethod',
  'الدفع': 'paymentMethod',

  // --- vendorNotes ---
  'notes': 'vendorNotes',
  'vendor notes': 'vendorNotes',
  'order notes': 'vendorNotes',
  'ملاحظات': 'vendorNotes',
  'ملاحظات المورد': 'vendorNotes',
};

/**
 * Headers whose presence indicates a Shopify export.
 */
const SHOPIFY_MARKERS = [
  'Lineitem name',
  'Lineitem quantity',
  'Shipping Name',
  'Financial Status',
];

// ---------------------------------------------------------------------------
// Column mapping
// ---------------------------------------------------------------------------

/**
 * Auto-map raw CSV/Excel headers to our expected column names.
 */
export function autoMapColumns(
  headers: string[]
): Record<string, ExpectedColumn | null> {
  const mapping: Record<string, ExpectedColumn | null> = {};

  for (const header of headers) {
    const normalized = header.trim().toLowerCase();

    // Direct match against expected column names (camelCase)
    if ((EXPECTED_COLUMNS as readonly string[]).includes(normalized)) {
      mapping[header] = normalized as ExpectedColumn;
      continue;
    }

    // Synonym match
    if (HEADER_SYNONYMS[normalized]) {
      mapping[header] = HEADER_SYNONYMS[normalized];
      continue;
    }

    mapping[header] = null;
  }

  return mapping;
}

// ---------------------------------------------------------------------------
// File parsing
// ---------------------------------------------------------------------------

/**
 * Detect whether a buffer is valid UTF-8 with Arabic content or needs
 * re-decoding as Windows-1256 (common for Arabic CSVs exported from Excel).
 */
function detectCSVEncoding(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);

  // UTF-8 BOM — definitely UTF-8
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) return 'utf-8';

  // Try strict UTF-8 decode
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    // Valid UTF-8 but might be mojibake: if we see Latin chars like Ù/Ø
    // (U+00D9/U+00D8) but no actual Arabic block chars, it's Windows-1256
    // being accidentally valid UTF-8.
    const hasArabic = /[\u0600-\u06FF]/.test(text);
    const hasMojibake = /[\u00C0-\u00FF]{2,}/.test(text);
    if (!hasArabic && hasMojibake) return 'windows-1256';
    return 'utf-8';
  } catch {
    // Invalid UTF-8 sequences → likely Windows-1256
    return 'windows-1256';
  }
}

/**
 * Parse a CSV file using PapaParse with automatic encoding detection.
 */
export async function parseCSV(
  file: File
): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
  const buffer = await file.arrayBuffer();
  const encoding = detectCSVEncoding(buffer);
  const text = new TextDecoder(encoding).decode(buffer);

  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const headers = results.meta.fields || [];
        const rows = results.data as Record<string, string>[];
        resolve({ headers, rows });
      },
      error(err: Error) {
        reject(err);
      },
    });
  });
}

/**
 * Parse an Excel file (.xlsx / .xls) using SheetJS.
 */
export async function parseExcel(
  file: File
): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', codepage: 65001 });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error('Excel file contains no sheets');

  const sheet = workbook.Sheets[sheetName];

  // Read with raw values so we can handle phone numbers ourselves
  const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
    raw: true,
  });

  // Convert all values to strings, preserving phone number leading zeros
  const stringRows = jsonData.map((row) => {
    const out: Record<string, string> = {};
    for (const [key, val] of Object.entries(row)) {
      if (val == null) {
        out[key] = '';
      } else if (typeof val === 'number') {
        // Check if this column is likely a phone/mobile field
        const normKey = key.trim().toLowerCase();
        const isPhone =
          normKey.includes('phone') ||
          normKey.includes('mobile') ||
          normKey === 'الموبايل' ||
          normKey === 'رقم الموبايل' ||
          normKey === 'رقم الهاتف' ||
          normKey === 'الهاتف';
        if (isPhone) {
          // Restore leading zero for Egyptian phone numbers
          const s = String(val);
          out[key] = s.length === 10 && !s.startsWith('0') ? '0' + s : s;
        } else {
          out[key] = String(val);
        }
      } else {
        out[key] = String(val);
      }
    }
    return out;
  });

  const headers = stringRows.length > 0 ? Object.keys(stringRows[0]) : [];

  return { headers, rows: stringRows };
}

/**
 * Route to the correct parser based on file extension.
 */
export async function parseImportFile(
  file: File
): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'csv') {
    return parseCSV(file);
  }
  if (extension === 'xlsx' || extension === 'xls') {
    return parseExcel(file);
  }

  throw new Error(`Unsupported file type: .${extension}`);
}

// ---------------------------------------------------------------------------
// Shopify-specific pre-processing
// ---------------------------------------------------------------------------

/**
 * Detect whether the parsed headers belong to a Shopify export.
 */
export function isShopifyExport(headers: string[]): boolean {
  const headerSet = new Set(headers.map((h) => h.trim()));
  return SHOPIFY_MARKERS.filter((m) => headerSet.has(m)).length >= 2;
}

/**
 * Pre-process Shopify export rows:
 *  1. Forward-fill customer / order-level fields from the first row of each
 *     order group (Shopify uses the `Name` column as the order identifier and
 *     leaves order-level fields blank for extra line-item rows).
 *  2. Concatenate Shipping Address1 + Shipping Address2 into a single field.
 *  3. Normalise payment method values.
 */
export function preprocessShopifyRows(
  rows: Record<string, string>[]
): Record<string, string>[] {
  // Fields that should be forward-filled from the first row of the same order
  const ORDER_LEVEL_FIELDS = [
    'Shipping Name',
    'Shipping Phone',
    'Shipping Address1',
    'Shipping Address2',
    'Shipping Street',
    'Shipping City',
    'Shipping Province',
    'Shipping Province Name',
    'Shipping Zip',
    'Shipping Country',
    'Billing Name',
    'Billing Phone',
    'Payment Method',
    'Financial Status',
    'Notes',
    'Email',
    'Phone',
  ];

  // ---- Forward-fill by order Name ----
  let lastOrder: Record<string, string> | null = null;

  for (const row of rows) {
    const orderName = (row['Name'] ?? '').trim();

    // If we encounter a new non-empty order name, treat this row as the
    // "first row" of a new order group and cache its order-level values.
    if (orderName) {
      lastOrder = {};
      for (const field of ORDER_LEVEL_FIELDS) {
        const val = (row[field] ?? '').trim();
        if (val) lastOrder[field] = val;
      }
    } else if (lastOrder) {
      // Continuation row — fill in missing order-level fields
      for (const field of ORDER_LEVEL_FIELDS) {
        if (!(row[field] ?? '').trim() && lastOrder[field]) {
          row[field] = lastOrder[field];
        }
      }
      // Copy order name too so we can group later
      if (!row['Name'] && lastOrder['Name']) {
        row['Name'] = lastOrder['Name'];
      }
    }

    // Store Name in lastOrder for potential continuation rows
    if (orderName && lastOrder) {
      lastOrder['Name'] = orderName;
    }
  }

  // ---- Concatenate Address1 + Address2 ----
  for (const row of rows) {
    const addr1 = (row['Shipping Address1'] ?? '').trim();
    const addr2 = (row['Shipping Address2'] ?? '').trim();
    if (addr2 && addr1) {
      row['Shipping Address1'] = `${addr1}, ${addr2}`;
    }
  }

  // ---- Normalise payment method ----
  for (const row of rows) {
    const raw = (
      row['Payment Method'] ??
      row['Financial Status'] ??
      ''
    )
      .trim()
      .toLowerCase();

    if (
      raw.includes('shopify payments') ||
      raw.includes('stripe') ||
      raw.includes('klarna') ||
      raw.includes('paypal') ||
      raw.includes('apple pay') ||
      raw === 'paid'
    ) {
      row['Payment Method'] = 'card';
    } else if (raw.includes('cash') || raw === 'cod') {
      row['Payment Method'] = 'cash';
    }
    // If the value doesn't match anything known, leave it as-is —
    // the user can fix it in the preview table.
  }

  return rows;
}

// ---------------------------------------------------------------------------
// Row mapping
// ---------------------------------------------------------------------------

/**
 * Convert raw parsed rows into ImportedOrderRow[] using the column mapping.
 * Automatically detects and pre-processes Shopify exports.
 */
export function mapRowsToOrders(
  rawRows: Record<string, string>[],
  mapping: Record<string, ExpectedColumn | null>,
  headers: string[]
): ImportedOrderRow[] {
  // Shopify pre-processing
  const shopify = isShopifyExport(headers);
  if (shopify) {
    preprocessShopifyRows(rawRows);
  }

  return rawRows.map((raw, index) => {
    const row: ImportedOrderRow = {
      _id: `import-${index}-${Date.now()}`,
      _orderRef: shopify ? (raw['Name'] ?? '').trim() : '',
      customerName: '',
      customerMobile: '',
      customerAddress: '',
      governorate: '',
      city: '',
      productName: '',
      quantity: 1,
      unitPrice: 0,
      paymentMethod: 'cash',
      vendorNotes: '',
      _errors: {},
    };

    for (const [header, column] of Object.entries(mapping)) {
      if (!column) continue;
      const value = (raw[header] ?? '').toString().trim();

      // Skip empty values when the column already has a non-empty value
      // (multiple headers can map to the same column, e.g. Shopify exports
      // have Billing Phone, Shipping Phone, and Phone all → customerMobile)
      if (!value && (row as unknown as Record<string, string>)[column]) continue;

      if (column === 'quantity') {
        const num = parseInt(value, 10);
        row.quantity = isNaN(num) ? 1 : num;
      } else if (column === 'unitPrice') {
        const num = parseFloat(value);
        row.unitPrice = isNaN(num) ? 0 : num;
      } else {
        (row as unknown as Record<string, unknown>)[column] = value;
      }
    }

    return row;
  });
}

// ---------------------------------------------------------------------------
// Location resolution — match imported governorate/city strings to DB IDs
// ---------------------------------------------------------------------------

/**
 * Normalize a location string for comparison: trim, lowercase, strip common
 * prefixes/suffixes like "Governorate", "محافظة", and normalise Arabic
 * ta-marbuta (ة → ه) so "الجيزه" matches "الجيزة".
 */
function normalizeLocation(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+governorate$/i, '')
    .replace(/\s+gov\.?$/i, '')
    .replace(/^محافظة\s+/, '')
    .replace(/\s+محافظة$/, '')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ');
}

/**
 * Try to find a governorate matching the raw string.
 * Checks name_en, name_ar (and their normalised forms).
 */
function findGovernorate(
  raw: string,
  governorates: Governorate[]
): Governorate | undefined {
  if (!raw.trim()) return undefined;
  const norm = normalizeLocation(raw);

  for (const gov of governorates) {
    if (
      normalizeLocation(gov.name_en) === norm ||
      normalizeLocation(gov.name_ar) === norm
    ) {
      return gov;
    }
  }

  // Partial / contains match as fallback (e.g. "Al Jizah" contains "jiz" ~ "giz")
  for (const gov of governorates) {
    const en = normalizeLocation(gov.name_en);
    const ar = normalizeLocation(gov.name_ar);
    if (norm.includes(en) || en.includes(norm) || norm.includes(ar) || ar.includes(norm)) {
      return gov;
    }
  }

  return undefined;
}

/**
 * Try to find a city matching the raw string within a given set of cities.
 */
function findCity(
  raw: string,
  cities: City[]
): City | undefined {
  if (!raw.trim()) return undefined;
  const norm = normalizeLocation(raw);

  for (const city of cities) {
    if (
      normalizeLocation(city.name_en) === norm ||
      normalizeLocation(city.name_ar) === norm
    ) {
      return city;
    }
  }

  // Partial / contains match as fallback
  for (const city of cities) {
    const en = normalizeLocation(city.name_en);
    const ar = normalizeLocation(city.name_ar);
    if (norm.includes(en) || en.includes(norm) || norm.includes(ar) || ar.includes(norm)) {
      return city;
    }
  }

  return undefined;
}

/**
 * Resolve governorate/city strings in imported rows to database IDs.
 * Mutates rows in place — sets _governorateId and _cityId, and normalises
 * the display strings to match the canonical DB names.
 *
 * @param rows     Parsed import rows
 * @param govs     Governorates from the API
 * @param cities   All cities (for all governorates) from the API
 */
export function resolveLocationIds(
  rows: ImportedOrderRow[],
  govs: Governorate[],
  cities: City[]
): void {
  for (const row of rows) {
    // --- Governorate ---
    const gov = findGovernorate(row.governorate, govs);
    if (gov) {
      row._governorateId = gov.id;
      row.governorate = gov.name_en;

      // --- City (scoped to matched governorate) ---
      const govCities = cities.filter(
        (c) => c.governorate.id === gov.id
      );
      const city = findCity(row.city, govCities);
      if (city) {
        row._cityId = city.id;
        row.city = city.name_en;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Validate a single order row. Mutates `row._errors` in place.
 */
export function validateOrderRow(row: ImportedOrderRow): boolean {
  const errors: ImportedOrderRow['_errors'] = {};

  const name = row.customerName.trim();
  if (!name) {
    errors.customerName = 'required';
  } else if (/^\d+$/.test(name)) {
    errors.customerName = 'invalidName';
  }

  const mobile = row.customerMobile.trim();
  if (!mobile) {
    errors.customerMobile = 'required';
  } else if (!/^01\d{9}$/.test(mobile)) {
    errors.customerMobile = 'invalidMobile';
  }

  if (!row.customerAddress.trim()) errors.customerAddress = 'required';
  if (!row.productName.trim()) errors.productName = 'required';
  if (row.quantity < 1) errors.quantity = 'min1';
  if (row.unitPrice < 0) errors.unitPrice = 'minZero';

  row._errors = errors;
  return Object.keys(errors).length === 0;
}

/**
 * Validate all rows. Returns number of rows with errors.
 */
export function validateAllRows(rows: ImportedOrderRow[]): number {
  let errorCount = 0;
  for (const row of rows) {
    if (!validateOrderRow(row)) errorCount++;
  }
  return errorCount;
}

// ---------------------------------------------------------------------------
// Template generation
// ---------------------------------------------------------------------------

/**
 * Generate a blank template file for download.
 */
export function generateTemplate(format: 'csv' | 'xlsx' = 'csv'): void {
  const headers = [
    'Customer Name',
    'Mobile',
    'Address',
    'Governorate',
    'City',
    'Product Name',
    'Quantity',
    'Unit Price',
    'Payment Method',
    'Notes',
  ];

  const sampleRow = [
    'Ahmed Mohamed',
    '01012345678',
    '123 Main St, Nasr City',
    'Cairo',
    'Nasr City',
    'T-Shirt - Black - XL',
    '2',
    '350',
    'cash',
    'Handle with care',
  ];

  if (format === 'csv') {
    const csv = [headers.join(','), sampleRow.join(',')].join('\n');
    const blob = new Blob(['\uFEFF' + csv], {
      type: 'text/csv;charset=utf-8;',
    });
    downloadBlob(blob, 'orders-template.csv');
  } else {
    const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Orders');
    XLSX.writeFile(wb, 'orders-template.xlsx');
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
