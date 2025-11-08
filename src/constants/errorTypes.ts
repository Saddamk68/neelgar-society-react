export const enum ErrorType {
  UNAUTHORIZED = "UNAUTHORIZED",
  NETWORK_ERROR = "NETWORK_ERROR",
  SERVER_ERROR = "SERVER_ERROR",
  CLIENT_ERROR = "CLIENT_ERROR",
  UNKNOWN = "UNKNOWN",
}

export type ErrorTypeString = `${ErrorType}`; // optional helper type
