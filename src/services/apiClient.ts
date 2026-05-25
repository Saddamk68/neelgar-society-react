import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";
import { ENV } from "../config/env";
import { buildAppError } from "@/utils/errorUtils";

// ─────────────────────────────────────────────────────────────────────────────
// Token storage helpers
// ─────────────────────────────────────────────────────────────────────────────

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

export function getAuthToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAuthToken(token: string | null): void {
  if (token) localStorage.setItem(ACCESS_TOKEN_KEY, token);
  else localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function clearAuthToken(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string | null): void {
  if (token) localStorage.setItem(REFRESH_TOKEN_KEY, token);
  else localStorage.removeItem(REFRESH_TOKEN_KEY);
}

// ─────────────────────────────────────────────────────────────────────────────
// Global 401 handler — AuthContext registers this on mount
// ─────────────────────────────────────────────────────────────────────────────

let unauthorizedHandler: (() => void) | null = null;

export function onUnauthorized(cb: (() => void) | null): void {
  unauthorizedHandler = cb;
}

// ─────────────────────────────────────────────────────────────────────────────
// OAuth2 client — used only for /oauth2/token and /oauth2/revoke
// ─────────────────────────────────────────────────────────────────────────────

function oauth2BasicAuth(): string {
  return `Basic ${btoa(`${ENV.OAUTH2_CLIENT_ID}:${ENV.OAUTH2_CLIENT_SECRET}`)}`;
}

const oauth2Client = axios.create({
  baseURL: ENV.OAUTH2_BASE_URL,
  withCredentials: true, // needed so the browser sends/receives the httpOnly refresh cookie
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
  },
  timeout: 15_000,
});

/**
 * LOGIN — calls POST /oauth2/token with username + password.
 * Stores both access token and refresh token.
 */
export async function oauth2Token(
  username: string,
  password: string
): Promise<{ access_token: string; refresh_token?: string }> {
  const body = new URLSearchParams({
    grant_type: "password",
    username,
    password,
    scope: "openid profile",
  });

  const resp: AxiosResponse<any> = await oauth2Client.post(
    "/oauth2/token",
    body,
    { headers: { Authorization: oauth2BasicAuth() } }
  );

  // Store refresh token immediately on login
  if (resp.data?.refresh_token) {
    setRefreshToken(resp.data.refresh_token);
  }

  return resp.data;
}

/**
 * SILENT REFRESH — sends the stored refresh token to get a new access token.
 * Also stores the new refresh token (reuseRefreshTokens=false means a new one
 * is issued every time).
 * Returns the new access token string.
 *
 * CONCURRENT-CALL GUARD:
 * If two callers invoke oauth2Refresh() at the same time (e.g. the Web Worker
 * timer and the visibilitychange handler both firing together), only ONE actual
 * HTTP request is sent. The second caller waits and receives the same result.
 * This is critical because reuseRefreshTokens=false means a refresh token can
 * only be used once — a second simultaneous call would fail and cause a logout.
 *
 * Java analogy: think of activeRefreshPromise like a synchronized singleton
 * — once one thread is inside, others wait at the door and share the result.
 */
let activeRefreshPromise: Promise<string> | null = null;

export async function oauth2Refresh(): Promise<string> {
  // If a refresh is already in flight, return the same promise — do not make a second HTTP call
  if (activeRefreshPromise) return activeRefreshPromise;

  activeRefreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) throw new Error("no_refresh_token_stored");

    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });

    const resp: AxiosResponse<any> = await oauth2Client.post(
      "/oauth2/token",
      body,
      { headers: { Authorization: oauth2BasicAuth() } }
    );

    const newAccessToken: string = resp.data?.access_token;
    if (!newAccessToken) throw new Error("no_access_token_in_refresh_response");

    // Store new tokens
    setAuthToken(newAccessToken);
    if (resp.data?.refresh_token) {
      setRefreshToken(resp.data.refresh_token);
    }

    return newAccessToken;
  })().finally(() => {
    // Always clear the gate when done (success or failure) so next call goes through fresh
    activeRefreshPromise = null;
  });

  return activeRefreshPromise;
}

/**
 * LOGOUT — revokes the current access token and clears all stored tokens.
 */
export async function oauth2Revoke(): Promise<void> {
  const token = getAuthToken();
  if (!token) return;

  const body = new URLSearchParams({
    token,
    token_type_hint: "access_token",
  });

  try {
    await oauth2Client.post("/oauth2/revoke", body, {
      headers: { Authorization: oauth2BasicAuth() },
    });
  } catch {
    // Best-effort — always clear locally even if server call fails
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main API client — used for all /api/v1/* calls
// ─────────────────────────────────────────────────────────────────────────────

export const api = axios.create({
  baseURL: ENV.API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 15_000,
});

// Attach Bearer token to every request
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAuthToken();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }

  // Let browser set Content-Type automatically for file uploads
  if (config.data instanceof FormData) {
    delete (config.headers as any)["Content-Type"];
  }

  return config;
});

// ─────────────────────────────────────────────────────────────────────────────
// Refresh queue — if multiple requests fail with 401 at the same time,
// only one refresh attempt is made and the others wait in the queue.
// ─────────────────────────────────────────────────────────────────────────────

let isRefreshing = false;
let refreshSubscribers: Array<(token: string | null) => void> = [];

function subscribeTokenRefresh(cb: (token: string | null) => void): void {
  refreshSubscribers.push(cb);
}

function notifySubscribers(token: string | null): void {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

// Handle 401 responses — attempt silent refresh, then replay the original request
api.interceptors.response.use(
  (resp) => resp,
  async (error: AxiosError<any>) => {
    const status = error.response?.status ?? 0;
    const originalReq = (error.config as AxiosRequestConfig & { _retry?: boolean }) || {};
    const isOAuth2Url = (originalReq.url ?? "").includes("/oauth2/");

    if (status === 401 && !originalReq._retry && !isOAuth2Url) {
      originalReq._retry = true;

      if (isRefreshing) {
        // Another refresh is already in flight — queue this request
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((token) => {
            if (!token) { reject(buildAppError(error)); return; }
            (originalReq.headers as any).Authorization = `Bearer ${token}`;
            resolve(api(originalReq));
          });
        });
      }

      isRefreshing = true;
      try {
        const newToken = await oauth2Refresh();
        isRefreshing = false;
        notifySubscribers(newToken);
        (originalReq.headers as any) = {
          ...originalReq.headers,
          Authorization: `Bearer ${newToken}`,
        };
        return api(originalReq);
      } catch {
        isRefreshing = false;
        notifySubscribers(null);
        clearAuthToken();
        if (unauthorizedHandler) unauthorizedHandler();
        return Promise.reject(buildAppError(error));
      }
    }

    return Promise.reject(buildAppError(error));
  }
);

export default api;
export { api as apiClient };
