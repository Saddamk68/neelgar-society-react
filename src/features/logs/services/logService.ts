import { api } from "../../../services/apiClient";
import { AuditLog, AuditLogPage, AuditLogFilters } from "../types";

function unwrap<T>(res: any): T {
  return res.data?.data ?? res.data;
}

export async function listLogs(
  page = 0,
  size = 20,
  filters: AuditLogFilters = {}
): Promise<AuditLogPage> {
  const res = await api.get("/logs", {
    params: {
      page,
      size,
      ...(filters.action ? { action: filters.action } : {}),
      ...(filters.entityType ? { entityType: filters.entityType } : {}),
      ...(filters.actorCode ? { actorCode: filters.actorCode } : {}),
      ...(filters.from ? { from: filters.from } : {}),
      ...(filters.to ? { to: filters.to } : {}),
    },
  });
  return unwrap<AuditLogPage>(res);
}

export async function getLog(id: number): Promise<AuditLog> {
  const res = await api.get(`/logs/${id}`);
  return unwrap<AuditLog>(res);
}
