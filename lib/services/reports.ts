/**
 * Reports Service
 *
 * Handles all report-related API operations including vendor profits,
 * top vendors, agent performance, and top agents reports.
 */

import { apiRequest } from '../api';

// ============================================
// Types
// ============================================

/**
 * Period filter options for reports
 */
export type ReportPeriod =
  | 'all_time'
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'last_30_days'
  | 'this_month'
  | 'last_month'
  | 'this_year'
  | 'custom';

/**
 * Report filter options
 */
export interface ReportFilters {
  /** Predefined period */
  period?: ReportPeriod;
  /** Custom start date (YYYY-MM-DD) */
  from?: string;
  /** Custom end date (YYYY-MM-DD) */
  to?: string;
}

/**
 * Report meta information
 */
export interface ReportMeta {
  /** Period used for the report */
  period: ReportPeriod | null;
  /** Start date of the report period */
  from: string;
  /** End date of the report period */
  to: string;
  /** Number of items in the report */
  count?: number;
}

// ============================================
// Vendor Reports
// ============================================

/**
 * Vendor information in report
 */
export interface ReportVendor {
  id: number;
  name_en: string;
  name_ar: string;
  logo_url: string | null;
}

/**
 * Vendor profit report item
 */
export interface VendorProfitItem {
  vendor_id: number;
  vendor_name: string;
  vendor: ReportVendor;
  cod_revenue: number;
  prepaid_revenue: number;
  total_revenue: number;
  shipping_fees: number;
  net_profit: number;
  cod_orders_count: number;
  prepaid_orders_count: number;
  total_orders_count: number;
}

/**
 * Vendor profits report response
 */
export interface VendorProfitsResponse {
  data: VendorProfitItem[];
  meta: ReportMeta;
}

// ============================================
// Agent Reports
// ============================================

/**
 * Agent information in report
 */
export interface ReportAgent {
  id: number;
  name_en: string;
  name_ar: string;
  email: string;
  avatar?: string | null;
}

/**
 * Agent performance report item
 */
export interface AgentPerformanceItem {
  agent_id: number;
  agent_name: string;
  agent: ReportAgent;
  pickup_orders_count: number;
  delivered_orders_count: number;
  total_orders_count: number;
  total_collected: number;
}

/**
 * Agent performance report response
 */
export interface AgentPerformanceResponse {
  data: AgentPerformanceItem[];
  meta: ReportMeta;
}

// ============================================
// API Functions
// ============================================

/**
 * Build query string from filters
 */
function buildReportQueryString(filters?: ReportFilters): string {
  if (!filters) return '';

  const params = new URLSearchParams();

  // all_time means no filter - return empty query string
  if (filters.period === 'all_time') {
    return '';
  }

  // custom period uses from/to dates
  if (filters.period === 'custom') {
    if (filters.from) params.append('from', filters.from);
    if (filters.to) params.append('to', filters.to);
  } else if (filters.period) {
    params.append('period', filters.period);
  } else {
    if (filters.from) params.append('from', filters.from);
    if (filters.to) params.append('to', filters.to);
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Fetch vendor profits report
 * Requires: view-vendor-profits permission
 */
export async function fetchVendorProfits(filters?: ReportFilters): Promise<VendorProfitsResponse> {
  const queryString = buildReportQueryString(filters);
  // apiRequest returns the raw response: { data: [...], meta: {...} }
  const response = await apiRequest<VendorProfitsResponse>(`/reports/vendor-profits${queryString}`, {
    method: 'GET',
  });

  // The response itself contains data and meta at the top level
  const result = response as unknown as VendorProfitsResponse;
  return {
    data: result.data || [],
    meta: result.meta || { period: null, from: '', to: '' },
  };
}

/**
 * Fetch top vendors report
 * Requires: view-top-vendors permission
 */
export async function fetchTopVendors(filters?: ReportFilters): Promise<VendorProfitsResponse> {
  const queryString = buildReportQueryString(filters);
  // apiRequest returns the raw response: { data: [...], meta: {...} }
  const response = await apiRequest<VendorProfitsResponse>(`/reports/top-vendors${queryString}`, {
    method: 'GET',
  });

  // The response itself contains data and meta at the top level
  const result = response as unknown as VendorProfitsResponse;
  return {
    data: result.data || [],
    meta: result.meta || { period: null, from: '', to: '' },
  };
}

/**
 * Fetch agent performance report
 * Requires: view-agent-performance permission
 */
export async function fetchAgentPerformance(filters?: ReportFilters): Promise<AgentPerformanceResponse> {
  const queryString = buildReportQueryString(filters);
  // apiRequest returns the raw response: { data: [...], meta: {...} }
  const response = await apiRequest<AgentPerformanceResponse>(`/reports/agent-performance${queryString}`, {
    method: 'GET',
  });

  // The response itself contains data and meta at the top level
  const result = response as unknown as AgentPerformanceResponse;
  return {
    data: result.data || [],
    meta: result.meta || { period: null, from: '', to: '' },
  };
}

/**
 * Fetch top agents report
 * Requires: view-top-agents permission
 */
export async function fetchTopAgents(filters?: ReportFilters): Promise<AgentPerformanceResponse> {
  const queryString = buildReportQueryString(filters);
  // apiRequest returns the raw response: { data: [...], meta: {...} }
  const response = await apiRequest<AgentPerformanceResponse>(`/reports/top-agents${queryString}`, {
    method: 'GET',
  });

  // The response itself contains data and meta at the top level
  const result = response as unknown as AgentPerformanceResponse;
  return {
    data: result.data || [],
    meta: result.meta || { period: null, from: '', to: '' },
  };
}

// ============================================
// Helper Functions
// ============================================

/**
 * Get vendor display name based on locale
 */
export function getVendorDisplayName(vendor: ReportVendor, locale: string): string {
  return locale === 'ar' ? vendor.name_ar : vendor.name_en;
}

/**
 * Get agent display name based on locale
 */
export function getAgentDisplayName(agent: ReportAgent, locale: string): string {
  return locale === 'ar' ? agent.name_ar : agent.name_en;
}

/**
 * Period options for UI
 */
export const REPORT_PERIODS: { value: ReportPeriod; labelKey: string }[] = [
  { value: 'all_time', labelKey: 'allTime' },
  { value: 'today', labelKey: 'today' },
  { value: 'yesterday', labelKey: 'yesterday' },
  { value: 'last_7_days', labelKey: 'last7Days' },
  { value: 'last_30_days', labelKey: 'last30Days' },
  { value: 'this_month', labelKey: 'thisMonth' },
  { value: 'last_month', labelKey: 'lastMonth' },
  { value: 'this_year', labelKey: 'thisYear' },
  { value: 'custom', labelKey: 'customRange' },
];
