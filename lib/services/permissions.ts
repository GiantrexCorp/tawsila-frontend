/**
 * Permissions Service
 */

import { apiRequest } from '../api';

export interface Permission {
  id: number;
  name: string;
  guard_name: string;
  created_at: string;
  updated_at: string;
}

export interface PermissionsResponse {
  data: Permission[];
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
  };
}

/**
 * Fetch all permissions
 */
export async function fetchPermissions(page: number = 1): Promise<PermissionsResponse> {
  const response = await apiRequest<Permission[]>(`/permissions?page=${page}`, {
    method: 'GET',
  });

  return response as unknown as PermissionsResponse;
}


