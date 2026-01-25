/**
 * Tracking Service
 * Uses X-Tracking-Key header for authentication
 */

import { getCurrentLocale } from '../api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';
const TRACKING_API_KEY = process.env.NEXT_PUBLIC_TRACKING_API_KEY || '';

export interface TrackingStep {
  key: string;
  label: string;
  description: string;
  completed: boolean;
  current: boolean;
  timestamp: string | null;
  location?: {
    latitude: number;
    longitude: number;
  } | null;
}

export interface StatusHistoryItem {
  status: string;
  status_label: string;
  timestamp: string;
}

export interface TrackingData {
  track_number: string;
  order_number: string;
  status: string;
  status_label: string;
  tracking_steps: TrackingStep[];
  current_phase: {
    phase: string;
    label: string;
    progress: number;
  };
  is_completed: boolean;
  is_failed: boolean;
  vendor: {
    name_en: string;
    name_ar: string;
  };
  delivery_address: {
    address: string;
    address_notes: string;
    city: {
      name_en: string;
      name_ar: string;
    };
    governorate: {
      name_en: string;
      name_ar: string;
    };
    full_address: string;
  };
  created_at: string;
  updated_at: string;
  status_history: StatusHistoryItem[];
}

export interface TrackingResponse {
  data: TrackingData;
}

/**
 * Fetch tracking information by tracking number
 */
export async function fetchTracking(trackingNumber: string): Promise<TrackingData> {
  const url = `${API_BASE_URL}/track/${trackingNumber}`;

  const locale = getCurrentLocale();

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Accept-Language': locale,
      'Content-Type': 'application/json',
      'X-Locale': locale,
      'X-Tracking-Key': TRACKING_API_KEY,
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Order not found');
    }
    throw new Error('Failed to fetch tracking information');
  }

  const result: TrackingResponse = await response.json();
  return result.data;
}
