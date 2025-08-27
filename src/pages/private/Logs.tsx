import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listLogs } from "../../features/logs/services/logService";
import { LOG_COLUMNS } from "../../features/logs/tableConfig";
import type { LogEntry, LogLevel } from "../../features/logs/types";
import { PRIVATE, LOGS_UI } from "../../constants/messages";
import { useNotify } from "../../services/notifications";

type Filters = {
  level: "ALL" | LogLevel;
  from?: string;
  to?: string;
  q?: string;
};

export default function Logs() {
  const notify = useNotify();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["logs", "list"],
    queryFn: listLogs,
  });

  useEffect(() => {
    if (isError) notify.error("Failed to load logs.");
  }, [isError, notify]);

  const [filters, setFilters] = useState<Filters>({ level: "ALL", q: "" });

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((row) => {
      if (filters.level !== "ALL" && row.level !== filters.level) return false;
      const ts = new Date(row.timestamp);
      if (filters.from) {
        const fromDate = new Date(filters.from + "T00:00:00");
        if (ts < fromDate) return false;
      }
      if (filters.to) {
        const toDate = new Date(filters.to + "T23:59:59");
        if (ts > toDate) return false;
      }
      const q = (filters.q ?? "").trim().toLowerCase();
      if (q) {
        const blob = `${row.actor} ${row.action} ${row.details ?? ""}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }, [data, filters]);

  const clearFilters = () =>
    setFilters({ level: "ALL", from: undefined, to: undefined, q: "" });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">{PRIVATE.LOGS_TITLE}</h1>
        <p className="text-text-muted">{PRIVATE.LOGS_DESC}</p>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex items-end flex-wrap gap-3">
          <div className="w-full sm:w-48">
            <label className="block text-xs text-text-muted mb-1">
              {LOGS_UI.LEVEL}
            </label>
            <select
              className="w-full rounded-md border border-slate-300 px-2 py-2"
              value={filters.level}
              onChange={(e) =>
                setFilters((f) => ({ ...f, level: e.target.value as Filters["level"] }))
              }
            >
              <option value="ALL">{LOGS_UI.ALL}</option>
              <option value="INFO">{LOGS_UI.INFO}</option>
              <option value="WARN">{LOGS_UI.WARN}</option>
              <option value="ERROR">{LOGS_UI.ERROR}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-text-muted mb-1">
              {LOGS_UI.FROM}
            </label>
            <input
              type="date"
              className="rounded-md border border-slate-300 px-2 py-2"
              value={filters.from ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value || undefined }))}
            />
          </div>

          <div>
            <label className="block text-xs text-text-muted mb-1">
              {LOGS_UI.TO}
            </label>
            <input
              type="date"
              className="rounded-md border border-slate-300 px-2 py-2"
              value={filters.to ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value || undefined }))}
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-text-muted mb-1">
              {LOGS_UI.SEARCH}
            </label>
            <input
              type="text"
              placeholder="actor, action, details..."
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              value={filters.q}
              onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            />
          </div>

          <button
            className="px-3 py-2 rounded-md border border-slate-300 hover:bg-slate-50 transition"
            onClick={clearFilters}
          >
            {LOGS_UI.CLEAR}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow p-4 overflow-x-auto">
        {isLoading && <div className="text-sm text-text-muted">Loading logs…</div>}
        {isError && <div className="text-sm text-danger">Failed to load logs.</div>}

        {!isLoading && !isError && (
          <table className="min-w-[800px] w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                {LOG_COLUMNS.map((col) => (
                  <th key={col.key as string} scope="col" className="py-2 pr-4 font-medium text-text-muted">
                    {col.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((row: LogEntry) => (
                  <tr key={row.id} className="border-b last:border-b-0 hover:bg-slate-50/60">
                    <td className="py-2 pr-4">{new Date(row.timestamp).toLocaleString()}</td>
                    <td className="py-2 pr-4">
                      <span
                        className={[
                          "px-2 py-0.5 rounded text-xs",
                          row.level === "INFO" && "bg-green-100 text-green-800",
                          row.level === "WARN" && "bg-yellow-100 text-yellow-800",
                          row.level === "ERROR" && "bg-red-100 text-red-800",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        {row.level}
                      </span>
                    </td>
                    <td className="py-2 pr-4">{row.actor}</td>
                    <td className="py-2 pr-4">{row.action}</td>
                    <td className="py-2 pr-4">{row.details ?? "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={LOG_COLUMNS.length} className="py-6 text-center text-text-muted">
                    No logs match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
