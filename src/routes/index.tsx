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
import heroImage from "@/assets/students-team-laptops.jpg";
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
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(var(--color-ink-foreground)_1px,transparent_1px),linear-gradient(90deg,var(--color-ink-foreground)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
        />
        <div className="container-page relative grid gap-14 pb-24 pt-14 sm:pt-20 lg:grid-cols-[1.02fr_1fr] lg:items-center lg:gap-16 lg:pb-28 lg:pt-24">
          <div className="min-w-0">
            <SkillBadge className="glass-ink border-ink-foreground/20 bg-ink-foreground/10 px-3.5 py-1.5 text-ink-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_10px_var(--color-accent)]" aria-hidden="true" />
              For college builders, everywhere
            </SkillBadge>
            <h1 className="mt-6 text-[2.6rem] font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-6xl lg:text-[4.25rem]">
              Find Your Team.
              <br />
              <span className="text-gradient">Build Something Great.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-foreground/72 sm:text-lg">
              ProjectConnect is where students turn late-night ideas into shipped products —
              match on skills, join real projects and collaborate with people who actually
              show up.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
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
                className="glass-ink border-ink-foreground/20 bg-ink-foreground/10 text-ink-foreground hover:border-ink-foreground/30 hover:bg-ink-foreground/15 hover:text-ink-foreground"
              >
                <Link to="/register">Create your profile</Link>
              </Button>
            </div>
            <dl className="glass-ink mt-11 grid max-w-lg grid-cols-3 divide-x divide-ink-foreground/12 rounded-2xl border py-4">
              {[
                { value: "4,800+", label: "Student builders" },
                { value: "1,200+", label: "Active projects" },
                { value: "62", label: "Campuses" },
              ].map((s) => (
                <div key={s.label} className="min-w-0 px-4 sm:px-5">
                  <dt className="sr-only">{s.label}</dt>
                  <dd>
                    <span className="block font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                      {s.value}
                    </span>
                    <span className="mt-1 block text-xs text-ink-foreground/60">{s.label}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative min-w-0">
            <div
              aria-hidden="true"
              className="absolute -inset-6 rounded-[2.5rem] bg-primary/30 blur-3xl"
            />
            <div className="glass-ink relative rounded-[2rem] border p-2 shadow-lift">
              <div className="overflow-hidden rounded-[1.6rem]">
                <img
                  src={heroImage}
                  width={1600}
                  height={906}
                  alt="Four university students collaborating on a project around their laptops"
                  className="aspect-[4/3] h-full w-full object-cover transition-transform duration-700 ease-out hover:scale-[1.03]"
                />
              </div>
            </div>
            <div className="glass-strong absolute -bottom-7 left-4 hidden w-64 rounded-2xl border p-4 transition-transform duration-300 hover:-translate-y-1 sm:block">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Match found
              </p>
              <p className="mt-1 text-sm font-semibold text-card-foreground">
                94% fit · Backend Engineer
              </p>
              <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div className="h-full w-[94%] rounded-full bg-gradient-primary" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container-page py-16 lg:py-24" aria-labelledby="how-it-works">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
            How it works
          </p>
          <h2 id="how-it-works" className="mt-3 text-3xl font-extrabold tracking-[-0.03em] sm:text-[2.6rem] sm:leading-[1.1]">
            Three steps from idea to team
          </h2>
        </div>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((step, i) => (
            <li key={step.title}>
              <Card className="card-hover h-full">
                <CardHeader className="gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
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
      <section className="border-y border-[color:var(--glass-border)] bg-[color:var(--glass)] py-16 backdrop-blur-sm lg:py-24" aria-labelledby="featured">
        <div className="container-page">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                Recruiting now
              </p>
              <h2 id="featured" className="mt-3 text-3xl font-extrabold tracking-[-0.03em] sm:text-[2.6rem] sm:leading-[1.1]">
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
            <p className="mt-10 text-sm text-muted-foreground">Loading projects…</p>
          ) : featured.length === 0 ? (
            <Card className="mt-10">
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
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
            Why ProjectConnect
          </p>
          <h2 id="why" className="mt-3 text-3xl font-extrabold tracking-[-0.03em] sm:text-[2.6rem] sm:leading-[1.1]">
            Everything a student team needs, in one place
          </h2>
        </div>
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <li key={f.title}>
              <Card className="card-hover h-full">
                <CardHeader className="gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl border border-accent/25 bg-accent/15 text-accent-foreground">
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
        <div className="surface-hero relative grid gap-6 overflow-hidden rounded-[2rem] px-6 py-14 text-center shadow-lift sm:px-12 lg:py-20">
          <h2 className="text-3xl font-extrabold tracking-[-0.03em] sm:text-[2.6rem]">Your next team is one click away</h2>
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
              className="glass-ink border-ink-foreground/20 bg-ink-foreground/10 text-ink-foreground hover:border-ink-foreground/30 hover:bg-ink-foreground/15 hover:text-ink-foreground"
            >
              <Link to="/about">Learn more</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
