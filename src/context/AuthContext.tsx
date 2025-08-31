import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { Role } from "../constants/roles";
import { setAuthToken, api } from "../services/apiClient";
import { ENDPOINTS } from "../config/endpoints";

type User = {
  username: string;
  roles: Role[];
};

type AuthState = {
  isAuthenticated: boolean;
  role: Role;
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  demoLogin: (role?: Role, tokenOverride?: string) => void; // keep demo login
  logout: () => void;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setAuth] = useState(false);
  const [role, setRole] = useState<Role>("guest");
  const [user, setUser] = useState<User | null>(null);

  // Load token from storage on mount
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const storedUser = localStorage.getItem("user");
    if (token && storedUser) {
      setAuth(true);
      setAuthToken(token);
      const parsed = JSON.parse(storedUser) as User;
      setUser(parsed);
      setRole((parsed.roles[0] as Role) ?? "guest");
    }
  }, []);

  // ---- Real backend login ----
  const login = async (username: string, password: string) => {
    const resp = await api.post(ENDPOINTS.auth.login, { username, password });
    const { accessToken, user } = resp.data;

    // Save in memory + localStorage
    setAuthToken(accessToken);
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("user", JSON.stringify(user));

    setAuth(true);
    setUser(user);
    setRole((user.roles[0] as Role) ?? "guest");
  };

  // ---- Real backend register ----
  const register = async (username: string, password: string) => {
    const resp = await api.post(ENDPOINTS.auth.register, { username, password });
    const { accessToken, user } = resp.data;

    setAuthToken(accessToken);
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("user", JSON.stringify(user));

    setAuth(true);
    setUser(user);
    setRole((user.roles[0] as Role) ?? "guest");
  };

  // ---- Demo login (existing behavior) ----
  const demoLogin = (newRole: Role = "admin", tokenOverride?: string) => {
    setAuth(true);
    setRole(newRole);
    setUser({ username: "demo", roles: [newRole] });
    const token = tokenOverride ?? "demo-token";
    setAuthToken(token);
  };

  const logout = () => {
    setAuth(false);
    setRole("guest");
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, role, user, login, register, demoLogin, logout }}
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
