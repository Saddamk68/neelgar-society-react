export enum ErrorType {
  NETWORK_ERROR = "NETWORK_ERROR",
  TIMEOUT = "TIMEOUT",
  UNAUTHORIZED = "UNAUTHORIZED",
  CLIENT_ERROR = "CLIENT_ERROR",
  SERVER_ERROR = "SERVER_ERROR",
  UNKNOWN = "UNKNOWN",
}

export type ErrorTypeString = `${ErrorType}`; // optional helper type
