import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Bell,
  TrendingUp,
  Users2,
  FolderKanban,
  Send,
  CheckCircle2,
  Bookmark,
  Sparkles,
  Github,
  Globe,
  GraduationCap,
  Code2,
  Braces,
  Terminal,
  Trophy,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { appStatusStyles, formatDate, listMyApplications } from "@/lib/applications";
import {
  activityDotStyles,
  getDashboardStats,
  listMyTeams,
  listRecentActivity,
  listRecommendedProjects,
  timeAgo,
} from "@/lib/dashboard";
import { statusStyles } from "@/components/DiscoveryCard";
import { useAuth } from "@/hooks/useAuth";
import { getAvatarUrl, initialsFrom } from "@/lib/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfilePhotoViewer } from "@/components/ProfilePhotoViewer";
import { MyProjectCard } from "@/components/MyProjectCard";
import { deleteProject, listMyProjects, type ProjectRow } from "@/lib/projects";
import { SkillBadgeList } from "@/components/SkillBadge";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — ProjectConnect" },
      {
        name: "description",
        content:
          "Track your projects, teams, applications, skill matches and milestones from one student dashboard.",
      },
      { property: "og:title", content: "Dashboard — ProjectConnect" },
      {
        property: "og:description",
        content: "Your projects, teams, applications and skill matches in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { profile, skills, user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [myProjects, setMyProjects] = useState<ProjectRow[] | null>(null);

  useEffect(() => {
    if (!user) return;
    listMyProjects(user.id)
      .then(setMyProjects)
      .catch(() => {
        setMyProjects([]);
        toast.error("Could not load your projects.");
      });
  }, [user]);

  useEffect(() => {
    let active = true;
    void getAvatarUrl(profile?.avatar_url ?? null).then((u) => {
      if (active) setAvatarUrl(u);
    });
    return () => {
      active = false;
    };
  }, [profile?.avatar_url]);

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "there";
  const firstName = displayName.split(" ")[0];

  const profileLinks = [
    { label: "GitHub", url: profile?.github_url, icon: Github },
    { label: "Portfolio", url: profile?.portfolio_url, icon: Globe },
    { label: "LeetCode", url: profile?.leetcode_url, icon: Code2 },
    { label: "HackerRank", url: profile?.hackerrank_url, icon: Braces },
    { label: "GeeksforGeeks", url: profile?.gfg_url, icon: Terminal },
    { label: "CodeChef", url: profile?.codechef_url, icon: Trophy },
  ].filter((l): l is { label: string; url: string; icon: typeof Github } => Boolean(l.url));

  const strength = useMemo(() => {
    const checks = [
      profile?.full_name,
      profile?.bio,
      profile?.college,
      profile?.course,
      profile?.semester,
      profile?.github_url,
      profile?.portfolio_url,
      profile?.avatar_url,
      skills.length >= 3 ? "ok" : null,
    ];
    const done = checks.filter(Boolean).length;
    return { pct: Math.round((done / checks.length) * 100), missing: checks.length - done };
  }, [profile, skills.length]);

  const mySkillNames = useMemo(() => skills.map((s) => s.name), [skills]);

  const { data: myApps = [] } = useQuery({
    queryKey: ["my-applications", user?.id],
    queryFn: () => listMyApplications(user!.id),
    enabled: !!user,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats", user?.id],
    queryFn: () => getDashboardStats(user!.id),
    enabled: !!user,
  });

  const { data: myTeams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ["dashboard-teams", user?.id],
    queryFn: () => listMyTeams(user!.id),
    enabled: !!user,
  });

  const { data: activity = [], isLoading: activityLoading } = useQuery({
    queryKey: ["dashboard-activity", user?.id],
    queryFn: () => listRecentActivity(user!.id),
    enabled: !!user,
  });

  const { data: recommendations = [], isLoading: recsLoading } = useQuery({
    queryKey: ["dashboard-recommendations", user?.id, mySkillNames.join(",")],
    queryFn: () => listRecommendedProjects(user!.id, mySkillNames),
    enabled: !!user && mySkillNames.length > 0,
  });

  const statValues = stats ?? {
    created: 0,
    joined: 0,
    pending: 0,
    accepted: 0,
    completed: 0,
    saved: 0,
  };

  const statCards = [
    { icon: FolderKanban, label: "Projects created", value: statValues.created, delta: `${myProjects?.filter((p) => p.status === "Recruiting").length ?? 0} recruiting` },
    { icon: Users2, label: "Projects joined", value: statValues.joined, delta: statValues.joined ? "as a team member" : "join a team to see it here" },
    { icon: Send, label: "Pending applications", value: statValues.pending, delta: statValues.pending ? "awaiting a response" : "nothing waiting" },
    { icon: CheckCircle2, label: "Accepted applications", value: statValues.accepted, delta: statValues.accepted ? "you're on those teams" : "no acceptances yet" },
    { icon: TrendingUp, label: "Completed projects", value: statValues.completed, delta: statValues.completed ? "as project owner" : "keep building" },
    { icon: Bookmark, label: "Saved projects", value: statValues.saved, delta: statValues.saved ? "in your bookmarks" : "bookmark projects on Explore" },
  ];

  return (
    <div className="container-page py-10">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">Welcome back</p>
          <h1 className="truncate text-2xl font-bold sm:text-3xl">
            {firstName}, here's your build log
          </h1>
        </div>
        <Button asChild className="shrink-0">
          <Link to="/projects/new">
            <Plus className="h-4 w-4" aria-hidden="true" />
            New project
          </Link>
        </Button>
      </header>

      <section aria-label="Your profile" className="mt-8">
        <Card className="shadow-soft">
          <CardContent className="grid gap-5 pt-6 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
            {avatarUrl ? (
              <ProfilePhotoViewer
                src={avatarUrl}
                name={displayName}
                className="h-16 w-16 rounded-full"
              />
            ) : (
              <span
                aria-hidden="true"
                className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-secondary text-lg font-semibold"
              >
                {initialsFrom(displayName)}
              </span>
            )}
            <div className="min-w-0 space-y-2">
              <h2 className="truncate text-lg font-semibold">{displayName}</h2>
              {(profile?.course || profile?.college || profile?.semester) && (
                <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
                  <GraduationCap className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="min-w-0">
                    {[profile?.course, profile?.semester, profile?.college].filter(Boolean).join(" · ")}
                  </span>
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                {profile?.bio || "Add a short bio so teammates know what you're about."}
              </p>
              {skills.length > 0 ? (
                <SkillBadgeList skills={mySkillNames} max={10} variant="primary" />
              ) : (
                <p className="text-sm text-muted-foreground">No skills yet — add some on your profile.</p>
              )}
              {profileLinks.length > 0 && (
                <div className="flex flex-wrap gap-4 pt-1 text-sm">
                  {profileLinks.map((l) => (
                    <a
                      key={l.label}
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 hover:text-primary"
                    >
                      <l.icon className="h-4 w-4" aria-hidden="true" /> {l.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
            <Button asChild variant="outline">
              <Link to="/profile">Edit profile</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((s) => (
          <li key={s.label}>
            <Card className="shadow-soft">
              <CardContent className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 pt-6">
                <div className="min-w-0">
                  <p className="truncate text-sm text-muted-foreground">{s.label}</p>
                  <p className="mt-1 font-display text-2xl font-bold">
                    {statsLoading ? "…" : s.value}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{s.delta}</p>
                </div>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <s.icon className="h-5 w-5" aria-hidden="true" />
                </span>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0" aria-label="Your projects and teams">
          <Tabs defaultValue="my-projects">
            <TabsList>
              <TabsTrigger value="my-projects">My projects</TabsTrigger>
              <TabsTrigger value="applications">Applications</TabsTrigger>
              <TabsTrigger value="teams">My teams</TabsTrigger>
            </TabsList>

            <TabsContent value="my-projects" className="mt-6 space-y-6">
              {myProjects === null ? (
                <p className="text-sm text-muted-foreground">Loading your projects…</p>
              ) : myProjects.length === 0 ? (
                <Card className="shadow-soft">
                  <CardContent className="flex flex-col items-start gap-3 pt-6">
                    <p className="text-sm text-muted-foreground">You haven't created any projects yet.</p>
                    <Button asChild>
                      <Link to="/projects/new"><Plus className="h-4 w-4" aria-hidden="true" /> Create your first project</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2">
                  {myProjects.map((project) => (
                    <MyProjectCard
                      key={project.id}
                      project={project}
                      onDelete={async () => {
                        try {
                          await deleteProject(project);
                          setMyProjects((p) => (p ?? []).filter((x) => x.id !== project.id));
                          toast.success("Project deleted");
                        } catch {
                          toast.error("Could not delete the project.");
                        }
                      }}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="applications" className="mt-6">
              <Card className="shadow-soft">
                <CardHeader>
                  <h2 className="text-base font-semibold">Applications sent</h2>
                </CardHeader>
                <CardContent>
                  <ul className="divide-y divide-border">
                    {myApps.length === 0 && (
                      <li className="py-2 text-sm text-muted-foreground">
                        You haven't applied to any projects yet.{" "}
                        <Link to="/projects" className="font-medium text-primary hover:underline">Explore projects</Link>
                      </li>
                    )}
                    {myApps.map((app) => (
                      <li
                        key={app.id}
                        className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-4 first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0">
                          <Link
                            to="/projects/$projectId"
                            params={{ projectId: app.project?.id ?? "" }}
                            className="truncate font-medium hover:text-primary"
                          >
                            {app.project?.title ?? "Removed project"}
                          </Link>
                          <p className="truncate text-xs text-muted-foreground">Applied {formatDate(app.created_at)}</p>
                        </div>
                        <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${appStatusStyles[app.status] ?? ""}`}>
                          {app.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="teams" className="mt-6">
              {teamsLoading ? (
                <p className="text-sm text-muted-foreground">Loading your teams…</p>
              ) : myTeams.length === 0 ? (
                <Card className="shadow-soft">
                  <CardContent className="flex flex-col items-start gap-3 pt-6">
                    <p className="text-sm text-muted-foreground">
                      You're not on a team yet. Apply to a project that matches your skills.
                    </p>
                    <Button asChild variant="outline">
                      <Link to="/projects">Explore projects</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2">
                  {myTeams.map((team) => (
                    <Card key={team.projectId} className="shadow-soft">
                      <CardContent className="space-y-3 pt-6">
                        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                          <div className="min-w-0">
                            <Link
                              to="/projects/$projectId"
                              params={{ projectId: team.projectId }}
                              className="block truncate font-semibold hover:text-primary"
                            >
                              {team.title}
                            </Link>
                            <p className="truncate text-xs text-muted-foreground">
                              {[team.category, `Joined ${formatDate(team.joinedAt)}`].filter(Boolean).join(" · ")}
                            </p>
                          </div>
                          {team.status && (
                            <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${statusStyles[team.status] ?? ""}`}>
                              {team.status}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <SkillBadgeList skills={[`Your role: ${team.role}`]} variant="accent" />
                          <SkillBadgeList skills={team.members.map((m) => (m.is_owner ? `${m.full_name ?? "Owner"} (owner)` : m.full_name ?? "Member")).slice(0, 4)} variant="outline" />
                          {team.members.length > 4 && (
                            <span className="text-xs text-muted-foreground">+{team.members.length - 4} more</span>
                          )}
                        </div>
                        <Button asChild variant="outline" size="sm" className="w-full">
                          <Link to="/projects/$projectId/team" params={{ projectId: team.projectId }}>View team</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </section>

        <aside className="min-w-0 space-y-6">
          <Card className="shadow-soft">
            <CardHeader className="flex-row items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <h2 className="text-base font-semibold">Recommended for you</h2>
            </CardHeader>
            <CardContent>
              {recsLoading ? (
                <p className="text-sm text-muted-foreground">Finding projects that match your skills…</p>
              ) : mySkillNames.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Add skills on your{" "}
                  <Link to="/profile" className="font-medium text-primary hover:underline">profile</Link>{" "}
                  to see project matches.
                </p>
              ) : recommendations.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No skill matches right now —{" "}
                  <Link to="/projects" className="font-medium text-primary hover:underline">browse all projects</Link>.
                </p>
              ) : (
                <ul className="space-y-4">
                  {recommendations.map((r) => (
                    <li key={r.id} className="space-y-1.5">
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-2">
                        <Link
                          to="/projects/$projectId"
                          params={{ projectId: r.id }}
                          className="min-w-0 truncate text-sm font-medium hover:text-primary"
                        >
                          {r.title}
                        </Link>
                        <span className="shrink-0 text-xs font-semibold text-primary">{r.match.pct}% match</span>
                      </div>
                      <div
                        className="h-1.5 w-full overflow-hidden rounded-full bg-secondary"
                        role="progressbar"
                        aria-label={`${r.match.pct}% skill match for ${r.title}`}
                        aria-valuenow={r.match.pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div className="h-full rounded-full bg-primary" style={{ width: `${r.match.pct}%` }} />
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {r.match.matched}/{r.match.total} skills · {r.category}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              <Button asChild variant="outline" className="mt-5 w-full">
                <Link to="/projects">See all projects</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex-row items-center gap-2">
              <Bell className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <h2 className="text-base font-semibold">Recent activity</h2>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <p className="text-sm text-muted-foreground">Loading your activity…</p>
              ) : activity.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nothing yet — apply to a project or create one and your activity will show up here.
                </p>
              ) : (
                <ul className="space-y-4">
                  {activity.map((a) => (
                    <li key={a.id} className="flex gap-3">
                      <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${activityDotStyles[a.kind]}`} />
                      <span className="min-w-0">
                        <span className="block text-sm">{a.text}</span>
                        <span className="block text-xs text-muted-foreground">{timeAgo(a.at)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
