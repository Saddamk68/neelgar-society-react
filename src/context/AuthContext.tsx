// path: neelgar-society-react/src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Role } from "../constants/roles";
import { api, setAuthToken, getAuthToken, clearAuthToken, onUnauthorized } from "../services/apiClient";
import { ENDPOINTS } from "../config/endpoints";

type User = {
  username: string;
  roles: Role[];
};

export type AuthState = {
  isAuthenticated: boolean;
  isInitializing: boolean;
  role: Role;
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, email: string) => Promise<void>;
  demoLogin: (role?: Role, tokenOverride?: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [role, setRole] = useState<Role>("guest");
  const [user, setUser] = useState<User | null>(null);

  const persistUser = (u: User | null) => {
    if (u) localStorage.setItem("user", JSON.stringify(u));
    else localStorage.removeItem("user");
  };

  // Central logout that cleans client and calls server to clear refresh cookie
  const logout = async () => {
    try {
      // Use fetch with credentials to ensure cookie cleared server-side
      const base = (api.defaults.baseURL ?? "").replace(/\/$/, "");
      await fetch(`${base}/api/v1/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
      });
    } catch {
      // ignore network errors
    } finally {
      setIsAuthenticated(false);
      setRole("guest");
      setUser(null);
      setAuthToken(null);
      clearAuthToken();
      persistUser(null);
    }
  };

  // Initialization: rehydrate or attempt credentialed refresh
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      // 1) synchronous rehydrate from localStorage
      const token = getAuthToken();
      const storedUser = localStorage.getItem("user");
      if (token) {
        setIsAuthenticated(true);
        setAuthToken(token);
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser) as User;
            setUser(parsed);
            setRole((parsed.roles[0] as Role) ?? "guest");
          } catch {
            // ignore parse errors
          }
        }
        if (!cancelled) setIsInitializing(false);
        return;
      }

      // 2) no token -> attempt refresh using credentialed fetch or internal refresh
      try {
        const base = (api.defaults.baseURL ?? "").replace(/\/$/, "");
        const resp = await fetch(`${base}/api/v1/auth/refresh`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
        });

        if (!resp.ok) {
          // refresh failed
          if (!cancelled) {
            setIsAuthenticated(false);
            setUser(null);
            setRole("guest");
            persistUser(null);
            setIsInitializing(false);
          }
          return;
        }

        const body = (await resp.json()) as any;
        const accessToken = body?.accessToken;
        const userPayload = body?.user;

        if (accessToken) {
          if (!cancelled) {
            setIsAuthenticated(true);
            setAuthToken(accessToken);
            persistUser(userPayload ?? null);
            setUser(userPayload ?? null);
            setRole((userPayload?.roles?.[0] as Role) ?? "guest");
          }
        } else {
          if (!cancelled) {
            setIsAuthenticated(false);
            setUser(null);
            setRole("guest");
            persistUser(null);
          }
        }
      } catch {
        if (!cancelled) {
          setIsAuthenticated(false);
          setUser(null);
          setRole("guest");
        }
      } finally {
        if (!cancelled) setIsInitializing(false);
      }
    };

    init();

    // register global unauthorized handler so refresh failure triggers logout
    onUnauthorized(() => {
      logout();
    });

    return () => {
      cancelled = true;
      onUnauthorized(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // login/register using api client
  const login = async (username: string, password: string) => {
    const resp = await api.post(ENDPOINTS.auth.login, { username, password });
    const { accessToken, user } = resp.data;
    setAuthToken(accessToken);
    persistUser(user ?? null);
    setIsAuthenticated(true);
    setUser(user ?? null);
    setRole((user?.roles?.[0] as Role) ?? "guest");
  };

  const register = async (username: string, password: string, email: string) => {
    const resp = await api.post(ENDPOINTS.auth.register, { username, password, email });
    const { accessToken, user } = resp.data;
    setAuthToken(accessToken);
    persistUser(user ?? null);
    setIsAuthenticated(true);
    setUser(user ?? null);
    setRole((user?.roles?.[0] as Role) ?? "guest");
  };

  const demoLogin = (newRole: Role = "admin", tokenOverride?: string) => {
    const token = tokenOverride ?? "demo-token";
    setIsAuthenticated(true);
    setRole(newRole);
    const demoUser = { username: "demo", roles: [newRole] } as User;
    setUser(demoUser);
    setAuthToken(token);
    persistUser(demoUser);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isInitializing,
        role,
        user,
        login,
        register,
        demoLogin,
        logout,
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
