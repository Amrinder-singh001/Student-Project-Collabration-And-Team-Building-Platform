import { createFileRoute, Link } from "@tanstack/react-router";
import { Target, HeartHandshake, Globe2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About ProjectConnect — Student Team Building Platform" },
      {
        name: "description",
        content:
          "Why we built ProjectConnect: a verified, skill-first place for college students to find teammates and ship real projects together.",
      },
      { property: "og:title", content: "About ProjectConnect" },
      {
        property: "og:description",
        content:
          "A skill-first collaboration platform helping student builders find teammates and finish real projects.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

const values = [
  {
    icon: Target,
    title: "Skills over titles",
    text: "What you can build matters more than your year, branch or CGPA. Profiles lead with proof of work.",
  },
  {
    icon: HeartHandshake,
    title: "Teams that finish",
    text: "Clear roles, honest commitment levels and visible milestones so projects actually reach the finish line.",
  },
  {
    icon: Globe2,
    title: "Open to every campus",
    text: "Cross-college teams are a feature, not an exception. Great collaborators shouldn't be limited by geography.",
  },
];

const timeline = [
  { year: "2024", text: "Started as a spreadsheet of teammates for a single hackathon." },
  { year: "2025", text: "Opened to five campuses, 600 students formed 120 teams." },
  { year: "2026", text: "ProjectConnect launches as a full collaboration platform." },
];

function AboutPage() {
  return (
    <div>
      <section className="surface-hero">
        <div className="container-page py-16 lg:py-20">
          <p className="text-sm font-semibold uppercase tracking-wider text-ink-foreground/70">
            About us
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
            We believe the best student work happens in teams
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-foreground/75 sm:text-lg">
            Most great campus ideas die because the right three people never met. ProjectConnect
            exists to close that gap — a verified, skill-first network where students find
            collaborators and build things worth putting their name on.
          </p>
        </div>
      </section>

      <section className="container-page py-16 lg:py-24" aria-labelledby="mission">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr]">
          <div className="min-w-0">
            <h2 id="mission" className="text-3xl font-bold sm:text-4xl">
              Our mission
            </h2>
            <p className="mt-5 leading-relaxed text-muted-foreground">
              Give every student, regardless of college or network, an equal shot at joining a
              team that pushes them. We do that by making skills, availability and open roles
              transparent — then getting out of the way so teams can build.
            </p>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              ProjectConnect is built and maintained by students who got tired of asking
              "anyone free for a project?" in group chats that nobody reads.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/register">Join the community</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/projects">Browse projects</Link>
              </Button>
            </div>
          </div>

          <ul className="grid gap-6 sm:grid-cols-2">
            {values.map((v) => (
              <li key={v.title}>
                <Card className="h-full shadow-soft">
                  <CardHeader className="gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                      <v.icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h3 className="text-base font-semibold">{v.title}</h3>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-muted-foreground">{v.text}</p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-secondary/40 py-16 lg:py-24" aria-labelledby="story">
        <div className="container-page">
          <h2 id="story" className="text-3xl font-bold sm:text-4xl">
            How we got here
          </h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {timeline.map((t) => (
              <li key={t.year} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                <p className="font-display text-3xl font-bold text-primary">{t.year}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
