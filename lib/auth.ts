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
export async function login(credentials: LoginCredentials): Promise<User> {
  const response = await apiRequest<User>('/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  // Check if user is inactive BEFORE storing any data
  if (response.data.status === 'inactive') {
    // Don't store token or user data for inactive users
    throw new Error('ACCOUNT_INACTIVE');
  }

  // Store the token from meta
  if (response.meta?.access_token) {
    setToken(response.meta.access_token);
    // Store user data
    setUser(response.data);
  }

  return response.data;
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
    // Continue with logout even if API call fails
    console.error('Logout error:', error);
  } finally {
    removeToken();
    removeUser();
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

