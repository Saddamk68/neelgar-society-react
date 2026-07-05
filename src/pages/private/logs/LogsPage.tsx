import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Monitor, Smartphone, Tablet, Bot, HelpCircle, X, ChevronDown, ChevronUp } from "lucide-react";
import { listLogs, getLog } from "../../../features/logs/services/logService";
import { AuditLog, AuditAction, AuditLogFilters, DeviceType } from "../../../features/logs/types";
import { useNotify } from "../../../services/notifications";
import Select from "@/components/form/Select";

// ── Constants ─────────────────────────────────────────────────────────────────

const ACTION_OPTIONS: AuditAction[] = [
    "LOGIN", "LOGIN_FAILED", "LOGOUT", "PASSWORD_CHANGED",
    "MEMBER_CREATED", "MEMBER_UPDATED", "MEMBER_DEACTIVATED", "MEMBER_REACTIVATED", "DOD_SET",
    "PHOTO_UPLOADED", "PHOTO_DELETED",
    "SPOUSE_LINKED", "SPOUSE_ENDED", "PARENT_LINKED",
    "FAMILY_CREATED", "FAMILY_UPDATED", "FAMILY_DEACTIVATED", "FAMILY_REASSIGNED", "HEAD_REASSIGNED",
    "USER_CREATED", "USER_DEACTIVATED", "USER_ROLE_CHANGED",
];

const ENTITY_OPTIONS = ["MEMBER", "FAMILY", "RELATIONSHIP", "USER"];

// ── Badge helpers ─────────────────────────────────────────────────────────────

function actionBadgeClass(action: AuditAction): string {
    if (["MEMBER_CREATED", "FAMILY_CREATED", "USER_CREATED", "SPOUSE_LINKED", "PARENT_LINKED", "MEMBER_REACTIVATED"].includes(action))
        return "bg-green-100 text-green-700";
    if (["MEMBER_UPDATED", "FAMILY_UPDATED", "FAMILY_REASSIGNED", "HEAD_REASSIGNED", "SPOUSE_ENDED", "PASSWORD_CHANGED", "USER_ROLE_CHANGED", "DOD_SET", "PHOTO_UPLOADED"].includes(action))
        return "bg-amber-100 text-amber-700";
    if (["MEMBER_DEACTIVATED", "FAMILY_DEACTIVATED", "USER_DEACTIVATED", "PHOTO_DELETED"].includes(action))
        return "bg-red-100 text-red-700";
    if (action === "LOGIN")
        return "bg-blue-100 text-blue-700";
    if (action === "LOGOUT")
        return "bg-slate-200 text-slate-700";
    if (action === "LOGIN_FAILED")
        return "bg-orange-100 text-orange-700";
    return "bg-slate-100 text-slate-600";
}

function DeviceIcon({ type }: { type?: DeviceType }) {
    const cls = "w-4 h-4 text-slate-400";
    switch (type) {
        case "MOBILE": return <Smartphone className={cls} />;
        case "TABLET": return <Tablet className={cls} />;
        case "BOT": return <Bot className={cls} />;
        case "DESKTOP": return <Monitor className={cls} />;
        default: return <HelpCircle className={cls} />;
    }
}

function formatTs(ts: string): string {
    return new Date(ts).toLocaleString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

// ── Field diff ────────────────────────────────────────────────────────────────

function FieldDiff({ oldValue, newValue }: { oldValue?: string; newValue?: string }) {
    const parse = (v?: string) => {
        if (!v) return null;
        try { return JSON.parse(v); } catch { return v; }
    };

    const oldObj = parse(oldValue);
    const newObj = parse(newValue);

    if (!oldObj && !newObj) return <p className="text-slate-400 text-xs">No data captured.</p>;

    // If both are objects, show field-level diff
    if (oldObj && newObj && typeof oldObj === "object" && typeof newObj === "object") {
        const keys = Array.from(new Set([...Object.keys(oldObj), ...Object.keys(newObj)]));
        const changed = keys.filter(k => JSON.stringify(oldObj[k]) !== JSON.stringify(newObj[k]));
        const unchanged = keys.filter(k => JSON.stringify(oldObj[k]) === JSON.stringify(newObj[k]));

        return (
            <div className="space-y-3">
                {changed.length > 0 && (
                    <div>
                        <p className="text-xs font-semibold text-slate-500 mb-1">Changed fields</p>
                        <div className="space-y-1">
                            {changed.map(k => (
                                <div key={k} className="grid grid-cols-3 gap-2 text-xs">
                                    <span className="font-mono text-slate-500">{k}</span>
                                    <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded truncate">
                                        {String(oldObj[k] ?? "—")}
                                    </span>
                                    <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded truncate">
                                        {String(newObj[k] ?? "—")}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {unchanged.length > 0 && (
                    <details className="text-xs text-slate-400 cursor-pointer">
                        <summary>{unchanged.length} unchanged field(s)</summary>
                        <div className="mt-1 space-y-1">
                            {unchanged.map(k => (
                                <div key={k} className="grid grid-cols-3 gap-2">
                                    <span className="font-mono text-slate-400">{k}</span>
                                    <span className="col-span-2 text-slate-400">{String(newObj[k] ?? "—")}</span>
                                </div>
                            ))}
                        </div>
                    </details>
                )}
            </div>
        );
    }

    // Raw fallback
    return (
        <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
                <p className="font-semibold text-slate-500 mb-1">Before</p>
                <pre className="bg-red-50 text-red-700 p-2 rounded whitespace-pre-wrap break-all">
                    {oldValue ?? "—"}
                </pre>
            </div>
            <div>
                <p className="font-semibold text-slate-500 mb-1">After</p>
                <pre className="bg-green-50 text-green-700 p-2 rounded whitespace-pre-wrap break-all">
                    {newValue ?? "—"}
                </pre>
            </div>
        </div>
    );
}

// ── Detail panel ──────────────────────────────────────────────────────────────

function DetailPanel({ log, onClose }: { log: AuditLog; onClose: () => void }) {
    const [showDiff, setShowDiff] = useState(false);
    const hasDiff = !!(log.oldValue || log.newValue);

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/30" onClick={onClose} />
            <div className="relative z-10 w-full max-w-lg bg-white shadow-xl flex flex-col h-full overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b">
                    <div>
                        <p className="font-semibold text-slate-800">Log #{log.id}</p>
                        <p className="text-xs text-slate-400">{formatTs(log.timestamp)}</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded hover:bg-slate-100">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4 text-sm">
                    {/* Action */}
                    <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${actionBadgeClass(log.action)}`}>
                            {log.action}
                        </span>
                        {log.entityType && (
                            <span className="text-xs text-slate-400">{log.entityType}{log.entityCode ? ` · ${log.entityCode}` : ""}</span>
                        )}
                    </div>

                    {/* Actor */}
                    <div className="bg-slate-50 rounded-lg p-3 space-y-1 text-xs">
                        <p><span className="text-slate-400 w-24 inline-block">Actor</span><span className="font-mono">{log.actorUsername ?? "—"}</span></p>
                        <p><span className="text-slate-400 w-24 inline-block">Member code</span><span className="font-mono">{log.actorMemberCode ?? "—"}</span></p>
                        <p><span className="text-slate-400 w-24 inline-block">Role</span>{log.actorRole ?? "—"}</p>
                    </div>

                    {/* Request */}
                    <div className="bg-slate-50 rounded-lg p-3 space-y-1 text-xs">
                        <p><span className="text-slate-400 w-24 inline-block">IP Address</span><span className="font-mono">{log.ipAddress ?? "—"}</span></p>
                        <p className="flex items-center gap-1">
                            <span className="text-slate-400 w-24 inline-block">Device</span>
                            <DeviceIcon type={log.deviceType} />
                            <span>{log.deviceType ?? "—"}</span>
                        </p>
                        <p><span className="text-slate-400 w-24 inline-block">User agent</span><span className="text-slate-500 break-all">{log.userAgent ?? "—"}</span></p>
                    </div>

                    {/* Diff */}
                    {hasDiff && (
                        <div>
                            <button
                                className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 mb-2"
                                onClick={() => setShowDiff(p => !p)}
                            >
                                {showDiff ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                Field changes
                            </button>
                            {showDiff && <FieldDiff oldValue={log.oldValue} newValue={log.newValue} />}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function LogsPage() {
    const notify = useNotify();
    const [page, setPage] = useState(0);
    const [filters, setFilters] = useState<AuditLogFilters>({});
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [detailLog, setDetailLog] = useState<AuditLog | null>(null);

    const { data, isLoading, isError } = useQuery({
        queryKey: ["logs", page, filters],
        queryFn: () => listLogs(page, 20, filters),
    });

    useEffect(() => { if (isError) notify.error("Failed to load audit logs."); }, [isError]);

    // Fetch detail when row clicked
    useEffect(() => {
        if (selectedId === null) { setDetailLog(null); return; }
        getLog(selectedId).then(setDetailLog).catch(() => notify.error("Failed to load log detail."));
    }, [selectedId]);

    function handleFilterChange(key: keyof AuditLogFilters, value: string) {
        setFilters(prev => ({ ...prev, [key]: value || undefined }));
        setPage(0);
    }

    function clearFilters() {
        setFilters({});
        setPage(0);
    }

    const hasFilters = Object.values(filters).some(Boolean);

    return (
        <div className="space-y-4 flex flex-col h-[calc(98vh-8rem)]">

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                    <h1 className="text-2xl font-semibold">Audit Logs</h1>
                    <p className="text-slate-500 text-sm">
                        {data ? `${data.totalElements} event(s) recorded` : "System activity trail"}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow p-3 flex flex-wrap gap-3 items-end">
                <div className="flex flex-col gap-1 w-48">
                    <label className="text-xs text-slate-500">Action</label>
                    <Select
                        value={filters.action ?? ""}
                        onChange={v => handleFilterChange("action", v)}
                        options={[
                            { value: "", label: "All actions" },
                            ...ACTION_OPTIONS.map(a => ({ value: a, label: a })),
                        ]}
                    />
                </div>

                <div className="flex flex-col gap-1 w-40">
                    <label className="text-xs text-slate-500">Entity type</label>
                    <Select
                        value={filters.entityType ?? ""}
                        onChange={v => handleFilterChange("entityType", v)}
                        options={[
                            { value: "", label: "All entities" },
                            ...ENTITY_OPTIONS.map(e => ({ value: e, label: e })),
                        ]}
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-500">Actor code</label>
                    <input
                        type="text"
                        placeholder="Member code…"
                        className="border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 w-36"
                        value={filters.actorCode ?? ""}
                        onChange={e => handleFilterChange("actorCode", e.target.value)}
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-500">From</label>
                    <input
                        type="datetime-local"
                        className="border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                        value={filters.from ?? ""}
                        onChange={e => handleFilterChange("from", e.target.value ? new Date(e.target.value).toISOString() : "")}
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-500">To</label>
                    <input
                        type="datetime-local"
                        className="border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                        value={filters.to ?? ""}
                        onChange={e => handleFilterChange("to", e.target.value ? new Date(e.target.value).toISOString() : "")}
                    />
                </div>

                {hasFilters && (
                    <button
                        onClick={clearFilters}
                        className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-500 transition px-2 py-1.5 border rounded-md"
                    >
                        <X size={12} /> Clear
                    </button>
                )}
            </div>

            {/* Table */}
            {isLoading && (
                <div className="flex-1 bg-white rounded-xl shadow p-6 space-y-3">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-8 bg-slate-100 rounded animate-pulse" />
                    ))}
                </div>
            )}

            {isError && (
                <div className="bg-white p-4 rounded shadow text-red-500 text-sm">
                    Failed to load audit logs.
                </div>
            )}

            {!isLoading && !isError && data && (
                <div className="flex-1 bg-white rounded-xl shadow overflow-hidden flex flex-col">
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-slate-50 text-left text-xs text-slate-500 uppercase tracking-wide">
                                    <th className="px-4 py-3">Timestamp</th>
                                    <th className="px-4 py-3">Actor</th>
                                    <th className="px-4 py-3">Action</th>
                                    <th className="px-4 py-3">Entity</th>
                                    <th className="px-4 py-3">Device</th>
                                    <th className="px-4 py-3">IP</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.content.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">
                                            No audit logs found.
                                        </td>
                                    </tr>
                                )}
                                {data.content.map(log => (
                                    <tr
                                        key={log.id}
                                        onClick={() => setSelectedId(log.id)}
                                        className="hover:bg-slate-50 cursor-pointer transition-colors"
                                    >
                                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                                            {formatTs(log.timestamp)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-slate-700">{log.actorUsername ?? "—"}</div>
                                            {log.actorRole && (
                                                <div className="text-xs text-slate-400">{log.actorRole}</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${actionBadgeClass(log.action)}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-500 text-xs">
                                            <div>{log.entityType ?? "—"}</div>
                                            {log.entityCode && (
                                                <div className="font-mono text-slate-400">{log.entityCode}</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <DeviceIcon type={log.deviceType} />
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs text-slate-400">
                                            {log.ipAddress ?? "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {data.totalPages > 1 && (
                        <div className="flex justify-center py-2 text-xs text-gray-600 border-t bg-gray-50 gap-1">
                            <span
                                className={`cursor-pointer mx-1 ${page === 0 ? "text-gray-400" : "hover:underline"}`}
                                onClick={() => page > 0 && setPage(page - 1)}
                            >
                                Prev
                            </span>
                            {Array.from({ length: data.totalPages }, (_, i) => i).map(p => (
                                <span
                                    key={p}
                                    className={`cursor-pointer mx-1 ${p === page ? "font-bold text-primary underline" : "hover:underline"}`}
                                    onClick={() => setPage(p)}
                                >
                                    {p + 1}
                                </span>
                            ))}
                            <span
                                className={`cursor-pointer mx-1 ${page >= data.totalPages - 1 ? "text-gray-400" : "hover:underline"}`}
                                onClick={() => page < data.totalPages - 1 && setPage(page + 1)}
                            >
                                Next
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Detail panel */}
            {detailLog && (
                <DetailPanel log={detailLog} onClose={() => { setSelectedId(null); setDetailLog(null); }} />
            )}
        </div>
    );
}
