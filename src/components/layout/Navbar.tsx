import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, Rocket, Sun, Moon, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/NotificationBell";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { toast } from "sonner";

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
  const [signingOut, setSigningOut] = useState(false);
  const { isAuthenticated, loading, signOut, role } = useAuth();
  const navLinks = role === "admin" ? [...links, { to: "/admin", label: "Admin" } as const] : links;
  const { theme, toggleTheme } = useTheme();
  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not log you out. Please try again.");
    } finally {
      setSigningOut(false);
    }
  };
  const authControls = isAuthenticated ? (
    <Button variant="ghost" size="sm" onClick={handleSignOut} disabled={signingOut}>
      {signingOut ? <Loader2 className="animate-spin" aria-hidden="true" /> : <LogOut aria-hidden="true" />}
      Log out
    </Button>
  ) : loading ? null : (
    <>
      <Button asChild variant="ghost" size="sm" onClick={() => setOpen(false)}>
        <Link to="/login">Log in</Link>
      </Button>
      <Button asChild size="sm" onClick={() => setOpen(false)}>
        <Link to="/register">Join free</Link>
      </Button>
    </>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-[color:var(--glass-border)] bg-[color:var(--glass-strong)] shadow-[var(--glass-highlight)] backdrop-blur-2xl backdrop-saturate-150">
      <nav
        aria-label="Primary"
        className="container-page grid h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-4"
      >
        <Link
          to="/"
          className="group flex min-w-0 items-center gap-2.5"
          aria-label="ProjectConnect home"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary bg-gradient-primary text-primary-foreground shadow-glow transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105">
            <Rocket className="h-4.5 w-4.5" aria-hidden="true" />
          </span>
          <span className="truncate font-display text-lg font-extrabold tracking-tight">
            Project<span className="text-primary">Connect</span>
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
          </Button>
          <ul className="hidden items-center gap-0.5 rounded-full border border-[color:var(--glass-border)] bg-[color:var(--glass)] p-1 lg:flex">
            {navLinks.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  activeOptions={{ exact: link.to === "/" }}
                  className="block rounded-full px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-secondary/80 hover:text-foreground"
                  activeProps={{ className: "!text-foreground bg-background shadow-soft" }}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="ml-2 hidden items-center gap-2 md:flex">
            <NotificationBell />
            {authControls}
          </div>

          <div className="md:hidden">
            <NotificationBell />
          </div>

          <Button
            variant="outline"
            size="icon"
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl lg:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </nav>

      <div
        id="mobile-nav"
        className={cn(
          "overflow-hidden border-t border-[color:var(--glass-border)] bg-[color:var(--glass-strong)] backdrop-blur-2xl lg:hidden",
          open ? "block" : "hidden",
        )}
      >
        <ul className="container-page flex flex-col gap-1 py-4">
          {navLinks.map((link) => (
            <li key={link.to}>
              <Link
                to={link.to}
                onClick={() => setOpen(false)}
                activeOptions={{ exact: link.to === "/" }}
                className="block rounded-xl px-3.5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-foreground"
                activeProps={{ className: "!text-foreground bg-secondary" }}
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li className="mt-2 grid grid-cols-2 gap-2 md:hidden">
            {authControls}
          </li>
        </ul>
      </div>
    </header>
  );
}
