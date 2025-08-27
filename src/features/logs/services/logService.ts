import { FEATURES } from "../../../config/features";
import type { LogEntry } from "../types";
import { api } from "../../../services/apiClient";
import { ENDPOINTS } from "../../../config/endpoints";

const MOCK_LOGS: LogEntry[] = [
  {
    id: "1",
    timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    level: "INFO",
    actor: "admin@system",
    action: "Login",
    details: "Admin logged in successfully",
  },
  {
    id: "2",
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    level: "WARN",
    actor: "member@a-101",
    action: "UpdateProfile",
    details: "Phone updated without email",
  },
  {
    id: "3",
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    level: "ERROR",
    actor: "system",
    action: "EmailDispatch",
    details: "SMTP connection timeout",
  },
  {
    id: "4",
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    level: "INFO",
    actor: "admin@system",
    action: "AddMember",
    details: "Member Asha Patel created",
  },
];

export async function listLogs(): Promise<LogEntry[]> {
  if (FEATURES.USE_MOCK_API) {
    await new Promise((r) => setTimeout(r, 250));
    // newest first
    return [...MOCK_LOGS].sort(
      (a, b) => +new Date(b.timestamp) - +new Date(a.timestamp)
    );
  }
  const res = await api.get(ENDPOINTS.logs.base);
  return res.data;
}
