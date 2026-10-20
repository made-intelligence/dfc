"use client";

import { useState, useEffect } from "react";
import { Bell, Check, Info, AlertTriangle, XCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "@/lib/navigation";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    const load = () =>
      fetch("/api/notifications")
        .then((response) => (response.ok ? response.json() : null))
        .then((data: Notification[] | null) => {
          if (cancelled || !data) return;
          setNotifications(data);
          setUnreadCount(data.filter((n) => !n.isRead).length);
        })
        .catch((error) => console.error("Failed to fetch notifications:", error));

    load();
    // Poll every 30 seconds
    const interval = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [userId]);

  const markAsRead = async (notification: Notification) => {
    // Navigate regardless of whether the read-receipt succeeds.
    if (notification.link) {
      setOpen(false);
      router.push(notification.link);
    }
    if (notification.isRead) return;
    try {
      const res = await fetch(`/api/notifications/${notification.id}/read`, { method: "POST" });
      if (!res.ok) return;
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.isRead);
    const results = await Promise.allSettled(
      unread.map((n) => fetch(`/api/notifications/${n.id}/read`, { method: "POST" }))
    );
    const done = new Set(
      unread.filter((_, i) => {
        const r = results[i];
        return r.status === "fulfilled" && r.value.ok;
      }).map((n) => n.id)
    );
    setNotifications((prev) => prev.map((n) => (done.has(n.id) ? { ...n, isRead: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - done.size));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-600 border-2 border-white" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <button
              type="button"
              className="text-xs font-normal text-blue-600 hover:underline"
              onClick={markAllAsRead}
            >
              Mark all read ({unreadCount})
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            <div className="flex flex-col gap-1 p-1">
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn(
                    "flex flex-col items-start gap-1 p-3 cursor-pointer",
                    !notification.isRead && "bg-blue-50"
                  )}
                  onClick={() => markAsRead(notification)}
                >
                  <div className="flex items-center gap-2 w-full">
                    {getIcon(notification.type)}
                    <span className={cn("text-sm font-medium flex-1", !notification.isRead && "text-blue-700")}>
                      {notification.title}
                    </span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 pl-6">
                    {notification.message}
                  </p>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
