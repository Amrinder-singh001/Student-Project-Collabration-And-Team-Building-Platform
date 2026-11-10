import { Link } from "@tanstack/react-router";
import { Rocket, Github, Twitter, Linkedin } from "lucide-react";

const columns = [
  {
    title: "Platform",
    links: [
      { to: "/projects", label: "Explore projects" },
      { to: "/dashboard", label: "Dashboard" },
      { to: "/profile", label: "Student profile" },
    ],
  },
  {
    title: "Company",
    links: [
      { to: "/about", label: "About us" },
      { to: "/register", label: "Create account" },
      { to: "/login", label: "Sign in" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="mt-24 border-t border-[color:var(--glass-border)] bg-[color:var(--glass)] backdrop-blur-xl">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary bg-gradient-primary text-primary-foreground shadow-glow">
              <Rocket className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <span className="font-display text-lg font-extrabold tracking-tight">
              Project<span className="text-primary">Connect</span>
            </span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Find your team. Build something great. The collaboration home for student
            builders, designers and researchers.
          </p>
          <ul className="mt-5 flex items-center gap-3">
            {[
              { icon: Github, label: "GitHub" },
              { icon: Twitter, label: "Twitter" },
              { icon: Linkedin, label: "LinkedIn" },
            ].map(({ icon: Icon, label }) => (
              <li key={label}>
                <a
                  href="#"
                  aria-label={label}
                  className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:text-primary"
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title} className="min-w-0">
            <h2 className="font-display text-xs font-bold uppercase tracking-[0.14em] text-foreground">
              {col.title}
            </h2>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-muted-foreground transition-colors duration-200 hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className="min-w-0">
          <h2 className="font-display text-xs font-bold uppercase tracking-[0.14em] text-foreground">
            Campus digest
          </h2>
          <p className="mt-4 text-sm text-muted-foreground">
            New projects worth joining, once a week.
          </p>
          <form
            className="mt-4 flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => e.preventDefault()}
          >
            <label htmlFor="footer-email" className="sr-only">
              Email address
            </label>
            <input
              id="footer-email"
              type="email"
              placeholder="you@college.edu"
              className="h-10 w-full min-w-0 rounded-xl border border-input bg-card px-3.5 text-sm outline-none backdrop-blur-md transition-[border-color,box-shadow] focus-visible:border-primary/60 focus-visible:ring-4 focus-visible:ring-ring/15"
            />
            <button
              type="submit"
              className="h-10 shrink-0 cursor-pointer rounded-xl bg-primary bg-gradient-primary px-4 text-sm font-semibold text-primary-foreground shadow-glow transition-all duration-200 hover:-translate-y-px hover:brightness-110 active:scale-[0.98]"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>

      <div className="border-t border-[color:var(--glass-border)]">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} ProjectConnect. Built by students.</p>
          <p>Privacy · Terms · Code of conduct</p>
        </div>
      </div>
    </footer>
  );
}
