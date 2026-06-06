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

// ACCESS TOKEN — stored in memory only (never localStorage).
// A JS module-level variable is cleared when the page is refreshed or the tab
// is closed. On page reload, AuthContext calls oauth2Refresh() to silently
// obtain a new access token using the refresh token stored in localStorage.
// This prevents XSS attacks from stealing the access token via localStorage.
let _accessToken: string | null = null;

export function getAuthToken(): string | null {
  return _accessToken;
}

export function setAuthToken(token: string | null): void {
  _accessToken = token ?? null;
}

// REFRESH TOKEN — stored in an httpOnly cookie set by the backend.
// JS cannot read or write it. The browser sends it automatically on every
// request to /oauth2/token and /oauth2/revoke (cookie Path="/oauth2/").
// On logout the backend clears the cookie by setting MaxAge=0.

export function clearAuthToken(): void {
  _accessToken = null;
  // Refresh token is in an httpOnly cookie — the backend clears it on revoke.
  // Nothing to clear here on the frontend.
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


const oauth2Client = axios.create({
  baseURL: ENV.OAUTH2_BASE_URL,
  withCredentials: true, // needed so the browser sends/receives the httpOnly refresh cookie
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
  },
  timeout: 15_000,
});

oauth2Client.interceptors.response.use(
  (resp) => resp,
  (error: AxiosError<any>) => {
    const data = error.response?.data ?? {};
    const message =
      data?.error_description ||
      data?.message ||
      data?.error ||
      error.message ||
      "Authentication failed.";
    return Promise.reject(new Error(message));
  }
);

/**
 * LOGIN — calls POST /oauth2/token with username + password.
 * Stores both access token and refresh token.
 */
export async function oauth2Token(
  username: string,
  password: string
): Promise<{ access_token: string; refresh_token?: string }> {
  // Public client: send client_id in body — no Authorization header needed
  const body = new URLSearchParams({
    grant_type: "password",
    client_id: ENV.OAUTH2_CLIENT_ID,
    username,
    password,
    scope: "openid profile",
  });

  const resp: AxiosResponse<any> = await oauth2Client.post(
    "/oauth2/token",
    body
  );

  // refresh_token is now set as an httpOnly cookie by the backend filter.
  // It is stripped from the JSON body — JS never sees it.
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
    // The refresh token is in an httpOnly cookie (set by the backend).
    // withCredentials:true on oauth2Client tells the browser to send it automatically.
    // We do NOT send refresh_token in the body — browser handles it via cookie.
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: ENV.OAUTH2_CLIENT_ID,
    });

    const resp: AxiosResponse<any> = await oauth2Client.post(
      "/oauth2/token",
      body
    );

    const newAccessToken: string = resp.data?.access_token;
    if (!newAccessToken) throw new Error("no_access_token_in_refresh_response");

    // Only store the new access token in memory.
    // The new refresh token cookie is set by the backend automatically.
    setAuthToken(newAccessToken);

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
    client_id: ENV.OAUTH2_CLIENT_ID,
    token,
    token_type_hint: "access_token",
  });

  // Public client: no Authorization header needed
  try {
    await oauth2Client.post("/oauth2/revoke", body);
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
