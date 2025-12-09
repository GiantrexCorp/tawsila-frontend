/**
 * Inventories Service
 */

import { apiRequest } from '../api';

export interface Inventory {
  id: number;
  name: string;
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
 */
export async function fetchInventory(id: number): Promise<Inventory> {
  const response = await apiRequest<Inventory>(`/inventories/${id}`, {
    method: 'GET',
  });

  if (!response.data) {
    throw new Error('Inventory not found');
  }

  return response.data;
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
 */
export async function deleteInventory(id: number): Promise<void> {
  await apiRequest(`/inventories/${id}`, {
    method: 'DELETE',
  });
}

