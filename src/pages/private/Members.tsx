import { useEffect, useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Eye, Pencil, Download, FileSpreadsheet, UserX, UserCheck } from "lucide-react";
import { listMembers, deactivateMember, searchMembers, reactivateMember } from "../../features/members/services/memberService";
import { Member } from "../../features/members/types";
import { MEMBER_COLUMNS } from "../../features/members/tableConfig";
import { ROUTES } from "../../constants/routes";
import { useNotify } from "../../services/notifications";
import { useAuth } from "../../context/AuthContext";
import { downloadImportTemplate } from "../../features/members/services/memberImportExportService";
import MembersSkeleton from "../../components/skeletons/MembersSkeleton";
import ResponsiveTable, { ColumnConfig, SortConfig } from "../../components/ResponsiveTable";
import Tooltip from "../../components/Tooltip";
import MemberAvatar from "@/components/MemberAvatar";

type LocalSortConfig = {
  key: keyof Member | null;
  direction: "asc" | "desc";
};

// ── Tabs ──────────────────────────────────────────────────────────────────────

const TABS = [
  { label: "Active", active: true },
  { label: "Inactive", active: false },
] as const;

// ── Component ─────────────────────────────────────────────────────────────────

export default function Members() {
  const notify = useNotify();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<boolean>(true);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [size] = useState(30);
  const [deactivating, setDeactivating] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<LocalSortConfig>({
    key: null,
    direction: "asc",
  });

  // Reset to page 0 when switching tabs
  const handleTabChange = (tab: boolean) => {
    setActiveTab(tab);
    setPage(0);
    setSearch("");
  };

  // ── Data fetching ───────────────────────────────────────────────────────────

  const isSearching = search.trim().length > 0;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["members", activeTab, page, search],
    queryFn: async () => {
      if (isSearching) {
        const results = await searchMembers(search.trim());
        // Filter search results by active/inactive tab
        const filtered = results.filter((m) => m.isActive === activeTab);
        return {
          content: filtered,
          totalElements: filtered.length,
          totalPages: 1,
          size: filtered.length,
          number: 0,
        };
      }
      return listMembers(user?.societyId, page, size, "", activeTab);
    },
  });

  useEffect(() => {
    if (isError) notify.error("Failed to load members.");
  }, [isError]);

  // ── Client-side sort ────────────────────────────────────────────────────────

  const sorted = useMemo(() => {
    if (!data?.content) return [];
    if (!sortConfig.key) return data.content;

    return [...data.content].sort((a: any, b: any) => {
      const aVal = (a[sortConfig.key!] ?? "").toString().toLowerCase();
      const bVal = (b[sortConfig.key!] ?? "").toString().toLowerCase();
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  const handleSort = (key: keyof Member) => {
    setSortConfig((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" }
    );
  };

  // ── Deactivate ──────────────────────────────────────────────────────────────

  const handleDeactivate = async (memberCode: string) => {
    if (!confirm(`Deactivate member ${memberCode}? This cannot be undone easily.`)) return;
    setDeactivating(memberCode);
    try {
      await deactivateMember(memberCode, user?.username ?? "system");
      notify.success(`Member ${memberCode} deactivated.`);
      queryClient.invalidateQueries({ queryKey: ["members"] });
    } catch (err: any) {
      notify.error(err.message || "Failed to deactivate member.");
    } finally {
      setDeactivating(null);
    }
  };

  // ── Reactivate ──────────────────────────────────────────────────────────────

  const handleReactivate = async (memberCode: string) => {
    if (!confirm(`Reactivate member ${memberCode}?`)) return;
    try {
      await reactivateMember(memberCode, user?.username ?? "system");
      notify.success(`Member ${memberCode} reactivated.`);
      queryClient.invalidateQueries({ queryKey: ["members"] });
    } catch (err: any) {
      notify.error(err.message || "Failed to reactivate member.");
    }
  };

  // ── Table columns ───────────────────────────────────────────────────────────

  const columns: ColumnConfig<Member>[] = MEMBER_COLUMNS.map((c) => ({
    key: c.key as any,
    title: c.title,
    align: (c as any).align,
    truncate: (c as any).truncate,
    tooltip: (c as any).tooltip,
    sortable: (c as any).sortable,
    hideBelow: (c as any).hideBelow,
    weight: (c as any).weight,
  }));

  const rtSortConfig: SortConfig | undefined = sortConfig.key
    ? { key: String(sortConfig.key), direction: sortConfig.direction }
    : undefined;

  // ── Cell renderer ───────────────────────────────────────────────────────────

  const renderCell = (row: Member, col: ColumnConfig<Member>) => {
    if (col.key === "memberCode") {
      return (
        <div className="flex items-center gap-2.5">
          <MemberAvatar
            memberCode={row.memberCode}
            firstName={row.firstName}
            lastName={row.lastName}
            hasPhoto={row.hasPhoto ?? false}
            size="thumb"
          />
          <div className="min-w-0">
            <div className="text-sm font-medium text-slate-800 truncate">
              {row.firstName} {row.lastName ?? ""}
            </div>
            <div className="text-xs text-slate-400 font-mono">{row.memberCode}</div>
          </div>
        </div>
      );
    }

    if (col.key === "actions") {
      return (
        <div className="flex items-center justify-center gap-2">
          <Tooltip content="View" offset={20}>
            <Link
              to={`${ROUTES.PRIVATE.MEMBERS}/${row.memberCode}/view`}
              onClick={(e) => e.stopPropagation()}
              className="p-1 rounded hover:bg-sky-50"
            >
              <Eye className="w-4 h-4 text-primary" />
            </Link>
          </Tooltip>

          {activeTab && (
            <>
              <Tooltip content="Edit" offset={20}>
                <Link
                  to={`${ROUTES.PRIVATE.MEMBERS}/${row.memberCode}/edit`}
                  onClick={(e) => e.stopPropagation()}
                  className="p-1 rounded hover:bg-sky-50"
                >
                  <Pencil className="w-4 h-4 text-primary" />
                </Link>
              </Tooltip>
              <Tooltip content="Deactivate" offset={20}>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeactivate(row.memberCode); }}
                  disabled={deactivating === row.memberCode}
                  className="p-1 rounded hover:bg-red-50 disabled:opacity-40"
                >
                  <UserX className="w-4 h-4 text-red-500" />
                </button>
              </Tooltip>
            </>
          )}

          {/* Reactivate button — only on Inactive tab */}
          {!activeTab && (
            <Tooltip content="Reactivate" offset={20}>
              <button
                onClick={(e) => { e.stopPropagation(); handleReactivate(row.memberCode); }}
                className="p-1 rounded hover:bg-green-50"
              >
                <UserCheck className="w-4 h-4 text-green-600" />
              </button>
            </Tooltip>
          )}
        </div>
      );
    }

    return undefined;
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 flex flex-col h-[calc(98vh-8rem)]">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Members</h1>
          <p className="text-slate-500 text-sm">
            {data ? `${data.totalElements} member(s)` : "Manage society members"}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Search members…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="px-3 py-2 border rounded-md text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {activeTab && (
            <>
              <Link
                to={`${ROUTES.PRIVATE.MEMBERS}/new`}
                className="hidden md:flex items-center px-4 py-2 rounded-md bg-primary text-white text-sm hover:bg-primary/90 transition"
              >
                Add Member
              </Link>
              <Link
                to={`${ROUTES.PRIVATE.MEMBERS}/new`}
                className="md:hidden flex items-center justify-center w-9 h-9 bg-primary text-white rounded-full text-lg"
              >
                +
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Tabs + toolbar row */}
      <div className="flex items-center justify-between border-b">
        <div className="flex items-center gap-1">
          {TABS.map((tab) => (
            <button
              key={String(tab.active)}
              onClick={() => handleTabChange(tab.active)}
              className={[
                "px-4 py-2 text-sm font-medium transition",
                activeTab === tab.active
                  ? "border-b-2 border-primary text-primary"
                  : "text-slate-500 hover:text-slate-800",
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 pr-1 text-sm pb-1">
          <Link
            to={`${ROUTES.PRIVATE.MEMBERS}/import`}
            className="flex items-center gap-1 text-primary hover:underline text-sm"
          >
            <Download className="w-3 h-3" />
            Import
          </Link>
          <button
            onClick={() => downloadImportTemplate()}
            className="flex items-center gap-1 text-primary hover:underline"
          >
            <FileSpreadsheet className="w-3 h-3" />
            Template
          </button>
        </div>
      </div>

      {/* Inactive notice banner */}
      {!activeTab && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-800">
          Showing inactive members — these records are read-only. Contact a system admin to reactivate.
        </div>
      )}

      {/* Table */}
      {isLoading && <MembersSkeleton />}

      {isError && (
        <div className="bg-white p-4 rounded shadow text-red-500 text-sm">
          Failed to load members.
        </div>
      )}

      {!isLoading && !isError && data && (
        <div className="flex-1 bg-white rounded-xl shadow overflow-hidden flex flex-col">
          <ResponsiveTable<Member>
            columns={columns}
            data={sorted}
            sortConfig={rtSortConfig}
            onSort={(key) => handleSort(key as keyof Member)}
            renderCell={renderCell}
            rowKey={(r) => r.memberCode}
          />

          {data.totalPages > 1 && (
            <div className="flex justify-center py-2 text-xs text-gray-600 border-t bg-gray-50 gap-1">
              <span
                className={`cursor-pointer mx-1 ${page === 0 ? "text-gray-400" : "hover:underline"}`}
                onClick={() => page > 0 && setPage(page - 1)}
              >
                Prev
              </span>
              {Array.from({ length: data.totalPages }, (_, i) => i).map((p) => (
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
    </div>
  );
}
