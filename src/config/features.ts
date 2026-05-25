export const FEATURES = {
  // Set to true only if you want to bypass the real API during local dev
  USE_MOCK_API: false,

  // Shows demo login buttons — only in development, never in production
  SHOW_DEMO_LOGIN: import.meta.env.MODE === "development",
} as const;
