/**
 * Inventories Service
 *
 * Handles inventory/warehouse location management including CRUD operations,
 * geographic data associations, and inventory status management.
 */

import { apiRequest } from '../api';
import { UserRoleObject } from './users';

/**
 * User type for inventory assignment (from /inventories/{id}/users endpoint)
 * Note: API may return 'role' or 'roles' depending on the endpoint
 */
export interface InventoryUser {
  id: number;
  name?: string;
  name_en: string;
  name_ar: string;
  email: string;
  mobile: string;
  type?: string;
  role?: UserRoleObject[];
  roles?: UserRoleObject[];  // Some endpoints return 'roles' instead of 'role'
  assigned_at?: string;
}

/**
 * Governorate (province/state) entity
 * Note: Also defined in vendors.ts - consider using shared types
 */
export interface Governorate {
  /** Unique governorate identifier */
  id: number;
  /** English name */
  name_en: string;
  /** Arabic name */
  name_ar: string;
}

/**
 * City entity within a governorate
 * Note: Also defined in vendors.ts - consider using shared types
 */
export interface City {
  /** Unique city identifier */
  id: number;
  /** English name */
  name_en: string;
  /** Arabic name */
  name_ar: string;
  /** Parent governorate */
  governorate: Governorate;
}

/**
 * Inventory/Warehouse location entity
 * Represents a physical location where orders can be processed and stored
 */
export interface Inventory {
  /** Unique inventory identifier */
  id: number;
  /** Legacy name field */
  name?: string;
  /** English location name */
  name_en?: string;
  /** Arabic location name */
  name_ar?: string;
  /** Unique inventory code */
  code?: string;
  /** Contact phone number */
  phone?: string;
  /** Physical address */
  address?: string;
  /** Complete formatted address */
  full_address?: string;
  /** Associated governorate ID */
  governorate_id?: number;
  /** Associated city ID */
  city_id?: number;
  /** Location latitude coordinate */
  latitude?: number | string;
  /** Location longitude coordinate */
  longitude?: number | string;
  /** Inventory status string */
  status?: string;
  /** Whether inventory is active */
  is_active?: boolean;
  /** Creation timestamp */
  created_at?: string;
  /** Last update timestamp */
  updated_at?: string;
  /** Associated governorate details */
  governorate?: Governorate;
  /** Associated city details */
  city?: City;
  /** Assigned users (when included) */
  users?: InventoryUser[];
}

/**
 * Request payload for creating a new inventory location
 */
export interface CreateInventoryRequest {
  /** English location name */
  name_en: string;
  /** Arabic location name */
  name_ar: string;
  /** Contact phone number */
  phone: string;
  /** Physical address */
  address: string;
  /** Governorate ID */
  governorate_id: number;
  /** City ID */
  city_id: number;
  /** Location latitude (optional) */
  latitude?: number;
  /** Location longitude (optional) */
  longitude?: number;
  /** Initial status */
  status?: string;
}

export interface UpdateInventoryRequest {
  name_en?: string;
  name_ar?: string;
  phone?: string;
  address?: string;
  governorate_id?: number;
  city_id?: number;
  latitude?: number;
  longitude?: number;
  status?: string;
}

/**
 * Filters for inventories list
 * Based on backend allowedFilters and allowedFiltersExact
 */
export interface InventoryFilters {
  /** Searchable filters */
  name_en?: string;
  name_ar?: string;
  code?: string;
  email?: string;
  phone?: string;
  address?: string;
  /** Exact filters */
  id?: string;
  status?: string;
  governorate_id?: string;
  city_id?: string;
  [key: string]: string | undefined;
}

/**
 * Build query string from filters
 */
function buildFilterQuery(filters: InventoryFilters): string {
  const params: string[] = [];

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.push(`filter[${key}]=${encodeURIComponent(value)}`);
    }
  });

  return params.length > 0 ? `&${params.join('&')}` : '';
}

/**
 * Available includes for inventories API
 */
const INVENTORY_INCLUDES = [
  'governorate',
  'city',
].join(',');

/**
 * Fetch all inventories with optional filters
 */
export async function fetchInventories(filters: InventoryFilters = {}): Promise<Inventory[]> {
  const filterQuery = buildFilterQuery(filters);
  const response = await apiRequest<Inventory[]>(`/inventories?include=${INVENTORY_INCLUDES}${filterQuery}`, {
    method: 'GET',
  });

  return response.data || [];
}

/**
 * Fetch current user's inventory
 */
export async function fetchCurrentInventory(): Promise<Inventory> {
  const response = await apiRequest<Inventory>('/inventories/me', {
    method: 'GET',
  });

  if (!response.data) {
    throw new Error('Inventory not found');
  }

  return response.data;
}

/**
 * Create a new inventory
 */
export async function createInventory(inventoryData: CreateInventoryRequest): Promise<Inventory> {
  const response = await apiRequest<Inventory>('/inventories', {
    method: 'POST',
    body: JSON.stringify(inventoryData),
  });

  if (!response.data) {
    throw new Error('Failed to create inventory');
  }

  return response.data;
}

/**
 * Fetch a single inventory by ID
 * API returns: { "data": [{ ... }], ... }
 * For single inventory, we take the first item from the data array
 */
export async function fetchInventory(id: number): Promise<Inventory> {
  const response = await apiRequest<{ data: Inventory[] | Inventory }>(`/inventories/${id}?include=users`, {
    method: 'GET',
  });

  // Handle both array response and single object response
  if (Array.isArray(response.data)) {
    if (response.data.length === 0) {
      throw new Error('Inventory not found');
    }
    return response.data[0];
  } else if (response.data && typeof response.data === 'object' && 'id' in response.data) {
    return response.data as Inventory;
  }

  throw new Error('Inventory not found');
}

/**
 * Update an inventory
 */
export async function updateInventory(id: number, inventoryData: UpdateInventoryRequest): Promise<Inventory> {
  const response = await apiRequest<Inventory>(`/inventories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(inventoryData),
  });

  if (!response.data) {
    throw new Error('Failed to update inventory');
  }

  return response.data;
}

/**
 * Delete an inventory
 * API returns: { "deleted": true, "message": "Inventory deleted successfully." }
 */
interface DeleteResponse {
  deleted?: boolean;
  message?: string;
}

export async function deleteInventory(id: number): Promise<void> {
  const response = await apiRequest<DeleteResponse>(`/inventories/${id}`, {
    method: 'DELETE',
    skipRedirectOn403: true,
  });

  // Verify that deletion was successful
  const responseData = response.data || (response as unknown as DeleteResponse);

  if (responseData.deleted !== true) {
    throw new Error(
      responseData.message ||
      (responseData.deleted === false ? 'Deletion was not successful' : 'Invalid response from server')
    );
  }
}

/**
 * Fetch users assigned to an inventory
 */
export async function fetchInventoryUsers(inventoryId: number): Promise<InventoryUser[]> {
  const response = await apiRequest<InventoryUser[]>(`/inventories/${inventoryId}/users`, {
    method: 'GET',
  });

  return response.data || [];
}

/**
 * Sync (assign) users to an inventory
 * This replaces all current user assignments with the provided user IDs
 */
export async function syncInventoryUsers(inventoryId: number, userIds: number[]): Promise<void> {
  await apiRequest(`/inventories/${inventoryId}/sync-users`, {
    method: 'POST',
    body: JSON.stringify({ user_ids: userIds }),
  });
}

/**
 * Fetch all users available for assignment (type=user filter)
 */
export async function fetchUsersForAssignment(): Promise<InventoryUser[]> {
  const response = await apiRequest<InventoryUser[]>('/get-users?filter[type]=user', {
    method: 'GET',
  });

  return response.data || [];
}

/**
 * Fetch inventories assigned to a specific user
 * This fetches all inventories and checks which ones have the user assigned
 */
export async function fetchUserInventories(userId: number): Promise<Inventory[]> {
  // Fetch all inventories
  const allInventories = await fetchInventories();
  
  // For each inventory, check if the user is assigned
  const userInventories: Inventory[] = [];
  
  await Promise.all(
    allInventories.map(async (inventory) => {
      try {
        const users = await fetchInventoryUsers(inventory.id);
        if (users.some(user => user.id === userId)) {
          userInventories.push(inventory);
        }
      } catch {
        // If we can't fetch users for an inventory, skip it
      }
    })
  );
  
  return userInventories;
}

