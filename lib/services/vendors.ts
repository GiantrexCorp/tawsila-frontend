/**
 * Vendors Service
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

export interface Vendor {
  id: number;
  name_en: string;
  name_ar: string;
  email: string;
  mobile: string;
  contact_person: string;
  description_en: string;
  description_ar: string;
  address: string;
  governorate: Governorate;
  city: City;
  latitude: string;
  longitude: string;
  commercial_registration: string | null;
  tax_number: string | null;
  status: 'active' | 'inactive';
  secret_key: string;
  logo: string;
  cover_image: string;
  created_at: string;
  updated_at: string;
}

export interface CreateVendorRequest {
  name_en: string;
  name_ar: string;
  email: string;
  mobile: string;
  contact_person: string;
  description_en?: string;
  description_ar?: string;
  address: string;
  governorate_id: number;
  city_id: number;
  latitude: string;
  longitude: string;
  commercial_registration?: string;
  tax_number?: string;
  status: 'active' | 'inactive';
  secret_key: string;
  logo?: File | string;
  cover_image?: File | string;
}

/**
 * Fetch all vendors
 */
export async function fetchVendors(): Promise<Vendor[]> {
  const response = await apiRequest<Vendor[]>('/vendors', {
    method: 'GET',
  });

  return response.data || [];
}

/**
 * Fetch a single vendor by ID
 */
export async function fetchVendor(id: number): Promise<Vendor> {
  const response = await apiRequest<Vendor>(`/vendors/${id}`, {
    method: 'GET',
  });

  if (!response.data) {
    throw new Error('Vendor not found');
  }

  return response.data;
}

/**
 * Create a new vendor
 */
export async function createVendor(vendorData: CreateVendorRequest): Promise<Vendor> {
  // Use FormData if there are file uploads
  const hasFileUpload = vendorData.logo instanceof File || vendorData.cover_image instanceof File;
  
  if (hasFileUpload) {
    const formData = new FormData();
    
    // Append all fields to FormData
    Object.entries(vendorData).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, String(value));
        }
      }
    });

    const response = await apiRequest<Vendor>('/vendors', {
      method: 'POST',
      body: formData,
    });

    if (!response.data) {
      throw new Error('Failed to create vendor');
    }

    return response.data;
  } else {
    // Use JSON for non-file uploads
    const response = await apiRequest<Vendor>('/vendors', {
      method: 'POST',
      body: JSON.stringify(vendorData),
    });

    if (!response.data) {
      throw new Error('Failed to create vendor');
    }

    return response.data;
  }
}

/**
 * Update a vendor
 */
export async function updateVendor(
  id: number,
  vendorData: Partial<CreateVendorRequest>
): Promise<Vendor> {
  const response = await apiRequest<Vendor>(`/vendors/${id}`, {
    method: 'PUT',
    body: JSON.stringify(vendorData),
  });

  if (!response.data) {
    throw new Error('Failed to update vendor');
  }

  return response.data;
}

/**
 * Delete a vendor
 */
export async function deleteVendor(id: number): Promise<void> {
  await apiRequest(`/vendors/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Fetch all governorates
 */
export async function fetchGovernorates(): Promise<Governorate[]> {
  const response = await apiRequest<Governorate[]>('/governorates', {
    method: 'GET',
  });

  return response.data || [];
}

/**
 * Fetch cities by governorate
 */
export async function fetchCities(governorateId: number): Promise<City[]> {
  const response = await apiRequest<City[]>(`/cities?filter[governorate_id]=${governorateId}`, {
    method: 'GET',
  });

  return response.data || [];
}

