import axios from "axios";
import { ENV } from "../config/env";

// Module-level token holder (in-memory). We avoid localStorage for security.
let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export const api = axios.create({
  baseURL: ENV.API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  // withCredentials can be enabled later if you use httpOnly cookies:
  // withCredentials: true,
});

// Attach token if present
api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${authToken}`;
  }
  return config;
});

// Basic response/error normalization
api.interceptors.response.use(
  (resp) => resp,
  (error) => {
    const normalized = {
      code: error?.response?.status ?? 0,
      message:
        error?.response?.data?.message ??
        error?.message ??
        "Unknown error",
      details: error?.response?.data ?? null,
    };
    return Promise.reject(normalized);
  }
);
