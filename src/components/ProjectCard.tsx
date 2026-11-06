import { Link } from "@tanstack/react-router";
import { Users, Clock, MapPin, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { SkillBadgeList, SkillBadge } from "@/components/SkillBadge";
import type { Project, ProjectStatus } from "@/data/mock";

const statusStyles: Record<ProjectStatus, string> = {
  Recruiting: "border-success/30 bg-success/15 text-success-foreground",
  "In Progress": "border-accent/40 bg-accent/15 text-accent-foreground",
  Completed: "border-border bg-muted text-muted-foreground",
};

export function ProjectCard({ project }: { project: Project }) {
  const spots = project.teamSize - project.teamFilled;

  return (
    <Card className="card-hover h-full shadow-soft">
      <article>
        <CardHeader className="gap-3">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {project.category}
              </p>
              <h3 className="mt-1 truncate text-lg font-bold">{project.title}</h3>
            </div>
            <SkillBadge size="sm" className={statusStyles[project.status]}>
              {project.status}
            </SkillBadge>
          </div>
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {project.tagline}
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <SkillBadgeList skills={project.skills} max={4} variant="primary" />
          <dl className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
            <div className="flex min-w-0 items-center gap-1.5">
              <Users className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <dt className="sr-only">Team</dt>
              <dd className="truncate">
                {project.teamFilled}/{project.teamSize} members
              </dd>
            </div>
            <div className="flex min-w-0 items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <dt className="sr-only">Commitment</dt>
              <dd className="truncate">{project.commitment}</dd>
            </div>
            <div className="col-span-2 flex min-w-0 items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <dt className="sr-only">Location</dt>
              <dd className="truncate">
                {project.mode} · {project.college}
              </dd>
            </div>
          </dl>
        </CardContent>

        <CardFooter className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-border pt-4">
          <div className="flex min-w-0 items-center gap-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold">
              {project.owner.initials}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-xs font-medium">{project.owner.name}</span>
              <span className="block truncate text-[11px] text-muted-foreground">
                {spots > 0 ? `${spots} open spot${spots > 1 ? "s" : ""}` : "Team full"}
              </span>
            </span>
          </div>
          <Link
            to="/projects/$projectId"
            params={{ projectId: project.id }}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
          >
            View
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </CardFooter>
      </article>
    </Card>
  );
}
