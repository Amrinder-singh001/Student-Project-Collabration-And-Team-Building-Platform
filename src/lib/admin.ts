import { supabase } from "@/integrations/supabase/client";

export const REPORT_REASONS = [
  "Spam",
  "Fake project",
  "Inappropriate content",
  "Duplicate project",
  "Other",
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export type AdminStats = {
  students: number;
  projects: number;
  active: number;
  completed: number;
  applications: number;
  teams: number;
};

async function count(query: PromiseLike<{ count: number | null; error: unknown }>) {
  const { count: c, error } = await query;
  if (error) throw error;
  return c ?? 0;
}

export async function getAdminStats(): Promise<AdminStats> {
  const head = { count: "exact" as const, head: true };
  const [students, projects, active, completed, applications, teamRows] = await Promise.all([
    count(supabase.from("user_roles").select("user_id", head).eq("role", "student")),
    count(supabase.from("projects").select("id", head)),
    count(supabase.from("projects").select("id", head).in("status", ["Recruiting", "In Progress"])),
    count(supabase.from("projects").select("id", head).eq("status", "Completed")),
    count(supabase.from("project_applications").select("id", head)),
    supabase.from("project_members").select("project_id"),
  ]);
  if (teamRows.error) throw teamRows.error;
  const teams = new Set((teamRows.data ?? []).map((r) => r.project_id)).size;
  return { students, projects, active, completed, applications, teams };
}

export type AdminUser = {
  id: string;
  full_name: string;
  email: string;
  college: string | null;
  course: string | null;
  semester: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  isAdmin: boolean;
  blocked: boolean;
};

export async function listAdminUsers(): Promise<AdminUser[]> {
  const [p, r, b] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, college, course, semester, bio, avatar_url, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("user_roles").select("user_id, role"),
    supabase.from("user_blocks").select("user_id"),
  ]);
  for (const res of [p, r, b]) if (res.error) throw res.error;
  const admins = new Set((r.data ?? []).filter((x) => x.role === "admin").map((x) => x.user_id));
  const blocked = new Set((b.data ?? []).map((x) => x.user_id));
  return (p.data ?? []).map((u) => ({ ...u, isAdmin: admins.has(u.id), blocked: blocked.has(u.id) }));
}

export async function setUserBlocked(userId: string, adminId: string, block: boolean) {
  if (userId === adminId) throw new Error("You can't block your own account.");
  const { error } = block
    ? await supabase.from("user_blocks").insert({ user_id: userId, blocked_by: adminId })
    : await supabase.from("user_blocks").delete().eq("user_id", userId);
  if (error) throw error;
}

export type AdminProject = {
  id: string;
  title: string;
  category: string;
  status: string;
  created_at: string;
  owner_id: string;
};

export async function listAdminProjects(): Promise<AdminProject[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("id, title, category, status, created_at, owner_id")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function removeProject(projectId: string) {
  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) throw error;
}

export type AdminApplication = {
  id: string;
  status: string;
  created_at: string;
  applicant_id: string;
  project: { id: string; title: string } | null;
};

export async function listAdminApplications(): Promise<AdminApplication[]> {
  const { data, error } = await supabase
    .from("project_applications")
    .select("id, status, created_at, applicant_id, project:projects(id, title)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as unknown as AdminApplication[];
}

export type AdminReport = {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  reporter_id: string;
  project: { id: string; title: string } | null;
};

export async function listReports(): Promise<AdminReport[]> {
  const { data, error } = await supabase
    .from("project_reports")
    .select("id, reason, details, status, created_at, reporter_id, project:projects(id, title)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as AdminReport[];
}

export async function setReportStatus(id: string, status: "Dismissed" | "Resolved" | "Open") {
  const { error } = await supabase.from("project_reports").update({ status }).eq("id", id);
  if (error) throw error;
}

export function validateReport(reason: string, details: string): string | null {
  if (!REPORT_REASONS.includes(reason as ReportReason)) return "Choose a reason for the report.";
  if (reason === "Other" && !details.trim()) return "Please describe the problem.";
  if (details.length > 1000) return "Details must be 1000 characters or fewer.";
  return null;
}

export async function reportProject(projectId: string, reporterId: string, reason: ReportReason, details: string) {
  const { error } = await supabase.from("project_reports").insert({
    project_id: projectId,
    reporter_id: reporterId,
    reason,
    details: details.trim() || null,
  });
  if (error) {
    if (error.code === "23505") throw new Error("You've already reported this project.");
    throw error;
  }
}
