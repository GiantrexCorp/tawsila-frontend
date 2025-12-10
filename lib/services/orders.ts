/**
 * Orders Service
 *
 * Handles all order-related API operations including creation, retrieval,
 * status updates (accept/reject), and agent assignments.
 */

import { apiRequest } from '../api';

/**
 * Order entity representing a delivery order in the system
 */
export interface Order {
  /** Unique order identifier */
  id: number;
  /** Human-readable order number (e.g., "ORD-2024-001") */
  order_number: string;
  /** Tracking number for public order tracking */
  track_number: string;
  /** Full URL for public order tracking page */
  tracking_url: string;
  /** QR code data for quick tracking access */
  qr_code: string;
  /** Current order status (e.g., 'pending', 'delivered') */
  status: string;
  /** Localized status label for display */
  status_label: string;
  /** Payment method (e.g., 'cash', 'card') */
  payment_method: string;
  /** Payment status (e.g., 'paid', 'unpaid') */
  payment_status: string;
  /** Localized payment status label */
  payment_status_label: string;
  /** Sum of all item prices */
  subtotal: number;
  /** Delivery/shipping cost */
  shipping_cost: number;
  /** Total order amount (subtotal + shipping) */
  total_amount: number;
  /** Reason for rejection (if rejected) */
  rejection_reason: string | null;
  /** Timestamp when order was rejected */
  rejected_at: string | null;
  /** Notes visible to vendor */
  vendor_notes: string | null;
  /** Internal notes (admin only) */
  internal_notes: string | null;
  /** Whether order is in phase 1 (vendor acceptance) */
  is_in_phase1: boolean;
  /** Whether order is in phase 2 (inventory confirmation) */
  is_in_phase2: boolean;
  /** Order creation timestamp */
  created_at: string;
  /** Last update timestamp */
  updated_at: string;
  /** Associated customer information */
  customer?: Customer;
}

/**
 * Individual item within an order
 */
export interface OrderItem {
  /** Product ID (optional, for inventory-linked items) */
  product_id?: number;
  /** Product/item name */
  product_name?: string;
  /** Number of units */
  quantity: number;
  /** Calculated price (quantity * unit_price) */
  price?: number;
  /** Price per single unit */
  unit_price: number;
}

/**
 * Customer information for delivery
 */
export interface Customer {
  /** Customer ID (if registered) */
  id?: number;
  /** Customer full name */
  name: string;
  /** Mobile phone number */
  mobile: string;
  /** Email address */
  email?: string | null;
  /** Delivery address */
  address: string;
  /** Additional address notes (e.g., "Ring doorbell") */
  address_notes?: string | null;
  /** Complete formatted address */
  full_address?: string;
  /** Delivery location latitude */
  latitude?: number | null;
  /** Delivery location longitude */
  longitude?: number | null;
  /** Whether coordinates are available */
  has_coordinates?: boolean;
  /** Governorate/province name */
  governorate?: string | null;
  /** City name */
  city?: string | null;
}

/**
 * Request payload for creating a new order
 */
export interface CreateOrderRequest {
  /** Notes visible to vendor */
  vendor_notes?: string;
  /** Internal notes (admin only) */
  internal_notes?: string;
  /** Payment method */
  payment_method?: string;
  /** Vendor ID (required for admin-created orders) */
  vendor_id?: number;
  /** Customer information */
  customer: Customer;
  /** Order items */
  items: OrderItem[];
  /** Shipping cost */
  shipping_cost?: number;
  /** Calculated subtotal */
  subtotal?: number;
  /** Calculated total amount */
  total_amount?: number;
  /** Additional dynamic fields */
  [key: string]: unknown;
}

/**
 * Create a new order
 */
export async function createOrder(orderData: CreateOrderRequest): Promise<Order> {
  const response = await apiRequest<Order>('/orders', {
    method: 'POST',
    body: JSON.stringify(orderData),
    skipRedirectOn403: true, // Don't redirect on 403, show error message instead
  });

  if (!response.data) {
    throw new Error('Failed to create order');
  }

  return response.data;
}

/**
 * Fetch all orders
 * For shipping agents, only returns orders assigned to them
 */
export async function fetchOrders(): Promise<Order[]> {
  const response = await apiRequest<Order[]>('/orders', {
    method: 'GET',
  });

  return response.data || [];
}

/**
 * Fetch orders assigned to current shipping agent
 * Backend should filter orders where the current user is assigned as the agent
 * Includes assignments in the response to verify filtering
 */
export async function fetchMyAssignedOrders(): Promise<Order[]> {
  // Fetch orders with assignments included
  // Backend should automatically filter by authenticated user's ID for shipping agents
  const response = await apiRequest<Order[]>('/orders?include=assignments', {
    method: 'GET',
  });

  const orders = response.data || [];
  
  // If backend doesn't filter automatically, filter client-side
  // Get current user ID to match against assignments
  const { getCurrentUser } = await import('../auth');
  const currentUser = getCurrentUser();
  const currentUserId = currentUser?.id;

  if (!currentUserId) {
    return [];
  }

  // Filter orders where current user is assigned as the agent
  interface OrderWithAssignments extends Order {
    assignments?: Assignment[];
  }
  const assignedOrders = orders.filter(order => {
    const orderWithAssignments = order as OrderWithAssignments;
    if (!orderWithAssignments.assignments || !Array.isArray(orderWithAssignments.assignments)) {
      return false;
    }
    
    // Check if any active assignment has current user as assigned_to
    return orderWithAssignments.assignments.some((assignment: Assignment) => {
      return assignment.is_active && 
             assignment.assigned_to && 
             assignment.assigned_to.id === currentUserId;
    });
  });

  return assignedOrders;
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

  if (!response.data) {
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
  name?: string; // Fallback for older API versions
  name_en?: string;
  name_ar?: string;
  mobile?: string;
  email?: string;
  status?: string;
  last_active?: string;
  created_at?: string;
  updated_at?: string;
  roles?: string[];
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

