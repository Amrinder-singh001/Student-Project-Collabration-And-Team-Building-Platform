import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Search,
  Users2,
  Sparkles,
  ShieldCheck,
  Rocket,
  MessageSquare,
  Trophy,
} from "lucide-react";
import heroImage from "@/assets/hero-students.jpg";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DiscoveryCard } from "@/components/DiscoveryCard";
import { SkillBadge } from "@/components/SkillBadge";
import { discoveryQuery } from "@/lib/discovery";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ProjectConnect — Find Your Team. Build Something Great." },
      {
        name: "description",
        content:
          "ProjectConnect helps college students find teammates by skill, launch project ideas and build real products together.",
      },
      { property: "og:title", content: "ProjectConnect — Find Your Team. Build Something Great." },
      {
        property: "og:description",
        content:
          "Discover student projects, match on skills and form the team that ships your next big idea.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

const steps = [
  {
    icon: Sparkles,
    title: "Build your skill profile",
    text: "Add your stack, interests and weekly availability so the right teams can find you.",
  },
  {
    icon: Search,
    title: "Explore live projects",
    text: "Filter by skill, category and commitment. See exactly which roles are still open.",
  },
  {
    icon: Users2,
    title: "Form your team",
    text: "Apply, get accepted and move into a shared workspace with milestones and updates.",
  },
];

const features = [
  {
    icon: ShieldCheck,
    title: "Verified student network",
    text: "Every profile is tied to a college email, so you always know who you're teaming up with.",
  },
  {
    icon: Rocket,
    title: "Skill-based matching",
    text: "Our matcher ranks teammates on overlapping stacks, availability and project category.",
  },
  {
    icon: MessageSquare,
    title: "Built-in collaboration",
    text: "Roles, milestones and updates live next to your project so nothing gets lost in chats.",
  },
  {
    icon: Trophy,
    title: "A portfolio that counts",
    text: "Finished projects turn into shareable case studies for internships and placements.",
  },
];

function HomePage() {
  const { data: allProjects = [], isLoading: projectsLoading } = useQuery(discoveryQuery);
  const featured = allProjects.slice(0, 3);

  return (
    <div>
      {/* Hero */}
      <section className="surface-hero relative overflow-hidden">
        <div className="container-page grid gap-12 py-16 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:py-24">
          <div className="min-w-0">
            <SkillBadge className="border-ink-foreground/20 bg-ink-foreground/10 text-ink-foreground">
              For college builders, everywhere
            </SkillBadge>
            <h1 className="mt-5 text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl">
              Find Your Team.
              <br />
              <span className="text-gradient">Build Something Great.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-foreground/75 sm:text-lg">
              ProjectConnect is where students turn late-night ideas into shipped products —
              match on skills, join real projects and collaborate with people who actually
              show up.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link to="/projects">
                  Explore projects
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-ink-foreground/25 bg-transparent text-ink-foreground hover:bg-ink-foreground/10 hover:text-ink-foreground"
              >
                <Link to="/register">Create your profile</Link>
              </Button>
            </div>
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6">
              {[
                { value: "4,800+", label: "Student builders" },
                { value: "1,200+", label: "Active projects" },
                { value: "62", label: "Campuses" },
              ].map((s) => (
                <div key={s.label} className="min-w-0">
                  <dt className="sr-only">{s.label}</dt>
                  <dd>
                    <span className="block font-display text-2xl font-bold sm:text-3xl">
                      {s.value}
                    </span>
                    <span className="mt-1 block text-xs text-ink-foreground/65">{s.label}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative min-w-0">
            <div className="overflow-hidden rounded-3xl border border-ink-foreground/15 shadow-lift">
              <img
                src={heroImage}
                width={1536}
                height={1024}
                alt="Students collaborating on a project around a laptop"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 left-4 hidden w-64 rounded-2xl border border-border bg-card p-4 shadow-lift sm:block">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Match found
              </p>
              <p className="mt-1 text-sm font-semibold text-card-foreground">
                94% fit · Backend Engineer
              </p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div className="h-full w-[94%] rounded-full bg-primary" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container-page py-16 lg:py-24" aria-labelledby="how-it-works">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            How it works
          </p>
          <h2 id="how-it-works" className="mt-3 text-3xl font-bold sm:text-4xl">
            Three steps from idea to team
          </h2>
        </div>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((step, i) => (
            <li key={step.title}>
              <Card className="h-full shadow-soft">
                <CardHeader className="gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                    <step.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="text-lg font-semibold">
                    <span className="mr-2 text-muted-foreground">0{i + 1}</span>
                    {step.title}
                  </h3>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">{step.text}</p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      {/* Featured projects */}
      <section className="bg-secondary/40 py-16 lg:py-24" aria-labelledby="featured">
        <div className="container-page">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                Recruiting now
              </p>
              <h2 id="featured" className="mt-3 text-3xl font-bold sm:text-4xl">
                Projects looking for teammates
              </h2>
            </div>
            <Button asChild variant="outline">
              <Link to="/projects">
                See all projects
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
          {projectsLoading ? (
            <p className="text-sm text-muted-foreground">Loading projects…</p>
          ) : featured.length === 0 ? (
            <Card className="shadow-soft">
              <CardContent className="flex flex-col items-start gap-3 pt-6">
                <p className="text-sm text-muted-foreground">
                  No projects have been posted yet — be the first to share one.
                </p>
                <Button asChild>
                  <Link to="/register">Create your profile</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {featured.map((project) => (
                <DiscoveryCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="container-page py-16 lg:py-24" aria-labelledby="why">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Why ProjectConnect
          </p>
          <h2 id="why" className="mt-3 text-3xl font-bold sm:text-4xl">
            Everything a student team needs, in one place
          </h2>
        </div>
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <li key={f.title}>
              <Card className="h-full shadow-soft">
                <CardHeader className="gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent/15 text-accent-foreground">
                    <f.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="text-base font-semibold">{f.title}</h3>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">{f.text}</p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      {/* CTA */}
      <section className="container-page pb-8">
        <div className="surface-hero grid gap-6 rounded-3xl px-6 py-12 text-center shadow-lift sm:px-12 lg:py-16">
          <h2 className="text-3xl font-bold sm:text-4xl">Your next team is one click away</h2>
          <p className="mx-auto max-w-xl text-ink-foreground/75">
            Join thousands of students turning coursework, hackathon hacks and side ideas into
            real, shipped products.
          </p>
          <div className="mx-auto flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg">
              <Link to="/register">Get started free</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-ink-foreground/25 bg-transparent text-ink-foreground hover:bg-ink-foreground/10 hover:text-ink-foreground"
            >
              <Link to="/about">Learn more</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
