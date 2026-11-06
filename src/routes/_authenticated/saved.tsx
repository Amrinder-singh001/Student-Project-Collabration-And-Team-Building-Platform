import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bookmark, Compass } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { DiscoveryCard } from "@/components/DiscoveryCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listSavedProjects } from "@/lib/discovery";

export const Route = createFileRoute("/_authenticated/saved")({
  head: () => ({
    meta: [
      { title: "Saved projects — ProjectConnect" },
      { name: "description", content: "Return to the student projects you've bookmarked on ProjectConnect." },
      { property: "og:title", content: "Saved projects — ProjectConnect" },
      { property: "og:description", content: "Your bookmarked student projects." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SavedProjectsPage,
});

function SavedProjectsPage() {
  const { user } = useAuth();
  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: ["saved-projects", user?.id],
    queryFn: () => {
      if (!user) throw new Error("Sign in to view saved projects.");
      return listSavedProjects(user.id);
    },
    enabled: Boolean(user),
  });

  return (
    <div className="container-page py-10 sm:py-12">
      <header className="border-b border-border pb-6">
        <p className="flex items-center gap-2 text-sm font-medium text-primary"><Bookmark className="h-4 w-4" aria-hidden="true" /> Your collection</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Saved projects</h1>
        <p className="mt-2 text-muted-foreground">Projects you're keeping an eye on.</p>
      </header>
      {isLoading ? (
        <p className="py-10 text-sm text-muted-foreground">Loading your saved projects…</p>
      ) : error ? (
        <p role="alert" className="py-10 text-sm text-destructive">Could not load saved projects. Please refresh the page.</p>
      ) : projects.length ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 2xl:grid-cols-3">
          {projects.map((project) => <DiscoveryCard key={project.id} project={project} />)}
        </div>
      ) : (
        <Card className="mt-8 border-dashed shadow-none">
          <CardContent className="flex flex-col items-center py-14 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-secondary text-primary"><Bookmark className="h-5 w-5" aria-hidden="true" /></span>
            <h2 className="mt-4 text-lg font-semibold">No saved projects yet</h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">Bookmark a project that interests you and it will be waiting here.</p>
            <Button asChild className="mt-5"><Link to="/projects"><Compass aria-hidden="true" /> Explore projects</Link></Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}