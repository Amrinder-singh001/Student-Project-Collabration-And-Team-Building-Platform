import { useState } from "react";
import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Rocket, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { loginSchema, type LoginValues } from "@/lib/auth-schemas";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } =>
    typeof search["redirect"] === "string" ? { redirect: search["redirect"] } : {},

  head: () => ({
    meta: [
      { title: "Log in — ProjectConnect" },
      {
        name: "description",
        content: "Sign in to ProjectConnect to manage your projects, teams and applications.",
      },
      { property: "og:title", content: "Log in — ProjectConnect" },
      {
        property: "og:description",
        content: "Access your student project dashboard, teams and applications.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function safePath(value: string | undefined): string {
  if (!value) return "/dashboard";
  return value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const router = useRouter();
  const search = Route.useSearch();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginValues) => {
    setFormError(null);
    try {
      await signIn(values.email, values.password);
      toast.success("Welcome back!");
      await router.invalidate();
      navigate({ to: safePath(search.redirect), replace: true });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not log you in.");
    }
  };

  return (
    <div className="container-page grid min-h-[calc(100vh-4rem)] items-center py-12 lg:grid-cols-2 lg:gap-16">
      <section className="hidden lg:block">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
          <Rocket className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="mt-6 text-4xl font-bold leading-tight">
          Welcome back to your <span className="text-primary">build crew</span>
        </h1>
        <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">
          Pick up where your team left off — review applications, track milestones and keep
          shipping.
        </p>
        <ul className="mt-8 space-y-3 text-sm text-muted-foreground">
          {[
            "Skill-matched teammate suggestions",
            "One place for roles, milestones and updates",
            "A portfolio that grows with every project",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <Card className="mx-auto w-full max-w-md shadow-lift">
        <CardHeader className="gap-2">
          <h2 className="text-2xl font-bold">Log in</h2>
          <p className="text-sm text-muted-foreground">Use your college email to continue.</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" noValidate onSubmit={form.handleSubmit(onSubmit)}>
            {formError ? (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@college.edu"
                aria-invalid={Boolean(form.formState.errors.email)}
                {...form.register("email")}
              />
              {form.formState.errors.email ? (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={Boolean(form.formState.errors.password)}
                {...form.register("password")}
              />
              {form.formState.errors.password ? (
                <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
              ) : null}
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : null}
              Log in
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              New to ProjectConnect?{" "}
              <Link to="/register" className="font-medium text-primary hover:underline">
                Create an account
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
