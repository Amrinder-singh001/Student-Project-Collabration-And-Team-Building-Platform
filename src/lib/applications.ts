import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const TEAM_ROLES = [
  "Frontend Developer",
  "Backend Developer",
  "Database Developer",
  "UI/UX Designer",
  "Tester",
  "Researcher",
  "Other",
] as const;
export type TeamRole = (typeof TEAM_ROLES)[number];

export const applicationSchema = z.object({
  motivation: z.string().trim().min(10, "Tell the owner a bit more (at least 10 characters)").max(2000, "Under 2000 characters"),
  relevantSkills: z.string().trim().min(2, "List your relevant skills").max(500, "Under 500 characters"),
  contribution: z.string().trim().min(10, "Describe what you can contribute (at least 10 characters)").max(2000, "Under 2000 characters"),
});
export type ApplicationInput = z.infer<typeof applicationSchema>;

export function friendlyDbError(e: unknown): string {
  const msg = (e as { message?: string; code?: string })?.message ?? "";
  if ((e as { code?: string })?.code === "23505") return "You've already applied to this project.";
  for (const known of [
    "You cannot apply to your own project",
    "This team is already full",
    "The team is already full",
    "You are already on this team",
    "Only the project owner can do this",
    "This application was already decided",
  ])
    if (msg.includes(known)) return known + ".";
  return "Something went wrong. Please try again.";
}

export async function getMyApplication(projectId: string, userId: string) {
  const { data, error } = await supabase
    .from("project_applications")
    .select("id, status, created_at")
    .eq("project_id", projectId)
    .eq("applicant_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function submitApplication(projectId: string, userId: string, input: ApplicationInput) {
  const { error } = await supabase.from("project_applications").insert({
    project_id: projectId,
    applicant_id: userId,
    motivation: input.motivation,
    relevant_skills: input.relevantSkills,
    contribution: input.contribution,
  });
  if (error) throw new Error(friendlyDbError(error));
}

export type MyApplication = { id: string; status: string; created_at: string; project: { id: string; title: string } | null };

export async function listMyApplications(userId: string): Promise<MyApplication[]> {
  const { data, error } = await supabase
    .from("project_applications")
    .select("id, status, created_at, project:projects(id, title)")
    .eq("applicant_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as MyApplication[];
}

export type Applicant = {
  id: string;
  applicant_id: string;
  motivation: string;
  relevant_skills: string;
  contribution: string;
  status: string;
  created_at: string;
  full_name: string | null;
  course: string | null;
  semester: string | null;
  college: string | null;
  bio: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  skills: string[];
};

export async function listApplicants(projectId: string): Promise<Applicant[]> {
  const { data, error } = await supabase.rpc("get_project_applicants", { _project_id: projectId });
  if (error) throw error;
  return (data ?? []) as Applicant[];
}

export async function decideApplication(id: string, accept: boolean, role: TeamRole = "Other") {
  const { error } = await supabase.rpc("decide_application", { _application_id: id, _accept: accept, _role: role });
  if (error) throw new Error(friendlyDbError(error));
}

export type TeamMember = {
  user_id: string;
  full_name: string | null;
  course: string | null;
  college: string | null;
  role: string;
  joined_at: string;
  is_owner: boolean;
  skills: string[];
};

export async function listTeam(projectId: string): Promise<TeamMember[]> {
  const { data, error } = await supabase.rpc("get_project_team", { _project_id: projectId });
  if (error) throw error;
  return (data ?? []) as TeamMember[];
}

export async function updateMemberRole(projectId: string, userId: string, role: TeamRole) {
  const { error } = await supabase.from("project_members").update({ role }).eq("project_id", projectId).eq("user_id", userId);
  if (error) throw new Error(friendlyDbError(error));
}

export async function removeMember(projectId: string, userId: string) {
  const { error } = await supabase.from("project_members").delete().eq("project_id", projectId).eq("user_id", userId);
  if (error) throw new Error(friendlyDbError(error));
}

export const formatDate = (d: string) =>
  new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

export const appStatusStyles: Record<string, string> = {
  Pending: "border-accent/40 bg-accent/15 text-accent-foreground",
  Accepted: "border-primary/25 bg-primary/10 text-primary",
  Rejected: "border-destructive/30 bg-destructive/10 text-destructive",
};
