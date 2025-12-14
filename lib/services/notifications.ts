import { apiRequest } from '../api';

export interface NotificationData {
  order_id?: number;
  order_number?: string;
  vendor_id?: number;
  vendor_name?: string;
  user_id?: number;
  user_name?: string;
  amount?: number;
  [key: string]: unknown;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: NotificationData | null;
  read_at: string | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationsResponse {
  data: Notification[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface UnreadCountResponse {
  unread_count: number;
}

export interface NotificationFilters {
  unread_only?: boolean;
  page?: number;
  per_page?: number;
}

export async function fetchNotifications(filters?: NotificationFilters): Promise<NotificationsResponse> {
  const params = new URLSearchParams();

  if (filters?.unread_only) {
    params.append('unread_only', 'true');
  }
  if (filters?.page) {
    params.append('page', filters.page.toString());
  }
  if (filters?.per_page) {
    params.append('per_page', filters.per_page.toString());
  }

  const queryString = params.toString();
  const endpoint = `/notifications${queryString ? `?${queryString}` : ''}`;

  const response = await apiRequest<NotificationsResponse>(endpoint, { method: 'GET' });
  return response as unknown as NotificationsResponse;
}

export async function fetchUnreadCount(): Promise<number> {
  const response = await apiRequest<UnreadCountResponse>('/notifications/unread-count', { method: 'GET' });
  const result = response as unknown as UnreadCountResponse;
  return result.unread_count;
}

export async function markNotificationsAsRead(notificationIds: string[]): Promise<void> {
  await apiRequest('/notifications/mark-read', {
    method: 'POST',
    body: JSON.stringify({ notification_ids: notificationIds }),
  });
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await apiRequest('/notifications/mark-all-read', {
    method: 'POST',
  });
}

export async function deleteNotification(id: string): Promise<void> {
  await apiRequest(`/notifications/${id}`, {
    method: 'DELETE',
  });
}

export async function deleteAllNotifications(): Promise<void> {
  await apiRequest('/notifications', {
    method: 'DELETE',
  });
}

// Helper function to get notification icon type based on notification type
export function getNotificationIconType(type: string): 'order' | 'wallet' | 'user' | 'alert' | 'info' {
  if (type.includes('order')) return 'order';
  if (type.includes('wallet') || type.includes('payment') || type.includes('settlement')) return 'wallet';
  if (type.includes('user') || type.includes('vendor') || type.includes('agent')) return 'user';
  if (type.includes('alert') || type.includes('warning') || type.includes('error')) return 'alert';
  return 'info';
}
