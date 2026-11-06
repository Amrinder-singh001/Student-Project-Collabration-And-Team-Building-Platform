import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/Modal";
import { SkillBadge, SkillBadgeList } from "@/components/SkillBadge";
import { useAuth } from "@/hooks/useAuth";
import { discoveryProjectQuery } from "@/lib/discovery";
import { TEAM_ROLES, appStatusStyles, decideApplication, formatDate, listApplicants, type Applicant, type TeamRole } from "@/lib/applications";

export const Route = createFileRoute("/_authenticated/projects/$projectId/applications")({
  head: () => ({
    meta: [
      { title: "Manage applications — ProjectConnect" },
      { name: "description", content: "Review, accept or reject students applying to your project." },
      { property: "og:title", content: "Manage applications — ProjectConnect" },
      { property: "og:description", content: "Review applicants for your ProjectConnect project." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ManageApplicationsPage,
});

function ManageApplicationsPage() {
  const { projectId } = Route.useParams();
  const { user } = useAuth();
  const { data: project, isLoading: pl } = useQuery(discoveryProjectQuery(projectId));
  const isOwner = !!user && project?.owner_id === user.id;
  const { data: apps = [], isLoading } = useQuery({
    queryKey: ["applicants", projectId],
    queryFn: () => listApplicants(projectId),
    enabled: isOwner,
  });

  return (
    <div className="container-page py-8 lg:py-12">
      <Link to="/projects/$projectId" params={{ projectId }} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to project
      </Link>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Manage applications</h1>
          {project && <p className="mt-2 text-muted-foreground">{project.title} · {project.members}/{project.team_size} members</p>}
        </div>
        <Button asChild variant="outline"><Link to="/projects/$projectId/team" params={{ projectId }}>View team</Link></Button>
      </div>
      {pl ? <p className="mt-8 text-muted-foreground">Loading…</p>
        : !isOwner ? <p className="mt-8 text-muted-foreground">Only the project owner can manage applications.</p>
        : isLoading ? <p className="mt-8 text-muted-foreground">Loading applications…</p>
        : apps.length === 0 ? <p className="mt-8 text-muted-foreground">No applications yet.</p>
        : <ul className="mt-8 space-y-4">{apps.map((a) => <ApplicantCard key={a.id} a={a} projectId={projectId} />)}</ul>}
    </div>
  );
}

function ApplicantCard({ a, projectId }: { a: Applicant; projectId: string }) {
  const qc = useQueryClient();
  const [role, setRole] = useState<TeamRole>("Other");
  const [busy, setBusy] = useState(false);
  const decide = async (accept: boolean) => {
    setBusy(true);
    try {
      await decideApplication(a.id, accept, role);
      toast.success(accept ? "Applicant added to the team" : "Application rejected");
      void qc.invalidateQueries({ queryKey: ["applicants", projectId] });
      void qc.invalidateQueries({ queryKey: ["discovery-project", projectId] });
      void qc.invalidateQueries({ queryKey: ["team", projectId] });
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };
  const name = a.full_name ?? "Student";
  return (
    <li>
      <Card className="shadow-soft">
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold">{name}</p>
              <p className="text-sm text-muted-foreground">{[a.course, a.semester && `Semester ${a.semester}`, a.college].filter(Boolean).join(" · ") || "Student"}</p>
              <p className="text-xs text-muted-foreground">Applied {formatDate(a.created_at)}</p>
            </div>
            <SkillBadge className={appStatusStyles[a.status] ?? ""}>{a.status}</SkillBadge>
          </div>
          {a.skills.length > 0 && <SkillBadgeList skills={a.skills} max={8} />}
          <div className="grid gap-4 md:grid-cols-3 text-sm">
            <div><p className="font-medium">Why they want to join</p><p className="mt-1 whitespace-pre-line text-muted-foreground">{a.motivation}</p></div>
            <div><p className="font-medium">Relevant skills</p><p className="mt-1 whitespace-pre-line text-muted-foreground">{a.relevant_skills}</p></div>
            <div><p className="font-medium">Contribution</p><p className="mt-1 whitespace-pre-line text-muted-foreground">{a.contribution}</p></div>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
            <Modal title={name} description="Applicant profile" trigger={<Button variant="outline" size="sm">View Profile</Button>}>
              <div className="space-y-3 text-sm">
                <p className="text-muted-foreground">{[a.course, a.semester && `Semester ${a.semester}`, a.college].filter(Boolean).join(" · ")}</p>
                {a.bio && <p className="whitespace-pre-line">{a.bio}</p>}
                {a.skills.length > 0 && <SkillBadgeList skills={a.skills} />}
                <div className="flex gap-4">
                  {a.github_url && <a className="text-primary hover:underline" href={a.github_url} target="_blank" rel="noreferrer">GitHub</a>}
                  {a.portfolio_url && <a className="text-primary hover:underline" href={a.portfolio_url} target="_blank" rel="noreferrer">Portfolio</a>}
                </div>
              </div>
            </Modal>
            {a.status === "Pending" && (
              <>
                <label className="sr-only" htmlFor={`role-${a.id}`}>Team role</label>
                <select id={`role-${a.id}`} value={role} onChange={(e) => setRole(e.target.value as TeamRole)} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
                  {TEAM_ROLES.map((r) => <option key={r}>{r}</option>)}
                </select>
                <Button size="sm" disabled={busy} onClick={() => decide(true)}>Accept</Button>
                <Button size="sm" variant="ghost" className="text-destructive" disabled={busy} onClick={() => decide(false)}>Reject</Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </li>
  );
}
