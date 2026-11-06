import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { listNotifications, markAllNotificationsRead, markNotificationRead, notificationTime } from "@/lib/notifications";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — ProjectConnect" },
      { name: "description", content: "Updates about your applications, project teams and tasks on ProjectConnect." },
      { property: "og:title", content: "Notifications — ProjectConnect" },
      { property: "og:description", content: "Your ProjectConnect activity updates." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["notifications", user?.id] as const;
  const { data = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: () => {
      if (!user) throw new Error("Sign in to view notifications.");
      return listNotifications(user.id);
    },
    enabled: Boolean(user),
  });
  const unread = data.filter((notification) => !notification.read_at).length;
  const updateRead = useMutation({
    mutationFn: ({ id, read }: { id: string; read: boolean }) => markNotificationRead(id, read),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey }),
    onError: () => toast.error("Could not update notification."),
  });
  const updateAll = useMutation({
    mutationFn: () => {
      if (!user) throw new Error("Sign in to update notifications.");
      return markAllNotificationsRead(user.id);
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey }),
    onError: () => toast.error("Could not update notifications."),
  });

  return (
    <div className="container-page py-10 sm:py-12">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium text-primary"><Bell className="h-4 w-4" aria-hidden="true" /> Your activity</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Notifications</h1>
          <p className="mt-2 text-muted-foreground">{unread} unread update{unread === 1 ? "" : "s"}</p>
        </div>
        {unread > 0 && <Button variant="outline" onClick={() => updateAll.mutate()} disabled={updateAll.isPending}><CheckCheck aria-hidden="true" /> Mark all as read</Button>}
      </header>
      {isLoading ? (
        <p className="py-10 text-sm text-muted-foreground">Loading notifications…</p>
      ) : error ? (
        <p role="alert" className="py-10 text-sm text-destructive">Could not load notifications. Please refresh the page.</p>
      ) : data.length === 0 ? (
        <div className="py-16 text-center">
          <p className="font-semibold">You're all caught up</p>
          <p className="mt-2 text-sm text-muted-foreground">Project and team updates will appear here.</p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {data.map((notification) => (
            <li key={notification.id} className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-5 ${notification.read_at ? "" : "bg-primary/[0.035]"}`}>
              <div className="flex min-w-0 gap-3">
                <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${notification.read_at ? "bg-muted" : "bg-primary"}`} aria-label={notification.read_at ? "Read" : "Unread"} />
                <div className="min-w-0">
                  {notification.project_id ? (
                    <Link
                      to="/projects/$projectId"
                      params={{ projectId: notification.project_id }}
                      onClick={() => { if (!notification.read_at) updateRead.mutate({ id: notification.id, read: true }); }}
                      className="font-medium hover:text-primary"
                    >{notification.message}</Link>
                  ) : <p className="font-medium">{notification.message}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">{notificationTime(notification.created_at)}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateRead.mutate({ id: notification.id, read: !notification.read_at })}
                disabled={updateRead.isPending}
                aria-label={notification.read_at ? "Mark as unread" : "Mark as read"}
              >
                {notification.read_at ? "Mark unread" : <><CheckCheck aria-hidden="true" /> Mark read</>}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}