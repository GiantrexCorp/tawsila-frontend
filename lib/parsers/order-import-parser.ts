import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import 'xlsx/dist/cpexcel.full.mjs';
import {
  EXPECTED_COLUMNS,
  type ExpectedColumn,
  type ImportedOrderRow,
} from '@/lib/types/import-orders';

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
 * Parse a CSV file using PapaParse.
 */
export function parseCSV(
  file: File
): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const headers = results.meta.fields || [];
        const rows = results.data as Record<string, string>[];
        resolve({ headers, rows });
      },
      error(err) {
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
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error('Excel file contains no sheets');

  const sheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
    defval: '',
    raw: false,
  });

  const headers = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];

  return { headers, rows: jsonData };
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
// Validation
// ---------------------------------------------------------------------------

/**
 * Validate a single order row. Mutates `row._errors` in place.
 */
export function validateOrderRow(row: ImportedOrderRow): boolean {
  const errors: ImportedOrderRow['_errors'] = {};

  if (!row.customerName.trim()) errors.customerName = 'required';
  if (!row.customerMobile.trim()) errors.customerMobile = 'required';
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
