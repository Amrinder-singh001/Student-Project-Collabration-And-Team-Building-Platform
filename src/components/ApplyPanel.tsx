import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/Modal";
import { SkillBadge } from "@/components/SkillBadge";
import { useAuth } from "@/hooks/useAuth";
import { applicationSchema, appStatusStyles, formatDate, getMyApplication, submitApplication } from "@/lib/applications";

type Field = "motivation" | "relevantSkills" | "contribution";

export function ApplyPanel({ projectId, full }: { projectId: string; full: boolean }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [values, setValues] = useState<Record<Field, string>>({ motivation: "", relevantSkills: "", contribution: "" });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});

  const { data: mine, isLoading } = useQuery({
    queryKey: ["my-application", projectId, user?.id],
    queryFn: () => getMyApplication(projectId, user!.id),
    enabled: !!user,
  });

  if (!user)
    return (
      <Button asChild className="w-full">
        <Link to="/login" search={{ redirect: `/projects/${projectId}` }}>Log in to apply</Link>
      </Button>
    );
  if (isLoading) return <Button className="w-full" disabled>Loading…</Button>;
  if (mine)
    return (
      <div className="flex items-center justify-between gap-2 rounded-xl bg-secondary/60 p-3 text-sm">
        <span>Applied {formatDate(mine.created_at)}</span>
        <SkillBadge size="sm" className={appStatusStyles[mine.status] ?? ""}>{mine.status}</SkillBadge>
      </div>
    );
  if (full) return <Button className="w-full" disabled>Team is full</Button>;

  const submit = async () => {
    const parsed = applicationSchema.safeParse(values);
    if (!parsed.success) {
      const e: Partial<Record<Field, string>> = {};
      for (const i of parsed.error.issues) e[i.path[0] as Field] ??= i.message;
      setErrors(e);
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      await submitApplication(projectId, user.id, parsed.data);
      toast.success("Application sent! The owner will review it.");
      setOpen(false);
      void qc.invalidateQueries({ queryKey: ["my-application", projectId] });
      void qc.invalidateQueries({ queryKey: ["my-applications"] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const fields: { id: Field; label: string; placeholder: string }[] = [
    { id: "motivation", label: "Why do you want to join?", placeholder: "What excites you about this project?" },
    { id: "relevantSkills", label: "Relevant skills", placeholder: "e.g. React, Node.js, Figma" },
    { id: "contribution", label: "What can you contribute?", placeholder: "Tasks or areas you'd take ownership of" },
  ];

  return (
    <Modal
      open={open}
      onOpenChange={setOpen}
      title="Apply to join"
      description="Tell the project owner why you'd be a great teammate."
      trigger={<Button className="w-full">Apply to Join</Button>}
      footer={<Button onClick={submit} disabled={busy}>{busy ? "Sending…" : "Submit application"}</Button>}
    >
      <div className="space-y-4">
        {fields.map((f) => (
          <div key={f.id} className="space-y-1.5">
            <Label htmlFor={f.id}>{f.label}</Label>
            <Textarea
              id={f.id}
              rows={f.id === "relevantSkills" ? 2 : 3}
              placeholder={f.placeholder}
              value={values[f.id]}
              aria-invalid={!!errors[f.id]}
              aria-describedby={errors[f.id] ? `${f.id}-err` : undefined}
              onChange={(e) => setValues((v) => ({ ...v, [f.id]: e.target.value }))}
            />
            {errors[f.id] && <p id={`${f.id}-err`} className="text-xs text-destructive">{errors[f.id]}</p>}
          </div>
        ))}
      </div>
    </Modal>
  );
}
