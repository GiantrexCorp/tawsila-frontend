/**
 * Inventories Service
 */

import { apiRequest } from '../api';

export interface Governorate {
  id: number;
  name_en: string;
  name_ar: string;
}

export interface City {
  id: number;
  name_en: string;
  name_ar: string;
  governorate: Governorate;
}

export interface Inventory {
  id: number;
  name?: string;
  name_en?: string;
  name_ar?: string;
  code?: string;
  phone?: string;
  address?: string;
  full_address?: string;
  governorate_id?: number;
  city_id?: number;
  latitude?: number | string;
  longitude?: number | string;
  status?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  governorate?: Governorate;
  city?: City;
}

export interface CreateInventoryRequest {
  name_en: string;
  name_ar: string;
  phone: string;
  address: string;
  governorate_id: number;
  city_id: number;
  latitude?: number;
  longitude?: number;
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
 * Fetch all inventories
 */
export async function fetchInventories(): Promise<Inventory[]> {
  const response = await apiRequest<Inventory[]>('/inventories', {
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
  const response = await apiRequest<{ data: Inventory[] | Inventory }>(`/inventories/${id}`, {
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
export async function deleteInventory(id: number): Promise<void> {
  const response = await apiRequest<{ deleted?: boolean; message?: string } & Record<string, unknown>>(`/inventories/${id}`, {
    method: 'DELETE',
    skipRedirectOn403: true, // Don't redirect on 403, show error message instead
  });

  // The API response structure is: { deleted: true, message: "..." }
  // apiRequest returns the parsed JSON directly (not wrapped in ApiResponse)
  // Access the data directly from the response
  const responseData = response as unknown as { deleted?: boolean; message?: string };
  
  // Strictly verify that deletion was successful
  if (responseData.deleted !== true) {
    // If deleted is false or missing, throw an error
    throw new Error(
      responseData.message || 
      (responseData.deleted === false ? 'Deletion was not successful' : 'Invalid response from server')
    );
  }
  
  // Only reach here if deleted === true
}

