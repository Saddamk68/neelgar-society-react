import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";
import { ENV } from "../config/env";
import { buildAppError } from "@/utils/errorUtils";
import { ErrorType } from "@/constants/errorTypes";

/**
 * Central API client + refresh flow.
 *
 * - Main `api` instance does NOT use withCredentials (keeps requests default).
 * - `refreshClient` uses withCredentials: true so the browser will send the HttpOnly refresh cookie.
 * - Access token is persisted to localStorage under the key ACCESS_TOKEN_KEY.
 * - Exports helpers: getAuthToken, setAuthToken, clearAuthToken, onUnauthorized, api.
 */

const ACCESS_TOKEN_KEY = "accessToken";

/** ================= Token helpers ================= */
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

/** ================= Unauthorized handler ================= */
let unauthorizedHandler: (() => void) | null = null;
export function onUnauthorized(cb: (() => void) | null) {
  unauthorizedHandler = cb;
}

/** ================= Main axios instance ================= */
export const api = axios.create({
  baseURL: ENV.API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 15_000,
});

/** ================= Refresh client ================= */
const refreshClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 15_000,
});

/** ================= Request interceptor ================= */
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAuthToken();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }

  if (config.data instanceof FormData) {
    delete (config.headers as any)["Content-Type"];
    delete (config.headers as any)["content-type"];
  }

  (config.headers as any)["X-Request-Id"] =
    (config.headers as any)["X-Request-Id"] ??
    `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  return config;
});

/** ================= Refresh queue implementation ================= */
let isRefreshing = false;
let refreshSubscribers: Array<(token: string | null) => void> = [];

function subscribeTokenRefresh(cb: (token: string | null) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string | null) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

async function attemptRefresh(): Promise<string> {
  const url = "/auth/refresh";
  try {
    const resp: AxiosResponse<any> = await refreshClient.post(url, {});
    const newAccessToken = resp?.data?.accessToken;
    if (!newAccessToken) throw new Error("no_access_token_in_refresh_response");
    setAuthToken(newAccessToken);
    return newAccessToken;
  } catch (err) {
    setAuthToken(null);
    throw err;
  }
}

/** ================= Error normalization wrapper ================= */
function buildNormalizedError(error: AxiosError<any>) {
  return buildAppError(error);
}

/** ================= Response interceptor ================= */
api.interceptors.response.use(
  (resp) => resp,
  async (error: AxiosError<any>) => {
    const status = error.response?.status ?? 0;
    const originalRequest =
      (error.config as AxiosRequestConfig & { _retry?: boolean }) || {};
    const requestUrl = originalRequest.url ?? "";

    const isAuthEndpoint =
      requestUrl.endsWith("/auth/refresh") ||
      requestUrl.endsWith("/auth/login") ||
      requestUrl.endsWith("/auth/register") ||
      requestUrl.endsWith("/auth/logout");

    // -------- Handle token refresh --------
    if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((token) => {
            if (!token) {
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

        const normalized = buildNormalizedError(refreshErr as AxiosError);

        // ✅ handle unauthorized vs others
        if (
          normalized.httpStatus === 401 ||
          normalized.httpStatus === 403 ||
          normalized.type === ErrorType.UNAUTHORIZED
        ) {
          if (unauthorizedHandler) {
            try {
              unauthorizedHandler();
            } catch {
              /* swallow */
            }
          }
        } else {
          import("./notifications").then(({ notifyGlobal }) => {
            if (normalized.type === ErrorType.NETWORK_ERROR) {
              notifyGlobal("error", "Network error — please check your connection.");
            } else if (normalized.type === ErrorType.SERVER_ERROR) {
              notifyGlobal("error", "Server error — please try again later.");
            }
          });
        }

        return Promise.reject(normalized);
      }
    }

    // Non-401 case for auth endpoints
    if (status === 401 && unauthorizedHandler && isAuthEndpoint) {
      try {
        unauthorizedHandler();
      } catch {
        /* swallow */
      }
    }

    return Promise.reject(buildNormalizedError(error));
  }
);

/** ================= Global network/server error handler ================= */
api.interceptors.response.use(undefined, (error: AxiosError<any>) => {
  const normalized = buildNormalizedError(error);

  if (normalized.type === ErrorType.NETWORK_ERROR) {
    import("./notifications").then(({ notifyGlobal }) => {
      notifyGlobal("error", "Network error — please check your connection.");
    });
  } else if (normalized.type === ErrorType.SERVER_ERROR) {
    import("./notifications").then(({ notifyGlobal }) => {
      notifyGlobal("error", "Server error — please try again later.");
    });
  }

  return Promise.reject(normalized);
});

export default api;
export { api as apiClient };
