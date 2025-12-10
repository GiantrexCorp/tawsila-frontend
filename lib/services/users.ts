/**
 * Users Service
 *
 * Handles all user-related API operations including CRUD, role assignment,
 * password management, and user filtering with pagination.
 */

import { apiRequest } from '../api';

/**
 * User entity representing a system user
 */
export interface User {
  /** Unique user identifier */
  id: number;
  /** Legacy name field (for backwards compatibility) */
  name: string;
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
  /** Assigned role names (e.g., ['super-admin', 'inventory-manager']) */
  roles: string[];
  /** Aggregated permissions from assigned roles */
  permissions?: string[];
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

  // The API returns the full paginated response directly
  return {
    data: response.data?.data || [],
    links: response.data?.links || { first: '', last: '', prev: null, next: null },
    meta: response.data?.meta || {
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

