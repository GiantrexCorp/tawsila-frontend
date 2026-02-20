/**
 * Orders Service
 *
 * Handles all order-related API operations including creation, retrieval,
 * status updates (accept/reject), and agent assignments.
 */

import { apiRequest } from '../api';
import { PAGINATION } from '../constants/pagination';

/**
 * Pagination links from API response
 */
export interface PaginationLinks {
  first: string;
  last: string;
  prev: string | null;
  next: string | null;
}

/**
 * Pagination metadata from API response
 */
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

/**
 * Paginated orders response
 */
export interface OrdersResponse {
  data: Order[];
  links: PaginationLinks;
  meta: PaginationMeta;
  delivered: number;
  in_transit: number;
  pending_orders: number;
}

/**
 * Filters for orders list
 * Based on backend API filter documentation
 */
export interface OrderFilters {
  id?: string;
  order_number?: string;
  track_number?: string; // API uses track_number, not tracking_number
  customer_mobile?: string; // Will be mapped to customer.mobile in query
  status?: string;
  payment_status?: string;
  payment_method?: string;
  created_between?: string; // API uses created_between, not created_at_between
  inventory_id?: string;
  'assignments.assigned_to'?: string; // API uses assignments.assigned_to, not agent_id
  is_in_phase1?: string; // Boolean: 'true', 'false', '1', '0'
  is_in_phase2?: string; // Boolean: 'true', 'false', '1', '0'
  // Legacy/UI-only filters (will be mapped)
  tracking_number?: string; // Maps to track_number
  customer_name?: string; // Not in API, but kept for UI
  vendor_id?: string; // Not in API, but kept for UI
  agent_id?: string; // Maps to assignments.assigned_to
  governorate_id?: string; // Not in API, but kept for UI
  city_id?: string; // Not in API, but kept for UI
  created_at_between?: string; // Maps to created_between
  [key: string]: string | undefined;
}

/**
 * Build query string from filters
 * Maps UI filter names to API filter names
 */
function buildFilterQuery(filters: OrderFilters): string {
  const params: string[] = [];

  // Filters not supported by API (UI-only)
  const unsupportedFilters = ['customer_name', 'governorate_id', 'city_id'];

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && !unsupportedFilters.includes(key)) {
      let apiKey = key;
      let apiValue = value;

      // Map UI filter names to API filter names
      if (key === 'tracking_number') {
        apiKey = 'track_number';
      } else if (key === 'customer_mobile') {
        apiKey = 'customer.mobile';
      } else if (key === 'created_at_between') {
        apiKey = 'created_between';
        // Validate date range format: must have both dates in YYYY-MM-DD,YYYY-MM-DD format
        // API expects: filter[created_between]=2024-01-01,2024-12-31
        // URL encoded: filter[created_between]=2024-01-01%2C2024-12-31
        const dateParts = value.split(',');
        if (dateParts.length !== 2) {
          // Skip invalid date ranges (must have comma separator)
          if (process.env.NODE_ENV === 'development') {
            console.warn('Invalid date range format (missing comma):', value);
          }
          return;
        }
        // Ensure both dates are in correct format (YYYY-MM-DD)
        const fromDate = dateParts[0]?.trim();
        const toDate = dateParts[1]?.trim();
        // Validate both dates exist and are in correct format
        if (!fromDate || !toDate || fromDate.length !== 10 || toDate.length !== 10) {
          // Skip invalid date format - both dates must be present and in YYYY-MM-DD format
          if (process.env.NODE_ENV === 'development') {
            console.warn('Invalid date range (missing or invalid dates):', { fromDate, toDate, original: value });
          }
          return;
        }
        // Validate date format (basic check for YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(fromDate) || !dateRegex.test(toDate)) {
          // Skip invalid date format
          if (process.env.NODE_ENV === 'development') {
            console.warn('Invalid date format (does not match YYYY-MM-DD):', { fromDate, toDate, original: value });
          }
          return;
        }
        // Format: YYYY-MM-DD,YYYY-MM-DD (comma will be URL encoded by encodeURIComponent)
        apiValue = `${fromDate},${toDate}`;
        if (process.env.NODE_ENV === 'development') {
          console.log('Date range filter applied:', { fromDate, toDate, apiValue, encoded: encodeURIComponent(apiValue) });
        }
      } else if (key === 'agent_id') {
        apiKey = 'assignments.assigned_to';
      } else if (key === 'vendor_id') {
        // Backend supports vendor_id as exact filter
        apiKey = 'vendor_id';
      }

      // Handle boolean filters - convert to API format
      if (apiKey === 'is_in_phase1' || apiKey === 'is_in_phase2') {
        // Convert '1'/'0' to 'true'/'false'
        if (value === '1') {
          apiValue = 'true';
        } else if (value === '0') {
          apiValue = 'false';
        }
        // If already 'true' or 'false', keep as is
      }

      params.push(`filter[${apiKey}]=${encodeURIComponent(apiValue)}`);
    }
  });

  return params.length > 0 ? `&${params.join('&')}` : '';
}

/**
 * Vendor information
 */
export interface Vendor {
  id: number;
  name?: string;
  name_en?: string;
  name_ar?: string;
  email?: string;
  mobile?: string;
  phone?: string;
  address?: string;
  logo?: string;
  status?: string;
}

/**
 * User information for assignments and logs
 */
export interface AssignedUser {
  id: number;
  name?: string;
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

/**
 * Status log entry for order history
 */
export interface StatusLog {
  id: number;
  order_id: number;
  status?: string;
  status_label?: string;
  to_status?: string;
  to_status_label?: string;
  from_status?: string;
  from_status_label?: string;
  notes?: string | null;
  reason?: string | null;
  created_at: string;
  created_by?: AssignedUser;
}

/**
 * Scan record for order tracking
 */
export interface Scan {
  id: number;
  order_id: number;
  scan_type: string;
  scan_type_label?: string;
  scanned_at: string;
  scanned_by?: AssignedUser;
  location?: string;
  latitude?: number;
  longitude?: number;
  has_coordinates?: boolean;
  coordinates?: string;
  device_info?: string;
  notes?: string | null;
}

/**
 * Inventory location
 */
export interface Inventory {
  id: number;
  name?: string;
  name_en?: string;
  name_ar?: string;
  code?: string;
  phone?: string;
  address?: string;
  full_address?: string;
  governorate?: string | { id: number; name_en: string; name_ar: string };
  city?: string | { id: number; name_en: string; name_ar: string; governorate?: { id: number; name_en: string; name_ar: string } };
  latitude?: number | string;
  longitude?: number | string;
  status?: string;
  is_active?: boolean;
}

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
  /** Reason for cancellation (if cancelled by vendor) */
  cancellation_reason: string | null;
  /** Timestamp when order was cancelled */
  cancelled_at: string | null;
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

  // Included relations
  /** Associated customer information */
  customer?: Customer;
  /** Associated vendor information */
  vendor?: Vendor;
  /** Order items */
  items?: OrderItem[];
  /** Order assignments (pickup/delivery agents) */
  assignments?: Assignment[];
  /** Status change history */
  status_logs?: StatusLog[];
  /** Scan records */
  scans?: Scan[];
  /** User who rejected the order */
  rejected_by?: AssignedUser;
  /** Assigned inventory location */
  inventory?: Inventory;
  /** Financial transactions related to this order */
  transactions?: OrderTransaction[];

  // Permission flags
  /** Whether current user can accept this order */
  can_accept?: boolean;
  /** Whether current user can reject this order */
  can_reject?: boolean;
  /** Whether current user (vendor) can cancel this order */
  can_cancel?: boolean;
  /** Whether current user can assign a pickup agent to this order */
  can_assign_pickup_agent?: boolean;
  /** Whether current user can assign a delivery agent to this order */
  can_assign_delivery_agent?: boolean;
  /** Whether current user can scan this order at inventory */
  can_scan_inventory?: boolean;
  /** Whether current user can scan this order for delivery */
  can_scan_delivery?: boolean;
  /** Whether current user can pickup this order from vendor */
  can_pickup_from_vendor?: boolean;
  /** Whether current user can pickup this order from inventory */
  can_pickup_from_inventory?: boolean;
  /** Whether current user can verify OTP */
  can_verify_otp?: boolean;
  /** Whether current user can mark delivery as failed */
  can_fail_delivery?: boolean;

  // Admin skip action flags
  /** Whether current user can mark order as picked up from vendor (skip QR scan) */
  can_mark_picked_up_from_vendor?: boolean;
  /** Whether current user can mark order as received at inventory (skip QR scan) */
  can_mark_received_at_inventory?: boolean;
  /** Whether current user can mark order as out for delivery (skip QR scan) */
  can_mark_out_for_delivery?: boolean;
  /** Whether current user can mark order as delivered (skip OTP verification) */
  can_mark_delivered?: boolean;

  /** Assigned inventory ID (direct field) */
  inventory_id?: number;
  /** Vendor ID */
  vendor_id?: number;
}

/**
 * User who created a transaction
 */
export interface TransactionCreator {
  id: number;
  name_en: string;
  name_ar: string;
  email?: string;
  mobile?: string;
}

/**
 * Financial transaction related to an order
 */
export interface OrderTransaction {
  /** Unique transaction identifier */
  id: number;
  /** Unique reference number */
  reference_number: string;
  /** Transaction type */
  type: 'credit' | 'debit';
  /** Localized type label */
  type_label: string;
  /** Transaction category */
  category: string;
  /** Localized category label */
  category_label: string;
  /** Transaction amount (always positive) */
  amount: number;
  /** Signed amount (negative for debit) */
  signed_amount: number;
  /** Balance after this transaction */
  balance_after: number;
  /** Transaction description */
  description: string;
  /** Transaction timestamp */
  created_at: string;
  /** User who created the transaction */
  created_by?: TransactionCreator;
}

/**
 * Individual item within an order
 */
export interface OrderItem {
  /** Product ID (optional, for inventory-linked items) */
  product_id?: number;
  /** Product/item name */
  product_name?: string;
  /** Product SKU */
  product_sku?: string | null;
  /** Product description */
  product_description?: string | null;
  /** Number of units */
  quantity: number;
  /** Calculated price (quantity * unit_price) */
  price?: number;
  /** Price per single unit */
  unit_price: number;
  /** Item weight */
  weight?: number | null;
  /** Item notes */
  notes?: string | null;
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
  /** Governorate ID */
  governorate_id?: number | null;
  /** City ID */
  city_id?: number | null;
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
 * Customer data for creating an order
 */
export interface CreateOrderCustomer {
  /** Customer full name (required) */
  name: string;
  /** Mobile phone number (required) */
  mobile: string;
  /** Email address */
  email?: string | null;
  /** Delivery address (required) */
  address: string;
  /** Additional address notes */
  address_notes?: string | null;
  /** Governorate ID */
  governorate_id?: number | null;
  /** City ID */
  city_id?: number | null;
  /** Delivery location latitude */
  latitude?: number | null;
  /** Delivery location longitude */
  longitude?: number | null;
}

/**
 * Item data for creating an order
 */
export interface CreateOrderItem {
  /** Product/item name (required) */
  product_name: string;
  /** Product SKU */
  product_sku?: string | null;
  /** Product description */
  product_description?: string | null;
  /** Number of units (required, min: 1) */
  quantity: number;
  /** Price per single unit (required, min: 0) */
  unit_price: number;
  /** Item weight */
  weight?: number | null;
  /** Item notes */
  notes?: string | null;
}

/**
 * Request payload for creating a new order
 */
export interface CreateOrderRequest {
  /** Customer information (required) */
  customer: CreateOrderCustomer;
  /** Order items (required, min: 1) */
  items: CreateOrderItem[];
  /** Payment method */
  payment_method?: string | null;
  /** Notes visible to vendor */
  vendor_notes?: string | null;
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
 * Available includes for orders API
 * Note: assignments.assignedTo and assignments.assignedBy load nested relations
 */
const ORDER_INCLUDES = [
  'vendor',
  'customer',
  'items',
  'assignments.assignedTo',
  'assignments.assignedBy',
  'statusLogs',
  'scans',
  'rejectedBy',
  'inventory',
].join(',');

/**
 * Fetch orders with pagination and filters
 * For shipping agents, only returns orders assigned to them
 */
export async function fetchOrders(
  page: number = 1,
  perPage: number = PAGINATION.ORDERS,
  filters: OrderFilters = {}
): Promise<OrdersResponse> {
  const filterQuery = buildFilterQuery(filters);
  const url = `/orders?page=${page}&per_page=${perPage}&include=${ORDER_INCLUDES}${filterQuery}`;
  
  // Debug logging (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('Orders API Request:', {
      url,
      filters,
      filterQuery,
    });
  }
  
  const response = await apiRequest<OrdersResponse>(url, {
    method: 'GET',
  });

  // apiRequest returns the raw JSON response which has data, links, meta at root level
  const rawResponse = response as unknown as OrdersResponse;

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
    delivered: rawResponse.delivered || 0,
    in_transit: rawResponse.in_transit || 0,
    pending_orders: rawResponse.pending_orders || 0,
  };
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
  const includeParams = 'customer,vendor,items,assignments,statusLogs,scans,rejectedBy,inventory,assignments.assignedBy,assignments.assignedTo,scans.scannedBy,transactions,transactions.createdBy';
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

export interface AssignDeliveryAgentRequest {
  agent_id: number;
  notes?: string;
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
 * Assign a delivery agent to an order
 */
export async function assignDeliveryAgent(id: number, agentId: number, notes?: string): Promise<Assignment> {
  const body: AssignDeliveryAgentRequest = {
    agent_id: agentId,
  };
  
  if (notes && notes.trim()) {
    body.notes = notes.trim();
  }

  const response = await apiRequest<Assignment>(`/orders/${id}/assign-delivery-agent`, {
    method: 'POST',
    body: JSON.stringify(body),
    skipRedirectOn403: true, // Don't redirect on 403, show error message instead
  });

  if (!response.data) {
    throw new Error(response.message || 'Failed to assign delivery agent');
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

/**
 * Skip scan action - used by admins to manually advance order status
 * without QR code scanning
 * 
 * Used for:
 * - Mark picked up from vendor (when status is pickup_assigned)
 * - Mark received at inventory (when status is picked_up_from_vendor)
 * - Mark out for delivery (when status is delivery_assigned)
 */
export async function skipScan(orderId: number): Promise<Order> {
  const response = await apiRequest<Order>(`/orders/${orderId}/skip-scan`, {
    method: 'POST',
    skipRedirectOn403: true,
  });

  if (!response.data) {
    throw new Error(response.message || 'Failed to skip scan');
  }

  return response.data;
}

/**
 * Skip OTP verification - used by admins to manually mark order as delivered
 * without customer OTP verification
 *
 * Used for:
 * - Mark as delivered (when status is out_for_delivery)
 */
export async function skipVerifyOtp(orderId: number): Promise<Order> {
  const response = await apiRequest<Order>(`/orders/${orderId}/skip-verify-otp`, {
    method: 'POST',
    skipRedirectOn403: true,
  });

  if (!response.data) {
    throw new Error(response.message || 'Failed to skip OTP verification');
  }

  return response.data;
}

/**
 * Cancel an order by vendor
 * Only available for vendors on their own orders before pickup
 */
export async function cancelOrder(id: number, reason: string): Promise<Order> {
  const response = await apiRequest<Order>(`/orders/${id}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason: reason.trim() }),
    skipRedirectOn403: true,
  });

  if (!response.data) {
    throw new Error(response.message || 'Failed to cancel order');
  }

  return response.data;
}

/**
 * Mark delivery as failed
 * Available when order is out for delivery and user has permission
 */
export async function failDelivery(id: number, reason: string): Promise<Order> {
  const response = await apiRequest<Order>(`/orders/${id}/fail-delivery`, {
    method: 'POST',
    body: JSON.stringify({ reason: reason.trim() }),
    skipRedirectOn403: true,
  });

  if (!response.data) {
    throw new Error(response.message || 'Failed to mark delivery as failed');
  }

  return response.data;
}

/**
 * Response from the bulk import orders endpoint
 */
export interface ImportOrderWarning {
  index: number;
  type: 'payload_duplicate' | 'existing_order_duplicate' | string;
  message: string;
  matched_index?: number;
  matched_order_id?: number;
  matched_order_number?: string;
  matched_order_created_at?: string;
}

export interface ImportOrdersResponse {
  success_count: number;
  failure_count: number;
  errors: Array<{ index: number; message: string }>;
  warnings: ImportOrderWarning[];
}

export interface ImportOrdersRequest {
  orders: CreateOrderRequest[];
  checkOnly?: boolean;
}

/**
 * Bulk import orders
 * Sends orders to the backend.
 * Set checkOnly=true to run duplicate checks without creating any orders.
 */
export async function importOrders(
  payload: ImportOrdersRequest
): Promise<ImportOrdersResponse> {
  const response = await apiRequest<ImportOrdersResponse>('/orders/import', {
    method: 'POST',
    body: JSON.stringify({
      orders: payload.orders,
      check_only: payload.checkOnly ?? false,
    }),
    skipRedirectOn403: true,
  });

  if (!response.data) {
    throw new Error(response.message || 'Failed to import orders');
  }

  return response.data;
}

