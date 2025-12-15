"use client";

import { useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  Check,
  BellOff,
  X,
  Sparkles,
} from "lucide-react";
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationsAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
  getNotificationIconType,
  isRecentNotification,
  type Notification,
  type NotificationIconType,
} from "@/lib/services/notifications";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Link } from "@/i18n/routing";

// Icon mapping
const NOTIFICATION_ICONS: Record<NotificationIconType, typeof Package> = {
  order: Package,
  wallet: Wallet,
  user: User,
  alert: AlertTriangle,
  info: Info,
};

// Modern gradient-based color scheme for 2026 design
const NOTIFICATION_COLORS: Record<NotificationIconType, string> = {
  order: "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-500/25",
  wallet: "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-emerald-500/25",
  user: "bg-gradient-to-br from-violet-500 to-violet-600 text-white shadow-violet-500/25",
  alert: "bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-amber-500/25",
  info: "bg-gradient-to-br from-slate-500 to-slate-600 text-white shadow-slate-500/25",
};

export function NotificationsDropdown() {
  const t = useTranslations("notifications");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const isRtl = locale === "ar";

  // Fetch unread count (always active for badge)
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications-unread-count", locale],
    queryFn: fetchUnreadCount,
    refetchInterval: 30000,
  });

  // Fetch notifications only when panel is open
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ["notifications", locale, { unread_only: false, per_page: 50 }],
    queryFn: () => fetchNotifications({ unread_only: false, per_page: 50 }),
    enabled: isOpen,
  });

  const notifications = notificationsData?.data || [];

  // Group notifications by time
  const recentNotifications = notifications.filter((n) =>
    isRecentNotification(n.created_at)
  );
  const earlierNotifications = notifications.filter(
    (n) => !isRecentNotification(n.created_at)
  );

  // Mutations
  const markReadMutation = useMutation({
    mutationFn: markNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
    onError: () => toast.error(t("errorMarkingRead")),
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
      toast.success(t("markedAllRead"));
    },
    onError: () => toast.error(t("errorMarkingRead")),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
      toast.success(t("deleted"));
    },
    onError: () => toast.error(t("errorDeleting")),
  });

  const deleteAllMutation = useMutation({
    mutationFn: deleteAllNotifications,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
      toast.success(t("allDeleted"));
    },
    onError: () => toast.error(t("errorDeleting")),
  });

  // Format time ago
  const formatTimeAgo = useCallback(
    (dateString: string) => {
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
    },
    [t]
  );

  // Get notification link
  const getNotificationLink = (notification: Notification): string | null => {
    if (notification.data?.order_id) {
      return `/dashboard/orders/${notification.data.order_id}`;
    }
    return null;
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markReadMutation.mutate([notification.id]);
    }
    if (notification.data?.order_id) {
      setIsOpen(false);
    }
  };

  // Notification Item Component
  const NotificationItem = ({ notification }: { notification: Notification }) => {
    const iconType = getNotificationIconType(notification.type);
    const Icon = NOTIFICATION_ICONS[iconType];
    const colorClass = NOTIFICATION_COLORS[iconType];
    const link = getNotificationLink(notification);

    const content = (
      <div
        dir={isRtl ? "rtl" : "ltr"}
        className={cn(
          "group relative flex gap-4 p-4 transition-all duration-200 cursor-pointer",
          "hover:bg-muted/60 active:bg-muted/80",
          !notification.is_read && "bg-primary/[0.03]"
        )}
        onClick={() => handleNotificationClick(notification)}
      >
        {/* Unread indicator - glowing dot */}
        {!notification.is_read && (
          <div
            className={cn(
              "absolute top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary",
              "shadow-[0_0_8px_2px] shadow-primary/50",
              isRtl ? "end-2" : "start-2"
            )}
          />
        )}

        {/* Icon with gradient background */}
        <div
          className={cn(
            "relative h-11 w-11 rounded-xl flex items-center justify-center shrink-0",
            "shadow-lg transition-transform duration-200 group-hover:scale-105",
            colorClass
          )}
        >
          <Icon className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          <p
            className={cn(
              "text-sm leading-snug line-clamp-1",
              !notification.is_read ? "font-semibold" : "font-medium"
            )}
          >
            {notification.title}
          </p>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {notification.body}
          </p>
          <p className="text-xs text-muted-foreground/70 font-medium">
            {formatTimeAgo(notification.created_at)}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {!notification.is_read && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                markReadMutation.mutate([notification.id]);
              }}
              title={t("markAsRead")}
            >
              <Check className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              deleteMutation.mutate(notification.id);
            }}
            title={t("delete")}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );

    if (link) {
      return (
        <Link href={link} className="block">
          {content}
        </Link>
      );
    }

    return content;
  };

  // Notification Group Component
  const NotificationGroup = ({
    title,
    items,
  }: {
    title: string;
    items: Notification[];
  }) => {
    if (items.length === 0) return null;

    return (
      <div>
        <div
          dir={isRtl ? "rtl" : "ltr"}
          className="sticky top-0 z-10 px-4 py-2.5 bg-background/95 backdrop-blur-sm border-b"
        >
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {title}
          </span>
        </div>
        <div className="divide-y divide-border/50">
          {items.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className={cn("h-5 w-5 transition-transform", isOpen && "scale-110")} />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className={cn(
              "absolute -top-1 h-5 min-w-5 px-1.5 flex items-center justify-center",
              "text-[10px] font-bold animate-in zoom-in-50 duration-200",
              isRtl ? "-start-1" : "-end-1"
            )}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
        <span className="sr-only">{t("title")}</span>
      </Button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Panel */}
      {isOpen && (
        <div
          dir={isRtl ? "rtl" : "ltr"}
          className={cn(
            "fixed inset-y-0 z-50 w-full sm:w-[420px] bg-background shadow-2xl",
            "animate-in duration-300 ease-out",
            isRtl
              ? "left-0 border-e slide-in-from-left"
              : "right-0 border-s slide-in-from-right"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-4 px-4 py-4 border-b bg-gradient-to-b from-muted/50 to-transparent">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 hover:bg-muted"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-semibold">{t("title")}</h2>
                {unreadCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 text-primary hover:bg-primary/20"
                  >
                    {t("unreadCount", { count: unreadCount })}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Actions Bar */}
          {notifications.length > 0 && (
            <div className="flex items-center justify-between px-4 py-2.5 border-b bg-muted/30">
              {unreadCount > 0 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-2 text-xs font-medium hover:bg-primary/10 hover:text-primary"
                  onClick={() => markAllReadMutation.mutate()}
                  disabled={markAllReadMutation.isPending}
                >
                  {markAllReadMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCheck className="h-3.5 w-3.5" />
                  )}
                  {t("markAllRead")}
                </Button>
              ) : (
                <div />
              )}

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-2 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {t("deleteAll")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("deleteAll")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("deleteAllConfirm")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteAllMutation.mutate()}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleteAllMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        t("delete")
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}

          {/* Content */}
          <ScrollArea className="h-[calc(100vh-140px)]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="relative">
                  <div className="h-12 w-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                </div>
                <p className="text-sm text-muted-foreground">{t("loading") || "Loading..."}</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="relative mb-6">
                  <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                    <BellOff className="h-10 w-10 text-muted-foreground/50" />
                  </div>
                  <div className="absolute -top-1 -end-1 h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                    <Sparkles className="h-3.5 w-3.5 text-white" />
                  </div>
                </div>
                <h3 className="font-semibold text-lg mb-1">{t("noNotifications")}</h3>
                <p className="text-sm text-muted-foreground max-w-[260px]">
                  {t("noNotificationsDesc")}
                </p>
              </div>
            ) : (
              <div>
                <NotificationGroup title={t("new")} items={recentNotifications} />
                <NotificationGroup title={t("earlier")} items={earlierNotifications} />
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
