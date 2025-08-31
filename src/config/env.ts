type AppEnv = {
  API_BASE_URL: string;
  ENV: "development" | "production" | "test";
};

function fallback(name: string, v: string | undefined, def: string): string {
  if (!v) {
    console.warn(`[env] Missing ${name}. Falling back to '${def}'. Create .env.local to override.`);
    return def;
  }
  return v;
}

export const ENV: AppEnv = {
  API_BASE_URL: fallback("VITE_API_BASE_URL", import.meta.env.VITE_API_BASE_URL, "http://localhost:8080/api/v1"),
  ENV: (import.meta.env.MODE as AppEnv["ENV"]) ?? "development",
};
