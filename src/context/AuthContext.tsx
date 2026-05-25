import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
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

// Decodes JWT exp claim and returns ms until expiry
function msUntilExpiry(token: string): number {
  try {
    const { exp } = jwtDecode<{ exp: number }>(token);
    return exp * 1000 - Date.now();
  } catch {
    return 0;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [role, setRole] = useState<Role>("MEMBER");
  const [user, setUser] = useState<AuthUser | null>(null);

  // ── Web Worker ref ─────────────────────────────────────────────────────────
  // WHY useRef here instead of a plain variable:
  // In React, plain variables inside the component function are recreated on
  // every render. useRef gives us a stable box that persists for the full
  // lifetime of the component — just like an instance field in a Java class.
  // The worker lives here and is shared across all renders.
  const workerRef = useRef<Worker | null>(null);

  // ── scheduleRefresh ────────────────────────────────────────────────────────
  // Tells the Web Worker to fire after (tokenExpiry - 2 min).
  // The worker runs in a background OS thread — unlike setTimeout in the main
  // thread, it is NOT frozen when the browser tab is idle or the laptop sleeps.
  //
  // Java analogy: like calling schedule() on a ScheduledExecutorService that
  // runs in a daemon thread, completely independent of the UI thread.
  const scheduleRefresh = useCallback((token: string) => {
    // Refresh 2 minutes before expiry.
    // We use 2 min (not 5) to keep the window small — the less time between
    // "timer set" and "timer fires", the less chance the browser has to freeze it.
    const delay = Math.max(msUntilExpiry(token) - 2 * 60 * 1000, 5_000);

    // Token is already expired or expiring in < 5 s — don't schedule,
    // let the 401 interceptor in apiClient.ts handle it reactively instead.
    if (delay <= 5_000 && msUntilExpiry(token) <= 0) return;

    if (workerRef.current) {
      workerRef.current.postMessage({ type: "start", delay });
    }
  }, []);

  // Save user to both React state and localStorage
  const commitUser = useCallback((u: AuthUser, token: string) => {
    setAuthToken(token);
    saveUser(u);
    setIsAuthenticated(true);
    setUser(u);
    setRole(u.role);
    scheduleRefresh(token); // arm the Web Worker countdown for proactive refresh
  }, [scheduleRefresh]);

  // Clear everything — called on logout or when refresh fails unrecoverably
  const logout = useCallback(async (): Promise<void> => {
    // Tell the worker to cancel its countdown so it doesn't fire after logout
    if (workerRef.current) {
      workerRef.current.postMessage({ type: "stop" });
    }
    try {
      await oauth2Revoke();
    } catch {
      // ignore
    } finally {
      setIsAuthenticated(false);
      setRole("MEMBER");
      setUser(null);
      clearAuthToken();
      saveUser(null);
    }
  }, []);

  // ── On page load: try to restore session ──────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      const storedUser = loadUser();

      // Access token is in memory only — always gone after a page refresh.
      // Go straight to silent refresh using the refresh token from localStorage.
      // If the refresh token is also missing or expired, the catch block below
      // will clear state and send the user to the login page.
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
        // Also clear any stale tokens from localStorage so the next
        // login starts completely fresh
        if (!cancelled) {
          setIsAuthenticated(false);
          setUser(null);
          setRole("MEMBER");
          saveUser(null);
          clearAuthToken();
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

  // ── Boot the Web Worker once on mount, tear it down on unmount ───────────
  // This useEffect runs exactly once when the AuthProvider first appears on
  // screen (the empty [] dependency array guarantees that — same as @PostConstruct
  // in Spring).  It creates the worker, wires up the 'fire' message handler,
  // and terminates it cleanly when the app is closed.
  useEffect(() => {
    // Create the worker from the file we placed in /public.
    // new URL(..., import.meta.url) is the Vite-safe way to reference a
    // public-folder file — think of it like getClass().getResource() in Java.
    const worker = new Worker(
      new URL("/tokenRefreshWorker.js", import.meta.url),
      { type: "classic" }
    );
    workerRef.current = worker;

    // This runs when the worker sends { type: 'fire' } back —
    // meaning the countdown completed and it's time to silently refresh.
    worker.onmessage = async (event: MessageEvent) => {
      if (event.data?.type !== "fire") return;
      try {
        const newToken = await oauth2Refresh();
        // Update React user state from the new token's claims
        const refreshedUser = toAuthUser(newToken);
        saveUser(refreshedUser);
        setUser(refreshedUser);
        setRole(refreshedUser.role);
        // Reschedule for the next token — keeps the cycle going indefinitely
        scheduleRefresh(newToken);
      } catch (e) {
        console.error("[AuthContext] Proactive token refresh failed:", e);
        // Do NOT logout here — the 401 interceptor in apiClient.ts will handle
        // it reactively if the next API call fails.  Calling logout() here on a
        // network hiccup would be too aggressive.
      }
    };

    worker.onerror = (e) => {
      console.error("[AuthContext] Refresh worker error:", e);
    };

    // Cleanup: terminate the worker when the component unmounts (app closes)
    return () => {
      worker.postMessage({ type: "stop" });
      worker.terminate();
      workerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Visibility / focus handler — safety net for idle / sleep ─────────────
  // The Web Worker handles the normal case (fires before expiry).
  // This handler is the safety net: it runs when the user comes BACK after
  // the laptop was asleep or the tab was hidden for a long time.
  //
  // KEY FIX vs the old code:
  //   1. We cancel the worker's pending countdown BEFORE calling refresh.
  //      This prevents the worker timer and this handler from both calling
  //      oauth2Refresh() at the same time (race condition).
  //   2. The concurrent-call guard in apiClient.ts (activeRefreshPromise) is
  //      a second line of defence — even if both do fire simultaneously, only
  //      one HTTP call goes out.
  //   3. When there's still plenty of time left, we simply RESET the worker
  //      timer (it may have been frozen and is now stale).
  useEffect(() => {
    let isChecking = false;

    const handleUserBack = async () => {
      // Guard: don't run if a check is already in progress
      if (isChecking) return;
      isChecking = true;

      try {
        const token = getAuthToken();
        // No token means the user is already logged out — nothing to do
        if (!token) return;

        const timeLeft = msUntilExpiry(token);

        // Cancel any pending worker countdown before we decide what to do.
        // This is the critical step that prevents the race condition.
        if (workerRef.current) {
          workerRef.current.postMessage({ type: "stop" });
        }

        if (timeLeft <= 0) {
          // Token is already expired — try to refresh immediately.
          // The 401 interceptor would also catch this on the next API call,
          // but proactively refreshing here gives a smoother UX (no flicker).
          const newToken = await oauth2Refresh();
          scheduleRefresh(newToken);
        } else if (timeLeft < 3 * 60 * 1000) {
          // Token expires in less than 3 minutes — refresh now proactively
          const newToken = await oauth2Refresh();
          scheduleRefresh(newToken);
        } else {
          // Plenty of time left — just reset the worker timer with correct
          // fresh timing.  The old timer may have been frozen while the
          // browser was sleeping, so its remaining time is unreliable.
          scheduleRefresh(token);
        }
      } catch (e) {
        console.error("[AuthContext] Refresh failed after idle/focus:", e);
        // Refresh token itself has expired (e.g. user was away for 14+ days)
        // — force logout so they see the login page cleanly.
        logout();
      } finally {
        isChecking = false;
      }
    };

    // Fires when the user switches back to this browser tab
    const visibilityHandler = () => {
      if (document.visibilityState === "visible") handleUserBack();
    };

    // Fires when the browser window regains focus (e.g. Alt+Tab back)
    window.addEventListener("focus", handleUserBack);
    document.addEventListener("visibilitychange", visibilityHandler);

    return () => {
      window.removeEventListener("focus", handleUserBack);
      document.removeEventListener("visibilitychange", visibilityHandler);
    };
  }, [scheduleRefresh, logout]);

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
