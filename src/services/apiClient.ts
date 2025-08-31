import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { ENV } from "../config/env";

// ---- In-memory token (no localStorage) ----
let authToken: string | null = null;
export function setAuthToken(token: string | null) {
  authToken = token;
}

// Optional: a callback the app can register to react to 401s (e.g., logout)
let unauthorizedHandler: (() => void) | null = null;
export function onUnauthorized(cb: (() => void) | null) {
  unauthorizedHandler = cb;
}

// ---- Axios instance ----
export const api = axios.create({
  baseURL: ENV.API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 15000, // sensible default
  // withCredentials: true, // enable if you switch to httpOnly cookies later
});

// ---- Request interceptor ----
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // Attach bearer token if available
  if (authToken) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${authToken}`;
  }

  // Add a lightweight request id for tracing (backend can echo it)
  (config.headers as any)["X-Request-Id"] =
    (config.headers as any)["X-Request-Id"] ??
    `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  return config;
});

// ---- Response interceptor (normalize errors, handle 401) ----
api.interceptors.response.use(
  (resp) => resp,
  (error: AxiosError<any>) => {
    const status = error.response?.status ?? 0;

    // Fire unauthorized hook once per 401 response
    if (status === 401 && unauthorizedHandler) {
      try {
        unauthorizedHandler();
      } catch {
        /* no-op */
      }
    }

    // Build normalized error payload
    const data = error.response?.data as any;
    const messageFromServer =
      (data && (data.message || data.error || data.title)) || undefined;

    const normalized = {
      code: status, // HTTP status or 0 for network/timeouts
      message:
        messageFromServer ??
        (error.code === "ECONNABORTED"
          ? "Request timed out"
          : error.message || "Unknown error"),
      details: data ?? null,
      // Optional extras for debugging:
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
    };

    return Promise.reject(normalized);
  }
);


// ------ This will be the future code ------ 

const apiClient = axios.create({
  baseURL: "http://localhost:8080/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
