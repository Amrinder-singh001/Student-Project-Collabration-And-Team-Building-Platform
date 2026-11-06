import { useState } from "react";
import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { registerSchema, colleges, courses, semesters, type RegisterValues } from "@/lib/auth-schemas";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create your account — ProjectConnect" },
      {
        name: "description",
        content:
          "Build a student profile on ProjectConnect, list your skills and get matched with project teams on your campus and beyond.",
      },
      { property: "og:title", content: "Create your account — ProjectConnect" },
      {
        property: "og:description",
        content: "List your skills and get matched with student project teams.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RegisterPage,
});

function FieldError({ message }: { message?: string | undefined }) {
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}

function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      college: "",
      course: "",
      semester: "",
    },
  });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = async (values: RegisterValues) => {
    setFormError(null);
    try {
      await signUp({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        college: values.college,
        course: values.course,
        semester: values.semester,
      });
      toast.success("Account created. Welcome to ProjectConnect!");
      await router.invalidate();
      navigate({ to: "/dashboard", replace: true });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not create your account.");
    }
  };

  return (
    <div className="container-page py-12 lg:py-16">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">Create your student profile</h1>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Two minutes now means the right teams can find you later.
          </p>
        </div>

        <Card className="mt-10 shadow-lift">
          <CardHeader>
            <h2 className="text-lg font-semibold">Account details</h2>
          </CardHeader>
          <CardContent>
            <form className="space-y-8" noValidate onSubmit={form.handleSubmit(onSubmit)}>
              {formError ? (
                <Alert variant="destructive">
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              ) : null}

              <fieldset className="space-y-5">
                <legend className="sr-only">Personal information</legend>
                <div className="space-y-2">
                  <Label htmlFor="full-name">Full name</Label>
                  <Input
                    id="full-name"
                    autoComplete="name"
                    aria-invalid={Boolean(errors.fullName)}
                    {...form.register("fullName")}
                  />
                  <FieldError message={errors.fullName?.message} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">College email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@college.edu"
                    aria-invalid={Boolean(errors.email)}
                    {...form.register("email")}
                  />
                  <FieldError message={errors.email?.message} />
                  <p className="text-xs text-muted-foreground">
                    We use this to verify you're a student. It stays private.
                  </p>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      autoComplete="new-password"
                      aria-invalid={Boolean(errors.password)}
                      {...form.register("password")}
                    />
                    <FieldError message={errors.password?.message} />
                    <p className="text-xs text-muted-foreground">
                      At least 8 characters, with an uppercase letter, a lowercase letter and a
                      number.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      autoComplete="new-password"
                      aria-invalid={Boolean(errors.confirmPassword)}
                      {...form.register("confirmPassword")}
                    />
                    <FieldError message={errors.confirmPassword?.message} />
                  </div>
                </div>
              </fieldset>

              <fieldset className="space-y-5">
                <legend className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Academic details
                </legend>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="college">College / University</Label>
                    <Controller
                      control={form.control}
                      name="college"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger id="college">
                            <SelectValue placeholder="Select college" />
                          </SelectTrigger>
                          <SelectContent>
                            {colleges.map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <FieldError message={errors.college?.message} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="course">Course</Label>
                    <Controller
                      control={form.control}
                      name="course"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger id="course">
                            <SelectValue placeholder="Select course" />
                          </SelectTrigger>
                          <SelectContent>
                            {courses.map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <FieldError message={errors.course?.message} />
                  </div>
                </div>
                <div className="space-y-2 sm:max-w-xs">
                  <Label htmlFor="semester">Semester</Label>
                  <Controller
                    control={form.control}
                    name="semester"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="semester">
                          <SelectValue placeholder="Select semester" />
                        </SelectTrigger>
                        <SelectContent>
                          {semesters.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FieldError message={errors.semester?.message} />
                </div>
              </fieldset>

              <div className="space-y-1">
                <div className="flex items-start gap-2">
                  <Controller
                    control={form.control}
                    name="terms"
                    render={({ field }) => (
                      <Checkbox
                        id="terms"
                        className="mt-0.5"
                        checked={field.value === true}
                        onCheckedChange={(checked) => field.onChange(checked === true)}
                      />
                    )}
                  />
                  <Label htmlFor="terms" className="text-sm font-normal text-muted-foreground">
                    I agree to the community code of conduct and terms of use.
                  </Label>
                </div>
                <FieldError message={errors.terms?.message} />
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                Create account
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="font-medium text-primary hover:underline">
                  Log in
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
