/**
 * Authentication Service
 */

import { apiRequest, setToken, removeToken, getToken } from './api';

export interface User {
  id: number;
  name: string;
  name_en: string;
  name_ar: string;
  email: string;
  mobile: string;
  status: 'active' | 'inactive';
  last_active: string | null;
  created_at: string;
  updated_at: string;
  roles: string[];
  permissions?: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  data?: User;
  message?: string;
  requires_password_change?: boolean;
  status_code?: number;
  meta: {
    access_token: string;
    token_type: string;
    expires_at?: string;
  };
}

export interface SetPasswordRequest {
  new_password: string;
  new_password_confirmation: string;
}

export interface SetPasswordResponse {
  message: string;
  data: User;
  meta: {
    access_token: string;
    token_type: string;
    expires_at: string;
  };
}

/**
 * Login user with credentials
 */
export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await apiRequest<User>('/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  // Check status_code 203 for password change requirement (from response body)
  if (response.status_code === 203 || response.requires_password_change) {
    // Store temporary token for set-password endpoint
    if (response.meta?.access_token) {
      setToken(response.meta.access_token);
      // Set flag to indicate this is a first-time login requiring password change
      if (typeof window !== 'undefined') {
        localStorage.setItem('requires_password_change', 'true');
      }
    }
    return {
      message: response.message,
      requires_password_change: true,
      status_code: 203,
      meta: {
        access_token: response.meta?.access_token || '',
        token_type: response.meta?.token_type || 'Bearer',
        expires_at: response.meta?.expires_at,
      },
    };
  }

  // Normal login (status_code 200)
  // Check if user is inactive BEFORE storing any data
  if (response.data && response.data.status === 'inactive') {
    throw new Error('ACCOUNT_INACTIVE');
  }

  // Store the token and user data
  if (response.meta?.access_token && response.data) {
    setToken(response.meta.access_token);
    setUser(response.data);
  }

  return response as LoginResponse;
}

/**
 * Set password for first-time login users
 */
export async function setPassword(data: SetPasswordRequest): Promise<SetPasswordResponse> {
  const response = await apiRequest<User>('/set-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  // Store the new token and user data
  if (response.meta?.access_token && response.data) {
    setToken(response.meta.access_token);
    setUser(response.data);
    // Clear the password change flag
    if (typeof window !== 'undefined') {
      localStorage.removeItem('requires_password_change');
    }
  }

  return response as SetPasswordResponse;
}

/**
 * Check if user needs to change password (first-time login)
 */
export function requiresPasswordChange(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('requires_password_change') === 'true';
}

/**
 * Clear password change requirement flag
 */
export function clearPasswordChangeFlag(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('requires_password_change');
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  try {
    await apiRequest('/logout', {
      method: 'POST',
    });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    removeToken();
    removeUser();
    clearPasswordChangeFlag();
  }
}

/**
 * Get current user
 */
export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;

  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

/**
 * Store user data
 */
export function setUser(user: User): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('user', JSON.stringify(user));
}

/**
 * Remove user data
 */
export function removeUser(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('user');
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getToken() && !!getCurrentUser();
}

/**
 * Export getToken for public use
 */
export { getToken } from './api';
