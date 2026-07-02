import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

/* ─── Types ─── */
export type WorkMode = "ops" | "clinician" | "patient" | "admin" | "ems";

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
  staffCode?: string;
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
