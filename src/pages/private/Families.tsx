import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Eye, ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { getFamiliesBySociety, getFamilyMembers } from "../../features/members/services/familyService";
import { Family, Member } from "../../features/members/types";
import { ROUTES } from "../../constants/routes";
import { useAuth } from "../../context/AuthContext";
import { useNotify } from "../../services/notifications";
import FamiliesSkeleton from "../../components/skeletons/FamiliesSkeleton";
import ResponsiveTable, { ColumnConfig } from "../../components/ResponsiveTable";
import MemberAvatar from "@/components/MemberAvatar";
import Tooltip from "@/components/Tooltip";

// ── Column definitions ────────────────────────────────────────────────────────

const FAMILY_COLUMNS: ColumnConfig<Family>[] = [
    { key: "familyCode", title: "Family", weight: 30 },
    { key: "geoUnitName", title: "Village", weight: 18, truncate: true, tooltip: true, hideBelow: "sm" },
    { key: "clanCode", title: "Clan", weight: 18, truncate: true, tooltip: true, hideBelow: "sm" },
    { key: "memberCount", title: "Members", weight: 10, align: "center", hideBelow: "sm" },
    { key: "actions", title: "Actions", weight: 12, align: "center" },
];

// ── Tabs ──────────────────────────────────────────────────────────────────────

const TABS = [
    { label: "Active", value: true },
    { label: "Inactive", value: false },
] as const;

// ── Expanded row — lazy loads family members ──────────────────────────────────

function FamilyMembersRow({ familyCode, includeInactive }: { familyCode: string; includeInactive: boolean }) {
    const { data: members = [], isLoading } = useQuery<Member[]>({
        queryKey: ["family-members", familyCode, includeInactive],
        queryFn: () => getFamilyMembers(familyCode, includeInactive),
    });

    if (isLoading) {
        return (
            <tr>
                <td colSpan={5} className="px-4 py-3 bg-slate-50 text-sm text-slate-400">
                    Loading members…
                </td>
            </tr>
        );
    }

    return (
        <tr>
            <td colSpan={5} className="px-4 py-3 bg-slate-50">
                {members.length === 0 ? (
                    <p className="text-sm text-slate-400">No members found.</p>
                ) : (
                    <div className="flex flex-wrap gap-3">
                        {members.map((m) => (
                            <div
                                key={m.memberCode}
                                className="flex items-center gap-2 bg-white border rounded-lg px-3 py-1.5 text-sm shadow-sm"
                            >
                                <MemberAvatar
                                    memberCode={m.memberCode}
                                    firstName={m.firstName}
                                    lastName={m.lastName}
                                    hasPhoto={m.hasPhoto ?? false}
                                    size="thumb"
                                />
                                <div>
                                    <div className="font-medium text-slate-700">
                                        {m.firstName} {m.lastName ?? ""}
                                    </div>
                                    <div className="text-xs text-slate-400 font-mono">{m.memberCode}</div>
                                </div>
                                {m.isHead && (
                                    <span className="ml-1 text-xs bg-amber-100 text-amber-700 rounded px-1.5 py-0.5">
                                        Head
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </td>
        </tr>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Families() {
    const { user } = useAuth();
    const notify = useNotify();
    const queryClient = useQueryClient();

    const [activeTab, setActiveTab] = useState<boolean>(true);
    const [search, setSearch] = useState("");
    const [expandedCode, setExpandedCode] = useState<string | null>(null);

    // ── Data ──────────────────────────────────────────────────────────────────

    const { data: allFamilies = [], isLoading, isError } = useQuery<Family[]>({
        queryKey: ["families", user?.societyId, activeTab],
        queryFn: () => getFamiliesBySociety(user!.societyId!, undefined, activeTab),
        enabled: !!user?.societyId,
        meta: {
            onError: () => notify.error("Failed to load families."),
        },
    });

    // ── Filter: tab + search ─────────────────────────────────────────────────

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        return allFamilies.filter((f) => {
            if (!term) return true;
            return (
                f.familyCode.toLowerCase().includes(term) ||
                (f.headPersonName ?? "").toLowerCase().includes(term) ||
                (f.geoUnitName ?? "").toLowerCase().includes(term) ||
                (f.clanName ?? "").toLowerCase().includes(term) ||
                (f.clanCode ?? "").toLowerCase().includes(term)
            );
        });
    }, [allFamilies, activeTab, search]);

    // ── Tab change ────────────────────────────────────────────────────────────

    const handleTabChange = (val: boolean) => {
        setActiveTab(val);
        setSearch("");
        setExpandedCode(null);
    };

    // ── Row expand toggle ─────────────────────────────────────────────────────

    const toggleExpand = (familyCode: string) => {
        setExpandedCode((prev) => (prev === familyCode ? null : familyCode));
    };

    // ── Cell renderer ─────────────────────────────────────────────────────────

    const renderCell = (row: Family, col: ColumnConfig<Family>) => {

        if (col.key === "familyCode") {
            return (
                <div
                    className="flex items-center gap-2.5 cursor-pointer select-none"
                    onClick={() => toggleExpand(row.familyCode)}
                >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm shrink-0">
                        {(row.headPersonName ?? "?")[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-800 truncate">
                            {row.headPersonName ?? "—"}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs text-slate-400 font-mono">{row.familyCode}</span>
                            {!row.isActive && row.headPersonName && (
                                <span className="text-xs text-slate-400 italic">· Last head</span>
                            )}
                        </div>
                    </div>
                    <span className="ml-1 text-slate-400">
                        {expandedCode === row.familyCode
                            ? <ChevronUp className="w-3.5 h-3.5" />
                            : <ChevronDown className="w-3.5 h-3.5" />
                        }
                    </span>
                </div>
            );
        }

        if (col.key === "clanCode") {
            if (!row.clanCode) return <span className="text-slate-300 text-xs">—</span>;
            return (
                <span className="inline-block text-xs bg-violet-50 text-violet-700 border border-violet-200 rounded px-2 py-0.5">
                    {row.clanName ?? row.clanCode}
                </span>
            );
        }

        if (col.key === "memberCount") {
            return (
                <span className="inline-block text-xs bg-slate-100 text-slate-600 rounded-full px-2 py-0.5 font-medium">
                    {row.memberCount ?? 0}
                </span>
            );
        }

        if (col.key === "actions") {
            return (
                <div className="flex items-center justify-center gap-2">
                    <Tooltip content="View" offset={20}>
                        <Link
                            to={`${ROUTES.PRIVATE.FAMILIES}/${row.familyCode}/view`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 rounded hover:bg-sky-50"
                        >
                            <Eye className="w-4 h-4 text-primary" />
                        </Link>

                    </Tooltip>
                    <Tooltip content="Edit" offset={20}>
                        <Link
                            to={`${ROUTES.PRIVATE.FAMILIES}/${row.familyCode}/edit`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 rounded hover:bg-sky-50"
                        >
                            <Pencil className="w-4 h-4 text-primary" />
                        </Link>
                    </Tooltip>

                </div>
            );
        }

        return undefined;
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-4 flex flex-col h-[calc(98vh-8rem)]">

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                    <h1 className="text-2xl font-semibold">Family Directory</h1>
                    <p className="text-slate-500 text-sm">
                        {allFamilies.length > 0
                            ? `${filtered.length} of ${allFamilies.length} family(s)`
                            : "Manage society families"}
                    </p>
                </div>
                <input
                    type="text"
                    placeholder="Search by head name, village or clan…"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setExpandedCode(null); }}
                    className="px-3 py-2 border rounded-md text-sm w-72 focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
            </div>

            {/* Tabs */}
            <div className="flex items-center border-b">
                {TABS.map((tab) => (
                    <button
                        key={String(tab.value)}
                        onClick={() => handleTabChange(tab.value)}
                        className={[
                            "px-4 py-2 text-sm font-medium transition",
                            activeTab === tab.value
                                ? "border-b-2 border-primary text-primary"
                                : "text-slate-500 hover:text-slate-800",
                        ].join(" ")}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Inactive notice */}
            {!activeTab && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-800">
                    Showing inactive families — reactivate a member from the Members page to restore a family.
                </div>
            )}

            {/* States */}
            {isLoading && <FamiliesSkeleton />}

            {isError && (
                <div className="bg-white p-4 rounded shadow text-red-500 text-sm">
                    Failed to load families.
                </div>
            )}

            {/* Table */}
            {!isLoading && !isError && (
                <div className="flex-1 bg-white rounded-xl shadow overflow-hidden flex flex-col">
                    <ResponsiveTable<Family>
                        columns={FAMILY_COLUMNS}
                        data={filtered}
                        renderCell={renderCell}
                        rowKey={(r) => r.familyCode}
                        expandedRowKey={expandedCode}
                        renderExpandedRow={(row) => (
                            <FamilyMembersRow
                                familyCode={row.familyCode}
                                includeInactive={!row.isActive}
                            />
                        )}
                    />

                    {filtered.length === 0 && (
                        <div className="flex-1 flex items-center justify-center text-slate-400 text-sm py-12">
                            {search ? "No families match your search." : "No families found."}
                        </div>
                    )}
                </div>
            )}

        </div>
    );
}
