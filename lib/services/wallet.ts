/**
 * Wallet Service
 *
 * Handles wallet-related API operations for the current user.
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
  /** Wallet creation timestamp */
  created_at: string;
  /** Last update timestamp */
  updated_at: string;
}

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
