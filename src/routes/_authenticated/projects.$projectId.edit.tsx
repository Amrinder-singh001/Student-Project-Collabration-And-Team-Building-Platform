import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ProjectForm } from "@/components/ProjectForm";
import { useAuth } from "@/hooks/useAuth";
import { getProject, saveProject, uploadProjectImage, type ProjectRow } from "@/lib/projects";

export const Route = createFileRoute("/_authenticated/projects/$projectId/edit")({
  head: () => ({
    meta: [
      { title: "Edit project — ProjectConnect" },
      { name: "description", content: "Update your project's details, skills and status." },
      { property: "og:title", content: "Edit project — ProjectConnect" },
      { property: "og:description", content: "Update your ProjectConnect project." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EditProjectPage,
});

function EditProjectPage() {
  const { projectId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectRow | null | undefined>(undefined);

  useEffect(() => {
    getProject(projectId).then(setProject).catch(() => setProject(null));
  }, [projectId]);

  let body: React.ReactNode;
  if (project === undefined) body = <p className="text-muted-foreground">Loading project…</p>;
  else if (!project || project.owner_id !== user?.id)
    body = <p className="text-muted-foreground">This project doesn't exist or you can't edit it.</p>;
  else
    body = (
      <ProjectForm
        initial={project}
        submitLabel="Save changes"
        onSubmit={async (input, image) => {
          try {
            const imagePath = image ? await uploadProjectImage(project.owner_id, image) : project.image_path;
            await saveProject({ userId: project.owner_id, projectId: project.id, input, imagePath });
            toast.success("Project updated");
            void navigate({ to: "/dashboard" });
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Could not save changes.");
          }
        }}
      />
    );

  return (
    <div className="container-page max-w-3xl py-10">
      <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to dashboard
      </Link>
      <h1 className="mt-4 text-3xl font-bold">Edit project</h1>
      <Card className="mt-6 shadow-soft">
        <CardContent className="pt-6">{body}</CardContent>
      </Card>
    </div>
  );
}
