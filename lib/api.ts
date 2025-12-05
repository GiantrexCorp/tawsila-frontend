/**
 * API Configuration and Utilities
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';

export interface ApiResponse<T> {
  message: string;
  data?: T;
  meta?: {
    access_token?: string;
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
    [key: string]: unknown;
  };
  status_code?: number;
  requires_password_change?: boolean;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
}

/**
 * Get current locale from URL
 */
function getCurrentLocale(): string {
  if (typeof window === 'undefined') return 'en';
  
  // Extract locale from pathname (e.g., /en/dashboard -> en, /ar/users -> ar)
  const pathSegments = window.location.pathname.split('/').filter(Boolean);
  const locale = pathSegments[0];
  
  // Validate locale (should be 'en' or 'ar')
  if (locale === 'ar' || locale === 'en') {
    return locale;
  }
  
  return 'en'; // Default to English
}

/**
 * Makes an API request with proper error handling
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Check if body is FormData - if so, don't set Content-Type (browser will set it with boundary)
  const isFormData = options.body instanceof FormData;
  
  const defaultHeaders: HeadersInit = {
    'Accept': 'application/json',
    'Accept-Language': getCurrentLocale(), // Add locale to all requests
    'X-Locale': getCurrentLocale(), // Also send as custom header for backend flexibility
  };
  
  // Only set Content-Type for JSON requests
  if (!isFormData) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  // Add authorization header if token exists
  const token = getToken();
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    // Get response text first to handle empty responses
    const responseText = await response.text();
    
    // Parse JSON only if we have content
    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      throw {
        message: 'Invalid response from server. Please try again.',
        status: response.status,
      } as ApiError;
    }

    // Handle HTTP 203 - password change required
    if (response.status === 203) {
      data.status_code = 203;
    }

    if (!response.ok) {
      // Handle 401 Unauthorized - session expired or logged in elsewhere
      if (response.status === 401) {
        handleUnauthorized();
        throw {
          message: data.message || 'Session expired. Please log in again.',
          errors: data.errors,
          status: 401,
        } as ApiError;
      }

      // Handle 403 Forbidden - user doesn't have permission
      if (response.status === 403) {
        handleForbidden();
        throw {
          message: data.message || 'You do not have permission to access this resource.',
          errors: data.errors,
          status: 403,
        } as ApiError;
      }

      throw {
        message: data.message || 'An error occurred',
        errors: data.errors,
        status: response.status,
      } as ApiError;
    }

    return data;
  } catch (error) {
    // Re-throw API errors
    if (error && typeof error === 'object' && 'message' in error) {
      throw error;
    }
    // Handle network errors
    throw {
      message: 'Network error. Please check your connection.',
    } as ApiError;
  }
}

/**
 * Handle unauthorized access (401)
 * This happens when token is invalid or user logged in elsewhere
 */
function handleUnauthorized(): void {
  if (typeof window === 'undefined') return;
  
  // Clear local storage
  removeToken();
  localStorage.removeItem('user');
  
  // Dispatch custom event to notify components
  window.dispatchEvent(new CustomEvent('auth:logout', { 
    detail: { reason: 'unauthorized' } 
  }));
  
  // Only redirect if not already on login page
  if (!window.location.pathname.includes('/login')) {
    // Extract current locale from pathname (e.g., /en/dashboard -> en)
    const pathSegments = window.location.pathname.split('/').filter(Boolean);
    const locale = pathSegments[0] || 'en'; // Default to 'en' if no locale found
    
    // Redirect to login with proper locale
    window.location.href = `/${locale}/login`;
  }
}

/**
 * Handle forbidden access (403)
 * This happens when user doesn't have permission for the resource
 */
function handleForbidden(): void {
  if (typeof window === 'undefined') return;
  
  // Only redirect if not already on 403 page
  if (!window.location.pathname.includes('/403')) {
    // Extract current locale from pathname
    const pathSegments = window.location.pathname.split('/').filter(Boolean);
    const locale = pathSegments[0] || 'en';
    
    // Redirect to 403 page with proper locale
    window.location.href = `/${locale}/403`;
  }
}

/**
 * Get stored authentication token
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

/**
 * Store authentication token
 */
export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('access_token', token);
  
  // Also store in cookie for middleware access
  // Set cookie with 7 days expiry (adjust as needed)
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 7);
  document.cookie = `token=${token}; path=/; expires=${expiryDate.toUTCString()}; SameSite=Lax`;
}

/**
 * Remove authentication token
 */
export function removeToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('access_token');
  
  // Also remove from cookie
  document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
}

