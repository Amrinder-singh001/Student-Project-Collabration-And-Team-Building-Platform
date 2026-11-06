import { Link } from "@tanstack/react-router";
import { Users, Gauge, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { SkillBadge, SkillBadgeList } from "@/components/SkillBadge";
import { BookmarkButton } from "@/components/BookmarkButton";
import { initialsFrom } from "@/lib/avatar";
import type { DiscoveryProject } from "@/lib/discovery";

export const statusStyles: Record<string, string> = {
  Recruiting: "border-success/30 bg-success/15 text-success-foreground",
  "Team Formed": "border-primary/25 bg-primary/10 text-primary",
  "In Progress": "border-accent/40 bg-accent/15 text-accent-foreground",
  Completed: "border-border bg-muted text-muted-foreground",
};

export function DiscoveryCard({ project }: { project: DiscoveryProject }) {
  const ownerName = project.owner?.full_name ?? "Student";
  return (
    <Card className="card-hover h-full shadow-soft">
      <article className="flex h-full flex-col">
        <CardHeader className="gap-3">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{project.category}</p>
              <h3 className="mt-1 truncate text-lg font-bold">{project.title}</h3>
            </div>
            <SkillBadge size="sm" className={statusStyles[project.status] ?? ""}>
              {project.status}
            </SkillBadge>
          </div>
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{project.description}</p>
        </CardHeader>
        <CardContent className="flex-1 space-y-4">
          <SkillBadgeList skills={project.skills} max={4} variant="primary" />
          <dl className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
            <div className="flex min-w-0 items-center gap-1.5">
              <Users className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <dt className="sr-only">Team</dt>
              <dd className="truncate">
                {project.members}/{project.team_size} members
              </dd>
            </div>
            <div className="flex min-w-0 items-center gap-1.5">
              <Gauge className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <dt className="sr-only">Difficulty</dt>
              <dd className="truncate">{project.difficulty}</dd>
            </div>
          </dl>
        </CardContent>
        <CardFooter className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 border-t border-border pt-4">
          <div className="flex min-w-0 items-center gap-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold">
              {initialsFrom(ownerName)}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-xs font-medium">{ownerName}</span>
              <span className="block truncate text-[11px] text-muted-foreground">
                {project.owner?.college ?? "Project owner"}
              </span>
            </span>
          </div>
          <BookmarkButton projectId={project.id} />
          <Link
            to="/projects/$projectId"
            params={{ projectId: project.id }}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
          >
            View Project
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </CardFooter>
      </article>
    </Card>
  );
}
