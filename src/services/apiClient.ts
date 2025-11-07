import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";
import { ENV } from "../config/env";

/**
 * Central API client + refresh flow.
 *
 * - Main `api` instance does NOT use withCredentials (keeps requests default).
 * - `refreshClient` uses withCredentials: true so the browser will send the HttpOnly refresh cookie.
 * - Access token is persisted to localStorage under the key ACCESS_TOKEN_KEY.
 * - Exports helpers: getAuthToken, setAuthToken, clearAuthToken, onUnauthorized, api.
 */

// Key for localStorage (keep consistent across codebase)
const ACCESS_TOKEN_KEY = "accessToken";

// Token helpers - single source of truth for access token persistence
export function getAuthToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}
export function setAuthToken(token: string | null) {
  if (token) localStorage.setItem(ACCESS_TOKEN_KEY, token);
  else localStorage.removeItem(ACCESS_TOKEN_KEY);
}
export function clearAuthToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

// Optional: app-level unauthorized hook (call logout from context)
let unauthorizedHandler: (() => void) | null = null;
export function onUnauthorized(cb: (() => void) | null) {
  unauthorizedHandler = cb;
}

// Main axios instance used by the app
export const api = axios.create({
  baseURL: ENV.API_BASE_URL, // e.g. "http://localhost:8080" or "/api/v1"
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 15_000,
  // Do not set withCredentials globally here; refresh uses refreshClient
});

// Dedicated client for refresh requests — sends cookies
const refreshClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 15_000,
});

// Request interceptor: attach Authorization header synchronously from localStorage
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAuthToken();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }

  // ✅ IMPORTANT FIX FOR FILE UPLOADS
  if (config.data instanceof FormData) {
    delete (config.headers as any)["Content-Type"];
    delete (config.headers as any)["content-type"];
  }

  (config.headers as any)["X-Request-Id"] =
    (config.headers as any)["X-Request-Id"] ??
    `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  return config;
});

// ========== Refresh queue implementation ==========
let isRefreshing = false;
let refreshSubscribers: Array<(token: string | null) => void> = [];

function subscribeTokenRefresh(cb: (token: string | null) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string | null) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

// Attempt to refresh using refreshClient (cookie will be sent)
async function attemptRefresh(): Promise<string> {
  // refresh endpoint - backend sets/reads the HttpOnly refresh cookie
  const url = "/auth/refresh";
  try {
    const resp: AxiosResponse<any> = await refreshClient.post(url, {});
    const newAccessToken = resp?.data?.accessToken;
    if (!newAccessToken) {
      throw new Error("no_access_token_in_refresh_response");
    }
    // persist token
    setAuthToken(newAccessToken);
    return newAccessToken;
  } catch (err) {
    // failed refresh -> clear token
    setAuthToken(null);
    throw err;
  }
}

// Normalize errors into a consistent shape (keeps your previous shape)
function buildNormalizedError(error: AxiosError<any>) {
  const status = error.response?.status ?? 0;
  const data = error.response?.data as any;
  const messageFromServer =
    (data && (data.message || data.error || data.title)) || undefined;

  return {
    code: status,
    message:
      messageFromServer ??
      (error.code === "ECONNABORTED"
        ? "Request timed out"
        : error.message || "Unknown error"),
    details: data ?? null,
    url: error.config?.url,
    method: (error.config?.method ?? "").toString().toUpperCase(),
  };
}

// Response interceptor: on 401 -> try refresh -> retry original request once
api.interceptors.response.use(
  (resp) => resp,
  async (error: AxiosError<any>) => {
    const status = error.response?.status ?? 0;
    const originalRequest = (error.config as AxiosRequestConfig & { _retry?: boolean }) || {};
    const requestUrl = originalRequest.url ?? "";

    // Avoid attempting refresh for auth endpoints themselves
    const isAuthEndpoint =
      requestUrl.endsWith("/auth/refresh") ||
      requestUrl.endsWith("/auth/login") ||
      requestUrl.endsWith("/auth/register") ||
      requestUrl.endsWith("/auth/logout");

    if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // queue until refresh completes
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((token) => {
            if (!token) {
              // refresh failed -> trigger unauthorized handler
              if (unauthorizedHandler) {
                try {
                  unauthorizedHandler();
                } catch {
                  /* swallow */
                }
              }
              reject(buildNormalizedError(error));
              return;
            }
            originalRequest.headers = originalRequest.headers ?? {};
            (originalRequest.headers as any).Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      // start refresh
      isRefreshing = true;
      try {
        const newToken = await attemptRefresh();
        isRefreshing = false;
        onRefreshed(newToken);
        originalRequest.headers = originalRequest.headers ?? {};
        (originalRequest.headers as any).Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        isRefreshing = false;
        onRefreshed(null);
        // refresh failed -> trigger unauthorized handler
        if (unauthorizedHandler) {
          try {
            unauthorizedHandler();
          } catch {
            /* swallow */
          }
        }
        return Promise.reject(buildNormalizedError(error));
      }
    }

    // non-401 or other case
    if (status === 401 && unauthorizedHandler && isAuthEndpoint) {
      // For auth endpoints, if they return 401, run handler too (optional)
      try {
        unauthorizedHandler();
      } catch {
        /* swallow */
      }
    }

    return Promise.reject(buildNormalizedError(error));
  }
);

export default api;
export { api as apiClient };
