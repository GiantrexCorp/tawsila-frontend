/**
 * Vendors Service
 *
 * Handles all vendor-related API operations including CRUD operations,
 * geographic data (governorates/cities), and vendor profile management.
 */

import { apiRequest } from '../api';

/**
 * Governorate (province/state) entity
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
 * Vendor/Organization entity
 * Represents a business partner that can create and manage orders
 */
export interface Vendor {
  /** Unique vendor identifier */
  id: number;
  /** English business name */
  name_en: string;
  /** Arabic business name */
  name_ar: string;
  /** Business email address */
  email: string | null;
  /** Business phone number */
  mobile: string;
  /** Primary contact person name */
  contact_person: string;
  /** English business description */
  description_en: string;
  /** Arabic business description */
  description_ar: string;
  /** Physical address */
  address: string;
  /** Operating governorate */
  governorate: Governorate;
  /** Operating city */
  city: City;
  /** Location latitude coordinate */
  latitude: string;
  /** Location longitude coordinate */
  longitude: string;
  /** Commercial registration number */
  commercial_registration: string | null;
  /** Tax identification number */
  tax_number: string | null;
  /** Vendor account status */
  status: 'active' | 'inactive';
  /** API secret key for authentication (only returned to authorized users) */
  secret_key?: string;
  /** Logo image URL */
  logo: string;
  /** Cover/banner image URL */
  cover_image: string;
  /** Account creation timestamp */
  created_at: string;
  /** Last update timestamp */
  updated_at: string;
}

/**
 * Request payload for creating a new vendor
 */
export interface CreateVendorRequest {
  /** English business name */
  name_en: string;
  /** Arabic business name */
  name_ar: string;
  /** Business email (optional) */
  email?: string;
  /** Business phone number */
  mobile: string;
  /** Primary contact person name */
  contact_person: string;
  /** English business description */
  description_en: string;
  /** Arabic business description */
  description_ar: string;
  /** Physical address */
  address: string;
  /** Governorate ID */
  governorate_id: number;
  /** City ID */
  city_id: number;
  /** Location latitude */
  latitude: string;
  /** Location longitude */
  longitude: string;
  /** Commercial registration number (optional) */
  commercial_registration?: string;
  /** Tax ID number (optional) */
  tax_number?: string;
  /** Account status */
  status: 'active' | 'inactive';
  /** API secret key for vendor authentication */
  secret_key: string;
  /** Logo image file or URL */
  logo?: File | string;
  /** Cover image file or URL */
  cover_image?: File | string;
}

/**
 * Fetch all vendors
 * API returns: { data: [...vendors] } or { data: { data: [...vendors] } }
 */
export async function fetchVendors(): Promise<Vendor[]> {
  const response = await apiRequest<Vendor[] | { data: Vendor[] }>('/vendors', {
    method: 'GET',
  });

  // Handle both direct array and nested data structure
  if (Array.isArray(response.data)) {
    return response.data;
  }

  // Handle nested { data: { data: [...] } } structure
  if (response.data && typeof response.data === 'object' && 'data' in response.data) {
    return (response.data as { data: Vendor[] }).data || [];
  }

  return [];
}

/**
 * Fetch current vendor's profile (for vendor users)
 * Uses /my-vendor endpoint
 */
export async function fetchCurrentVendor(): Promise<Vendor> {
  const response = await apiRequest<Vendor>('/my-vendor', {
    method: 'GET',
  });

  if (!response.data) {
    throw new Error('Vendor not found');
  }

  return response.data;
}

/**
 * Fetch a single vendor by ID
 * API may return: { data: {...vendor} } or { data: { data: {...vendor} } }
 */
export async function fetchVendor(id: number): Promise<Vendor> {
  const response = await apiRequest<Vendor | { data: Vendor }>(`/vendors/${id}`, {
    method: 'GET',
  });

  if (!response.data) {
    throw new Error('Vendor not found');
  }

  // Handle nested { data: { data: {...} } } structure
  if (response.data && typeof response.data === 'object' && 'data' in response.data && !('id' in response.data)) {
    const nestedData = (response.data as { data: Vendor }).data;
    if (!nestedData) {
      throw new Error('Vendor not found');
    }
    return nestedData;
  }

  return response.data as Vendor;
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
  // Use FormData if there are file uploads
  const hasFileUpload = vendorData.logo instanceof File || vendorData.cover_image instanceof File;
  
  if (hasFileUpload) {
    const formData = new FormData();
    
    // Laravel requires _method field for PUT via POST
    formData.append('_method', 'PUT');
    
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

    const response = await apiRequest<Vendor>(`/vendors/${id}`, {
      method: 'POST', // Use POST with _method=PUT for file uploads
      body: formData,
    });

    if (!response.data) {
      throw new Error('Failed to update vendor');
    }

    return response.data;
  } else {
    // Use JSON for non-file uploads
    const response = await apiRequest<Vendor>(`/vendors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(vendorData),
    });

    if (!response.data) {
      throw new Error('Failed to update vendor');
    }

    return response.data;
  }
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

/**
 * Get vendor ID for current vendor user
 * Tries multiple methods in order:
 * 1. /vendors/me endpoint (preferred)
 * 2. vendor_id from user object (from login response)
 * 3. Fallback methods
 */
export async function getCurrentUserVendorId(): Promise<number> {
  const { getCurrentUser } = await import('../auth');
  const currentUser = getCurrentUser();
  
  if (!currentUser) {
    throw new Error('User not found');
  }

  // Method 1: Try /my-vendor endpoint first (preferred method)
  try {
    const vendor = await fetchCurrentVendor();
    return vendor.id;
  } catch {
    // /my-vendor endpoint not available, try fallback methods
  }

  // Method 2: Try to get vendor_id from user object (from login response)

  const vendorIdFromUser = currentUser.vendor_id || 
                           currentUser.organization_id || 
                           // @ts-expect-error - vendor object might exist with different structure
                           currentUser.vendor?.id ||
                           // @ts-expect-error - organization object might exist with different structure
                           currentUser.organization?.id ||
                           null;

  if (vendorIdFromUser) {
    return vendorIdFromUser;
  }

  // Method 3: Last resort - Try to fetch vendors and match by email
  // Note: This might fail with 403 if vendor users don't have permission to list vendors
  if (currentUser.email) {
    try {
      const vendors = await fetchVendors();
      const matchingVendor = vendors.find(v =>
        v.email === currentUser.email ||
        v.email === currentUser.email?.toLowerCase() ||
        v.contact_person === currentUser.name_en ||
        v.contact_person === currentUser.name_ar
      );

      if (matchingVendor) {
        return matchingVendor.id;
      }
    } catch {
      // Could not fetch vendors list - permission denied or other error
    }
  }

  // All methods failed
  throw new Error('Vendor ID not found. Please contact your administrator to configure vendor_id retrieval.');
}

