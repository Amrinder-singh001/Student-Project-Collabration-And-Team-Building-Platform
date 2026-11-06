import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarDays, ChevronLeft, ChevronRight, Pencil, Plus, Trash2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/Modal";
import { SkillBadge } from "@/components/SkillBadge";
import { useAuth } from "@/hooks/useAuth";
import { discoveryProjectQuery } from "@/lib/discovery";
import { formatDate, listTeam } from "@/lib/applications";
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  createTask,
  deleteTask,
  friendlyTaskError,
  listTasks,
  priorityStyles,
  syncProjectWorkflow,
  taskSchema,
  updateTask,
  updateTaskStatus,
  type TaskField,
  type TaskInput,
  type TaskRow,
  type TaskStatus,
} from "@/lib/tasks";

const COLUMN_DOTS: Record<TaskStatus, string> = {
  "To Do": "bg-muted-foreground",
  "In Progress": "bg-accent",
  Completed: "bg-primary",
};

const EMPTY_FORM: TaskInput = { title: "", description: "", assigneeId: "", priority: "Medium", deadline: "", status: "To Do" };

type Errors = Partial<Record<TaskField, string>>;

export function TaskBoard({ projectId }: { projectId: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TaskRow | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);

  const { data: project } = useQuery(discoveryProjectQuery(projectId));
  const { data: team = [] } = useQuery({ queryKey: ["team", projectId], queryFn: () => listTeam(projectId) });
  const { data: tasks = [], isLoading } = useQuery({ queryKey: ["tasks", projectId], queryFn: () => listTasks(projectId) });

  const isOwner = !!user && project?.owner_id === user.id;
  const isMember = isOwner || (!!user && team.some((m) => m.user_id === user.id));
  const nameOf = (id: string | null) => (id ? (team.find((m) => m.user_id === id)?.full_name ?? "Team member") : null);

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["tasks", projectId] });
    void qc.invalidateQueries({ queryKey: ["project-task-stats", projectId] });
    void qc.invalidateQueries({ queryKey: ["discovery-project", projectId] });
    void qc.invalidateQueries({ queryKey: ["discovery-projects"] });
  };

  const advance = async (fn: () => Promise<void>, message: string) => {
    try {
      await fn();
      await syncProjectWorkflow(projectId);
      toast.success(message);
      refresh();
    } catch (e) {
      toast.error(friendlyTaskError(e));
    }
  };

  const move = (task: TaskRow, target: TaskStatus) => {
    if (target === task.status) return;
    if (!(isOwner || task.assignee_id === user?.id)) {
      toast.error("Only the project owner or the assignee can move this task.");
      return;
    }
    void advance(() => updateTaskStatus(task.id, target), "Task moved");
  };

  const remove = (task: TaskRow) =>
    void advance(() => deleteTask(task.id), "Task deleted");

  const startCreate = () => {
    setEditing(null);
    setOpen(true);
  };
  const startEdit = (task: TaskRow) => {
    setEditing(task);
    setOpen(true);
  };

  if (!user || !project) return <p className="mt-8 text-sm text-muted-foreground">Loading board…</p>;
  if (!isMember && !isLoading && tasks.length === 0)
    return (
      <div className="mt-8 rounded-2xl border border-border bg-card p-8 text-center shadow-soft">
        <p className="font-medium">Only the project owner and team members can see this task board.</p>
        <p className="mt-1 text-sm text-muted-foreground">Join the project team to view and work on its tasks.</p>
      </div>
    );

  return (
    <>
      {isOwner && (
        <div className="mt-6 flex justify-end">
          <Button onClick={startCreate}>
            <Plus className="h-4 w-4" aria-hidden="true" /> New task
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {TASK_STATUSES.map((s) => (
            <div key={s} className="h-48 animate-pulse rounded-2xl bg-secondary" />
          ))}
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-3" role="list" aria-label="Task board">
          {TASK_STATUSES.map((status, col) => {
            const columnTasks = tasks.filter((t) => t.status === status);
            return (
              <section
                key={status}
                aria-label={`${status} (${columnTasks.length})`}
                className="flex min-h-64 flex-col rounded-2xl border border-border bg-card p-4 shadow-soft"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  const task = tasks.find((t) => t.id === dragging);
                  setDragging(null);
                  if (task) move(task, status);
                }}
              >
                <header className="flex items-center justify-between gap-2">
                  <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    <span className={`h-2 w-2 rounded-full ${COLUMN_DOTS[status]}`} aria-hidden="true" />
                    {status}
                  </h3>
                  <SkillBadge size="sm">{columnTasks.length}</SkillBadge>
                </header>

                <div className="mt-3 flex flex-1 flex-col gap-3">
                  {columnTasks.length === 0 && (
                    <p className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                      No tasks here
                    </p>
                  )}
                  {columnTasks.map((task) => {
                    const canMove = isOwner || task.assignee_id === user.id;
                    const overdue = !!task.deadline && task.status !== "Completed" && task.deadline < new Date().toISOString().slice(0, 10);
                    const assignee = nameOf(task.assignee_id);
                    return (
                      <article
                        key={task.id}
                        draggable={canMove}
                        onDragStart={() => setDragging(task.id)}
                        onDragEnd={() => setDragging(null)}
                        className={`rounded-xl border border-border bg-background p-3 shadow-soft ${canMove ? "cursor-grab active:cursor-grabbing" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="min-w-0 text-sm font-semibold leading-snug">{task.title}</h4>
                          <SkillBadge size="sm" className={priorityStyles[task.priority]}>
                            {task.priority}
                          </SkillBadge>
                        </div>
                        {task.description && <p className="mt-1.5 line-clamp-3 text-xs text-muted-foreground">{task.description}</p>}
                        <dl className="mt-2.5 space-y-1 text-xs text-muted-foreground">
                          {task.deadline && (
                            <div className="flex items-center gap-1.5">
                              <CalendarDays className={`h-3.5 w-3.5 shrink-0 ${overdue ? "text-destructive" : ""}`} aria-hidden="true" />
                              <dt className="sr-only">Deadline</dt>
                              <dd className={overdue ? "font-medium text-destructive" : ""}>
                                {formatDate(task.deadline)}
                                {overdue ? " · overdue" : ""}
                              </dd>
                            </div>
                          )}
                          {assignee && (
                            <div className="flex items-center gap-1.5">
                              <UserRound className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                              <dt className="sr-only">Assigned to</dt>
                              <dd className="truncate">{assignee}</dd>
                            </div>
                          )}
                        </dl>

                        <div className="mt-3 flex items-center justify-between gap-1 border-t border-border pt-2.5">
                          <div className="flex items-center gap-1">
                            {canMove && col > 0 && TASK_STATUSES[col - 1] && (
                              <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`Move "${task.title}" to ${TASK_STATUSES[col - 1]}`}
                                onClick={() => move(task, TASK_STATUSES[col - 1]!)}>
                                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                              </Button>
                            )}
                            {canMove && col < TASK_STATUSES.length - 1 && TASK_STATUSES[col + 1] && (
                              <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`Move "${task.title}" to ${TASK_STATUSES[col + 1]}`}
                                onClick={() => move(task, TASK_STATUSES[col + 1]!)}>
                                <ChevronRight className="h-4 w-4" aria-hidden="true" />
                              </Button>
                            )}
                          </div>
                          {isOwner && (
                            <div className="flex items-center gap-0.5">
                              <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`Edit "${task.title}"`} onClick={() => startEdit(task)}>
                                <Pencil className="h-4 w-4" aria-hidden="true" />
                              </Button>
                              <Modal
                                title="Delete this task?"
                                description={`"${task.title}" will be permanently removed.`}
                                trigger={
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" aria-label={`Delete "${task.title}"`}>
                                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                                  </Button>
                                }
                                footer={
                                  <Button variant="destructive" onClick={() => remove(task)}>
                                    Delete task
                                  </Button>
                                }
                              >
                                <p className="text-sm text-muted-foreground">This can't be undone.</p>
                              </Modal>
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <TaskFormModal
        projectId={projectId}
        team={team}
        task={editing}
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setEditing(null);
        }}
        onSaved={() => {
          setOpen(false);
          setEditing(null);
          refresh();
        }}
      />
    </>
  );
}

function TaskFormModal({
  projectId,
  team,
  task,
  open,
  onOpenChange,
  onSaved,
}: {
  projectId: string;
  team: { user_id: string; full_name: string | null }[];
  task: TaskRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [values, setValues] = useState<TaskInput>(EMPTY_FORM);
  const [loadedFor, setLoadedFor] = useState<TaskRow | null | undefined>(undefined);

  // Populate the form when the modal opens for create or edit.
  if (open && loadedFor !== task) {
    setLoadedFor(task);
    setValues(
      task
        ? {
            title: task.title,
            description: task.description ?? "",
            assigneeId: task.assignee_id ?? "",
            priority: task.priority,
            deadline: task.deadline ?? "",
            status: task.status,
          }
        : EMPTY_FORM,
    );
    setErrors({});
  }
  if (!open && loadedFor !== undefined) setLoadedFor(undefined);

  const set = (field: TaskField, value: string) => setValues((v) => ({ ...v, [field]: value }));

  const save = async () => {
    const parsed = taskSchema.safeParse(values);
    if (!parsed.success) {
      const e: Errors = {};
      for (const issue of parsed.error.issues) e[issue.path[0] as TaskField] ??= issue.message;
      setErrors(e);
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      if (task) await updateTask(task.id, parsed.data);
      else await createTask(projectId, parsed.data);
      await syncProjectWorkflow(projectId);
      toast.success(task ? "Task updated" : "Task created");
      void qc.invalidateQueries({ queryKey: ["project-task-stats", projectId] });
      onSaved();
    } catch (e) {
      toast.error(friendlyTaskError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={task ? "Edit task" : "New task"}
      description={task ? "Update the task details." : "Add a task to this project's board."}
      footer={
        <Button onClick={save} disabled={busy}>
          {busy ? "Saving…" : task ? "Save changes" : "Create task"}
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="task-title">Task title</Label>
          <Input
            id="task-title"
            placeholder="e.g. Build the login page"
            value={values.title}
            aria-invalid={!!errors.title}
            aria-describedby={errors.title ? "task-title-err" : undefined}
            onChange={(e) => set("title", e.target.value)}
          />
          {errors.title && <p id="task-title-err" className="text-xs text-destructive">{errors.title}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="task-description">Description</Label>
          <Textarea
            id="task-description"
            rows={3}
            placeholder="What needs to be done?"
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="task-assignee">Assigned team member</Label>
            <select
              id="task-assignee"
              className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              value={values.assigneeId}
              onChange={(e) => set("assigneeId", e.target.value)}
            >
              <option value="">Unassigned</option>
              {team.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.full_name ?? "Student"}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-priority">Priority</Label>
            <select
              id="task-priority"
              className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              value={values.priority}
              onChange={(e) => set("priority", e.target.value)}
            >
              {TASK_PRIORITIES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-deadline">Deadline</Label>
            <Input
              id="task-deadline"
              type="date"
              value={values.deadline}
              aria-invalid={!!errors.deadline}
              aria-describedby={errors.deadline ? "task-deadline-err" : undefined}
              onChange={(e) => set("deadline", e.target.value)}
            />
            {errors.deadline && <p id="task-deadline-err" className="text-xs text-destructive">{errors.deadline}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-status">Status</Label>
            <select
              id="task-status"
              className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              value={values.status}
              onChange={(e) => set("status", e.target.value)}
            >
              {TASK_STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </Modal>
  );
}
