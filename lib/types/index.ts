/**
 * Shared type definitions for the Tawsila inventory management system
 * This file consolidates common types used across multiple services
 */

// =============================================================================
// API Response Types
// =============================================================================

/**
 * Standard API response wrapper from Laravel backend
 */
export interface ApiResponse<T> {
  /** Human-readable message */
  message: string;
  /** Response data payload */
  data?: T;
  /** Metadata including pagination and auth tokens */
  meta?: ApiMeta;
  /** HTTP status code (sometimes included in body) */
  status_code?: number;
  /** Flag for first-time login requiring password change */
  requires_password_change?: boolean;
}

/**
 * API response metadata
 */
export interface ApiMeta {
  /** JWT access token */
  access_token?: string;
  /** Token type (usually 'Bearer') */
  token_type?: string;
  /** Token expiration timestamp */
  expires_at?: string;
  /** Current page number for pagination */
  current_page?: number;
  /** Last page number for pagination */
  last_page?: number;
  /** Items per page for pagination */
  per_page?: number;
  /** Total number of items */
  total?: number;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

// =============================================================================
// Geographic Types
// =============================================================================

/**
 * Governorate (province/state)
 */
export interface Governorate {
  id: number;
  /** English name */
  name_en: string;
  /** Arabic name */
  name_ar: string;
  /** Legacy name field */
  name?: string;
}

/**
 * City within a governorate
 */
export interface City {
  id: number;
  /** English name */
  name_en: string;
  /** Arabic name */
  name_ar: string;
  /** Legacy name field */
  name?: string;
  /** Parent governorate ID */
  governorate_id: number;
}

/**
 * Geographic location with coordinates
 */
export interface Location {
  /** Latitude coordinate */
  latitude?: number;
  /** Longitude coordinate */
  longitude?: number;
  /** Full address string */
  address?: string;
  /** Associated governorate */
  governorate?: Governorate;
  /** Associated city */
  city?: City;
}

// =============================================================================
// User Types
// =============================================================================

/**
 * User entity
 */
export interface User {
  id: number;
  /** Legacy name field */
  name: string;
  /** English name */
  name_en: string;
  /** Arabic name */
  name_ar: string;
  /** Email address */
  email?: string;
  /** Mobile phone number */
  mobile: string;
  /** Account status */
  status: 'active' | 'inactive';
  /** User roles (e.g., 'super-admin', 'vendor') */
  roles: string[];
  /** Last activity timestamp */
  last_active?: string;
  /** Account creation timestamp */
  created_at: string;
  /** Last update timestamp */
  updated_at?: string;
  /** Associated vendor ID (for vendor users) */
  vendor_id?: number;
  /** Associated organization ID */
  organization_id?: number;
}

/**
 * Minimal user reference (for assignments, etc.)
 */
export interface UserReference {
  id: number;
  name?: string;
  name_en?: string;
  name_ar?: string;
  mobile?: string;
  email?: string;
}

// =============================================================================
// Role & Permission Types
// =============================================================================

/**
 * System role
 */
export interface Role {
  id: number;
  /** Role identifier (e.g., 'super-admin') */
  name: string;
  /** English display slug */
  slug_en: string;
  /** Arabic display slug */
  slug_ar: string;
  /** Permissions assigned to this role */
  permissions: Permission[] | string[];
  /** Number of users with this role */
  users_count?: number;
}

/**
 * System permission
 */
export interface Permission {
  id: number;
  /** Permission identifier */
  name: string;
  /** Permission description */
  description?: string;
}

// =============================================================================
// Common Status Types
// =============================================================================

/**
 * Generic entity status
 */
export type EntityStatus = 'active' | 'inactive';

/**
 * Order status values
 */
export type OrderStatus =
  | 'pending'
  | 'created'
  | 'accepted'
  | 'confirmed'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'completed'
  | 'rejected'
  | 'cancelled'
  | 'failed';

/**
 * Payment status values
 */
export type PaymentStatus = 'paid' | 'unpaid' | 'partial';

// =============================================================================
// Form & Filter Types
// =============================================================================

/**
 * Date range filter
 */
export interface DateRange {
  from?: Date;
  to?: Date;
}

/**
 * Generic filter record
 */
export type FilterRecord = Record<string, string | number | boolean | undefined>;

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Makes specific properties required
 */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Makes all properties optional except specified ones
 */
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

/**
 * Type for localized display name resolution
 */
export interface LocalizedEntity {
  name?: string;
  name_en?: string;
  name_ar?: string;
}

/**
 * Helper to get display name based on locale
 */
export function getLocalizedName(entity: LocalizedEntity, locale: string): string {
  if (locale === 'ar' && entity.name_ar) {
    return entity.name_ar;
  }
  return entity.name_en || entity.name || '';
}
