import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/NotificationBell";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "Home" },
  { to: "/projects", label: "Projects" },
  { to: "/saved", label: "Saved" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/profile", label: "Profile" },
  { to: "/about", label: "About" },
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <nav
        aria-label="Primary"
        className="container-page grid h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-4"
      >
        <Link
          to="/"
          className="flex min-w-0 items-center gap-2.5"
          aria-label="ProjectConnect home"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Rocket className="h-4.5 w-4.5" aria-hidden="true" />
          </span>
          <span className="truncate font-display text-lg font-bold tracking-tight">
            Project<span className="text-primary">Connect</span>
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <ul className="hidden items-center gap-1 lg:flex">
            {links.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  activeOptions={{ exact: link.to === "/" }}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  activeProps={{ className: "!text-foreground bg-secondary" }}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="ml-2 hidden items-center gap-2 md:flex">
            <NotificationBell />
            <Button asChild variant="ghost" size="sm">
              <Link to="/login">Log in</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/register">Join free</Link>
            </Button>
          </div>

          <div className="md:hidden">
            <NotificationBell />
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border lg:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      <div
        id="mobile-nav"
        className={cn(
          "overflow-hidden border-t border-border bg-background lg:hidden",
          open ? "block" : "hidden",
        )}
      >
        <ul className="container-page flex flex-col gap-1 py-4">
          {links.map((link) => (
            <li key={link.to}>
              <Link
                to={link.to}
                onClick={() => setOpen(false)}
                activeOptions={{ exact: link.to === "/" }}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                activeProps={{ className: "!text-foreground bg-secondary" }}
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li className="mt-2 grid grid-cols-2 gap-2">
            <Button asChild variant="outline" onClick={() => setOpen(false)}>
              <Link to="/login">Log in</Link>
            </Button>
            <Button asChild onClick={() => setOpen(false)}>
              <Link to="/register">Join free</Link>
            </Button>
          </li>
        </ul>
      </div>
    </header>
  );
}
