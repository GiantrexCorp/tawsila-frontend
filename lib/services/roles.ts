/**
 * Roles Service
 */

import { apiRequest } from '../api';

export interface Role {
  id: number;
  name: string;
  slug_en: string | null;
  slug_ar: string | null;
  guard_name: string;
  permissions: string[]; // Array of permission names
  users_count: number;
  created_at: string;
  updated_at: string;
}

export interface RolesResponse {
  data: Role[];
  links?: unknown;
  meta?: unknown;
}

/**
 * Fetch all roles
 */
export async function fetchRoles(): Promise<RolesResponse> {
  const response = await apiRequest<Role[]>('/roles', {
    method: 'GET',
  });

  return response as unknown as RolesResponse;
}

/**
 * Fetch a single role by ID
 */
export async function fetchRole(id: number): Promise<Role> {
  const response = await apiRequest<Role>(`/roles/${id}`, {
    method: 'GET',
  });

  if (!response.data) {
    throw new Error('Role not found');
  }

  return response.data;
}

/**
 * Create a new role
 */
export async function createRole(roleData: {
  name: string;
  slug_en: string;
  slug_ar: string;
  permissions: number[];
}): Promise<Role> {
  const response = await apiRequest<Role>('/roles', {
    method: 'POST',
    body: JSON.stringify(roleData),
  });

  if (!response.data) {
    throw new Error('Failed to create role');
  }

  return response.data;
}

/**
 * Update a role
 */
export async function updateRole(
  id: number,
  roleData: {
    name: string;
    slug_en: string;
    slug_ar: string;
    permissions: number[];
  }
): Promise<Role> {
  const response = await apiRequest<Role>(`/roles/${id}`, {
    method: 'POST',
    body: JSON.stringify({
      ...roleData,
      _method: 'PUT',
    }),
  });

  if (!response.data) {
    throw new Error('Failed to update role');
  }

  return response.data;
}

/**
 * Delete a role
 */
export async function deleteRole(id: number): Promise<void> {
  await apiRequest(`/roles/${id}`, {
    method: 'DELETE',
  });
}

