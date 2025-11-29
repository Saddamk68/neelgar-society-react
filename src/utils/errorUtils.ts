import { AxiosError } from "axios";
import { ErrorType } from "@/constants/errorTypes";
import { DEFAULT_ERROR_MESSAGES } from "@/constants/errorMessages";

/**
 * Extract meaningful data from backend error payload.
 * Example backend structure:
 * {
 *   "timestamp": "2025-11-11T04:53:26.204Z",
 *   "status": "401 UNAUTHORIZED",
 *   "message": "Unauthorized access",
 *   "details": "uri=/api/v1/member/10088"
 * }
 */
export function normalizeBackendError(error: AxiosError<any>) {
  const hasResponse = !!error.response;
  const statusCode = error.response?.status ?? 0;
  const data = error.response?.data ?? {};
  const rawStatus = data?.status ?? "";
  const message = data?.message || data?.error || data?.title || "";

  // Extract symbolic error code (e.g. "UNAUTHORIZED" from "401 UNAUTHORIZED")
  let errorCode = "";
  if (typeof rawStatus === "string") {
    const parts = rawStatus.split(/\s+/);
    if (parts.length > 1) errorCode = parts[1];
  }

  const details = data?.details ?? null;

  return {
    httpStatus: statusCode,
    errorCode: errorCode || statusCode.toString(),
    message,
    details,
    raw: data,
  };
}

/**
 * Classify the error type for easier UI handling.
 */
export function classifyErrorType(err: {
  httpStatus?: number;
  errorCode?: string;
}): ErrorType {
  const status = err.httpStatus ?? 0;
  const code = err.errorCode?.toUpperCase() ?? "";

  if (code === "UNAUTHORIZED" || status === 401 || status === 403)
    return ErrorType.UNAUTHORIZED;
  if (status >= 500) return ErrorType.SERVER_ERROR;
  if (status >= 400) return ErrorType.CLIENT_ERROR;
  if (status === 0) return ErrorType.NETWORK_ERROR;
  return ErrorType.UNKNOWN;
}

/**
 * Build the final normalized error object for the entire app.
 */
export function buildAppError(error: AxiosError<any>) {
  const base = normalizeBackendError(error);
  const type = classifyErrorType(base);

  const message =
    base.message ||
    DEFAULT_ERROR_MESSAGES[type] ||
    DEFAULT_ERROR_MESSAGES.UNKNOWN;

  const url = error.config?.url;
  const method = (error.config?.method ?? "").toUpperCase();

  return {
    httpStatus: base.httpStatus,
    errorCode: base.errorCode,
    type,
    message,
    details: base.details,
    url,
    method,
    raw: base.raw,
  };
}
