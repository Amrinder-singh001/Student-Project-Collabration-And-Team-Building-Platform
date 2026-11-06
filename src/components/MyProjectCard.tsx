import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Pencil, Trash2, Users, Clock, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Modal } from "@/components/Modal";
import { SkillBadge, SkillBadgeList } from "@/components/SkillBadge";
import { getAvatarUrl } from "@/lib/avatar";
import type { ProjectRow } from "@/lib/projects";

export function MyProjectCard({ project, onDelete }: { project: ProjectRow; onDelete: () => Promise<void> }) {
  const [img, setImg] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    void getAvatarUrl(project.image_path).then(setImg);
  }, [project.image_path]);

  return (
    <Card className="h-full overflow-hidden shadow-soft">
      <article className="flex h-full flex-col">
        {img && <img src={img} alt="" className="h-36 w-full object-cover" />}
        <CardHeader className="gap-2">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{project.category}</p>
              <h3 className="mt-1 truncate text-lg font-bold">{project.title}</h3>
            </div>
            <SkillBadge size="sm" variant="accent">{project.status}</SkillBadge>
          </div>
          <p className="line-clamp-2 text-sm text-muted-foreground">{project.description}</p>
        </CardHeader>
        <CardContent className="flex-1 space-y-4">
          <SkillBadgeList skills={project.skills.map((s) => s.name)} max={4} variant="primary" />
          <dl className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1"><Users className="h-3.5 w-3.5" aria-hidden="true" /><dt className="sr-only">Team size</dt><dd>{project.team_size}</dd></div>
            <div className="flex items-center gap-1"><Gauge className="h-3.5 w-3.5" aria-hidden="true" /><dt className="sr-only">Difficulty</dt><dd className="truncate">{project.difficulty}</dd></div>
            <div className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" aria-hidden="true" /><dt className="sr-only">Duration</dt><dd className="truncate">{project.duration}</dd></div>
          </dl>
        </CardContent>
        <CardFooter className="gap-2 border-t border-border pt-4">
          <Button asChild variant="outline" size="sm">
            <Link to="/projects/$projectId/edit" params={{ projectId: project.id }}>
              <Pencil className="h-4 w-4" aria-hidden="true" /> Edit
            </Link>
          </Button>
          <Modal
            title="Delete this project?"
            description={`"${project.title}" will be permanently removed.`}
            trigger={
              <Button variant="ghost" size="sm" className="text-destructive">
                <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete
              </Button>
            }
            footer={
              <Button
                variant="destructive"
                disabled={deleting}
                onClick={async () => {
                  setDeleting(true);
                  try { await onDelete(); } finally { setDeleting(false); }
                }}
              >
                {deleting ? "Deleting…" : "Delete project"}
              </Button>
            }
          >
            <p className="text-sm text-muted-foreground">This can't be undone.</p>
          </Modal>
        </CardFooter>
      </article>
    </Card>
  );
}
