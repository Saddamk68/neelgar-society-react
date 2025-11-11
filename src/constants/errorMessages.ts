export const DEFAULT_ERROR_MESSAGES = {
  NETWORK_ERROR: "Network error — unable to reach the server.",
  TIMEOUT: "Request timed out. Please try again.",
  SERVER_ERROR: "Server error — please try again later.",
  CLIENT_ERROR: "Request could not be completed. Please check your input.",
  UNAUTHORIZED: "Unauthorized access. Please sign in again.",
  UNKNOWN: "An unexpected error occurred. Please try again.",
} as const;

export type DefaultErrorMessageKey = keyof typeof DEFAULT_ERROR_MESSAGES;
