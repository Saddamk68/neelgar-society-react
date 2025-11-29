import { api } from "../../../services/apiClient";
import { ENDPOINTS } from "../../../config/endpoints";
import type { LogEntry } from "../types";

export type PaginatedResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type LogFilters = {
  actor?: string;
  action?: string;
  level?: string;
  from?: string;
  to?: string;
  q?: string;
  sort?: string;
};

export async function listLogs(
  page = 0,
  size = 20,
  filters: LogFilters = {}
): Promise<PaginatedResponse<LogEntry>> {
  const res = await api.get(ENDPOINTS.logs.base, {
    params: { page, size, ...filters },
  });
  return res.data;
}
