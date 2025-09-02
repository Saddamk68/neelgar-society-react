// Match backend LogLevel enum
export type LogLevel = "INFO" | "WARN" | "ERROR" | "TRACE" | "DEBUG" | "FATAL";

export type LogEntry = {
  id: number;              // backend uses Long
  eventTime: string;       // ISO string from backend
  level: LogLevel;
  actor?: string;          // who did it (nullable allowed)
  action: string;          // what happened
  metadata?: string;       // optional extra info (JSON/string)
  targetUserId?: number;   // optional, only if needed
  ipAddress?: string;
  userAgent?: string;
};


// Generic paginated response (matches backend PageResponse)
export type PaginatedResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

// 🔹 Centralized color mapping for log levels
export const LOG_LEVEL_STYLES: Record<
  LogLevel,
  { bg: string; text: string }
> = {
  INFO:   { bg: "bg-green-100",  text: "text-green-800" },
  WARN:   { bg: "bg-yellow-100", text: "text-yellow-800" },
  ERROR:  { bg: "bg-red-100",    text: "text-red-800" },
  TRACE:  { bg: "bg-gray-100",   text: "text-gray-800" },
  DEBUG:  { bg: "bg-blue-100",   text: "text-blue-800" },
  FATAL:  { bg: "bg-purple-100", text: "text-purple-800" },
};
