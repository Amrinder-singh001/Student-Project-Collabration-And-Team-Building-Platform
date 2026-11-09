import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, Search, Trash2, Ban, Undo2, Eye } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Modal } from "@/components/Modal";
import {
  getAdminStats, listAdminApplications, listAdminProjects, listAdminUsers, listReports,
  removeProject, setReportStatus, setUserBlocked, type AdminUser,
} from "@/lib/admin";
import { formatDate } from "@/lib/applications";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin dashboard — ProjectConnect" },
      { name: "description", content: "Manage students, projects, applications and reports on ProjectConnect." },
      { property: "og:title", content: "Admin dashboard — ProjectConnect" },
      { property: "og:description", content: "Moderation and platform statistics for ProjectConnect admins." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function State({ loading, error, empty, children }: { loading: boolean; error: unknown; empty: boolean; children: React.ReactNode }) {
  if (loading) return <p className="py-8 text-sm text-muted-foreground">Loading…</p>;
  if (error) return <p role="alert" className="py-8 text-sm text-destructive">Could not load this data. Please refresh.</p>;
  if (empty) return <p className="py-8 text-sm text-muted-foreground">Nothing to show yet.</p>;
  return <>{children}</>;
}

function AdminPage() {
  const { user, role, loading } = useAuth();
  const isAdmin = role === "admin";
  if (loading) return <div className="container-page py-12 text-sm text-muted-foreground">Loading…</div>;
  if (!isAdmin)
    return (
      <div className="container-page py-16 text-center">
        <h1 className="text-2xl font-bold">Admins only</h1>
        <p className="mt-2 text-muted-foreground">You don't have permission to view this page.</p>
        <Button asChild className="mt-6"><Link to="/dashboard">Go to dashboard</Link></Button>
      </div>
    );
  return <AdminContent adminId={user!.id} />;
}

function AdminContent({ adminId }: { adminId: string }) {
  const qc = useQueryClient();
  const stats = useQuery({ queryKey: ["admin", "stats"], queryFn: getAdminStats });
  const users = useQuery({ queryKey: ["admin", "users"], queryFn: listAdminUsers });
  const projects = useQuery({ queryKey: ["admin", "projects"], queryFn: listAdminProjects });
  const apps = useQuery({ queryKey: ["admin", "applications"], queryFn: listAdminApplications });
  const reports = useQuery({ queryKey: ["admin", "reports"], queryFn: listReports });
  const [userQ, setUserQ] = useState("");
  const [projQ, setProjQ] = useState("");
  const [viewing, setViewing] = useState<AdminUser | null>(null);

  const nameById = useMemo(() => new Map((users.data ?? []).map((u) => [u.id, u.full_name])), [users.data]);
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin"] });

  const block = useMutation({
    mutationFn: ({ id, b }: { id: string; b: boolean }) => setUserBlocked(id, adminId, b),
    onSuccess: (_d, v) => { toast.success(v.b ? "User blocked." : "User unblocked."); void refresh(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Action failed."),
  });
  const remove = useMutation({
    mutationFn: removeProject,
    onSuccess: () => { toast.success("Project removed."); void refresh(); void qc.invalidateQueries({ queryKey: ["discovery"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not remove project."),
  });
  const review = useMutation({
    mutationFn: ({ id, s }: { id: string; s: "Dismissed" | "Resolved" }) => setReportStatus(id, s),
    onSuccess: () => { toast.success("Report updated."); void refresh(); },
    onError: () => toast.error("Could not update the report."),
  });

  const filteredUsers = (users.data ?? []).filter((u) =>
    `${u.full_name} ${u.email} ${u.college ?? ""}`.toLowerCase().includes(userQ.trim().toLowerCase()));
  const filteredProjects = (projects.data ?? []).filter((p) =>
    `${p.title} ${p.category} ${p.status}`.toLowerCase().includes(projQ.trim().toLowerCase()));
  const openReports = (reports.data ?? []).filter((r) => r.status === "Open").length;

  const statItems = stats.data ? [
    ["Total students", stats.data.students], ["Total projects", stats.data.projects],
    ["Active projects", stats.data.active], ["Completed projects", stats.data.completed],
    ["Total applications", stats.data.applications], ["Total teams", stats.data.teams],
  ] as const : [];

  const confirmRemove = (id: string, title: string) => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive"><Trash2 aria-hidden="true" /> Remove</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove "{title}"?</AlertDialogTitle>
          <AlertDialogDescription>This permanently deletes the project, its team, tasks and applications.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => remove.mutate(id)}>Remove project</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return (
    <div className="container-page py-10 sm:py-12">
      <header className="border-b border-border pb-6">
        <p className="flex items-center gap-2 text-sm font-medium text-primary"><ShieldCheck className="h-4 w-4" aria-hidden="true" /> Admin</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Admin dashboard</h1>
        <p className="mt-2 text-muted-foreground">Keep ProjectConnect safe and healthy.</p>
      </header>

      <section aria-label="Statistics" className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {stats.isLoading ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-secondary" />)
          : statItems.map(([label, value]) => (
            <Card key={label}><CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-1 text-2xl font-bold">{value}</p>
            </CardContent></Card>
          ))}
        {stats.error ? <p role="alert" className="col-span-full text-sm text-destructive">Could not load statistics.</p> : null}
      </section>

      <Tabs defaultValue="users" className="mt-10">
        <TabsList className="flex h-auto flex-wrap">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="reports">Reports{openReports ? ` (${openReports})` : ""}</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <SearchBox id="user-search" label="Search users" value={userQ} onChange={setUserQ} placeholder="Name, email or college" />
          <State loading={users.isLoading} error={users.error} empty={!filteredUsers.length}>
            <ul className="divide-y divide-border rounded-2xl border border-border">
              {filteredUsers.map((u) => (
                <li key={u.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium">{u.full_name} {u.isAdmin ? <Badge variant="secondary">Admin</Badge> : null} {u.blocked ? <Badge variant="destructive">Blocked</Badge> : null}</p>
                    <p className="truncate text-sm text-muted-foreground">{u.email}{u.college ? ` · ${u.college}` : ""}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setViewing(u)}><Eye aria-hidden="true" /> View</Button>
                    {u.isAdmin || u.id === adminId ? null : (
                      <Button variant={u.blocked ? "outline" : "ghost"} size="sm" disabled={block.isPending}
                        className={u.blocked ? "" : "text-destructive"}
                        onClick={() => block.mutate({ id: u.id, b: !u.blocked })}>
                        {u.blocked ? <><Undo2 aria-hidden="true" /> Unblock</> : <><Ban aria-hidden="true" /> Block</>}
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </State>
        </TabsContent>

        <TabsContent value="projects" className="mt-6">
          <SearchBox id="project-search" label="Search projects" value={projQ} onChange={setProjQ} placeholder="Title, category or status" />
          <State loading={projects.isLoading} error={projects.error} empty={!filteredProjects.length}>
            <ul className="divide-y divide-border rounded-2xl border border-border">
              {filteredProjects.map((p) => (
                <li key={p.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium">{p.title}</p>
                    <p className="text-sm text-muted-foreground">{p.category} · {p.status} · by {nameById.get(p.owner_id) ?? "Student"} · {formatDate(p.created_at)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm"><Link to="/projects/$projectId" params={{ projectId: p.id }}><Eye aria-hidden="true" /> View</Link></Button>
                    {confirmRemove(p.id, p.title)}
                  </div>
                </li>
              ))}
            </ul>
          </State>
        </TabsContent>

        <TabsContent value="applications" className="mt-6">
          <State loading={apps.isLoading} error={apps.error} empty={!apps.data?.length}>
            <ul className="divide-y divide-border rounded-2xl border border-border">
              {(apps.data ?? []).map((a) => (
                <li key={a.id} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm"><span className="font-medium">{nameById.get(a.applicant_id) ?? "A student"}</span> applied to <span className="font-medium">{a.project?.title ?? "a removed project"}</span></p>
                  <p className="text-sm text-muted-foreground"><Badge variant="outline">{a.status}</Badge> {formatDate(a.created_at)}</p>
                </li>
              ))}
            </ul>
          </State>
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <State loading={reports.isLoading} error={reports.error} empty={!reports.data?.length}>
            <ul className="divide-y divide-border rounded-2xl border border-border">
              {(reports.data ?? []).map((r) => (
                <li key={r.id} className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium">{r.project?.title ?? "Removed project"} <Badge variant={r.status === "Open" ? "destructive" : "secondary"}>{r.status}</Badge></p>
                    <p className="text-sm text-muted-foreground">{r.reason} · reported by {nameById.get(r.reporter_id) ?? "a student"} · {formatDate(r.created_at)}</p>
                    {r.details ? <p className="mt-1 text-sm">{r.details}</p> : null}
                  </div>
                  {r.status === "Open" ? (
                    <div className="flex flex-wrap gap-2">
                      {r.project ? <Button asChild variant="outline" size="sm"><Link to="/projects/$projectId" params={{ projectId: r.project.id }}><Eye aria-hidden="true" /> View</Link></Button> : null}
                      <Button variant="outline" size="sm" onClick={() => review.mutate({ id: r.id, s: "Dismissed" })}>Dismiss</Button>
                      <Button variant="outline" size="sm" onClick={() => review.mutate({ id: r.id, s: "Resolved" })}>Mark resolved</Button>
                      {r.project ? confirmRemove(r.project.id, r.project.title) : null}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </State>
        </TabsContent>
      </Tabs>

      <Modal open={Boolean(viewing)} onOpenChange={(o) => !o && setViewing(null)} title={viewing?.full_name ?? "Profile"} description={viewing?.email ?? ""}>
        {viewing ? (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">College</dt><dd>{viewing.college ?? "—"}</dd>
            <dt className="text-muted-foreground">Course</dt><dd>{viewing.course ?? "—"}</dd>
            <dt className="text-muted-foreground">Semester</dt><dd>{viewing.semester ?? "—"}</dd>
            <dt className="text-muted-foreground">Joined</dt><dd>{formatDate(viewing.created_at)}</dd>
            <dt className="text-muted-foreground">Bio</dt><dd>{viewing.bio ?? "—"}</dd>
          </dl>
        ) : null}
      </Modal>
    </div>
  );
}

function SearchBox({ id, label, value, onChange, placeholder }: { id: string; label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative mb-4 max-w-md">
      <label htmlFor={id} className="sr-only">{label}</label>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="pl-9" />
    </div>
  );
}
