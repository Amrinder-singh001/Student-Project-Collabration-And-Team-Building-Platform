import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Bell, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { listNotifications, markAllNotificationsRead, markNotificationRead, notificationTime } from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function NotificationBell() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["notifications", user?.id] as const;
  const { data = [] } = useQuery({
    queryKey,
    queryFn: () => {
      if (!user) throw new Error("Sign in to view notifications.");
      return listNotifications(user.id);
    },
    enabled: Boolean(user),
    refetchInterval: 30_000,
  });
  const unread = data.filter((notification) => !notification.read_at).length;
  const markRead = useMutation({
    mutationFn: ({ id, read }: { id: string; read: boolean }) => markNotificationRead(id, read),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey }),
    onError: () => toast.error("Could not update notification."),
  });
  const markAllRead = useMutation({
    mutationFn: () => {
      if (!user) throw new Error("Sign in to update notifications.");
      return markAllNotificationsRead(user.id);
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey }),
    onError: () => toast.error("Could not update notifications."),
  });

  if (!user) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}>
          <Bell aria-hidden="true" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(24rem,calc(100vw-2rem))] p-0">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <p className="font-semibold">Notifications</p>
            <p className="text-xs text-muted-foreground">{unread} unread</p>
          </div>
          {unread > 0 && (
            <Button variant="ghost" size="sm" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
              <CheckCheck aria-hidden="true" /> Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {data.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">You're all caught up.</p>
          ) : (
            <ul className="divide-y divide-border">
              {data.slice(0, 6).map((notification) => (
                <li key={notification.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 px-4 py-3">
                  <div className="flex min-w-0 gap-2">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notification.read_at ? "bg-muted" : "bg-primary"}`} aria-label={notification.read_at ? "Read" : "Unread"} />
                    <div className="min-w-0">
                      {notification.project_id ? (
                        <Link
                          to="/projects/$projectId"
                          params={{ projectId: notification.project_id }}
                          onClick={() => {
                            if (!notification.read_at) markRead.mutate({ id: notification.id, read: true });
                          }}
                          className="text-sm leading-snug hover:text-primary"
                        >
                          {notification.message}
                        </Link>
                      ) : <p className="text-sm leading-snug">{notification.message}</p>}
                      <p className="mt-1 text-xs text-muted-foreground">{notificationTime(notification.created_at)}</p>
                    </div>
                  </div>
                  {!notification.read_at && (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Mark as read"
                      title="Mark as read"
                      onClick={() => markRead.mutate({ id: notification.id, read: true })}
                    >
                      <CheckCheck aria-hidden="true" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="border-t border-border p-2">
          <Button asChild variant="ghost" className="w-full">
            <Link to="/notifications">View all notifications</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}