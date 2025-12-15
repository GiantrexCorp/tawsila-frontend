import { apiRequest } from "../api";

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

// GET /notifications
export async function fetchNotifications(
  filters?: NotificationFilters
): Promise<NotificationsResponse> {
  const params = new URLSearchParams();

  if (filters?.unread_only) {
    params.append("unread_only", "true");
  }
  if (filters?.page) {
    params.append("page", filters.page.toString());
  }
  if (filters?.per_page) {
    params.append("per_page", filters.per_page.toString());
  }

  const queryString = params.toString();
  const endpoint = `/notifications${queryString ? `?${queryString}` : ""}`;

  const response = await apiRequest<NotificationsResponse>(endpoint, {
    method: "GET",
  });
  return response as unknown as NotificationsResponse;
}

// GET /notifications/unread-count
export async function fetchUnreadCount(): Promise<number> {
  const response = await apiRequest<UnreadCountResponse>(
    "/notifications/unread-count",
    { method: "GET" }
  );
  const result = response as unknown as UnreadCountResponse;
  return result.unread_count;
}

// POST /notifications/mark-read
export async function markNotificationsAsRead(
  notificationIds: string[]
): Promise<void> {
  await apiRequest("/notifications/mark-read", {
    method: "POST",
    body: JSON.stringify({ notification_ids: notificationIds }),
  });
}

// POST /notifications/mark-all-read
export async function markAllNotificationsAsRead(): Promise<void> {
  await apiRequest("/notifications/mark-all-read", {
    method: "POST",
  });
}

// DELETE /notifications/{id}
export async function deleteNotification(id: string): Promise<void> {
  await apiRequest(`/notifications/${id}`, {
    method: "DELETE",
  });
}

// DELETE /notifications
export async function deleteAllNotifications(): Promise<void> {
  await apiRequest("/notifications", {
    method: "DELETE",
  });
}

export type NotificationIconType =
  | "order"
  | "wallet"
  | "user"
  | "alert"
  | "info";

export function getNotificationIconType(type: string): NotificationIconType {
  if (type.includes("order")) return "order";
  if (
    type.includes("wallet") ||
    type.includes("payment") ||
    type.includes("settlement")
  )
    return "wallet";
  if (
    type.includes("user") ||
    type.includes("vendor") ||
    type.includes("agent")
  )
    return "user";
  if (
    type.includes("alert") ||
    type.includes("warning") ||
    type.includes("error")
  )
    return "alert";
  return "info";
}

export function isRecentNotification(createdAt: string): boolean {
  const date = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / 3600000;
  return diffHours < 24;
}
