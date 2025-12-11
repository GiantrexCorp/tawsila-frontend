/**
 * Users Service
 *
 * Handles all user-related API operations including CRUD, role assignment,
 * password management, and user filtering with pagination.
 */

import { apiRequest } from '../api';

/**
 * Role object returned from API
 */
export interface UserRoleObject {
  id: number;
  name: string;
  slug_en: string | null;
  slug_ar: string | null;
}

/**
 * User entity representing a system user
 */
export interface User {
  /** Unique user identifier */
  id: number;
  /** Legacy name field (for backwards compatibility) */
  name?: string;
  /** English display name */
  name_en: string;
  /** Arabic display name */
  name_ar: string;
  /** Email address */
  email: string;
  /** Mobile phone number */
  mobile: string;
  /** Account status */
  status: 'active' | 'inactive';
  /** Last activity timestamp */
  last_active: string | null;
  /** Account creation timestamp */
  created_at: string;
  /** Last update timestamp */
  updated_at: string;
  /** Assigned roles with localized slugs */
  roles: UserRoleObject[];
  /** Aggregated permissions from assigned roles */
  roles_permissions?: string[];
}

/**
 * Helper to get role name for checking (e.g., 'shipping-agent')
 */
export function getUserRoleName(user: User | null | undefined): string | undefined {
  return user?.roles?.[0]?.name;
}

/**
 * Helper to check if user has a specific role
 */
export function userHasRole(user: User | null | undefined, roleName: string): boolean {
  return user?.roles?.some(r => r.name === roleName) ?? false;
}

/**
 * Helper to get localized role display name
 */
export function getRoleDisplayName(role: UserRoleObject | undefined, locale: string): string {
  if (!role) return '';

  const localizedSlug = locale === 'ar' ? role.slug_ar : role.slug_en;
  if (localizedSlug) return localizedSlug;

  // Fallback: format role name
  return role.name.split('-').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

export interface PaginationLinks {
  first: string;
  last: string;
  prev: string | null;
  next: string | null;
}

export interface PaginationMeta {
  current_page: number;
  from: number;
  last_page: number;
  links: Array<{
    url: string | null;
    label: string;
    page: number | null;
    active: boolean;
  }>;
  path: string;
  per_page: number;
  to: number;
  total: number;
}

export interface UsersResponse {
  data: User[];
  links: PaginationLinks;
  meta: PaginationMeta;
  title?: string;
  alias?: string;
}

export interface UserFilters {
  status?: 'active' | 'inactive';
  id?: string;
  name_en?: string;
  name_ar?: string;
  email?: string;
  mobile?: string;
  createdAtBetween?: string;
  [key: string]: string | undefined;
}

/**
 * Build query string from filters
 */
function buildFilterQuery(filters: UserFilters): string {
  const params: string[] = [];
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.push(`filter[${key}]=${encodeURIComponent(value)}`);
    }
  });
  
  return params.length > 0 ? `&${params.join('&')}` : '';
}

/**
 * Fetch users with pagination and filters
 */
export async function fetchUsers(
  page: number = 1,
  perPage: number = 50,
  filters: UserFilters = {}
): Promise<UsersResponse> {
  const filterQuery = buildFilterQuery(filters);
  const response = await apiRequest<UsersResponse>(`/users?page=${page}&per_page=${perPage}${filterQuery}`, {
    method: 'GET',
  });

  // apiRequest returns the raw JSON response which has data, links, meta at root level
  // Cast response to the expected shape since apiRequest returns ApiResponse<T>
  const rawResponse = response as unknown as UsersResponse;

  return {
    data: rawResponse.data || [],
    links: rawResponse.links || { first: '', last: '', prev: null, next: null },
    meta: rawResponse.meta || {
      current_page: 1,
      from: 0,
      last_page: 1,
      links: [],
      path: '',
      per_page: perPage,
      to: 0,
      total: 0,
    },
  } as UsersResponse;
}

/**
 * Fetch a single user by ID
 */
export async function fetchUser(id: number): Promise<User> {
  const response = await apiRequest<User>(`/users/${id}`, {
    method: 'GET',
  });

  if (!response.data) {
    throw new Error('User not found');
  }

  return response.data;
}

/**
 * Create a new user
 */
export async function createUser(userData: Partial<User>): Promise<User> {
  const response = await apiRequest<User>('/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  });

  if (!response.data) {
    throw new Error('Failed to create user');
  }

  return response.data;
}

/**
 * Update a user
 */
export async function updateUser(id: number, userData: Partial<User>): Promise<User> {
  const response = await apiRequest<User>(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  });

  if (!response.data) {
    throw new Error('Failed to update user');
  }

  return response.data;
}

/**
 * Delete a user
 */
export async function deleteUser(id: number): Promise<void> {
  await apiRequest(`/users/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Change own password (from profile page)
 */
export async function changeOwnPassword(
  password: string, 
  passwordConfirmation: string
): Promise<User> {
  const response = await apiRequest<User>('/profile/change-password', {
    method: 'POST',
    body: JSON.stringify({
      password,
      password_confirmation: passwordConfirmation,
    }),
  });

  if (!response.data) {
    throw new Error('Failed to change password');
  }

  return response.data;
}

/**
 * Change user password (admin function - for changing other users' passwords)
 */
export async function changeUserPassword(
  userId: number,
  password: string, 
  passwordConfirmation: string
): Promise<User> {
  const response = await apiRequest<User>('/change-password', {
    method: 'POST',
    body: JSON.stringify({
      id: userId,
      password,
      password_confirmation: passwordConfirmation,
    }),
  });

  if (!response.data) {
    throw new Error('Failed to change user password');
  }

  return response.data;
}

/**
 * Assign role to user
 * Backend expects: POST /assign-role with user_id and roles[] array as form-data
 * Returns: { message: "Role assigned successfully" }
 */
export async function assignUserRole(
  userId: number,
  roleId: number
): Promise<{ message: string }> {
  const formData = new FormData();
  formData.append('user_id', userId.toString());
  formData.append('roles[0]', roleId.toString());

  const response = await apiRequest<{ message: string }>('/assign-role', {
    method: 'POST',
    body: formData,
  });

  return response;
}

/**
 * Current user profile with permissions
 */
export interface CurrentUserProfile {
  id: number;
  name_en: string;
  name_ar: string;
  mobile: string;
  email: string;
  status: 'active' | 'inactive';
  last_active: string | null;
  created_at: string;
  updated_at: string;
  roles: string[];
  roles_permissions: string[];
}

/**
 * Fetch current user profile (includes live permissions)
 */
export async function fetchCurrentUserProfile(): Promise<CurrentUserProfile> {
  const response = await apiRequest<CurrentUserProfile>('/profile', {
    method: 'GET',
  });

  if (!response.data) {
    throw new Error('Failed to fetch profile');
  }

  return response.data;
}

