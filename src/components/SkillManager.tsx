import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SkillBadge } from "@/components/SkillBadge";

type SkillRow = { id: string; name: string; category: string | null };

export function SkillManager() {
  const { user, skills, refreshProfile } = useAuth();
  const [catalog, setCatalog] = useState<SkillRow[]>([]);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    void supabase
      .from("skills")
      .select("id, name, category")
      .order("name")
      .then(({ data }) => setCatalog((data ?? []) as SkillRow[]));
  }, []);

  const owned = useMemo(() => new Set(skills.map((s) => s.skill_id)), [skills]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog
      .filter((s) => !owned.has(s.id))
      .filter((s) => !q || s.name.toLowerCase().includes(q) || (s.category ?? "").toLowerCase().includes(q))
      .slice(0, 12);
  }, [catalog, owned, query]);

  async function addSkill(skill: SkillRow) {
    if (!user) return;
    setBusy(skill.id);
    const { error } = await supabase
      .from("student_skills")
      .insert({ user_id: user.id, skill_id: skill.id });
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refreshProfile();
    toast.success(`${skill.name} added to your skills.`);
  }

  async function removeSkill(id: string, name: string) {
    setBusy(id);
    const { error } = await supabase.from("student_skills").delete().eq("id", id);
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refreshProfile();
    toast.success(`${name} removed.`);
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="skill-search">Search skills</Label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="skill-search"
            className="pl-9"
            placeholder="Try React, Python, Figma…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {results.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {results.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                disabled={busy === s.id}
                onClick={() => void addSkill(s)}
                className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border px-3 py-1 text-xs font-medium transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
              >
                <Plus className="h-3 w-3" aria-hidden="true" />
                {s.name}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          {query ? "No matching skills found." : "You've added every available skill."}
        </p>
      )}

      <div className="space-y-2">
        <p className="text-sm font-medium">Your skills ({skills.length})</p>
        {skills.length === 0 ? (
          <p className="text-sm text-muted-foreground">No skills yet — add a few from above.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {skills.map((s) => (
              <li key={s.id}>
                <SkillBadge variant="primary" className="pr-1.5">
                  {s.name}
                  <button
                    type="button"
                    aria-label={`Remove ${s.name}`}
                    disabled={busy === s.id}
                    onClick={() => void removeSkill(s.id, s.name)}
                    className="ml-0.5 grid h-4 w-4 place-items-center rounded-full hover:bg-primary/20 disabled:opacity-50"
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                  </button>
                </SkillBadge>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Button variant="outline" className="w-full" onClick={() => setQuery("")}>
        Clear search
      </Button>
    </div>
  );
}
