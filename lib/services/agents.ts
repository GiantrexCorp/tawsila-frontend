/**
 * Agents Service
 */

import { apiRequest } from '../api';
import { UserRoleObject } from './users';

export interface Agent {
  id: number;
  name: string;
  name_en?: string;
  name_ar?: string;
  email?: string;
  mobile?: string;
  phone?: string;
  status?: 'active' | 'inactive';
  rating?: number;
  total_deliveries?: number;
  roles?: UserRoleObject[];
  [key: string]: unknown;
}

/**
 * Fetch all agents (pickup/delivery agents)
 */
export async function fetchAgents(): Promise<Agent[]> {
  const response = await apiRequest<Agent[]>('/get-users', {
    method: 'GET',
  });

  return response.data || [];
}

/**
 * Fetch active shipping agents only
 */
export async function fetchActiveAgents(): Promise<Agent[]> {
  const response = await apiRequest<Agent[]>('/get-users?filter[status]=active', {
    method: 'GET',
  });

  const allUsers = response.data || [];

  // Filter to only shipping agents
  const shippingAgents = allUsers.filter((user: Agent) => {
    // Check if user has shipping-agent role
    if (user.roles && Array.isArray(user.roles)) {
      return user.roles.some(r => r.name === 'shipping-agent');
    }
    return false;
  });

  return shippingAgents;
}

