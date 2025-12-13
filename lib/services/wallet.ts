/**
 * Wallet & Finance Service
 *
 * Handles wallet-related API operations for users and admin.
 */

import { apiRequest } from '../api';

/**
 * Wallet entity representing user's financial wallet
 */
export interface Wallet {
  /** Unique wallet identifier */
  id: number;
  /** Type of entity that owns the wallet */
  walletable_type: string;
  /** ID of the entity that owns the wallet */
  walletable_id: number;
  /** Current balance (can be negative) */
  balance: number;
  /** Total amount credited to wallet */
  total_credited: number;
  /** Total amount debited from wallet */
  total_debited: number;
  /** Balance status indicator */
  balance_status: 'positive' | 'negative' | 'zero';
  /** Absolute value of balance */
  absolute_balance: number;
  /** Last transaction timestamp */
  last_transaction_at: string | null;
  /** Whether the wallet has unsettled transactions */
  has_unsettled_transactions: boolean;
  /** Wallet creation timestamp */
  created_at: string;
  /** Last update timestamp */
  updated_at: string;
  /** Owner information (for admin views) */
  walletable?: {
    id: number;
    name?: string;
    name_en?: string;
    name_ar?: string;
    email?: string;
    mobile?: string;
    status?: string;
    /** User roles (only for User walletable type) */
    roles?: Array<{
      id: number;
      name: string;
      slug_en: string;
      slug_ar: string;
    }>;
  };
  /** Settlements for this wallet (when included) */
  settlements?: WalletSettlement[];
}

/**
 * Settlement included in wallet response (simplified)
 */
export interface WalletSettlement {
  id: number;
  settlement_number: string;
  settleble_type: string;
  settleble_id: number;
  type: 'payout' | 'collection';
  type_label: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  status_label: string;
  period_from: string;
  period_to: string;
  notes: string | null;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
  can_confirm: boolean;
  can_cancel: boolean;
}

/**
 * Available includes for wallet API
 * - walletable: Owner information
 * - settlements: Wallet settlements
 */
export type WalletInclude = 'walletable' | 'settlements';

/**
 * User role in transaction context
 */
export interface TransactionUserRole {
  id: number;
  name: string;
  slug_en: string;
  slug_ar: string;
}

/**
 * User who created the transaction
 */
export interface TransactionUser {
  id: number;
  name_en: string;
  name_ar: string;
  mobile: string;
  email: string;
  status: 'active' | 'inactive';
  last_active: string | null;
  created_at: string;
  updated_at: string;
  roles: TransactionUserRole[];
  roles_permissions: string[];
}

/**
 * Order linked to transaction
 */
export interface TransactionOrder {
  id: number;
  order_number: string;
}

/**
 * Transaction metadata
 */
export interface TransactionMetadata {
  order_number?: string;
  total_amount?: string;
  [key: string]: unknown;
}

/**
 * Transaction entity
 */
export interface Transaction {
  /** Unique transaction identifier */
  id: number;
  /** Unique reference number */
  reference_number: string;
  /** Related order ID (if applicable) */
  order_id: number | null;
  /** Related wallet ID */
  wallet_id?: number;
  /** Type of entity this transaction belongs to */
  transactable_type: string;
  /** ID of the entity this transaction belongs to */
  transactable_id: number;
  /** Transaction type */
  type: 'credit' | 'debit';
  /** Localized type label */
  type_label: string;
  /** Transaction category */
  category: string;
  /** Localized category label */
  category_label: string;
  /** Transaction amount (always positive) */
  amount: number;
  /** Signed amount (negative for debit) */
  signed_amount: number;
  /** Balance after this transaction */
  balance_after: number;
  /** Transaction description */
  description: string;
  /** Additional metadata */
  metadata: TransactionMetadata;
  /** Transaction timestamp */
  created_at: string;
  /** Last update timestamp */
  updated_at: string;
  /** Related order */
  order: TransactionOrder | null;
  /** User who created the transaction */
  created_by: TransactionUser | null;
  /** Wallet information (for admin views) */
  wallet?: Wallet;
}

/**
 * Pagination meta information
 */
export interface PaginationMeta {
  current_page: number;
  from: number | null;
  last_page: number;
  per_page: number;
  to: number | null;
  total: number;
}

/**
 * Wallets response with pagination
 */
export interface WalletsResponse {
  data: Wallet[];
  meta: PaginationMeta;
}

/**
 * Transactions response with pagination
 */
export interface TransactionsResponse {
  data: Transaction[];
  meta: PaginationMeta;
}

// ============================================
// User's Own Wallet & Transactions
// ============================================

/**
 * Fetch current user's wallet
 */
export async function fetchMyWallet(): Promise<Wallet> {
  const response = await apiRequest<Wallet>('/finance/my/wallet', {
    method: 'GET',
  });

  if (!response.data) {
    throw new Error('No wallet data returned');
  }

  return response.data;
}

/**
 * Transaction filter parameters
 */
export interface TransactionFilters {
  page?: number;
  per_page?: number;
  type?: 'credit' | 'debit';
  category?: string;
  from_date?: string;
  to_date?: string;
  wallet_id?: number;
}

/**
 * Fetch current user's transactions
 */
export async function fetchMyTransactions(filters?: TransactionFilters): Promise<TransactionsResponse> {
  const params = new URLSearchParams();

  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.per_page) params.append('per_page', filters.per_page.toString());
  if (filters?.type) params.append('type', filters.type);
  if (filters?.category) params.append('category', filters.category);
  if (filters?.from_date) params.append('from_date', filters.from_date);
  if (filters?.to_date) params.append('to_date', filters.to_date);

  const queryString = params.toString();
  const endpoint = `/finance/my/transactions${queryString ? `?${queryString}` : ''}`;

  const response = await apiRequest<Transaction[]>(endpoint, {
    method: 'GET',
  });

  return {
    data: response.data || [],
    meta: extractPaginationMeta(response.meta),
  };
}

/**
 * Financial summary for current user
 */
export interface MySummary {
  /** Current wallet balance */
  current_balance: string;
  /** Total amount credited */
  total_credited: string;
  /** Total amount debited */
  total_debited: string;
  /** Unsettled balance (pending to be settled) */
  unsettled_balance: number;
  /** Number of pending settlements */
  pending_settlements: number;
  /** Total payouts made */
  total_payouts: number;
  /** Total collections received */
  total_collections: number;
}

/**
 * Fetch current user's financial summary
 */
export async function fetchMySummary(): Promise<MySummary> {
  const response = await apiRequest<MySummary>('/finance/my/summary', {
    method: 'GET',
  });

  if (!response.data) {
    throw new Error('No summary data returned');
  }

  return response.data;
}

// ============================================
// Admin Wallets Management
// ============================================

/**
 * Wallet filter parameters for admin
 */
export interface WalletFilters {
  page?: number;
  per_page?: number;
  balance_status?: 'positive' | 'negative' | 'zero';
  walletable_type?: string;
  /** Relations to include in the response */
  includes?: WalletInclude[];
}

/**
 * Fetch all wallets (admin)
 * Requires: list-wallets permission
 */
export async function fetchWallets(filters?: WalletFilters): Promise<WalletsResponse> {
  const params = new URLSearchParams();

  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.per_page) params.append('per_page', filters.per_page.toString());
  if (filters?.balance_status) params.append('balance_status', filters.balance_status);
  if (filters?.walletable_type) params.append('walletable_type', filters.walletable_type);
  if (filters?.includes && filters.includes.length > 0) {
    params.append('include', filters.includes.join(','));
  }

  const queryString = params.toString();
  const endpoint = `/wallets${queryString ? `?${queryString}` : ''}`;

  const response = await apiRequest<Wallet[]>(endpoint, {
    method: 'GET',
  });

  return {
    data: response.data || [],
    meta: extractPaginationMeta(response.meta),
  };
}

/**
 * Fetch single wallet by ID (admin)
 * Requires: show-wallet permission
 * @param id - Wallet ID
 * @param includes - Optional array of relations to include
 */
export async function fetchWallet(id: number, includes?: WalletInclude[]): Promise<Wallet> {
  const params = new URLSearchParams();

  if (includes && includes.length > 0) {
    params.append('include', includes.join(','));
  }

  const queryString = params.toString();
  const endpoint = `/wallets/${id}${queryString ? `?${queryString}` : ''}`;

  const response = await apiRequest<Wallet>(endpoint, {
    method: 'GET',
  });

  if (!response.data) {
    throw new Error('No wallet data returned');
  }

  return response.data;
}

/**
 * Fetch transactions for a specific wallet (admin)
 * Requires: list-transactions permission
 */
export async function fetchWalletTransactions(walletId: number, filters?: TransactionFilters): Promise<TransactionsResponse> {
  const params = new URLSearchParams();

  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.per_page) params.append('per_page', filters.per_page.toString());
  if (filters?.type) params.append('type', filters.type);
  if (filters?.category) params.append('category', filters.category);
  if (filters?.from_date) params.append('from_date', filters.from_date);
  if (filters?.to_date) params.append('to_date', filters.to_date);

  const queryString = params.toString();
  const endpoint = `/wallets/${walletId}/transactions${queryString ? `?${queryString}` : ''}`;

  const response = await apiRequest<Transaction[]>(endpoint, {
    method: 'GET',
  });

  return {
    data: response.data || [],
    meta: extractPaginationMeta(response.meta),
  };
}

// ============================================
// Admin Transactions Management
// ============================================

/**
 * Fetch all transactions (admin)
 * Requires: list-transactions permission
 */
export async function fetchTransactions(filters?: TransactionFilters): Promise<TransactionsResponse> {
  const params = new URLSearchParams();

  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.per_page) params.append('per_page', filters.per_page.toString());
  if (filters?.type) params.append('type', filters.type);
  if (filters?.category) params.append('category', filters.category);
  if (filters?.from_date) params.append('from_date', filters.from_date);
  if (filters?.to_date) params.append('to_date', filters.to_date);
  if (filters?.wallet_id) params.append('wallet_id', filters.wallet_id.toString());

  const queryString = params.toString();
  const endpoint = `/transactions${queryString ? `?${queryString}` : ''}`;

  const response = await apiRequest<Transaction[]>(endpoint, {
    method: 'GET',
  });

  return {
    data: response.data || [],
    meta: extractPaginationMeta(response.meta),
  };
}

/**
 * Fetch single transaction by ID (admin)
 * Requires: show-transaction permission
 */
export async function fetchTransaction(id: number): Promise<Transaction> {
  const response = await apiRequest<Transaction>(`/transactions/${id}`, {
    method: 'GET',
  });

  if (!response.data) {
    throw new Error('No transaction data returned');
  }

  return response.data;
}

// ============================================
// Wallet Adjustments
// ============================================

/**
 * Adjustment request payload
 */
export interface CreateAdjustmentRequest {
  type: 'credit' | 'debit';
  amount: number;
  description: string;
}

/**
 * Create a wallet adjustment (credit or debit)
 * Requires: create-adjustment permission
 * Note: Users cannot create adjustments on their own wallets
 * @param walletId - The wallet to adjust
 * @param data - Adjustment details (type, amount, description)
 */
export async function createAdjustment(walletId: number, data: CreateAdjustmentRequest): Promise<Transaction> {
  const response = await apiRequest<Transaction>(`/wallets/${walletId}/adjustments`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.data) {
    throw new Error(response.message || 'Failed to create adjustment');
  }

  return response.data;
}

// ============================================
// Settlements
// ============================================

/**
 * Transaction in settlement item
 */
export interface SettlementItemTransaction {
  id: number;
  reference_number: string;
  order_id: number | null;
  transactable_type: string;
  transactable_id: number;
  type: 'credit' | 'debit';
  type_label: string;
  category: string;
  category_label: string;
  amount: number;
  signed_amount: number;
  balance_after: number;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Order in settlement item
 */
export interface SettlementItemOrder {
  id: number;
  order_number: string;
}

/**
 * Settlement item - transaction included in settlement
 */
export interface SettlementItem {
  id: number;
  settlement_id: number;
  transaction_id: number;
  order_id: number | null;
  amount: number;
  created_at: string;
  transaction?: SettlementItemTransaction;
  order?: SettlementItemOrder | null;
}

/**
 * User who created or confirmed the settlement
 */
export interface SettlementUser {
  id: number;
  name_en: string;
  name_ar: string;
  mobile?: string;
  email: string;
  status?: string;
  last_active?: string | null;
  created_at?: string;
  updated_at?: string;
  roles?: Array<{
    id: number;
    name: string;
    slug_en: string;
    slug_ar: string;
  }>;
}

/**
 * Settleble entity (wallet owner)
 */
export interface SettlementSettleble {
  id: number;
  name?: string;
  name_en?: string;
  name_ar?: string;
  email?: string;
  mobile?: string;
  status?: string;
  /** User roles (only for User settleble type) */
  roles?: Array<{
    id: number;
    name: string;
    slug_en: string;
    slug_ar: string;
  }>;
}

/**
 * Settlement entity
 */
export interface Settlement {
  /** Unique settlement identifier */
  id: number;
  /** Unique settlement reference number */
  settlement_number: string;
  /** Type of entity this settlement belongs to */
  settleble_type: string;
  /** ID of the entity this settlement belongs to */
  settleble_id: number;
  /** Settlement type - payout (we owe them) or collection (they owe us) */
  type: 'payout' | 'collection';
  /** Localized type label */
  type_label: string;
  /** Absolute total amount */
  amount: number;
  /** Settlement status */
  status: 'pending' | 'confirmed' | 'cancelled';
  /** Localized status label */
  status_label: string;
  /** Start of settlement period */
  period_from: string;
  /** End of settlement period */
  period_to: string;
  /** Optional notes */
  notes: string | null;
  /** When the settlement was confirmed */
  confirmed_at: string | null;
  /** Settlement creation timestamp */
  created_at: string;
  /** Last update timestamp */
  updated_at: string;
  /** Whether current user can confirm this settlement */
  can_confirm: boolean;
  /** Whether current user can cancel this settlement */
  can_cancel: boolean;
  /** The entity this settlement belongs to (wallet owner) */
  settleble?: SettlementSettleble;
  /** User who confirmed the settlement */
  confirmed_by: SettlementUser | null;
  /** User who created the settlement */
  created_by: SettlementUser | null;
  /** Transactions included in this settlement */
  items: SettlementItem[];
}

/**
 * Settlements response with pagination
 */
export interface SettlementsResponse {
  data: Settlement[];
  meta: PaginationMeta;
}

/**
 * Settlement filter parameters
 */
export interface SettlementFilters {
  page?: number;
  per_page?: number;
  id?: number;
  type?: 'payout' | 'collection';
  status?: 'pending' | 'confirmed' | 'cancelled';
  settleble_type?: string;
  settleble_id?: number;
}

/**
 * Available includes for settlement API
 */
export type SettlementInclude = 'settleble' | 'items' | 'items.transaction' | 'items.order' | 'confirmedBy' | 'createdBy';

/**
 * Settlement creation request payload
 */
export interface CreateSettlementRequest {
  /** Start of settlement period (YYYY-MM-DD) */
  period_from: string;
  /** End of settlement period (YYYY-MM-DD) - cannot be future date */
  period_to: string;
  /** Optional notes (max 1000 characters) */
  notes?: string;
}

/**
 * Create a settlement for a wallet
 * Requires: create-settlement permission
 * @param walletId - The wallet to create settlement for
 * @param data - Settlement details (period_from, period_to, notes)
 */
export async function createSettlement(walletId: number, data: CreateSettlementRequest): Promise<Settlement> {
  const response = await apiRequest<Settlement>(`/wallets/${walletId}/settlements`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.data) {
    throw new Error(response.message || 'Failed to create settlement');
  }

  return response.data;
}

/**
 * Fetch all settlements (admin)
 * Requires: list-settlements permission
 */
export async function fetchSettlements(
  filters?: SettlementFilters,
  includes?: SettlementInclude[]
): Promise<SettlementsResponse> {
  const params = new URLSearchParams();

  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.per_page) params.append('per_page', filters.per_page.toString());
  if (filters?.id) params.append('filter[id]', filters.id.toString());
  if (filters?.type) params.append('filter[type]', filters.type);
  if (filters?.status) params.append('filter[status]', filters.status);
  if (filters?.settleble_type) params.append('filter[settleble_type]', filters.settleble_type);
  if (filters?.settleble_id) params.append('filter[settleble_id]', filters.settleble_id.toString());
  if (includes && includes.length > 0) {
    params.append('include', includes.join(','));
  }

  const queryString = params.toString();
  const endpoint = `/settlements${queryString ? `?${queryString}` : ''}`;

  const response = await apiRequest<Settlement[]>(endpoint, {
    method: 'GET',
  });

  return {
    data: response.data || [],
    meta: extractPaginationMeta(response.meta),
  };
}

/**
 * Fetch single settlement by ID (admin)
 * Requires: show-settlement permission
 * @param id - Settlement ID
 * @param includes - Optional array of relations to include
 */
export async function fetchSettlement(
  id: number,
  includes?: SettlementInclude[]
): Promise<Settlement> {
  const params = new URLSearchParams();

  if (includes && includes.length > 0) {
    params.append('include', includes.join(','));
  }

  const queryString = params.toString();
  const endpoint = `/settlements/${id}${queryString ? `?${queryString}` : ''}`;

  const response = await apiRequest<Settlement>(endpoint, {
    method: 'GET',
  });

  if (!response.data) {
    throw new Error('No settlement data returned');
  }

  return response.data;
}

/**
 * Confirm a settlement
 * Requires: confirm-settlement permission
 * @param id - Settlement ID to confirm
 */
export async function confirmSettlement(id: number): Promise<Settlement> {
  const response = await apiRequest<Settlement>(`/settlements/${id}/confirm`, {
    method: 'POST',
  });

  if (!response.data) {
    throw new Error(response.message || 'Failed to confirm settlement');
  }

  return response.data;
}

/**
 * Cancel a settlement
 * Requires: cancel-settlement permission
 * @param id - Settlement ID to cancel
 */
export async function cancelSettlement(id: number): Promise<Settlement> {
  const response = await apiRequest<Settlement>(`/settlements/${id}/cancel`, {
    method: 'POST',
  });

  if (!response.data) {
    throw new Error(response.message || 'Failed to cancel settlement');
  }

  return response.data;
}

/**
 * Get settleble name from settlement
 */
export function getSettlementSettlebleName(settlement: Settlement, locale: string): string {
  if (!settlement.settleble) return `#${settlement.settleble_id}`;

  const settleble = settlement.settleble;
  if (locale === 'ar' && settleble.name_ar) return settleble.name_ar;
  if (settleble.name_en) return settleble.name_en;
  if (settleble.name) return settleble.name;
  return settleble.email || `#${settlement.settleble_id}`;
}

/**
 * Get settleble type from settlement
 */
export function getSettlementSettlebleType(settlebleType: string): 'user' | 'vendor' | 'unknown' {
  if (settlebleType.includes('User')) return 'user';
  if (settlebleType.includes('Vendor')) return 'vendor';
  return 'unknown';
}

/**
 * Get settleble role name from settlement (for users only)
 */
export function getSettlementSettlebleRole(settlement: Settlement, locale: string): string | null {
  if (!settlement.settleble?.roles || settlement.settleble.roles.length === 0) return null;

  const role = settlement.settleble.roles[0];
  return locale === 'ar' ? role.slug_ar : role.slug_en;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Extract pagination meta from API response
 */
function extractPaginationMeta(meta: Record<string, unknown> | undefined): PaginationMeta {
  if (!meta) {
    return {
      current_page: 1,
      from: null,
      last_page: 1,
      per_page: 25,
      to: null,
      total: 0,
    };
  }

  return {
    current_page: (meta.current_page as number) ?? 1,
    from: (meta.from as number | null) ?? null,
    last_page: (meta.last_page as number) ?? 1,
    per_page: (meta.per_page as number) ?? 25,
    to: (meta.to as number | null) ?? null,
    total: (meta.total as number) ?? 0,
  };
}

/**
 * Get wallet owner type label
 */
export function getWalletOwnerType(walletableType: string): 'user' | 'vendor' | 'unknown' {
  if (walletableType.includes('User')) return 'user';
  if (walletableType.includes('Vendor')) return 'vendor';
  return 'unknown';
}

/**
 * Get wallet owner display name
 */
export function getWalletOwnerName(wallet: Wallet, locale: string): string {
  if (!wallet.walletable) return `#${wallet.walletable_id}`;

  const owner = wallet.walletable;
  if (locale === 'ar' && owner.name_ar) return owner.name_ar;
  if (owner.name_en) return owner.name_en;
  if (owner.name) return owner.name;
  return owner.email || `#${wallet.walletable_id}`;
}
