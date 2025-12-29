/**
 * Centralized pagination constants
 */

/**
 * Default number of items per page across the entire system
 */
export const DEFAULT_ITEMS_PER_PAGE = 24;

/**
 * Items per page for specific use cases (if different from default)
 */
export const PAGINATION = {
  DEFAULT: DEFAULT_ITEMS_PER_PAGE,
  ORDERS: DEFAULT_ITEMS_PER_PAGE,
  USERS: DEFAULT_ITEMS_PER_PAGE,
  TRANSACTIONS: DEFAULT_ITEMS_PER_PAGE,
  SETTLEMENTS: DEFAULT_ITEMS_PER_PAGE,
  WALLETS: DEFAULT_ITEMS_PER_PAGE,
  WALLET_TRANSACTIONS: DEFAULT_ITEMS_PER_PAGE,
} as const;

