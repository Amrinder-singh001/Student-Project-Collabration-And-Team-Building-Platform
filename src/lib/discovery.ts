import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { bookmarkUpsertOptions } from "@/lib/bookmark-policy";
import { progressFromStats, type TaskStats } from "@/lib/tasks";

export type DiscoveryOwner = { id: string; full_name: string; college: string | null; course: string | null };

export type DiscoveryProject = {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  category: string;
  team_size: number;
  difficulty: string;
  duration: string;
  status: string;
  additional_info: string | null;
  created_at: string;
  skills: string[];
  owner: DiscoveryOwner | null;
  members: number;
  progress: number;
};

const PROGRESS: Record<string, number> = {
  Recruiting: 10,
  "Team Formed": 35,
  "In Progress": 65,
  Completed: 100,
};

export type Raw = Omit<DiscoveryProject, "skills" | "owner" | "members" | "progress"> & {
  project_skills: { skills: { name: string } | null }[] | null;
  project_members: { count: number }[] | null;
};

export async function withOwners(rows: Raw[]): Promise<DiscoveryProject[]> {
  const ids = [...new Set(rows.map((r) => r.owner_id))];
  let owners: DiscoveryOwner[] = [];
  if (ids.length) {
    const { data } = await supabase.rpc("get_project_owners", { _ids: ids });
    owners = (data ?? []) as DiscoveryOwner[];
  }
  const { data: stats } = await supabase.rpc("get_project_task_stats", { _ids: [...new Set(rows.map((r) => r.id))] });
  const statMap = new Map<string, TaskStats>(((stats ?? []) as TaskStats[]).map((s) => [s._project_id, s]));
  return rows.map(({ project_skills, project_members, ...r }) => ({
    ...r,
    skills: (project_skills ?? []).map((ps) => ps.skills?.name).filter((n): n is string => !!n),
    owner: owners.find((o) => o.id === r.owner_id) ?? null,
    // The owner always counts as a member.
    members: 1 + (project_members?.[0]?.count ?? 0),
    progress: progressFromStats(statMap.get(r.id), PROGRESS[r.status] ?? 0),
  }));
}

export const DISCOVERY_SELECT =
  "id, owner_id, title, description, category, team_size, difficulty, duration, status, additional_info, created_at, project_skills(skills(name)), project_members(count)";

export const discoveryQuery = queryOptions({
  queryKey: ["discovery-projects"],
  queryFn: async () => {
    const { data, error } = await supabase.from("projects").select(DISCOVERY_SELECT).order("created_at", { ascending: false });
    if (error) throw error;
    return withOwners((data ?? []) as unknown as Raw[]);
  },
});

export const discoveryProjectQuery = (id: string) =>
  queryOptions({
    queryKey: ["discovery-project", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select(DISCOVERY_SELECT).eq("id", id).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return (await withOwners([data as unknown as Raw]))[0] ?? null;
    },
  });

export async function listBookmarks(userId: string): Promise<string[]> {
  const { data, error } = await supabase.from("project_bookmarks").select("project_id").eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((b) => b.project_id);
}

export async function setBookmark(userId: string, projectId: string, on: boolean) {
  const { error } = on
    ? await supabase
        .from("project_bookmarks")
        .upsert({ user_id: userId, project_id: projectId }, bookmarkUpsertOptions())
    : await supabase.from("project_bookmarks").delete().eq("user_id", userId).eq("project_id", projectId);
  if (error) throw error;
}

export async function listSavedProjects(userId: string): Promise<DiscoveryProject[]> {
  const projectIds = await listBookmarks(userId);
  if (!projectIds.length) return [];
  const { data, error } = await supabase.from("projects").select(DISCOVERY_SELECT).in("id", projectIds);
  if (error) throw error;
  const projects = await withOwners((data ?? []) as unknown as Raw[]);
  const byId = new Map(projects.map((project) => [project.id, project]));
  return projectIds.flatMap((id) => {
    const project = byId.get(id);
    return project ? [project] : [];
  });
}

export function relevance(p: DiscoveryProject, q: string, skills: string[]): number {
  let s = 0;
  const t = q.trim().toLowerCase();
  if (t) {
    if (p.title.toLowerCase().includes(t)) s += 5;
    if (p.skills.some((k) => k.toLowerCase().includes(t))) s += 3;
    if (p.category.toLowerCase().includes(t)) s += 2;
    if (p.description.toLowerCase().includes(t)) s += 1;
  }
  s += p.skills.filter((k) => skills.includes(k)).length * 2;
  if (p.status === "Recruiting") s += 1;
  return s;
}
