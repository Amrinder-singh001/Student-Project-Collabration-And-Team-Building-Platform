import { useState } from "react";
import { Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Modal } from "@/components/Modal";
import { useAuth } from "@/hooks/useAuth";
import { REPORT_REASONS, reportProject, validateReport, type ReportReason } from "@/lib/admin";

export function ReportProjectButton({ projectId }: { projectId: string }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (!user) return null;

  const submit = async () => {
    const problem = validateReport(reason, details);
    if (problem) return setError(problem);
    setBusy(true);
    try {
      await reportProject(projectId, user.id, reason as ReportReason, details);
      toast.success("Thanks — an admin will review this project.");
      setOpen(false);
      setReason("");
      setDetails("");
      setError(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send the report.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={setOpen}
      title="Report this project"
      description="Tell us what's wrong. Reports are only visible to admins."
      trigger={
        <Button variant="ghost" size="sm" className="w-full text-muted-foreground">
          <Flag aria-hidden="true" /> Report project
        </Button>
      }
      footer={
        <>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" aria-hidden="true" /> : null} Send report
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="report-reason">Reason</Label>
          <Select value={reason} onValueChange={(v) => { setReason(v); setError(null); }}>
            <SelectTrigger id="report-reason"><SelectValue placeholder="Choose a reason" /></SelectTrigger>
            <SelectContent>
              {REPORT_REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="report-details">Details {reason === "Other" ? "" : "(optional)"}</Label>
          <Textarea id="report-details" maxLength={1000} value={details} onChange={(e) => setDetails(e.target.value)} />
        </div>
        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      </div>
    </Modal>
  );
}
