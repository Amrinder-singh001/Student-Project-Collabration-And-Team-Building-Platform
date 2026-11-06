import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "student" | "admin";

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  college: string | null;
  course: string | null;
  semester: string | null;
  bio: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  leetcode_url: string | null;
  hackerrank_url: string | null;
  gfg_url: string | null;
  codechef_url: string | null;
  avatar_url: string | null;
};

export type StudentSkill = {
  id: string;
  skill_id: string;
  name: string;
  category: string | null;
  level: string;
};

type RegisterInput = {
  fullName: string;
  email: string;
  password: string;
  college: string;
  course: string;
  semester: string;
};

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  skills: StudentSkill[];
  role: AppRole | null;
  loading: boolean;
  isAuthenticated: boolean;
  hasRole: (role: AppRole) => boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: RegisterInput) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** Maps backend auth errors to messages a student can actually act on. */
function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("already registered") || m.includes("already been registered")) {
    return "An account with this email already exists. Try logging in instead.";
  }
  if (m.includes("invalid login credentials")) {
    return "Email or password is incorrect.";
  }
  if (m.includes("email not confirmed")) {
    return "Please confirm your email address before logging in.";
  }
  if (m.includes("pwned") || m.includes("compromised")) {
    return "This password has appeared in a data breach. Please choose a different one.";
  }
  if (m.includes("rate limit") || m.includes("too many")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  return message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [skills, setSkills] = useState<StudentSkill[]>([]);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserData = useCallback(async (userId: string) => {
    const [{ data: profileRow }, { data: roleRows }, { data: skillRows }] = await Promise.all([
      supabase
        .from("profiles")
        .select(
          "id, full_name, email, college, course, semester, bio, github_url, portfolio_url, leetcode_url, hackerrank_url, gfg_url, codechef_url, avatar_url",
        )
        .eq("id", userId)
        .maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase
        .from("student_skills")
        .select("id, skill_id, level, skills(name, category)")
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
    ]);
    setProfile((profileRow as Profile | null) ?? null);
    const roles = (roleRows ?? []).map((r) => r.role as AppRole);
    setRole(roles.includes("admin") ? "admin" : (roles[0] ?? null));
    setSkills(
      ((skillRows ?? []) as unknown as Array<{
        id: string;
        skill_id: string;
        level: string;
        skills: { name: string; category: string | null } | null;
      }>)
        .filter((r) => r.skills)
        .map((r) => ({
          id: r.id,
          skill_id: r.skill_id,
          level: r.level,
          name: r.skills!.name,
          category: r.skills!.category,
        })),
    );
  }, []);

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (!nextSession?.user) {
        setProfile(null);
        setRole(null);
        return;
      }
      // Defer backend reads out of the auth callback to avoid deadlocks.
      setTimeout(() => void loadUserData(nextSession.user.id), 0);
    });

    void supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) await loadUserData(data.session.user.id);
      setLoading(false);
    });

    return () => subscription.subscription.unsubscribe();
  }, [loadUserData]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw new Error(friendlyAuthError(error.message));
  }, []);

  const signUp = useCallback(async (input: RegisterInput) => {
    const email = input.email.trim();
    const { data, error } = await supabase.auth.signUp({
      email,
      password: input.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          full_name: input.fullName,
          college: input.college,
          course: input.course,
          semester: input.semester,
        },
      },
    });
    if (error) throw new Error(friendlyAuthError(error.message));

    const newUser = data.user;
    if (!newUser) throw new Error("Account could not be created. Please try again.");
    // Supabase returns an existing-user shell with no identities on duplicate email.
    if (newUser.identities && newUser.identities.length === 0) {
      throw new Error("An account with this email already exists. Try logging in instead.");
    }
    if (!data.session) {
      throw new Error("Check your inbox to confirm your email, then log in.");
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: newUser.id,
      full_name: input.fullName,
      email,
      college: input.college,
      course: input.course,
      semester: input.semester,
    });
    if (profileError) throw new Error(profileError.message);

    await supabase.from("user_roles").insert({ user_id: newUser.id, role: "student" });
    await loadUserData(newUser.id);
  }, [loadUserData]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setSkills([]);
    setRole(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await loadUserData(user.id);
  }, [user, loadUserData]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      profile,
      skills,
      role,
      loading,
      isAuthenticated: Boolean(session),
      hasRole: (r: AppRole) => role === r,
      signIn,
      signUp,
      signOut,
      refreshProfile,
    }),
    [user, session, profile, skills, role, loading, signIn, signUp, signOut, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
