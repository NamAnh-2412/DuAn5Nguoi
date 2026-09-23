import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { login as apiLogin } from "../api/authApi";
import type { AuthUser, Role } from "../api/types";

type Ctx = {
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<AuthUser>;
  logout: () => void;
};

const AuthContext = createContext<Ctx | null>(null);

function readUser(): AuthUser | null {
  const raw = localStorage.getItem("vx_user");
  const token = localStorage.getItem("vx_token");
  if (!raw || !token) return null;
  try {
    return { ...JSON.parse(raw), token };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readUser);

  const value = useMemo<Ctx>(
    () => ({
      user,
      login: async (username, password) => {
        const data = await apiLogin(username, password);
        localStorage.setItem("vx_token", data.token);
        localStorage.setItem("vx_user", JSON.stringify(data));
        setUser(data);
        return data;
      },
      logout: () => {
        localStorage.removeItem("vx_token");
        localStorage.removeItem("vx_user");
        setUser(null);
      },
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("AuthProvider missing");
  return ctx;
}

export function useRole(): Role | null {
  return useAuth().user?.role ?? null;
}
