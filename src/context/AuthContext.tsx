import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Role } from "../constants/roles";
import {
  api,
  oauth2Token,
  oauth2Refresh,
  oauth2Revoke,
  setAuthToken,
  getAuthToken,
  clearAuthToken,
  onUnauthorized,
} from "../services/apiClient";
import { FEATURES } from "../config/features";
import { jwtDecode } from "jwt-decode";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The small user object we keep in memory (and localStorage) after login.
 * Full profile details are fetched separately via GET /api/v1/users/me.
 */
export type AuthUser = {
  username: string;
  role: Role;
  personName?: string;
  memberCode?: string;
  societyId?: number;
};

export type AuthState = {
  isAuthenticated: boolean;
  isInitializing: boolean;   // true while we check localStorage / attempt silent refresh on page load
  role: Role;
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  demoLogin: (role?: Role) => void;  // dev only — gated by FEATURES.SHOW_DEMO_LOGIN
};

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthState | undefined>(undefined);

// ─────────────────────────────────────────────────────────────────────────────
// Small helpers
// ─────────────────────────────────────────────────────────────────────────────

const USER_KEY = "ngs_user";

function saveUser(u: AuthUser | null): void {
  if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
  else localStorage.removeItem(USER_KEY);
}

function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

/**
 * Pull the fields we care about from the OAuth2 token response.
 *
 * Spring OAuth2 standard fields use snake_case: access_token, refresh_token.
 * Our custom fields (username, role, personName, memberCode) are added by
 * CustomTokenCustomizer in the backend and come back at the top level.
 */
function toAuthUser(accessToken: string, extraData?: any): AuthUser {
  // First try to read custom fields from extra response data (if backend adds them)
  // Then fall back to decoding them from the JWT claims directly
  let claims: any = {};
  try {
    claims = jwtDecode<any>(accessToken);
  } catch {
    // ignore decode errors
  }

  return {
    username: extraData?.username ?? claims.username ?? claims.sub ?? "",
    role: ((extraData?.role ?? claims.role ?? "MEMBER") as string).toUpperCase() as Role,
    personName: extraData?.personName ?? claims.personName ?? undefined,
    memberCode: extraData?.memberCode ?? claims.memberCode ?? undefined,
    societyId: extraData?.societyId ?? claims.societyId ?? undefined,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [role, setRole] = useState<Role>("MEMBER");
  const [user, setUser] = useState<AuthUser | null>(null);

  // Save user to both React state and localStorage
  const commitUser = (u: AuthUser, token: string) => {
    setAuthToken(token);
    saveUser(u);
    setIsAuthenticated(true);
    setUser(u);
    setRole(u.role);
  };

  // Clear everything — called on logout or when refresh fails
  const logout = async (): Promise<void> => {
    try {
      await oauth2Revoke(); // best-effort — tells backend to invalidate the token
    } catch {
      // ignore
    } finally {
      setIsAuthenticated(false);
      setRole("MEMBER");
      setUser(null);
      clearAuthToken();
      saveUser(null);
    }
  };

  // ── On page load: try to restore session ──────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      const storedToken = getAuthToken();
      const storedUser = loadUser();

      // Happy path: we already have a token and user info stored
      if (storedToken && storedUser) {
        if (!cancelled) {
          setIsAuthenticated(true);
          setUser(storedUser);
          setRole(storedUser.role);
          setIsInitializing(false);
        }
        return;
      }

      // No token — try a silent refresh via the httpOnly cookie
      // This lets the user stay logged in after a page refresh without re-entering credentials
      try {
        const newToken = await oauth2Refresh();

        if (storedUser) {
          // We have user info stored, just the token was missing
          if (!cancelled) commitUser(storedUser, newToken);
        } else {
          // Fetch user info from the server
          const resp = await api.get("/users/me", {
            headers: { Authorization: `Bearer ${newToken}` },
          });
          const freshUser = toAuthUser(newToken, resp.data?.data ?? resp.data);
          if (!cancelled) commitUser(freshUser, newToken);
        }
      } catch {
        // Refresh failed — user needs to log in manually
        if (!cancelled) {
          setIsAuthenticated(false);
          setUser(null);
          setRole("MEMBER");
          saveUser(null);
        }
      } finally {
        if (!cancelled) setIsInitializing(false);
      }
    };

    restoreSession();

    // Register the global 401 handler — if any API call gets a 401 that
    // can't be recovered by refresh, this triggers a logout automatically
    onUnauthorized(() => logout());

    return () => {
      cancelled = true;
      onUnauthorized(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = async (username: string, password: string): Promise<void> => {
    const data = await oauth2Token(username, password);
    const accessToken = data.access_token;
    if (!accessToken) throw new Error("No access token received");

    commitUser(toAuthUser(accessToken, data), accessToken);
  };

  // ── Demo login (dev only) ──────────────────────────────────────────────────
  const demoLogin = (newRole: Role = "ADMIN"): void => {
    if (!FEATURES.SHOW_DEMO_LOGIN) return;
    commitUser({ username: "demo", role: newRole }, "demo-token");
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, isInitializing, role, user, login, logout, demoLogin }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
