import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { TaskBoard } from "@/components/TaskBoard";
import { discoveryProjectQuery } from "@/lib/discovery";
import { getTaskStats, progressFromStats } from "@/lib/tasks";

export const Route = createFileRoute("/_authenticated/projects/$projectId/tasks")({
  head: () => ({
    meta: [
      { title: "Task board — ProjectConnect" },
      { name: "description", content: "Plan, assign and track tasks for a student project on a Kanban board." },
      { property: "og:title", content: "Task board — ProjectConnect" },
      { property: "og:description", content: "Plan, assign and track tasks for a student project on a Kanban board." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TasksPage,
});

function TasksPage() {
  const { projectId } = Route.useParams();
  const { data: project } = useQuery(discoveryProjectQuery(projectId));
  const { data: stats = null } = useQuery({
    queryKey: ["project-task-stats", projectId],
    queryFn: async () => (await getTaskStats([projectId]))[0] ?? null,
  });

  const total = stats?._total ?? 0;
  const completed = stats?._completed ?? 0;
  const pending = total - completed;
  const progress = progressFromStats(stats, project?.progress ?? 0);

  return (
    <div className="container-page py-8 lg:py-12">
      <Link
        to="/projects/$projectId"
        params={{ projectId }}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to project
      </Link>

      <h1 className="mt-6 text-3xl font-bold">Tasks{project ? ` · ${project.title}` : ""}</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Drag cards between columns or use the arrows to move them. Progress updates automatically as tasks are completed.
      </p>

      <section aria-label="Project progress" className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <Progress value={progress} aria-label="Project progress" />
          <span className="shrink-0 text-sm font-semibold">{progress}%</span>
        </div>
        <dl className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
          <div className="rounded-xl bg-secondary/60 p-3">
            <dt className="text-xs text-muted-foreground">Total tasks</dt>
            <dd className="mt-0.5 font-semibold">{total}</dd>
          </div>
          <div className="rounded-xl bg-secondary/60 p-3">
            <dt className="text-xs text-muted-foreground">Completed</dt>
            <dd className="mt-0.5 font-semibold text-primary">{completed}</dd>
          </div>
          <div className="rounded-xl bg-secondary/60 p-3">
            <dt className="text-xs text-muted-foreground">Pending</dt>
            <dd className="mt-0.5 font-semibold">{pending}</dd>
          </div>
        </dl>
      </section>

      <TaskBoard projectId={projectId} />
    </div>
  );
}
