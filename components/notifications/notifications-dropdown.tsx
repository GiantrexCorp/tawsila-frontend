"use client";

import { useState } from "react";
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

const NOTIFICATION_ICONS: Record<NotificationIconType, typeof Package> = {
  order: Package,
  wallet: Wallet,
  user: User,
  alert: AlertTriangle,
  info: Info,
};

const NOTIFICATION_COLORS: Record<NotificationIconType, string> = {
  order: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  wallet: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
  user: "bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400",
  alert: "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
  info: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

export function NotificationsDropdown() {
  const t = useTranslations("notifications");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const isRtl = locale === "ar";

  // Fetch unread count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications-unread-count", locale],
    queryFn: fetchUnreadCount,
    refetchInterval: 30000,
  });

  // Fetch notifications when panel is open
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ["notifications", locale, { unread_only: false, per_page: 20 }],
    queryFn: () => fetchNotifications({ unread_only: false, per_page: 20 }),
    enabled: isOpen,
  });

  const notifications = notificationsData?.data || [];

  // Group notifications
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
    if (notification.data?.order_id) {
      setIsOpen(false);
    }
  };

  const getNotificationLink = (notification: Notification): string | null => {
    if (notification.data?.order_id) {
      return `/dashboard/orders/${notification.data.order_id}`;
    }
    return null;
  };

  const NotificationItem = ({ notification }: { notification: Notification }) => {
    const iconType = getNotificationIconType(notification.type);
    const Icon = NOTIFICATION_ICONS[iconType];
    const colorClass = NOTIFICATION_COLORS[iconType];
    const link = getNotificationLink(notification);

    const content = (
      <div
        className={cn(
          "group relative flex items-start gap-4 p-4 transition-colors cursor-pointer",
          "hover:bg-muted/50",
          !notification.is_read && "bg-primary/5",
          isRtl && "flex-row-reverse text-right"
        )}
        onClick={() => handleNotificationClick(notification)}
      >
        {/* Unread indicator */}
        {!notification.is_read && (
          <div className={cn(
            "absolute top-5 h-2 w-2 rounded-full bg-primary",
            isRtl ? "right-1.5" : "left-1.5"
          )} />
        )}

        {/* Icon */}
        <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0", colorClass)}>
          <Icon className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className={cn("flex-1 min-w-0 space-y-1", isRtl && "text-right")}>
          <p className={cn("text-sm leading-snug", !notification.is_read ? "font-semibold" : "font-medium")}>
            {notification.title}
          </p>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {notification.body}
          </p>
          <p className="text-xs text-muted-foreground/60">
            {formatTimeAgo(notification.created_at)}
          </p>
        </div>

        {/* Actions */}
        <div className={cn("flex items-center gap-1", isRtl && "flex-row-reverse")}>
          {!notification.is_read && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
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
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
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

  const NotificationGroup = ({ title, items }: { title: string; items: Notification[] }) => {
    if (items.length === 0) return null;

    return (
      <div>
        <div className={cn("px-4 py-2", isRtl && "text-right")}>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {title}
          </span>
        </div>
        <div className="divide-y divide-border">
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
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -end-1 h-5 min-w-5 px-1 flex items-center justify-center text-[10px] font-bold"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
        <span className="sr-only">{t("title")}</span>
      </Button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Panel */}
      {isOpen && (
        <div
          dir={isRtl ? "rtl" : "ltr"}
          className={cn(
            "fixed inset-y-0 z-50 w-full sm:w-[400px] bg-background shadow-2xl",
            "animate-in duration-300",
            isRtl
              ? "left-0 border-r slide-in-from-left"
              : "right-0 border-l slide-in-from-right"
          )}
        >
          {/* Header */}
          <div className={cn("flex items-center justify-between gap-4 px-4 py-4 border-b", isRtl && "flex-row-reverse")}>
            <div className={cn("flex items-center gap-3", isRtl && "flex-row-reverse")}>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
              <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
                <h2 className="text-lg font-semibold">{t("title")}</h2>
                {unreadCount > 0 && (
                  <Badge variant="secondary">{t("unreadCount", { count: unreadCount })}</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Actions Bar */}
          {notifications.length > 0 && (
            <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/40">
              {unreadCount > 0 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-2 text-xs"
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
                    className="h-8 gap-2 text-xs text-muted-foreground hover:text-destructive"
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
          <ScrollArea className="h-[calc(100vh-130px)]">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <BellOff className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg">{t("noNotifications")}</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-[240px]">
                  {t("noNotificationsDesc")}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
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
