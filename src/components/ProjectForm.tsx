import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SkillBadge } from "@/components/SkillBadge";
import { getAvatarUrl } from "@/lib/avatar";
import {
  PROJECT_CATEGORIES,
  PROJECT_DIFFICULTIES,
  PROJECT_DURATIONS,
  PROJECT_STATUSES,
  projectSchema,
  type ProjectInput,
  type ProjectRow,
} from "@/lib/projects";

type Errors = Partial<Record<keyof ProjectInput | "image", string | undefined>>;

export function ProjectForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: ProjectRow | null;
  submitLabel: string;
  onSubmit: (input: ProjectInput, image: File | null) => Promise<void>;
}) {
  const [catalog, setCatalog] = useState<{ id: string; name: string }[]>([]);
  const [values, setValues] = useState({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    category: initial?.category ?? "",
    skillIds: initial?.skills.map((s) => s.id) ?? [],
    teamSize: String(initial?.team_size ?? 4),
    difficulty: initial?.difficulty ?? "",
    duration: initial?.duration ?? "",
    status: initial?.status ?? "Recruiting",
    additionalInfo: initial?.additional_info ?? "",
  });
  const [skillQuery, setSkillQuery] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void supabase.from("skills").select("id, name").order("name").then(({ data }) => setCatalog(data ?? []));
  }, []);

  useEffect(() => {
    if (image) {
      const url = URL.createObjectURL(image);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    void getAvatarUrl(initial?.image_path ?? null).then(setPreview);
    return undefined;
  }, [image, initial?.image_path]);

  const set = <K extends keyof typeof values>(k: K, v: (typeof values)[K]) => {
    setValues((p) => ({ ...p, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const selected = catalog.filter((s) => values.skillIds.includes(s.id));
  const suggestions = useMemo(() => {
    const q = skillQuery.trim().toLowerCase();
    return catalog
      .filter((s) => !values.skillIds.includes(s.id) && (!q || s.name.toLowerCase().includes(q)))
      .slice(0, 12);
  }, [catalog, skillQuery, values.skillIds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = projectSchema.safeParse(values);
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof ProjectInput;
        next[key] ??= issue.message;
      }
      setErrors(next);
      document.getElementById(`project-${Object.keys(next)[0]}`)?.focus();
      return;
    }
    if (image && (!image.type.startsWith("image/") || image.size > 5 * 1024 * 1024)) {
      setErrors({ image: "Choose an image under 5 MB." });
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(parsed.data, image);
    } finally {
      setSubmitting(false);
    }
  };

  const err = (k: keyof Errors) =>
    errors[k] ? (
      <p id={`project-${k}-error`} className="text-sm text-destructive">
        {errors[k]}
      </p>
    ) : null;
  const aria = (k: keyof Errors) => ({
    "aria-invalid": !!errors[k],
    "aria-describedby": errors[k] ? `project-${k}-error` : undefined,
  });

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="project-title">Project title *</Label>
        <Input id="project-title" value={values.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. CampusPool" {...aria("title")} />
        {err("title")}
      </div>

      <div className="space-y-2">
        <Label htmlFor="project-description">Description *</Label>
        <Textarea id="project-description" rows={5} value={values.description} onChange={(e) => set("description", e.target.value)} placeholder="What are you building, why, and what will the team do?" {...aria("description")} />
        {err("description")}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="project-category">Category *</Label>
          <Select value={values.category} onValueChange={(v) => set("category", v)}>
            <SelectTrigger id="project-category" {...aria("category")}><SelectValue placeholder="Choose a category" /></SelectTrigger>
            <SelectContent>{PROJECT_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
          {err("category")}
        </div>
        <div className="space-y-2">
          <Label htmlFor="project-difficulty">Difficulty *</Label>
          <Select value={values.difficulty} onValueChange={(v) => set("difficulty", v)}>
            <SelectTrigger id="project-difficulty" {...aria("difficulty")}><SelectValue placeholder="Choose a difficulty" /></SelectTrigger>
            <SelectContent>{PROJECT_DIFFICULTIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
          {err("difficulty")}
        </div>
        <div className="space-y-2">
          <Label htmlFor="project-teamSize">Team size *</Label>
          <Input id="project-teamSize" type="number" min={1} max={20} value={values.teamSize} onChange={(e) => set("teamSize", e.target.value)} {...aria("teamSize")} />
          {err("teamSize")}
        </div>
        <div className="space-y-2">
          <Label htmlFor="project-duration">Expected duration *</Label>
          <Select value={values.duration} onValueChange={(v) => set("duration", v)}>
            <SelectTrigger id="project-duration" {...aria("duration")}><SelectValue placeholder="Choose a duration" /></SelectTrigger>
            <SelectContent>{PROJECT_DURATIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
          {err("duration")}
        </div>
        <div className="space-y-2">
          <Label htmlFor="project-status">Status</Label>
          <Select value={values.status} onValueChange={(v) => set("status", v)}>
            <SelectTrigger id="project-status"><SelectValue /></SelectTrigger>
            <SelectContent>{PROJECT_STATUSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Required skills *</legend>
        {selected.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Selected skills">
            {selected.map((s) => (
              <li key={s.id}>
                <SkillBadge variant="primary">
                  {s.name}
                  <button type="button" aria-label={`Remove ${s.name}`} onClick={() => set("skillIds", values.skillIds.filter((id) => id !== s.id))}>
                    <X className="h-3 w-3" aria-hidden="true" />
                  </button>
                </SkillBadge>
              </li>
            ))}
          </ul>
        )}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input id="project-skillIds" aria-label="Search skills" className="pl-9" placeholder="Search skills…" value={skillQuery} onChange={(e) => setSkillQuery(e.target.value)} {...aria("skillIds")} />
        </div>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button key={s.id} type="button" onClick={() => set("skillIds", [...values.skillIds, s.id])} className="rounded-full border border-border px-3 py-1 text-xs hover:border-primary hover:text-primary">
              + {s.name}
            </button>
          ))}
        </div>
        {err("skillIds")}
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="project-image">Project image (optional, max 5 MB)</Label>
        <div className="flex flex-wrap items-center gap-4">
          {preview ? (
            <img src={preview} alt="Project preview" className="h-24 w-40 rounded-xl border border-border object-cover" />
          ) : (
            <span className="grid h-24 w-40 place-items-center rounded-xl border border-dashed border-border text-muted-foreground">
              <ImagePlus className="h-6 w-6" aria-hidden="true" />
            </span>
          )}
          <Input id="project-image" type="file" accept="image/*" className="max-w-xs" onChange={(e) => { setImage(e.target.files?.[0] ?? null); setErrors((x) => ({ ...x, image: undefined })); }} {...aria("image")} />
        </div>
        {err("image")}
      </div>

      <div className="space-y-2">
        <Label htmlFor="project-additionalInfo">Additional information</Label>
        <Textarea id="project-additionalInfo" rows={3} value={values.additionalInfo} onChange={(e) => set("additionalInfo", e.target.value)} placeholder="Meeting schedule, links, expectations…" {...aria("additionalInfo")} />
        {err("additionalInfo")}
      </div>

      <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
        {submitting ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
