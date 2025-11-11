type AppEnv = {
  API_BASE_URL: string;
  MAX_UPLOAD_MB: number;
  NOTIFICATION_TIMEOUT_MS: number;
  ENV: "development" | "production" | "test";
};

/**
 * Utility to handle missing environment variables gracefully.
 */
function fallback(
  name: string,
  v: string | undefined,
  def: string
): string {
  if (!v) {
    console.warn(
      `[env] Missing ${name}. Falling back to '${def}'. Create .env.local or .env.<env> to override.`
    );
    return def;
  }
  return v;
}

/**
 * Centralized environment configuration for frontend.
 * Equivalent to application.properties in Java.
 */
export const ENV: AppEnv = {
  API_BASE_URL: fallback(
    "VITE_API_BASE_URL",
    import.meta.env.VITE_API_BASE_URL,
    "http://localhost:8080/api/v1"
  ),
  MAX_UPLOAD_MB: Number(
    fallback("VITE_MAX_UPLOAD_MB", import.meta.env.VITE_MAX_UPLOAD_MB, "5")
  ),
  NOTIFICATION_TIMEOUT_MS: Number(
    fallback(
      "VITE_NOTIFICATION_TIMEOUT_MS",
      import.meta.env.VITE_NOTIFICATION_TIMEOUT_MS,
      "5000"
    )
  ),
  ENV: (import.meta.env.MODE as AppEnv["ENV"]) ?? "development",
};
