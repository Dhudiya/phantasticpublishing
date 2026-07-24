import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export type AdminRole = "super_admin" | "admin" | "editor";

export interface AdminProfile {
  id: string;
  full_name: string;
  role: AdminRole;
  active: boolean;
  created_at: string;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: AdminProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (uid: string, email?: string) => {
    const { data, error } = await supabase
      .from("admin_profiles")
      .select("id, full_name, role, active, created_at")
      .eq("id", uid)
      .maybeSingle();
    if (error) {
      setProfile(null);
      return;
    }
    if (data) {
      setProfile(data as AdminProfile);
      return;
    }
    // No profile row yet — auto-create one as INACTIVE so access must be
    // explicitly granted by a super_admin. This prevents any authenticated
    // user from getting automatic admin access.
    const fullName = (email ?? "").split("@")[0] || "Admin";
    const { data: created } = await supabase
      .from("admin_profiles")
      .insert({ id: uid, full_name: fullName, role: "editor", active: false })
      .select("id, full_name, role, active, created_at")
      .maybeSingle();
    setProfile((created as AdminProfile | null) ?? null);
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user) {
        fetchProfile(data.session.user.id, data.session.user.email ?? undefined).finally(() => mounted && setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      (async () => {
        setSession(newSession);
        if (newSession?.user) {
          await fetchProfile(newSession.user.id, newSession.user.email ?? undefined);
        } else {
          setProfile(null);
        }
        setLoading(false);
      })();
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? error.message : null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user) await fetchProfile(session.user.id);
  }, [session, fetchProfile]);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        loading,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
