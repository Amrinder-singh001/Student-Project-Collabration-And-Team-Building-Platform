import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkillBadge, SkillBadgeList } from "@/components/SkillBadge";
import { useAuth } from "@/hooks/useAuth";
import { initialsFrom } from "@/lib/avatar";
import { discoveryProjectQuery } from "@/lib/discovery";
import { TEAM_ROLES, formatDate, listTeam, removeMember, updateMemberRole, type TeamRole } from "@/lib/applications";

export const Route = createFileRoute("/_authenticated/projects/$projectId/team")({
  head: () => ({
    meta: [
      { title: "Project team — ProjectConnect" },
      { name: "description", content: "See the owner, members, roles and skills of this project team." },
      { property: "og:title", content: "Project team — ProjectConnect" },
      { property: "og:description", content: "Team members, roles and skills for a student project." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TeamPage,
});

function TeamPage() {
  const { projectId } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: project } = useQuery(discoveryProjectQuery(projectId));
  const { data: team = [], isLoading } = useQuery({ queryKey: ["team", projectId], queryFn: () => listTeam(projectId) });
  const isOwner = !!user && project?.owner_id === user.id;
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["team", projectId] });
    void qc.invalidateQueries({ queryKey: ["discovery-project", projectId] });
  };

  return (
    <div className="container-page py-8 lg:py-12">
      <Link to="/projects/$projectId" params={{ projectId }} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to project
      </Link>
      <h1 className="mt-6 text-3xl font-bold">Team{project ? ` · ${project.title}` : ""}</h1>
      {project && <p className="mt-2 text-muted-foreground">{project.members}/{project.team_size} members</p>}
      <ul className="mt-8 grid gap-4 md:grid-cols-2">
        {isLoading && <li className="text-muted-foreground">Loading team…</li>}
        {team.map((m) => (
          <li key={m.user_id}>
            <Card className="h-full shadow-soft">
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/10 font-semibold text-primary">{initialsFrom(m.full_name ?? "S")}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{m.full_name ?? "Student"}</p>
                    <p className="truncate text-sm text-muted-foreground">{m.course ?? "Student"} · joined {formatDate(m.joined_at)}</p>
                  </div>
                  {(!isOwner || m.is_owner) && <SkillBadge variant={m.is_owner ? "primary" : "default"}>{m.role}</SkillBadge>}
                </div>
                {m.skills.length ? <SkillBadgeList skills={m.skills} max={6} /> : <p className="text-sm text-muted-foreground">No skills listed.</p>}
                {isOwner && !m.is_owner && (
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="sr-only" htmlFor={`role-${m.user_id}`}>Role</label>
                    <select
                      id={`role-${m.user_id}`}
                      className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                      value={m.role}
                      onChange={async (e) => {
                        try { await updateMemberRole(projectId, m.user_id, e.target.value as TeamRole); toast.success("Role updated"); refresh(); }
                        catch (err) { toast.error((err as Error).message); }
                      }}
                    >
                      {TEAM_ROLES.map((r) => <option key={r}>{r}</option>)}
                    </select>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={async () => {
                      try { await removeMember(projectId, m.user_id); toast.success("Member removed"); refresh(); }
                      catch (err) { toast.error((err as Error).message); }
                    }}>Remove</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
