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
  email: string | null;
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
  secret_key?: string; // Optional - may not be included in all responses
  logo: string;
  cover_image: string;
  created_at: string;
  updated_at: string;
}

export interface CreateVendorRequest {
  name_en: string;
  name_ar: string;
  email?: string;
  mobile: string;
  contact_person: string;
  description_en: string;
  description_ar: string;
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
 * Fetch current vendor's profile (for vendor users)
 * Uses /vendors/me endpoint
 */
export async function fetchCurrentVendor(): Promise<Vendor> {
  const response = await apiRequest<Vendor>('/vendors/me', {
    method: 'GET',
  });

  if (!response.data) {
    throw new Error('Vendor not found');
  }

  return response.data;
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

  // Method 1: Try /vendors/me endpoint first (preferred method)
  try {
    console.log('🔍 Trying /vendors/me endpoint...');
    const vendor = await fetchCurrentVendor();
    console.log('✅ Found vendor_id from /vendors/me:', vendor.id);
    return vendor.id;
  } catch (meError: any) {
    if (meError.status === 404) {
      console.log('⚠️ /vendors/me endpoint not available (404)');
    } else if (meError.status === 403) {
      console.log('⚠️ /vendors/me endpoint forbidden (403)');
    } else {
      console.log('⚠️ /vendors/me endpoint error:', meError);
    }
  }

  // Method 2: Try to get vendor_id from user object (from login response)
  console.log('🔍 Searching for vendor_id in user object:', currentUser);
  console.log('📋 All user object keys:', Object.keys(currentUser));

  // @ts-ignore - vendor_id might be in user object with different field names
  const vendorIdFromUser = currentUser.vendor_id || 
                           currentUser.organization_id || 
                           // @ts-ignore
                           currentUser.vendor?.id ||
                           // @ts-ignore
                           currentUser.organization?.id ||
                           null;

  if (vendorIdFromUser) {
    console.log('✅ Found vendor_id in user object:', vendorIdFromUser);
    return vendorIdFromUser;
  }

  // Method 3: Last resort - Try to fetch vendors and match by email
  // Note: This might fail with 403 if vendor users don't have permission to list vendors
  if (currentUser.email) {
    try {
      console.log('🔄 Trying to find vendor by matching email:', currentUser.email);
      const vendors = await fetchVendors();
      const matchingVendor = vendors.find(v => 
        v.email === currentUser.email || 
        v.email === currentUser.email?.toLowerCase() ||
        v.contact_person === currentUser.name_en ||
        v.contact_person === currentUser.name_ar
      );
      
      if (matchingVendor) {
        console.log('✅ Found vendor by matching email/name:', matchingVendor.id);
        return matchingVendor.id;
      } else {
        console.log('❌ No vendor found matching user email or name');
      }
    } catch (vendorsError: any) {
      if (vendorsError.status === 403) {
        console.log('❌ Vendor users do not have permission to list vendors (403 Forbidden)');
      } else {
        console.log('❌ Could not fetch vendors list:', vendorsError);
      }
    }
  }

  // All methods failed
  console.log('❌ vendor_id not found using any method');
  console.log('📋 Full user object:', JSON.stringify(currentUser, null, 2));
  console.log('💡 Backend should implement one of:');
  console.log('   1. /vendors/me endpoint (GET) - returns current vendor profile');
  console.log('   2. Include vendor_id in login response user object');
  console.log('   3. Include vendor_id in /user endpoint response');

  throw new Error('Vendor ID not found. Please contact your administrator to configure vendor_id retrieval.');
}

