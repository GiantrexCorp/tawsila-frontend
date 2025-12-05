/**
 * Users Service
 */

import { apiRequest } from '../api';

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
  permissions?: string[]; // User's permissions from their role
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
  const response = await apiRequest<User[]>(`/users?page=${page}&per_page=${perPage}${filterQuery}`, {
    method: 'GET',
  });

  return response as unknown as UsersResponse;
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
  console.log('assignUserRole called with:', { userId, roleId });
  
  // Create FormData for form-data submission
  const formData = new FormData();
  formData.append('user_id', userId.toString());
  formData.append('roles[0]', roleId.toString());
  
  console.log('Request URL:', '/assign-role');
  console.log('FormData:', { user_id: userId, 'roles[0]': roleId });
  
  const response = await apiRequest<{ message: string }>('/assign-role', {
    method: 'POST',
    body: formData,
  });

  return response;
}

