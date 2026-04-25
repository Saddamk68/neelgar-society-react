type AppEnv = {
  API_BASE_URL: string;
  OAUTH2_BASE_URL: string;
  OAUTH2_CLIENT_ID: string;
  OAUTH2_CLIENT_SECRET: string;
  MAX_UPLOAD_MB: number;
  NOTIFICATION_TIMEOUT_MS: number;
  ENV: "development" | "production" | "test";
};

function fallback(name: string, v: string | undefined, def: string): string {
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
    "/api/v1"
  ),
  OAUTH2_BASE_URL: fallback(
    "VITE_OAUTH2_BASE_URL",
    import.meta.env.VITE_OAUTH2_BASE_URL,
    ""
  ),
  OAUTH2_CLIENT_ID: fallback(
    "VITE_OAUTH2_CLIENT_ID",
    import.meta.env.VITE_OAUTH2_CLIENT_ID,
    "neelgar-web"
  ),
  OAUTH2_CLIENT_SECRET: fallback(
    "VITE_OAUTH2_CLIENT_SECRET",
    import.meta.env.VITE_OAUTH2_CLIENT_SECRET,
    ""
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
