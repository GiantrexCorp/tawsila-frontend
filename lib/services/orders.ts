/**
 * Orders Service
 */

import { apiRequest } from '../api';

export interface Order {
  id: number;
  order_number: string;
  track_number: string;
  tracking_url: string;
  qr_code: string;
  status: string;
  status_label: string;
  payment_method: string;
  payment_status: string;
  payment_status_label: string;
  subtotal: number;
  shipping_cost: number;
  total_amount: number;
  rejection_reason: string | null;
  rejected_at: string | null;
  vendor_notes: string | null;
  internal_notes: string | null;
  is_in_phase1: boolean;
  is_in_phase2: boolean;
  created_at: string;
  updated_at: string;
  customer?: Customer; // Customer information from API
}

export interface OrderItem {
  product_id?: number;
  product_name?: string;
  quantity: number;
  price?: number; // Keep for frontend calculation
  unit_price: number; // Backend expects this
}

export interface Customer {
  id?: number;
  name: string;
  mobile: string;
  email?: string | null;
  address: string;
  address_notes?: string | null;
  full_address?: string;
  latitude?: number | null;
  longitude?: number | null;
  has_coordinates?: boolean;
  governorate?: string | null;
  city?: string | null;
}

export interface CreateOrderRequest {
  vendor_notes?: string;
  internal_notes?: string;
  payment_method?: string;
  vendor_id?: number;
  customer: Customer;
  items: OrderItem[];
  shipping_cost?: number;
  subtotal?: number;
  total_amount?: number;
  [key: string]: unknown;
}

/**
 * Create a new order
 */
export async function createOrder(orderData: CreateOrderRequest): Promise<Order> {
  const response = await apiRequest<Order>('/orders', {
    method: 'POST',
    body: JSON.stringify(orderData),
  });

  if (!response.data) {
    throw new Error('Failed to create order');
  }

  return response.data;
}

/**
 * Fetch all orders
 */
export async function fetchOrders(): Promise<Order[]> {
  const response = await apiRequest<Order[]>('/orders', {
    method: 'GET',
  });

  return response.data || [];
}

/**
 * Fetch a single order by ID
 */
export async function fetchOrder(id: number): Promise<Order> {
  const includeParams = 'customer,vendor,items,assignments,statusLogs,scans,rejectedBy,inventory';
  const response = await apiRequest<Order>(`/orders/${id}?include=${includeParams}`, {
    method: 'GET',
  });

  if (!response.data) {
    throw new Error('Order not found');
  }

  return response.data;
}

export interface AcceptOrderRequest {
  inventory_id: number;
}

/**
 * Accept an order
 */
export async function acceptOrder(id: number, inventoryId: number): Promise<Order> {
  const response = await apiRequest<Order>(`/orders/${id}/accept`, {
    method: 'POST',
    body: JSON.stringify({
      inventory_id: inventoryId,
    }),
  });

  if (!response.data) {
    throw new Error('Failed to accept order');
  }

  return response.data;
}

export interface RejectOrderRequest {
  reason?: string;
}

/**
 * Reject an order
 */
export async function rejectOrder(id: number, rejectionReason?: string): Promise<Order> {
  const body: { reason?: string } = {};
  
  // Only include reason if it has a value
  if (rejectionReason && rejectionReason.trim()) {
    body.reason = rejectionReason.trim();
  }

  const response = await apiRequest<Order>(`/orders/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify(body),
  });

  // The API returns { data: Order, message: string }
  // Check if data exists in the response
  if (!response.data) {
    console.error('Reject order response:', response);
    throw new Error(response.message || 'Failed to reject order');
  }

  return response.data;
}

export interface AssignPickupAgentRequest {
  agent_id: number;
  notes?: string;
}

export interface AssignedUser {
  id: number;
  name: string;
  mobile?: string;
}

export interface Assignment {
  id: number;
  order_id: number;
  assignment_type: string;
  assignment_type_label: string;
  status: string;
  status_label: string;
  assigned_at: string;
  accepted_at: string | null;
  picked_up_at: string | null;
  completed_at: string | null;
  notes: string | null;
  is_active: boolean;
  is_finished: boolean;
  assigned_by?: AssignedUser;
  assigned_to?: AssignedUser;
  created_at: string;
}

/**
 * Assign a pickup agent to an order
 */
export async function assignPickupAgent(id: number, agentId: number, notes?: string): Promise<Assignment> {
  const body: AssignPickupAgentRequest = {
    agent_id: agentId,
  };
  
  if (notes && notes.trim()) {
    body.notes = notes.trim();
  }

  const response = await apiRequest<Assignment>(`/orders/${id}/assign-pickup-agent`, {
    method: 'POST',
    body: JSON.stringify(body),
    skipRedirectOn403: true, // Don't redirect on 403, show error message instead
  });

  if (!response.data) {
    throw new Error(response.message || 'Failed to assign pickup agent');
  }

  return response.data;
}

/**
 * Fetch assignments for an order
 */
export async function fetchOrderAssignments(id: number): Promise<Assignment[]> {
  const response = await apiRequest<Assignment[]>(`/orders/${id}/assignments`, {
    method: 'GET',
  });

  return response.data || [];
}

