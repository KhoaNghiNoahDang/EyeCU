import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

import { fetchApi } from "../api/client";

/* ─── Types ─── */
export type WorkMode = "ops" | "clinician" | "patient" | "admin" | "ems" | "crowd";

export interface AuthUser {
  id: string;
  name: string;
  type: "staff" | "patient";
  avatar?: string;
  department?: string;
  /** "BS." | "ĐD." | "" */
  title?: string;
  cccd?: string;
  phone?: string;
  gender?: string;
  dob?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  staffCode?: string;
  appointments?: any[];
  address?: string;
  role?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  workMode: WorkMode | null;
  isAuthenticated: boolean;
  login: (user: AuthUser, mode?: WorkMode) => void;
  setWorkMode: (mode: WorkMode) => void;
  logout: () => void;
}

/* ─── Mock Staff Database Removed (Now using API) ─── */
export const MOCK_STAFF: AuthUser[] = [];

/* ─── Context ─── */
const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "eyecu_auth";

function loadPersistedAuth(): { user: AuthUser | null; workMode: WorkMode | null } {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { user: null, workMode: null };
    const parsed = JSON.parse(raw);
    return { user: parsed.user ?? null, workMode: parsed.workMode ?? null };
  } catch {
    return { user: null, workMode: null };
  }
}

function persistAuth(user: AuthUser | null, workMode: WorkMode | null, token?: string) {
  if (user) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ user, workMode }));
    if (token) {
      sessionStorage.setItem("eyecu_token", token);
    }
  } else {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem("eyecu_token");
  }
}

/* ─── Provider ─── */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [isClient, setIsClient] = useState(false);
  const [state, setState] = useState<{ user: AuthUser | null; workMode: WorkMode | null }>({
    user: null,
    workMode: null,
  });

  useEffect(() => {
    setIsClient(true);
    const persisted = loadPersistedAuth();
    setState({
      user: persisted.user,
      workMode: persisted.workMode,
    });

    // Background refresh user data on app load to sync fresh DB fields (e.g. phone, dob, gender)
    const token = sessionStorage.getItem("eyecu_token");
    if (token && persisted.user) {
      fetchApi("/auth/me").then((freshUser) => {
        setState((prev) => {
          const next = { ...prev, user: freshUser as AuthUser };
          persistAuth(next.user, next.workMode, token);
          return next;
        });
      }).catch((err) => console.error("Failed to refresh user", err));
    }
  }, []);

  const login = useCallback((user: AuthUser, mode?: WorkMode, token?: string) => {
    const workMode = mode ?? (user.type === "patient" ? "patient" : null);
    setState({ user, workMode });
    persistAuth(user, workMode, token);
  }, []);

  const setWorkMode = useCallback((mode: WorkMode) => {
    setState((prev) => {
      const next = { ...prev, workMode: mode };
      persistAuth(next.user, mode);
      return next;
    });
  }, []);

  const logout = useCallback(() => {
    setState({ user: null, workMode: null });
    persistAuth(null, null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        workMode: state.workMode,
        isAuthenticated: state.user !== null && state.workMode !== null,
        login,
        setWorkMode,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* ─── Hook ─── */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
