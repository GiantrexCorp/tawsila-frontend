/**
 * Authentication Service
 */

import { apiRequest, setToken, getToken, clearAuthData } from './api';
import { UserRoleObject } from './services/users';

export interface User {
  id: number;
  name?: string;
  name_en: string;
  name_ar: string;
  email: string;
  mobile: string;
  status: 'active' | 'inactive';
  type?: string;
  last_active: string | null;
  created_at: string;
  updated_at: string;
  roles: UserRoleObject[];
  roles_permissions: string[];
  vendor_id?: number;
  organization_id?: number;
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

  // Check status_code 203 for password change requirement
  if (response.status_code === 203 || response.requires_password_change) {
    // Store temporary token for set-password endpoint
    if (response.meta?.access_token) {
      setToken(response.meta.access_token);
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
 * Logout user - clears all auth state
 */
export async function logout(): Promise<void> {
  try {
    await apiRequest('/logout', {
      method: 'POST',
    });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Always clear auth data even if API call fails
    clearAuthData();
  }
}

/**
 * Get current user from localStorage
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
 * Store user data in localStorage
 */
export function setUser(user: User): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('user', JSON.stringify(user));
}

/**
 * Remove user data from localStorage
 */
export function removeUser(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('user');
}

/**
 * Check if user is fully authenticated (has both token and user data)
 */
export function isAuthenticated(): boolean {
  return !!getToken() && !!getCurrentUser();
}

/**
 * Check if only token exists (possibly stale session)
 */
export function hasToken(): boolean {
  return !!getToken();
}

/**
 * Validate session by making API call to get current user
 * Returns user data if valid, null if invalid
 */
export async function validateSession(): Promise<User | null> {
  const token = getToken();
  if (!token) {
    clearAuthData();
    return null;
  }

  try {
    // Call the /me endpoint to validate token and get user data
    const response = await apiRequest<User>('/me', {
      method: 'GET',
    });

    if (response.data) {
      // Update stored user data
      setUser(response.data);
      return response.data;
    }

    // No user data returned - clear auth
    clearAuthData();
    return null;
  } catch {
    // Token is invalid - clear auth data
    clearAuthData();
    return null;
  }
}

// Re-export for convenience
export { getToken, clearAuthData } from './api';

/**
 * Helper to check if current user has a specific role
 */
export function currentUserHasRole(roleName: string): boolean {
  const user = getCurrentUser();
  return user?.roles?.some(r => r.name === roleName) ?? false;
}

/**
 * Helper to get current user's role name
 */
export function getCurrentUserRoleName(): string | undefined {
  const user = getCurrentUser();
  return user?.roles?.[0]?.name;
}
