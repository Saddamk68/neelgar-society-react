// Single source of truth for environment variables.
export const ENV = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080",
  APP_ENV: import.meta.env.MODE ?? "development",
} as const;
