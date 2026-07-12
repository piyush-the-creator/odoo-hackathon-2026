// components/notifications/NotificationCenter.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Check, CheckCheck } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  actionUrl: string | null;
  createdAt: string;
}

const typeIcons: Record<string, string> = {
  INFO: "ℹ️",
  SUCCESS: "✅",
  WARNING: "⚠️",
  ERROR: "❌",
};

export function NotificationCenter() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications");
      if (!response.ok) throw new Error("Failed to fetch notifications");
      const data = await response.json();
      setNotifications(data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications/unread");
      if (!response.ok) throw new Error("Failed to fetch unread count");
      const data = await response.json();
      setUnreadCount(data.count || 0);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [session, fetchNotifications, fetchUnreadCount]);

  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
      });
      if (!response.ok) throw new Error("Failed to mark as read");

      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, isRead: true } : n
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications/read-all", {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to mark all as read");

      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error("Failed to mark all as read");
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger render={
        <Button variant="ghost" size="icon" className="relative rounded-full cursor-pointer">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-red-500 p-0 text-xs text-white flex items-center justify-center">
              {unreadCount}
            </Badge>
          )}
        </Button>
      } />
      <PopoverContent className="w-90 p-0" align="end">
        <div className="flex items-center justify-between border-b p-3 bg-slate-50/50">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs h-7 px-2"
            >
              <CheckCheck className="mr-1 h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[350px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-xs">
              <Bell className="mx-auto h-8 w-8 opacity-40 mb-2" />
              <p>No new notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 text-xs transition-colors ${
                    notification.isRead
                      ? "bg-white"
                      : "bg-blue-50/50"
                  } hover:bg-slate-50`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="text-base leading-none shrink-0">
                      {typeIcons[notification.type] || "ℹ️"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={notification.actionUrl || "#"}
                        onClick={() => {
                          if (!notification.isRead) {
                            handleMarkAsRead(notification.id);
                          }
                          setIsOpen(false);
                        }}
                        className="block space-y-0.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold truncate text-slate-800">{notification.title}</span>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {format(new Date(notification.createdAt), "MMM d, HH:mm")}
                          </span>
                        </div>
                        <p className="text-slate-600 leading-normal">{notification.message}</p>
                      </Link>
                    </div>
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
