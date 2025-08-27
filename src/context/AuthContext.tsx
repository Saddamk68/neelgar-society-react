import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import type { Role } from "../constants/roles";
import { setAuthToken } from "../services/apiClient";

type AuthState = {
  isAuthenticated: boolean;
  role: Role;
  login: (role?: Role, tokenOverride?: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setAuth] = useState(false);
  const [role, setRole] = useState<Role>("guest");

  const login = (newRole: Role = "admin", tokenOverride?: string) => {
    setAuth(true);
    setRole(newRole);
    // In real flow, use token from your backend login response:
    const token = tokenOverride ?? "demo-token";
    setAuthToken(token);
  };

  const logout = () => {
    setAuth(false);
    setRole("guest");
    setAuthToken(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
