import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DiscoveryCard } from "@/components/DiscoveryCard";
import { SkillBadge } from "@/components/SkillBadge";
import { discoveryQuery, relevance } from "@/lib/discovery";
import { PROJECT_CATEGORIES, PROJECT_DIFFICULTIES, PROJECT_STATUSES } from "@/lib/projects";

export const Route = createFileRoute("/projects/")({
  head: () => ({
    meta: [
      { title: "Explore student projects — ProjectConnect" },
      {
        name: "description",
        content: "Search and filter student projects by skill, category, difficulty and status, and find a team that fits you.",
      },
      { property: "og:title", content: "Explore student projects — ProjectConnect" },
      { property: "og:description", content: "Search, filter and sort student projects by skill, category and status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProjectsPage,
});

const ALL = "all";
type Sort = "newest" | "oldest" | "relevant";

function ProjectsPage() {
  const { data: projects = [], isLoading, error } = useQuery(discoveryQuery);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(ALL);
  const [difficulty, setDifficulty] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [skills, setSkills] = useState<string[]>([]);
  const [sort, setSort] = useState<Sort>("newest");

  const skillOptions = useMemo(
    () => [...new Set(projects.flatMap((p) => p.skills))].sort((a, b) => a.localeCompare(b)),
    [projects],
  );

  const toggleSkill = (skill: string) =>
    setSkills((prev) => (prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]));

  const reset = () => {
    setQuery("");
    setCategory(ALL);
    setDifficulty(ALL);
    setStatus(ALL);
    setSkills([]);
  };

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = projects.filter((p) => {
      const matchesQuery =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.skills.some((s) => s.toLowerCase().includes(q));
      return (
        matchesQuery &&
        (category === ALL || p.category === category) &&
        (difficulty === ALL || p.difficulty === difficulty) &&
        (status === ALL || p.status === status) &&
        (skills.length === 0 || skills.every((s) => p.skills.includes(s)))
      );
    });
    const time = (d: string) => new Date(d).getTime();
    return [...list].sort((a, b) => {
      if (sort === "oldest") return time(a.created_at) - time(b.created_at);
      if (sort === "relevant") {
        const diff = relevance(b, query, skills) - relevance(a, query, skills);
        if (diff) return diff;
      }
      return time(b.created_at) - time(a.created_at);
    });
  }, [projects, query, category, difficulty, status, skills, sort]);

  const hasFilters = !!query || category !== ALL || difficulty !== ALL || status !== ALL || skills.length > 0;

  const selects = [
    { id: "filter-category", label: "Category", value: category, set: setCategory, all: "All categories", options: PROJECT_CATEGORIES },
    { id: "filter-difficulty", label: "Difficulty", value: difficulty, set: setDifficulty, all: "All levels", options: PROJECT_DIFFICULTIES },
    { id: "filter-status", label: "Status", value: status, set: setStatus, all: "All statuses", options: PROJECT_STATUSES },
  ];

  return (
    <div>
      <section className="border-b border-border bg-secondary/40">
        <div className="container-page py-12 lg:py-16">
          <h1 className="text-3xl font-bold sm:text-4xl">Explore projects</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            {projects.length} student project{projects.length === 1 ? "" : "s"} on ProjectConnect. Search, filter and
            sort to find one you want to build.
          </p>
        </div>
      </section>

      <div className="container-page grid gap-8 py-10 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside aria-label="Project filters" className="min-w-0">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft lg:sticky lg:top-24">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
              <h2 className="flex min-w-0 items-center gap-2 text-sm font-semibold uppercase tracking-wider">
                <SlidersHorizontal className="h-4 w-4 shrink-0" aria-hidden="true" />
                Filters
              </h2>
              {hasFilters ? (
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                  Clear
                </button>
              ) : null}
            </div>

            <div className="mt-5 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="project-search">Search</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input
                    id="project-search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Title, description, skill, category…"
                    className="pl-9"
                  />
                </div>
              </div>

              {selects.map((s) => (
                <div key={s.id} className="space-y-2">
                  <Label htmlFor={s.id}>{s.label}</Label>
                  <Select value={s.value} onValueChange={s.set}>
                    <SelectTrigger id={s.id}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL}>{s.all}</SelectItem>
                      {s.options.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}

              <fieldset className="space-y-3">
                <legend className="text-sm font-medium">Skills</legend>
                {skillOptions.length ? (
                  <ul className="flex flex-wrap gap-2">
                    {skillOptions.map((skill) => {
                      const active = skills.includes(skill);
                      return (
                        <li key={skill}>
                          <button
                            type="button"
                            aria-pressed={active}
                            onClick={() => toggleSkill(skill)}
                            className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <SkillBadge size="sm" variant={active ? "primary" : "outline"}>
                              {skill}
                            </SkillBadge>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">Skills appear once projects are posted.</p>
                )}
              </fieldset>
            </div>
          </div>
        </aside>

        <section aria-label="Project results" className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              Showing <span className="font-medium text-foreground">{results.length}</span> of {projects.length} projects
            </p>
            <div className="flex items-center gap-2">
              <Label htmlFor="sort" className="text-sm text-muted-foreground">
                Sort by
              </Label>
              <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
                <SelectTrigger id="sort" className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="relevant">Most relevant</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="mt-5 grid gap-6 sm:grid-cols-2 2xl:grid-cols-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-64 animate-pulse rounded-2xl bg-secondary" />
              ))}
            </div>
          ) : error ? (
            <div role="alert" className="mt-5 rounded-2xl border border-destructive/30 p-8 text-center text-sm">
              Could not load projects. Please refresh the page.
            </div>
          ) : results.length ? (
            <div className="mt-5 grid gap-6 sm:grid-cols-2 2xl:grid-cols-3">
              {results.map((project) => (
                <DiscoveryCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-border p-12 text-center">
              <h2 className="font-display text-lg font-semibold">
                {projects.length ? "No projects match yet" : "No projects posted yet"}
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                {projects.length
                  ? "Try removing a filter or widening your skill selection."
                  : "Be the first — create a project from your dashboard."}
              </p>
              {hasFilters && (
                <Button className="mt-5" variant="outline" onClick={reset}>
                  Reset filters
                </Button>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
