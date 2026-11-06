import { supabase } from "@/integrations/supabase/client";
import { listTeam, type TeamMember } from "@/lib/applications";
import { DISCOVERY_SELECT, withOwners, type DiscoveryProject, type Raw } from "@/lib/discovery";
import { formatDate } from "@/lib/applications";

/* ---------- Skill matching (deterministic, no external AI) ---------- */

export type SkillMatch = {
  matched: number;
  total: number;
  pct: number;
  matchedSkills: string[];
  missingSkills: string[];
};

export function computeSkillMatch(studentSkills: string[], requiredSkills: string[]): SkillMatch {
  const mine = new Set(studentSkills.map((s) => s.trim().toLowerCase()).filter(Boolean));
  const required = [...new Set(requiredSkills.map((s) => s.trim()).filter(Boolean))];
  const matchedSkills = required.filter((s) => mine.has(s.toLowerCase()));
  const missingSkills = required.filter((s) => !mine.has(s.toLowerCase()));
  const matched = matchedSkills.length;
  const total = required.length;
  return {
    matched,
    total,
    pct: total ? Math.round((matched / total) * 100) : 0,
    matchedSkills,
    missingSkills,
  };
}

/* ---------- Dashboard statistics ---------- */

export type DashboardStats = {
  created: number;
  joined: number;
  pending: number;
  accepted: number;
  completed: number;
  saved: number;
};

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const [createdRes, appsRes, memberRes, savedRes] = await Promise.all([
    supabase.from("projects").select("id, status").eq("owner_id", userId),
    supabase.from("project_applications").select("status").eq("applicant_id", userId),
    supabase.from("project_members").select("project_id").eq("user_id", userId),
    supabase.from("project_bookmarks").select("project_id").eq("user_id", userId),
  ]);
  for (const res of [createdRes, appsRes, memberRes, savedRes]) if (res.error) throw res.error;
  const created = createdRes.data ?? [];
  const apps = appsRes.data ?? [];
  return {
    created: created.length,
    joined: (memberRes.data ?? []).length,
    pending: apps.filter((a) => a.status === "Pending").length,
    accepted: apps.filter((a) => a.status === "Accepted").length,
    completed: created.filter((p) => p.status === "Completed").length,
    saved: (savedRes.data ?? []).length,
  };
}

/* ---------- Recent activity ---------- */

export type ActivityKind = "application" | "accepted" | "rejected" | "joined" | "task" | "status";

export type DashboardActivity = { id: string; kind: ActivityKind; text: string; at: string };

type AppRow = {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  project: { title: string } | null;
};
type MemberRow = { project_id: string; joined_at: string; project: { title: string } | null };

export async function listRecentActivity(userId: string): Promise<DashboardActivity[]> {
  const [ownedRes, memberRes, appsRes] = await Promise.all([
    supabase.from("projects").select("id, title, status, updated_at").eq("owner_id", userId),
    supabase.from("project_members").select("project_id, joined_at, project:projects(id, title)").eq("user_id", userId),
    supabase
      .from("project_applications")
      .select("id, status, created_at, updated_at, project:projects(id, title)")
      .eq("applicant_id", userId),
  ]);
  for (const res of [ownedRes, memberRes, appsRes]) if (res.error) throw res.error;

  const owned = ownedRes.data ?? [];
  const memberships = (memberRes.data ?? []) as unknown as MemberRow[];
  const apps = (appsRes.data ?? []) as unknown as AppRow[];

  const items: DashboardActivity[] = [];
  for (const a of apps) {
    const title = a.project?.title ?? "a project";
    items.push({ id: `app-${a.id}`, kind: "application", text: `You applied to "${title}"`, at: a.created_at });
    if (a.status === "Accepted")
      items.push({ id: `app-ok-${a.id}`, kind: "accepted", text: `Your application for "${title}" was accepted`, at: a.updated_at });
    else if (a.status === "Rejected")
      items.push({ id: `app-no-${a.id}`, kind: "rejected", text: `Your application for "${title}" was declined`, at: a.updated_at });
  }
  for (const m of memberships) {
    const title = m.project?.title ?? "a project";
    items.push({ id: `team-${m.project_id}`, kind: "joined", text: `You joined the team for "${title}"`, at: m.joined_at });
  }

  const titleById = new Map<string, string>([
    ...owned.map((p) => [p.id, p.title] as const),
    ...memberships.flatMap((m) => (m.project ? [[m.project_id, m.project.title] as const] : [])),
  ]);
  const teamIds = [...new Set([...owned.map((p) => p.id), ...memberships.map((m) => m.project_id)])];
  if (teamIds.length) {
    const tasksRes = await supabase
      .from("project_tasks")
      .select("id, title, project_id, updated_at")
      .in("project_id", teamIds)
      .eq("status", "Completed");
    if (tasksRes.error) throw tasksRes.error;
    for (const t of tasksRes.data ?? []) {
      items.push({
        id: `task-${t.id}`,
        kind: "task",
        text: `Task "${t.title}" was completed on "${titleById.get(t.project_id) ?? "a project"}"`,
        at: t.updated_at,
      });
    }
  }
  for (const p of owned) {
    if (p.status && p.status !== "Recruiting") {
      items.push({ id: `status-${p.id}`, kind: "status", text: `"${p.title}" moved to ${p.status}`, at: p.updated_at });
    }
  }

  items.sort((a, b) => b.at.localeCompare(a.at));
  return items.slice(0, 8);
}

export const activityDotStyles: Record<ActivityKind, string> = {
  application: "bg-accent-foreground/60",
  accepted: "bg-primary",
  rejected: "bg-destructive",
  joined: "bg-primary",
  task: "bg-primary",
  status: "bg-accent-foreground/60",
};

export function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}

/* ---------- My teams ---------- */

export type MyTeam = {
  projectId: string;
  title: string;
  category: string;
  status: string;
  joinedAt: string;
  role: string;
  members: TeamMember[];
};

export async function listMyTeams(userId: string): Promise<MyTeam[]> {
  const { data, error } = await supabase
    .from("project_members")
    .select("project_id, role, joined_at, project:projects(id, title, category, status, owner_id)")
    .eq("user_id", userId)
    .order("joined_at", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as unknown as Array<{
    project_id: string;
    role: string;
    joined_at: string;
    project: { id: string; title: string; category: string; status: string; owner_id: string } | null;
  }>;
  return Promise.all(
    rows.map(async (r) => {
      const p = r.project;
      const members = p ? await listTeam(p.id).catch(() => [] as TeamMember[]) : [];
      return {
        projectId: r.project_id,
        title: p?.title ?? "Project",
        category: p?.category ?? "",
        status: p?.status ?? "",
        joinedAt: r.joined_at,
        role: p && p.owner_id === userId ? "Owner" : r.role,
        members,
      };
    }),
  );
}

/* ---------- Recommended projects (highest skill match first) ---------- */

export type RecommendedProject = DiscoveryProject & { match: SkillMatch };

export async function listRecommendedProjects(
  userId: string,
  studentSkills: string[],
  limit = 5,
): Promise<RecommendedProject[]> {
  if (!studentSkills.length) return [];
  const [memberRes, mineRes] = await Promise.all([
    supabase.from("project_members").select("project_id").eq("user_id", userId),
    supabase.from("projects").select("id").eq("owner_id", userId),
  ]);
  for (const res of [memberRes, mineRes]) if (res.error) throw res.error;
  const exclude = new Set([
    ...(memberRes.data ?? []).map((m) => m.project_id),
    ...(mineRes.data ?? []).map((p) => p.id),
  ]);

  const { data, error } = await supabase.from("projects").select(DISCOVERY_SELECT).order("created_at", { ascending: false });
  if (error) throw error;
  const projects = await withOwners((data ?? []) as unknown as Raw[]);
  return projects
    .filter((p) => !exclude.has(p.id))
    .map((p) => ({ ...p, match: computeSkillMatch(studentSkills, p.skills) }))
    .filter((p) => p.match.matched > 0)
    .sort((a, b) => b.match.pct - a.match.pct || b.match.matched - a.match.matched)
    .slice(0, limit);
}
