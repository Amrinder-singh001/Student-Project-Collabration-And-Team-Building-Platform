import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ProjectForm } from "@/components/ProjectForm";
import { useAuth } from "@/hooks/useAuth";
import { saveProject, uploadProjectImage } from "@/lib/projects";

export const Route = createFileRoute("/_authenticated/projects/new")({
  head: () => ({
    meta: [
      { title: "Create a project — ProjectConnect" },
      { name: "description", content: "Post a new student project and describe the skills and team you need." },
      { property: "og:title", content: "Create a project — ProjectConnect" },
      { property: "og:description", content: "Post a new student project on ProjectConnect." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewProjectPage,
});

function NewProjectPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="container-page max-w-3xl py-10">
      <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to dashboard
      </Link>
      <h1 className="mt-4 text-3xl font-bold">Create a project</h1>
      <p className="mt-2 text-muted-foreground">Fields marked * are required.</p>
      <Card className="mt-6 shadow-soft">
        <CardContent className="pt-6">
          <ProjectForm
            submitLabel="Create project"
            onSubmit={async (input, image) => {
              if (!user) return;
              try {
                const imagePath = image ? await uploadProjectImage(user.id, image) : null;
                await saveProject({ userId: user.id, input, imagePath });
                toast.success("Project created");
                void navigate({ to: "/dashboard" });
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Could not create the project.");
              }
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
