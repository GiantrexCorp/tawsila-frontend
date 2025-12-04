/**
 * API Configuration and Utilities
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';

export interface ApiResponse<T> {
  message: string;
  data: T;
  meta?: any;
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
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Accept-Language': getCurrentLocale(), // Add locale to all requests
    'X-Locale': getCurrentLocale(), // Also send as custom header for backend flexibility
  };

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
    const data = await response.json();

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

      throw {
        message: data.message || 'An error occurred',
        errors: data.errors,
      } as ApiError;
    }

    return data;
  } catch (error: any) {
    // Re-throw API errors
    if (error.message) {
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
}

/**
 * Remove authentication token
 */
export function removeToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('access_token');
}

