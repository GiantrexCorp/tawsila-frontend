/**
 * Analytics Service
 *
 * Handles all analytics dashboard API operations including
 * dashboard stats, orders analytics, revenue analytics, and more.
 */

import { apiRequest } from '../api';

/**
 * Dashboard statistics overview
 */
export interface DashboardStats {
  total_orders: number;
  completed_orders: number;
  pending_orders: number;
  cancelled_orders: number;
  total_revenue: number;
  total_vendors: number;
  active_vendors: number;
  total_agents: number;
  active_agents: number;
  average_delivery_time_hours: number;
  success_rate: number;
}

/**
 * Top vendor data
 */
export interface TopVendor {
  vendor_id: number;
  vendor_name_en: string;
  vendor_name_ar: string;
  logo_url: string | null;
  total_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  success_rate: number;
  total_revenue: number;
  average_order_value: number;
  rank: number;
}

/**
 * Order status breakdown
 */
export interface OrderStatusBreakdown {
  status: string;
  count: number;
  percentage: number;
}

/**
 * Order trend data point
 */
export interface OrderTrendPoint {
  date: string;
  orders: number;
  completed: number;
  cancelled: number;
}

/**
 * Orders analytics data
 */
export interface OrdersAnalytics {
  summary: {
    total: number;
    completed: number;
    pending: number;
    in_transit: number;
    cancelled: number;
  };
  by_status: OrderStatusBreakdown[];
  trend: OrderTrendPoint[];
}

/**
 * Revenue trend data point
 */
export interface RevenueTrendPoint {
  date: string;
  revenue: number;
  orders: number;
}

/**
 * Revenue by vendor
 */
export interface RevenueByVendor {
  vendor_id: number;
  vendor_name_en: string;
  vendor_name_ar: string;
  revenue: number;
}

/**
 * Revenue analytics data
 */
export interface RevenueAnalytics {
  summary: {
    total_revenue: number;
    shipping_fees: number;
    cod_collected: number;
    vendor_payouts: number;
  };
  trend: RevenueTrendPoint[];
  by_vendor: RevenueByVendor[];
}

/**
 * Top agent data
 */
export interface TopAgent {
  agent_id: number;
  agent_name_en: string;
  agent_name_ar: string;
  total_deliveries: number;
  successful_deliveries: number;
  failed_deliveries: number;
  pickup_orders: number;
  success_rate: number;
  total_collected: number;
  rank: number;
}

/**
 * Agents analytics data
 */
export interface AgentsAnalytics {
  summary: {
    total_agents: number;
    active_agents: number;
    total_deliveries: number;
    average_deliveries_per_agent: number;
  };
  top_agents: TopAgent[];
}

/**
 * Geographic analytics data point
 */
export interface GeographicData {
  location: string;
  location_ar: string;
  total_orders: number;
  completed_orders: number;
  success_rate: number;
  revenue: number;
  percentage_of_total: number;
}

/**
 * Activity feed item
 */
export interface ActivityItem {
  id: number;
  type: string;
  title: string;
  title_ar: string;
  description: string;
  description_ar: string;
  metadata: {
    order_id?: number;
    order_number?: string;
    vendor_id?: number;
    status?: string;
    [key: string]: unknown;
  };
  created_at: string;
}

/**
 * Complete analytics dashboard response
 */
export interface AnalyticsDashboard {
  dashboard_stats: DashboardStats;
  top_vendors: TopVendor[];
  orders_analytics: OrdersAnalytics;
  revenue_analytics: RevenueAnalytics;
  agents_analytics: AgentsAnalytics;
  geographic_analytics: GeographicData[];
  activity_feed: ActivityItem[];
}

/**
 * Analytics API response with meta
 */
export interface AnalyticsResponse {
  data: AnalyticsDashboard;
  meta: {
    period: string | null;
    start_date: string | null;
    end_date: string | null;
  };
}

/**
 * Fetch analytics dashboard data
 */
export async function fetchAnalyticsDashboard(
  period?: string,
  startDate?: string,
  endDate?: string
): Promise<AnalyticsDashboard> {
  const params = new URLSearchParams();

  if (period) {
    params.append('period', period);
  }
  if (startDate) {
    params.append('start_date', startDate);
  }
  if (endDate) {
    params.append('end_date', endDate);
  }

  const queryString = params.toString();
  const endpoint = `/analytics/dashboard${queryString ? `?${queryString}` : ''}`;

  const response = await apiRequest<AnalyticsDashboard>(endpoint, {
    method: 'GET',
  });

  if (!response.data) {
    throw new Error('Failed to fetch analytics dashboard');
  }

  return response.data;
}
