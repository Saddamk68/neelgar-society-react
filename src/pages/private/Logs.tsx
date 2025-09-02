import { useEffect, useState, JSX } from "react";
import { useQuery } from "@tanstack/react-query";
import { listLogs, PaginatedResponse } from "../../features/logs/services/logService";
import { LOGS_COLUMNS } from "../../features/logs/tableConfig";
import type { LogEntry, LogLevel } from "../../features/logs/types";
import { PRIVATE, LOGS_UI } from "../../constants/messages";
import { useNotify } from "../../services/notifications";
import { LOG_LEVEL_STYLES } from "../../features/logs/types";

type Filters = {
  level: "ALL" | LogLevel;
  from?: string;
  to?: string;
  q?: string;
};

type SortConfig = {
  key: keyof LogEntry | null;
  direction: "asc" | "desc";
};

export default function Logs() {
  const notify = useNotify();

  const [filters, setFilters] = useState<Filters>({ level: "ALL", q: "" });
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "eventTime",
    direction: "desc",
  });

  const { data, isLoading, isError } = useQuery<PaginatedResponse<LogEntry>>({
    queryKey: ["logs", page, filters, sortConfig],
    queryFn: () =>
      listLogs(page, size, {
        level: filters.level !== "ALL" ? filters.level : undefined,
        from: filters.from,
        to: filters.to,
        q: filters.q,
        sort: sortConfig.key
          ? `${sortConfig.key},${sortConfig.direction}`
          : undefined,
      }),
  });

  useEffect(() => {
    if (isError) notify.error("Failed to load logs.");
  }, [isError, notify]);

  const clearFilters = () => {
    setFilters({ level: "ALL", from: undefined, to: undefined, q: "" });
    setPage(0);
  };

  // Pagination helper
  const getVisiblePages = (totalPages: number, currentPage: number) => {
    const maxVisible = 5;
    let start = Math.max(0, currentPage - Math.floor(maxVisible / 2));
    let end = start + maxVisible - 1;
    if (end >= totalPages) {
      end = totalPages - 1;
      start = Math.max(0, end - maxVisible + 1);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const handleSort = (key: keyof LogEntry) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">{PRIVATE.LOGS_TITLE}</h1>
        <p className="text-text-muted">{PRIVATE.LOGS_DESC}</p>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex items-end flex-wrap gap-3">
          {/* Level filter */}
          <div className="w-full sm:w-48">
            <label className="block text-xs text-text-muted mb-1">{LOGS_UI.LEVEL}</label>
            <select
              className="w-full rounded-md border border-slate-300 px-2 py-2"
              value={filters.level}
              onChange={(e) =>
                setFilters((f) => ({ ...f, level: e.target.value as Filters["level"] }))
              }
            >
              <option value="ALL">{LOGS_UI.ALL}</option>
              <option value="INFO">INFO</option>
              <option value="WARN">WARN</option>
              <option value="ERROR">ERROR</option>
              <option value="TRACE">TRACE</option>
              <option value="DEBUG">DEBUG</option>
              <option value="FATAL">FATAL</option>
            </select>
          </div>

          {/* Date filters */}
          <div>
            <label className="block text-xs text-text-muted mb-1">{LOGS_UI.FROM}</label>
            <input
              type="date"
              className="rounded-md border border-slate-300 px-2 py-2"
              value={filters.from ?? ""}
              onChange={(e) =>
                setFilters((f) => ({ ...f, from: e.target.value || undefined }))
              }
            />
          </div>

          <div>
            <label className="block text-xs text-text-muted mb-1">{LOGS_UI.TO}</label>
            <input
              type="date"
              className="rounded-md border border-slate-300 px-2 py-2"
              value={filters.to ?? ""}
              onChange={(e) =>
                setFilters((f) => ({ ...f, to: e.target.value || undefined }))
              }
            />
          </div>

          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-text-muted mb-1">{LOGS_UI.SEARCH}</label>
            <input
              type="text"
              placeholder="actor, action, details..."
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              value={filters.q}
              onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            />
          </div>

          {/* Clear button */}
          <button
            className="px-4 py-2 rounded-md bg-red-50 text-red-600 border border-red-200 
                       shadow-sm hover:bg-red-100 hover:shadow transition text-sm"
            onClick={clearFilters}
          >
            {LOGS_UI.CLEAR}
          </button>
        </div>
      </div>

      {/* Table + Pagination */}
      <div className="flex-1 bg-white rounded-xl shadow overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <div className="max-h-[49vh] overflow-y-auto">
            {isLoading && (
              <div className="text-sm text-text-muted p-4">Loading logs…</div>
            )}
            {isError && (
              <div className="text-sm text-danger p-4">Failed to load logs.</div>
            )}

            {!isLoading && !isError && data && (
              <table className="min-w-[1000px] w-full text-sm border-collapse">
                <thead className="sticky top-0 bg-gray-200 shadow-sm">
                  <tr className="text-left border-b">
                    {LOGS_COLUMNS.map((col) => (
                      <th
                        key={col.key}
                        style={{ minWidth: col.width, textAlign: col.align ?? "left" }}
                        className={`py-2 px-4 ${
                          col.sortable ? "cursor-pointer select-none" : ""
                        }`}
                        onClick={() => col.sortable && handleSort(col.key as keyof LogEntry)}
                      >
                        {col.title}{" "}
                        {sortConfig.key === col.key &&
                          (sortConfig.direction === "asc" ? "↑" : "↓")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.content.length > 0 ? (
                    data.content.map((row: LogEntry) => (
                      <tr
                        key={row.id}
                        className="border-b last:border-b-0 hover:bg-slate-50/60"
                      >
                        {LOGS_COLUMNS.map((col) => {
                          const value = row[col.key as keyof LogEntry];
                          let displayValue: string | JSX.Element = value as string;

                          // Special formatting for known fields
                          if (col.key === "eventTime" && value) {
                            displayValue = new Date(value as string).toLocaleString();
                          }
                          if (col.key === "level" && value) {
                            displayValue = (
                              <span
                                className={`px-2 py-0.5 rounded text-xs ${
                                  LOG_LEVEL_STYLES[value as LogLevel].bg
                                } ${LOG_LEVEL_STYLES[value as LogLevel].text}`}
                              >
                                {value}
                              </span>
                            );
                          }

                          return (
                            <td
                              key={col.key}
                              style={{ minWidth: col.width, textAlign: col.align ?? "left" }}
                              className={`py-2 px-4 ${
                                col.truncate ? "truncate max-w-[200px]" : ""
                              }`}
                              title={col.tooltip && typeof value === "string" ? value : undefined}
                            >
                              {displayValue ?? "-"}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={LOGS_COLUMNS.length} className="py-6 text-center text-text-muted">
                        No logs match your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex justify-center py-2 text-xs text-gray-600">
            <span
              className={`cursor-pointer mx-1 ${
                page === 0 ? "text-gray-400 cursor-not-allowed" : "hover:underline"
              }`}
              onClick={() => page > 0 && setPage(page - 1)}
            >
              Prev
            </span>
            {getVisiblePages(data.totalPages, page).map((p) => (
              <span
                key={p}
                className={`cursor-pointer mx-1 ${
                  p === page ? "font-bold text-primary underline" : "hover:underline"
                }`}
                onClick={() => setPage(p)}
              >
                {p + 1}
              </span>
            ))}
            <span
              className={`cursor-pointer mx-1 ${
                page >= data.totalPages - 1 ? "text-gray-400 cursor-not-allowed" : "hover:underline"
              }`}
              onClick={() => page < data.totalPages - 1 && setPage(page + 1)}
            >
              Next
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
