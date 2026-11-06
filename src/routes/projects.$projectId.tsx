import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Users, Gauge, CalendarDays, CalendarPlus, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SkillBadge, SkillBadgeList } from "@/components/SkillBadge";
import { BookmarkButton } from "@/components/BookmarkButton";
import { statusStyles } from "@/components/DiscoveryCard";
import { discoveryProjectQuery } from "@/lib/discovery";
import { getTaskStats, progressFromStats } from "@/lib/tasks";
import { PROJECT_STATUSES } from "@/lib/projects";
import { initialsFrom } from "@/lib/avatar";
import { ApplyPanel } from "@/components/ApplyPanel";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/projects/$projectId")({
  head: () => ({
    meta: [
      { title: "Project details — ProjectConnect" },
      { name: "description", content: "See the full description, skills, team and progress of this student project." },
      { property: "og:title", content: "Project details — ProjectConnect" },
      { property: "og:description", content: "Full description, required skills, team and progress of a student project." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProjectDetailsPage,
});

function ProjectDetailsPage() {
  const { projectId } = Route.useParams();
  const { user } = useAuth();
  const { data: project, isLoading, error } = useQuery(discoveryProjectQuery(projectId));
  const { data: taskStats = null } = useQuery({
    queryKey: ["project-task-stats", projectId],
    queryFn: async () => (await getTaskStats([projectId]))[0] ?? null,
  });

  const back = (
    <Link
      to="/projects"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Back to projects
    </Link>
  );

  if (isLoading)
    return (
      <div className="container-page py-8 lg:py-12">
        {back}
        <div className="mt-6 h-72 animate-pulse rounded-3xl bg-secondary" />
      </div>
    );

  if (error || !project)
    return (
      <div className="container-page py-16 text-center">
        <h1 className="text-2xl font-bold">Project not found</h1>
        <p className="mt-2 text-muted-foreground">It may have been removed by its owner.</p>
        <div className="mt-6">{back}</div>
      </div>
    );

  const ownerName = project.owner?.full_name ?? "Student";
  const created = new Date(project.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  const stageIndex = PROJECT_STATUSES.indexOf(project.status as (typeof PROJECT_STATUSES)[number]);
  const spots = project.team_size - project.members;
  const isOwner = user?.id === project.owner_id;
  const taskTotal = taskStats?._total ?? 0;
  const taskCompleted = taskStats?._completed ?? 0;
  const progress = progressFromStats(taskStats, project.progress);

  return (
    <div className="container-page py-8 lg:py-12">
      {back}
      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <article className="min-w-0 space-y-8">
          <header className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <SkillBadge variant="primary">{project.category}</SkillBadge>
              <SkillBadge className={statusStyles[project.status] ?? ""}>{project.status}</SkillBadge>
            </div>
            <h1 className="mt-4 text-3xl font-bold sm:text-4xl">{project.title}</h1>
            <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: Users, label: "Team", value: `${project.members}/${project.team_size} members` },
                { icon: Gauge, label: "Difficulty", value: project.difficulty },
                { icon: CalendarDays, label: "Duration", value: project.duration },
                { icon: CalendarPlus, label: "Created", value: created },
              ].map((item) => (
                <div key={item.label} className="min-w-0 rounded-xl bg-secondary/60 p-3">
                  <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <item.icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {item.label}
                  </dt>
                  <dd className="mt-1 truncate text-sm font-semibold">{item.value}</dd>
                </div>
              ))}
            </dl>
          </header>

          <section aria-labelledby="overview">
            <h2 id="overview" className="text-xl font-bold">About this project</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-muted-foreground">{project.description}</p>
            <h3 className="mt-6 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Required skills</h3>
            <SkillBadgeList className="mt-3" skills={project.skills} variant="primary" />
            {project.additional_info && (
              <>
                <h3 className="mt-6 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Additional information
                </h3>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {project.additional_info}
                </p>
              </>
            )}
          </section>

          <section aria-labelledby="progress">
            <h2 id="progress" className="text-xl font-bold">Project progress</h2>
            <div className="mt-4 rounded-2xl border border-border bg-card p-6 shadow-soft">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                <Progress value={progress} aria-label="Project progress" />
                <span className="shrink-0 text-sm font-semibold">{progress}%</span>
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
                <div className="rounded-xl bg-secondary/60 p-3">
                  <dt className="text-xs text-muted-foreground">Total tasks</dt>
                  <dd className="mt-0.5 font-semibold">{taskTotal}</dd>
                </div>
                <div className="rounded-xl bg-secondary/60 p-3">
                  <dt className="text-xs text-muted-foreground">Completed</dt>
                  <dd className="mt-0.5 font-semibold text-primary">{taskCompleted}</dd>
                </div>
                <div className="rounded-xl bg-secondary/60 p-3">
                  <dt className="text-xs text-muted-foreground">Pending</dt>
                  <dd className="mt-0.5 font-semibold">{taskTotal - taskCompleted}</dd>
                </div>
              </dl>
              <ol className="mt-5 space-y-3">
                {PROJECT_STATUSES.map((stage, i) => {
                  const done = i <= stageIndex;
                  return (
                    <li key={stage} className="flex items-start gap-3 text-sm">
                      {done ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                      ) : (
                        <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      )}
                      <span className={done ? "font-medium" : "text-muted-foreground"}>{stage}</span>
                    </li>
                  );
                })}
              </ol>
            </div>
          </section>
        </article>

        <aside className="min-w-0 space-y-6 lg:sticky lg:top-24 lg:self-start">
          <Card className="shadow-lift">
            <CardHeader className="gap-1">
              <h2 className="text-base font-semibold">Team</h2>
              <p className="text-sm text-muted-foreground">
                {spots > 0 ? `${spots} open spot${spots > 1 ? "s" : ""} · applications open` : "This team is currently full."}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {isOwner ? (
                <>
                  <Button asChild className="w-full">
                    <Link to="/projects/$projectId/applications" params={{ projectId: project.id }}>Manage applications</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/projects/$projectId/edit" params={{ projectId: project.id }}>Edit project</Link>
                  </Button>
                </>
              ) : (
                <ApplyPanel projectId={project.id} full={spots <= 0} />
              )}
              <Button asChild variant="ghost" className="w-full">
                <Link to="/projects/$projectId/team" params={{ projectId: project.id }}>View team</Link>
              </Button>
              <Button asChild variant="ghost" className="w-full">
                <Link to="/projects/$projectId/tasks" params={{ projectId: project.id }}>Task board</Link>
              </Button>
              <BookmarkButton projectId={project.id} withLabel className="w-full" />
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <h2 className="text-base font-semibold">Project owner</h2>
            </CardHeader>
            <CardContent>
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/10 font-semibold text-primary">
                  {initialsFrom(ownerName)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-medium">{ownerName}</span>
                  <span className="block truncate text-sm text-muted-foreground">{project.owner?.course ?? "Student"}</span>
                </span>
              </div>
              {project.owner?.college && <p className="mt-4 text-sm text-muted-foreground">{project.owner.college}</p>}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
