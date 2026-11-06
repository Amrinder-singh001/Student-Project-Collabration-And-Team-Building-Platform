import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  MapPin,
  GraduationCap,
  Clock,
  Github,
  Globe,
  Code2,
  Braces,
  Terminal,
  Trophy,
  Pencil,
  Camera,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Modal } from "@/components/Modal";
import { AvatarEditor } from "@/components/AvatarEditor";
import { ProfilePhotoViewer } from "@/components/ProfilePhotoViewer";
import { SkillBadge } from "@/components/SkillBadge";
import { SkillManager } from "@/components/SkillManager";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AVATAR_BUCKET, getAvatarUrl, initialsFrom } from "@/lib/avatar";
import { colleges, courses, semesters } from "@/lib/auth-schemas";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your student profile — ProjectConnect" },
      {
        name: "description",
        content:
          "Manage your ProjectConnect profile: bio, college, course, semester, links and the skills you bring to a team.",
      },
      { property: "og:title", content: "Your student profile — ProjectConnect" },
      {
        property: "og:description",
        content: "Bio, college details, links and skills for a student builder.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, profile, skills, refreshProfile, loading } = useAuth();
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    full_name: "",
    bio: "",
    college: "",
    course: "",
    semester: "",
    github_url: "",
    portfolio_url: "",
    leetcode_url: "",
    hackerrank_url: "",
    gfg_url: "",
    codechef_url: "",
  });

  useEffect(() => {
    if (!profile) return;
    setForm({
      full_name: profile.full_name ?? "",
      bio: profile.bio ?? "",
      college: profile.college ?? "",
      course: profile.course ?? "",
      semester: profile.semester ?? "",
      github_url: profile.github_url ?? "",
      portfolio_url: profile.portfolio_url ?? "",
      leetcode_url: profile.leetcode_url ?? "",
      hackerrank_url: profile.hackerrank_url ?? "",
      gfg_url: profile.gfg_url ?? "",
      codechef_url: profile.codechef_url ?? "",
    });
  }, [profile]);

  useEffect(() => {
    let active = true;
    void getAvatarUrl(profile?.avatar_url ?? null).then((url) => {
      if (active) setAvatarSrc(url);
    });
    return () => {
      active = false;
    };
  }, [profile?.avatar_url]);

  async function saveProfile() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name.trim(),
        bio: form.bio.trim() || null,
        college: form.college || null,
        course: form.course || null,
        semester: form.semester || null,
        github_url: form.github_url.trim() || null,
        portfolio_url: form.portfolio_url.trim() || null,
        leetcode_url: form.leetcode_url.trim() || null,
        hackerrank_url: form.hackerrank_url.trim() || null,
        gfg_url: form.gfg_url.trim() || null,
        codechef_url: form.codechef_url.trim() || null,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refreshProfile();
    setEditOpen(false);
    toast.success("Profile updated.");
  }

  function selectAvatar(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB.");
      return;
    }
    setPendingPhoto(file);
  }

  async function uploadAvatar(file: File): Promise<boolean> {
    if (!user) return false;
    setUploading(true);
    try {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) {
      setUploading(false);
      toast.error(uploadError.message);
      return false;
    }
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: path })
      .eq("id", user.id);
    setUploading(false);
    if (error) {
      toast.error(error.message);
      return false;
    }
    await refreshProfile();
    toast.success("Profile photo updated.");
    return true;
    } finally {
      setUploading(false);
    }
  }

  if (loading && !profile) {
    return <div className="container-page py-16 text-muted-foreground">Loading your profile…</div>;
  }

  const name = profile?.full_name || "Your profile";

  const linkItems = [
    { label: "GitHub", url: profile?.github_url, icon: Github },
    { label: "Portfolio", url: profile?.portfolio_url, icon: Globe },
    { label: "LeetCode", url: profile?.leetcode_url, icon: Code2 },
    { label: "HackerRank", url: profile?.hackerrank_url, icon: Braces },
    { label: "GeeksforGeeks", url: profile?.gfg_url, icon: Terminal },
    { label: "CodeChef", url: profile?.codechef_url, icon: Trophy },
  ].filter((l): l is { label: string; url: string; icon: typeof Github } => Boolean(l.url));

  return (
    <div>
      {pendingPhoto ? (
        <AvatarEditor file={pendingPhoto} onCancel={() => setPendingPhoto(null)} onSave={uploadAvatar} />
      ) : null}
      <section className="surface-hero">
        <div className="container-page py-12">
          <div className="grid gap-6 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
            <div className="relative h-20 w-20 shrink-0">
              {avatarSrc ? (
                <ProfilePhotoViewer
                  src={avatarSrc}
                  name={name}
                  className="h-20 w-20 rounded-2xl"
                />
              ) : (
                <span className="grid h-20 w-20 place-items-center rounded-2xl bg-ink-foreground/10 font-display text-2xl font-bold">
                  {initialsFrom(profile?.full_name)}
                </span>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                aria-label="Change profile photo"
                className="absolute -bottom-2 -right-2 grid h-8 w-8 place-items-center rounded-full border border-ink-foreground/20 bg-ink-foreground/15 backdrop-blur transition-colors hover:bg-ink-foreground/25 disabled:opacity-50"
              >
                <Camera className="h-4 w-4" aria-hidden="true" />
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) selectAvatar(file);
                  e.target.value = "";
                }}
              />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-3xl font-bold sm:text-4xl">{name}</h1>
              <p className="mt-2 text-ink-foreground/75">
                {profile?.bio || "Add a short bio so teammates know what you build."}
              </p>
              <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-foreground/70">
                <li className="flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {profile?.course || "Course not set"}
                </li>
                <li className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {profile?.college || "College not set"}
                </li>
                <li className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {profile?.semester || "Semester not set"}
                </li>
              </ul>
            </div>

            <div className="flex flex-wrap gap-2 sm:shrink-0">
              <Modal
                open={editOpen}
                onOpenChange={setEditOpen}
                title="Edit profile"
                description="Your details are saved to your account."
                trigger={
                  <Button variant="secondary">
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                    Edit profile
                  </Button>
                }
                footer={
                  <Button disabled={saving} onClick={() => void saveProfile()}>
                    {saving ? "Saving…" : "Save changes"}
                  </Button>
                }
              >
                <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Full name</Label>
                    <Input
                      id="edit-name"
                      value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-bio">Bio</Label>
                    <Textarea
                      id="edit-bio"
                      rows={4}
                      placeholder="What you build, what you're looking for."
                      value={form.bio}
                      onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-college">College / University</Label>
                    <Select
                      value={form.college}
                      onValueChange={(v) => setForm({ ...form, college: v })}
                    >
                      <SelectTrigger id="edit-college">
                        <SelectValue placeholder="Select your college" />
                      </SelectTrigger>
                      <SelectContent>
                        {colleges.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-course">Course</Label>
                    <Select
                      value={form.course}
                      onValueChange={(v) => setForm({ ...form, course: v })}
                    >
                      <SelectTrigger id="edit-course">
                        <SelectValue placeholder="Select your course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-semester">Semester</Label>
                    <Select
                      value={form.semester}
                      onValueChange={(v) => setForm({ ...form, semester: v })}
                    >
                      <SelectTrigger id="edit-semester">
                        <SelectValue placeholder="Select your semester" />
                      </SelectTrigger>
                      <SelectContent>
                        {semesters.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-github">GitHub URL</Label>
                    <Input
                      id="edit-github"
                      type="url"
                      placeholder="https://github.com/username"
                      value={form.github_url}
                      onChange={(e) => setForm({ ...form, github_url: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-portfolio">Portfolio URL</Label>
                    <Input
                      id="edit-portfolio"
                      type="url"
                      placeholder="https://yourportfolio.com"
                      value={form.portfolio_url}
                      onChange={(e) => setForm({ ...form, portfolio_url: e.target.value })}
                    />
                  </div>
                  <p className="pt-1 text-sm font-semibold text-muted-foreground">Coding profiles</p>
                  <div className="space-y-2">
                    <Label htmlFor="edit-leetcode">LeetCode URL</Label>
                    <Input
                      id="edit-leetcode"
                      type="url"
                      placeholder="https://leetcode.com/username"
                      value={form.leetcode_url}
                      onChange={(e) => setForm({ ...form, leetcode_url: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-hackerrank">HackerRank URL</Label>
                    <Input
                      id="edit-hackerrank"
                      type="url"
                      placeholder="https://www.hackerrank.com/username"
                      value={form.hackerrank_url}
                      onChange={(e) => setForm({ ...form, hackerrank_url: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-gfg">GeeksforGeeks URL</Label>
                    <Input
                      id="edit-gfg"
                      type="url"
                      placeholder="https://www.geeksforgeeks.org/user/username"
                      value={form.gfg_url}
                      onChange={(e) => setForm({ ...form, gfg_url: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-codechef">CodeChef URL</Label>
                    <Input
                      id="edit-codechef"
                      type="url"
                      placeholder="https://www.codechef.com/users/username"
                      value={form.codechef_url}
                      onChange={(e) => setForm({ ...form, codechef_url: e.target.value })}
                    />
                  </div>
                </div>
              </Modal>
            </div>
          </div>
        </div>
      </section>

      <div className="container-page grid gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-8">
          <Card className="shadow-soft">
            <CardHeader>
              <h2 className="text-lg font-bold">About</h2>
            </CardHeader>
            <CardContent>
              <p className="leading-relaxed text-muted-foreground">
                {profile?.bio || "You haven't written a bio yet. Use “Edit profile” to add one."}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="gap-1">
              <h2 className="text-lg font-bold">Skills</h2>
              <p className="text-sm text-muted-foreground">
                Search the skill library, then add or remove what fits you.
              </p>
            </CardHeader>
            <CardContent>
              <SkillManager />
            </CardContent>
          </Card>
        </div>

        <aside className="min-w-0 space-y-6">
          <Card className="shadow-soft">
            <CardHeader>
              <h2 className="text-base font-semibold">Links</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              {linkItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No links yet — add GitHub, portfolio and coding profiles via “Edit profile”.
                </p>
              ) : (
                linkItems.map((l) => (
                  <a
                    key={l.label}
                    href={l.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="flex items-center gap-2 text-sm font-medium hover:text-primary"
                  >
                    <l.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{l.label}</span>
                  </a>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex-row items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <h2 className="text-base font-semibold">Skill snapshot</h2>
            </CardHeader>
            <CardContent>
              {skills.length === 0 ? (
                <p className="text-sm text-muted-foreground">Add skills to complete your profile.</p>
              ) : (
                <ul className="flex flex-wrap gap-1.5">
                  {skills.map((s) => (
                    <li key={s.id}>
                      <SkillBadge size="sm" variant="accent">
                        {s.name}
                      </SkillBadge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="gap-1">
              <h2 className="text-base font-semibold">Looking for a team?</h2>
              <p className="text-sm text-muted-foreground">
                Browse projects that match your stack.
              </p>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link to="/projects">Explore projects</Link>
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
