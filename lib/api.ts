/**
 * API Configuration and Utilities
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';

export interface ApiResponse<T> {
  message: string;
  data?: T;
  meta?: {
    access_token?: string;
    token_type?: string;
    expires_at?: string;
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
export function getCurrentLocale(): string {
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

export interface ApiRequestOptions extends RequestInit {
  skipRedirectOn403?: boolean;
}

/**
 * Makes an API request with proper error handling
 */
export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;

  // Check if body is FormData - if so, don't set Content-Type (browser will set it with boundary)
  const isFormData = options.body instanceof FormData;

  const defaultHeaders: HeadersInit = {
    'Accept': 'application/json',
    'Accept-Language': getCurrentLocale(),
    'X-Locale': getCurrentLocale(),
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

  // Extract skipRedirectOn403 from options before passing to fetch
  const { skipRedirectOn403, ...fetchOptions } = options;

  const config: RequestInit = {
    ...fetchOptions,
    headers: {
      ...defaultHeaders,
      ...fetchOptions.headers,
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
    } catch {
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
        // Only redirect if skipRedirectOn403 is not set to true
        if (!skipRedirectOn403) {
          handleForbidden();
        }
        throw {
          message: data.message || 'You do not have permission to access this resource.',
          errors: data.errors,
          status: 403,
        } as ApiError;
      }

      // Handle 501 Not Implemented - feature coming soon
      if (response.status === 501) {
        handleNotImplemented();
        throw {
          message: data.message || 'This feature is coming soon. Stay tuned for updates!',
          errors: data.errors,
          status: 501,
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

  // Clear all auth data
  clearAuthData();

  // Dispatch custom event to notify components
  window.dispatchEvent(new CustomEvent('auth:logout', {
    detail: { reason: 'unauthorized' }
  }));

  // Only redirect if not already on login page
  if (!window.location.pathname.includes('/login')) {
    const locale = getCurrentLocale();
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
    const locale = getCurrentLocale();
    window.location.href = `/${locale}/403`;
  }
}

/**
 * Handle not implemented (501)
 * This happens when a feature is coming soon / not yet available
 */
function handleNotImplemented(): void {
  if (typeof window === 'undefined') return;

  // Only redirect if not already on coming-soon page
  if (!window.location.pathname.includes('/coming-soon')) {
    const locale = getCurrentLocale();
    window.location.href = `/${locale}/coming-soon`;
  }
}

/**
 * Get stored authentication token
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

/** Token cookie expiry in days */
const TOKEN_EXPIRY_DAYS = 7;

/**
 * Store authentication token in both localStorage and cookie
 */
export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('access_token', token);

  // Store in cookie for middleware access
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + TOKEN_EXPIRY_DAYS);
  const isSecure = window.location.protocol === 'https:';
  const secureFlag = isSecure ? '; Secure' : '';
  document.cookie = `token=${token}; path=/; expires=${expiryDate.toUTCString()}; SameSite=Lax${secureFlag}`;
}

/**
 * Remove authentication token from both localStorage and cookie
 */
export function removeToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('access_token');

  // Remove cookie - must match the path used when setting
  const isSecure = window.location.protocol === 'https:';
  const secureFlag = isSecure ? '; Secure' : '';
  document.cookie = `token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secureFlag}`;
}

/**
 * Clear all authentication data (token, user, flags)
 */
export function clearAuthData(): void {
  if (typeof window === 'undefined') return;

  // Clear localStorage
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
  localStorage.removeItem('requires_password_change');

  // Clear cookie
  const isSecure = window.location.protocol === 'https:';
  const secureFlag = isSecure ? '; Secure' : '';
  document.cookie = `token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secureFlag}`;
}

/**
 * Check if token cookie exists (for detecting stale auth state)
 */
export function hasTokenCookie(): boolean {
  if (typeof window === 'undefined') return false;
  return document.cookie.split(';').some(c => c.trim().startsWith('token='));
}

/**
 * Sync token from localStorage to cookie if missing
 */
export function syncTokenToCookie(): void {
  if (typeof window === 'undefined') return;

  const token = localStorage.getItem('access_token');
  if (token && !hasTokenCookie()) {
    setToken(token);
  }
}
