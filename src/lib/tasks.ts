import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const TASK_STATUSES = ["To Do", "In Progress", "Completed"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["Low", "Medium", "High"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const priorityStyles: Record<TaskPriority, string> = {
  Low: "border-primary/25 bg-primary/10 text-primary",
  Medium: "border-accent/40 bg-accent/15 text-accent-foreground",
  High: "border-destructive/30 bg-destructive/10 text-destructive",
};

export const taskSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(120, "Title must be under 120 characters"),
  description: z.string().trim().max(2000, "Description must be under 2000 characters"),
  assigneeId: z.string(),
  priority: z.enum(TASK_PRIORITIES, { message: "Choose a priority" }),
  deadline: z.string().refine((d) => d === "" || /^\d{4}-\d{2}-\d{2}$/.test(d), "Choose a valid deadline"),
  status: z.enum(TASK_STATUSES, { message: "Choose a status" }),
});
export type TaskInput = z.infer<typeof taskSchema>;
export type TaskField = keyof TaskInput;

export type TaskRow = {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  assignee_id: string | null;
  priority: TaskPriority;
  deadline: string | null;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
};

export type TaskStats = { _project_id: string; _total: number; _completed: number; _active: number };

export function friendlyTaskError(e: unknown): string {
  const msg = (e as { message?: string })?.message ?? "";
  if (msg.includes("Only the project owner can change task details")) return "Only the project owner can change task details.";
  return "Something went wrong. Please try again.";
}

export async function listTasks(projectId: string): Promise<TaskRow[]> {
  const { data, error } = await supabase
    .from("project_tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as TaskRow[];
}

export async function createTask(projectId: string, input: TaskInput) {
  const { error } = await supabase.from("project_tasks").insert({
    project_id: projectId,
    title: input.title,
    description: input.description || null,
    assignee_id: input.assigneeId || null,
    priority: input.priority,
    deadline: input.deadline || null,
    status: input.status,
  });
  if (error) throw new Error(friendlyTaskError(error));
}

export async function updateTask(taskId: string, input: TaskInput) {
  const { error } = await supabase
    .from("project_tasks")
    .update({
      title: input.title,
      description: input.description || null,
      assignee_id: input.assigneeId || null,
      priority: input.priority,
      deadline: input.deadline || null,
      status: input.status,
    })
    .eq("id", taskId);
  if (error) throw new Error(friendlyTaskError(error));
}

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  const { error } = await supabase.from("project_tasks").update({ status }).eq("id", taskId);
  if (error) throw new Error(friendlyTaskError(error));
}

export async function deleteTask(taskId: string) {
  const { error } = await supabase.from("project_tasks").delete().eq("id", taskId);
  if (error) throw error;
}

export async function getTaskStats(ids: string[]): Promise<TaskStats[]> {
  if (!ids.length) return [];
  const { data, error } = await supabase.rpc("get_project_task_stats", { _ids: ids });
  if (error) throw error;
  return (data ?? []) as unknown as TaskStats[];
}

export function progressFromStats(stats: TaskStats | null | undefined, fallback: number): number {
  if (!stats || stats._total <= 0) return fallback;
  return Math.round((stats._completed / stats._total) * 100);
}

/** Advances the project status along the workflow; never moves it backwards. */
export async function syncProjectWorkflow(projectId: string) {
  const { error } = await supabase.rpc("sync_project_workflow", { _project_id: projectId });
  if (error) throw error;
}
