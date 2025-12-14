"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  CheckCheck,
  Package,
  Wallet,
  User,
  AlertTriangle,
  Info,
  Trash2,
  Loader2,
} from "lucide-react";
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationsAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getNotificationIconType,
  type Notification,
} from "@/lib/services/notifications";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Link } from "@/i18n/routing";

const NOTIFICATION_ICONS = {
  order: Package,
  wallet: Wallet,
  user: User,
  alert: AlertTriangle,
  info: Info,
};

const NOTIFICATION_COLORS = {
  order: "bg-blue-500/10 text-blue-500",
  wallet: "bg-emerald-500/10 text-emerald-500",
  user: "bg-purple-500/10 text-purple-500",
  alert: "bg-amber-500/10 text-amber-500",
  info: "bg-slate-500/10 text-slate-500",
};

export function NotificationsDropdown() {
  const t = useTranslations("notifications");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  // Fetch unread count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: fetchUnreadCount,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch notifications when dropdown is open
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ["notifications", { unread_only: false, per_page: 10 }],
    queryFn: () => fetchNotifications({ unread_only: false, per_page: 10 }),
    enabled: isOpen,
  });

  const notifications = notificationsData?.data || [];

  // Mark as read mutation
  const markReadMutation = useMutation({
    mutationFn: markNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
    onError: () => {
      toast.error(t("errorMarkingRead"));
    },
  });

  // Mark all as read mutation
  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
      toast.success(t("markedAllRead"));
    },
    onError: () => {
      toast.error(t("errorMarkingRead"));
    },
  });

  // Delete notification mutation
  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
      toast.success(t("deleted"));
    },
    onError: () => {
      toast.error(t("errorDeleting"));
    },
  });

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t("justNow");
    if (diffMins < 60) return t("minutesAgo", { count: diffMins });
    if (diffHours < 24) return t("hoursAgo", { count: diffHours });
    return t("daysAgo", { count: diffDays });
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markReadMutation.mutate([notification.id]);
    }
    // Navigate based on notification type
    if (notification.data?.order_id) {
      // Will navigate to order
      setIsOpen(false);
    }
  };

  const getNotificationLink = (notification: Notification): string | null => {
    if (notification.data?.order_id) {
      return `/dashboard/orders/${notification.data.order_id}`;
    }
    return null;
  };

  const renderNotificationItem = (notification: Notification) => {
    const iconType = getNotificationIconType(notification.type);
    const Icon = NOTIFICATION_ICONS[iconType];
    const colorClass = NOTIFICATION_COLORS[iconType];
    const link = getNotificationLink(notification);

    const content = (
      <div
        className={cn(
          "flex gap-3 p-3 rounded-lg transition-colors cursor-pointer",
          !notification.is_read
            ? "bg-primary/5 hover:bg-primary/10"
            : "hover:bg-muted/50"
        )}
        onClick={() => handleNotificationClick(notification)}
      >
        <div
          className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0",
            colorClass
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p
                className={cn(
                  "text-sm font-medium truncate",
                  !notification.is_read && "font-semibold"
                )}
              >
                {notification.title}
              </p>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                {notification.body}
              </p>
            </div>
            {!notification.is_read && (
              <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {formatTimeAgo(notification.created_at)}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            deleteMutation.mutate(notification.id);
          }}
        >
          <Trash2 className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
    );

    if (link) {
      return (
        <Link key={notification.id} href={link} className="group block">
          {content}
        </Link>
      );
    }

    return (
      <div key={notification.id} className="group">
        {content}
      </div>
    );
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -end-1 h-5 min-w-5 px-1 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
          <span className="sr-only">{t("title")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={locale === "ar" ? "start" : "end"}
        className="w-80 md:w-96"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{t("title")}</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {t("unreadCount", { count: unreadCount })}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
            >
              {markAllReadMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin me-1" />
              ) : (
                <CheckCheck className="h-3 w-3 me-1" />
              )}
              {t("markAllRead")}
            </Button>
          )}
        </div>

        <DropdownMenuSeparator />

        {/* Notifications List */}
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Bell className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="font-medium">{t("noNotifications")}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {t("noNotificationsDesc")}
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {notifications.map(renderNotificationItem)}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
