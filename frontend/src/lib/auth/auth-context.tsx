import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

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

/* ─── Mock Staff Database ─── */
export const MOCK_STAFF: AuthUser[] = [
  {
    id: "s1",
    name: "Văn Ngữ",
    type: "staff",
    title: "BS.",
    department: "Khoa Nội",
    staffCode: "NV001",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDf_48z5oZ1XvbMQe_8k81LEPaXIvnkC1aHkdBi6sXOrodi0w8Bxq0g8gTjdYEy6fm3QCpnF0Rku3OudVdGkgrkxf1A0uM0RrlvocS-G3xiZ8MqD2ylIW9ITbFmkRdLl6jimSqUcxbnmjK4_rbS6hs80Z3VjYM8Cyt4vsAjoX93YsT_Ya4-5KATNO5aGRo71S5KI03JBmzSXIDNnyx8tqkfhDMQd74UjgF2KXbh5FUwGd2DgKrV-Xmma_DPbCulqLv13AaiEYvLdTVJ",
  },
  {
    id: "s2",
    name: "Minh Tuấn",
    type: "staff",
    title: "BS.",
    department: "Tim mạch",
    staffCode: "NV002",
  },
  {
    id: "s3",
    name: "Thu Hà",
    type: "staff",
    title: "ĐD.",
    department: "Khoa Nội",
    staffCode: "NV003",
  },
  {
    id: "s4",
    name: "Thành Đạt",
    type: "staff",
    title: "BS.",
    department: "Chấn thương",
    staffCode: "NV004",
  },
];

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

function persistAuth(user: AuthUser | null, workMode: WorkMode | null) {
  if (user) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ user, workMode }));
  } else {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

/* ─── Provider ─── */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(() => {
    const persisted = loadPersistedAuth();
    return {
      user: persisted.user,
      workMode: persisted.workMode,
    };
  });

  const login = useCallback((user: AuthUser, mode?: WorkMode) => {
    const workMode = mode ?? (user.type === "patient" ? "patient" : null);
    setState({ user, workMode });
    persistAuth(user, workMode);
  }, []);

  const setWorkMode = useCallback(
    (mode: WorkMode) => {
      setState((prev) => {
        const next = { ...prev, workMode: mode };
        persistAuth(next.user, mode);
        return next;
      });
    },
    [],
  );

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
