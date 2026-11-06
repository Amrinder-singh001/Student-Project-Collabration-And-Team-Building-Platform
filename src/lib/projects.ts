import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { AVATAR_BUCKET } from "@/lib/avatar";

export const PROJECT_CATEGORIES = [
  "Web Development",
  "Mobile Development",
  "AI/ML",
  "Data Science",
  "Cybersecurity",
  "IoT",
  "Software Development",
  "Game Development",
  "UI/UX",
  "Other",
] as const;
export const PROJECT_DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"] as const;
export const PROJECT_STATUSES = ["Recruiting", "Team Formed", "In Progress", "Completed"] as const;
export const PROJECT_DURATIONS = [
  "1–2 weeks",
  "3–4 weeks",
  "1–2 months",
  "3–4 months",
  "One semester",
  "6+ months",
] as const;

export const projectSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(120, "Title must be under 120 characters"),
  description: z
    .string()
    .trim()
    .min(20, "Description must be at least 20 characters")
    .max(4000, "Description must be under 4000 characters"),
  category: z.enum(PROJECT_CATEGORIES, { message: "Choose a category" }),
  skillIds: z.array(z.string().uuid()).min(1, "Add at least one required skill").max(15, "Up to 15 skills"),
  teamSize: z.coerce
    .number({ message: "Enter a team size" })
    .int("Team size must be a whole number")
    .min(1, "Team size must be at least 1")
    .max(20, "Team size can be at most 20"),
  difficulty: z.enum(PROJECT_DIFFICULTIES, { message: "Choose a difficulty" }),
  duration: z.enum(PROJECT_DURATIONS, { message: "Choose an expected duration" }),
  status: z.enum(PROJECT_STATUSES),
  additionalInfo: z.string().trim().max(2000, "Must be under 2000 characters"),
});
export type ProjectInput = z.infer<typeof projectSchema>;

export type ProjectRow = {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  category: string;
  team_size: number;
  difficulty: string;
  duration: string;
  status: string;
  image_path: string | null;
  additional_info: string | null;
  created_at: string;
  skills: { id: string; name: string }[];
};

const SELECT = "*, project_skills(skills(id, name))";

type Raw = Omit<ProjectRow, "skills"> & {
  project_skills: { skills: { id: string; name: string } | null }[] | null;
};
const normalize = (r: Raw): ProjectRow => {
  const { project_skills, ...rest } = r;
  return {
    ...rest,
    skills: (project_skills ?? []).map((ps) => ps.skills).filter((s): s is { id: string; name: string } => !!s),
  };
};

export async function listMyProjects(userId: string): Promise<ProjectRow[]> {
  const { data, error } = await supabase
    .from("projects")
    .select(SELECT)
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as Raw[]).map(normalize);
}

export async function getProject(id: string): Promise<ProjectRow | null> {
  const { data, error } = await supabase.from("projects").select(SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? normalize(data as unknown as Raw) : null;
}

export async function uploadProjectImage(userId: string, file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Project image must be an image file.");
  if (file.size > 5 * 1024 * 1024) throw new Error("Project image must be under 5 MB.");
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/projects/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, { upsert: false });
  if (error) throw new Error("Could not upload the project image.");
  return path;
}

export async function saveProject(opts: {
  userId: string;
  projectId?: string;
  input: ProjectInput;
  imagePath: string | null;
}): Promise<string> {
  const { userId, projectId, input, imagePath } = opts;
  const row = {
    title: input.title,
    description: input.description,
    category: input.category,
    team_size: input.teamSize,
    difficulty: input.difficulty,
    duration: input.duration,
    status: input.status,
    additional_info: input.additionalInfo || null,
    image_path: imagePath,
  };
  let id = projectId;
  if (id) {
    const { error } = await supabase.from("projects").update(row).eq("id", id).eq("owner_id", userId);
    if (error) throw error;
    const { error: delErr } = await supabase.from("project_skills").delete().eq("project_id", id);
    if (delErr) throw delErr;
  } else {
    const { data, error } = await supabase
      .from("projects")
      .insert({ ...row, owner_id: userId })
      .select("id")
      .single();
    if (error) throw error;
    id = data.id;
  }
  if (input.skillIds.length) {
    const { error } = await supabase
      .from("project_skills")
      .insert(input.skillIds.map((skill_id) => ({ project_id: id!, skill_id })));
    if (error) throw error;
  }
  return id!;
}

export async function deleteProject(project: ProjectRow): Promise<void> {
  const { error } = await supabase.from("projects").delete().eq("id", project.id);
  if (error) throw error;
  if (project.image_path) await supabase.storage.from(AVATAR_BUCKET).remove([project.image_path]);
}
