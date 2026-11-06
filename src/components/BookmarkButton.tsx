import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Bookmark } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { listBookmarks, setBookmark } from "@/lib/discovery";
import { cn } from "@/lib/utils";

export function useBookmarks() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["bookmarks", user?.id],
    queryFn: () => {
      if (!user) throw new Error("Sign in to view bookmarks.");
      return listBookmarks(user.id);
    },
    enabled: !!user,
  });
}

export function BookmarkButton({ projectId, withLabel, className }: { projectId: string; withLabel?: boolean; className?: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data = [] } = useBookmarks();
  const saved = data.includes(projectId);
  const m = useMutation({
    mutationFn: () => {
      if (!user) throw new Error("Sign in to bookmark projects.");
      return setBookmark(user.id, projectId, !saved);
    },
    onSuccess: () => {
      qc.setQueryData<string[]>(["bookmarks", user?.id], (prev = []) =>
        saved ? prev.filter((id) => id !== projectId) : [...prev, projectId],
      );
      void qc.invalidateQueries({ queryKey: ["saved-projects", user?.id] });
      toast.success(saved ? "Removed from bookmarks" : "Saved to bookmarks");
    },
    onError: () => toast.error("Could not update bookmark. Please try again."),
  });

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? "Remove bookmark" : "Bookmark project"}
      disabled={m.isPending}
      onClick={() => {
        if (!user) {
          toast.info("Log in to bookmark projects.");
          navigate({ to: "/login" });
          return;
        }
        m.mutate();
      }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-border px-2.5 py-2 text-sm font-medium transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60",
        saved && "border-primary/30 bg-primary/10 text-primary",
        className,
      )}
    >
      <Bookmark className={cn("h-4 w-4", saved && "fill-current")} aria-hidden="true" />
      {withLabel && (saved ? "Bookmarked" : "Save for later")}
    </button>
  );
}
