import { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Eye, Pencil } from "lucide-react";
import ResponsiveTable, { ColumnConfig, SortConfig } from "../../components/ResponsiveTable";
import Tooltip from "../../components/Tooltip";
import {
  listMembers,
  MemberListItem,
} from "../../features/members/services/memberService";
import { MEMBER_COLUMNS } from "../../features/members/tableConfig";
import { ROUTES } from "../../constants/routes";
import { PRIVATE } from "../../constants/messages";
import { useNotify } from "../../services/notifications";
import MembersSkeleton from "../../components/skeletons/MembersSkeleton"; // 🔹 NEW

type LocalSortConfig = {
  key: keyof MemberListItem | null;
  direction: "asc" | "desc";
};

export default function Members() {
  const notify = useNotify();

  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [size] = useState(30); // fixed page size
  const [sortConfig, setSortConfig] = useState<LocalSortConfig>({
    key: null,
    direction: "asc",
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["members", page, search],
    queryFn: () => listMembers(page, size, search),
  });

  useEffect(() => {
    if (isError) {
      notify.error("Failed to load members.");
    }
  }, [isError, notify]);

  // Filter + Sort (client-side on current page)
  const filteredAndSorted = useMemo(() => {
    if (!data) return [];

    let filtered = data.content.filter((m) =>
      [
        m.id?.toString(),
        m.name,
        m.fatherName,
        m.motherName,
        m.gotra,
        m.currentVillage,
      ]
        .filter(Boolean)
        .some((val) =>
          val!.toLowerCase().includes(search.trim().toLowerCase())
        )
    );

    if (sortConfig.key) {
      filtered.sort((a: any, b: any) => {
        const aVal = (a[sortConfig.key!] ?? "").toString().toLowerCase();
        const bVal = (b[sortConfig.key!] ?? "").toString().toLowerCase();
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [data, search, sortConfig]);

  const handleSort = (key: keyof MemberListItem) => {
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

  // 🔹 Helper to limit visible pages (max 5)
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

  // Map global MEMBER_COLUMNS to ColumnConfig<MemberListItem> and add responsive hide flags
  const responsiveColumns: ColumnConfig<MemberListItem>[] = MEMBER_COLUMNS.map((c) => {
    const base: ColumnConfig<MemberListItem> = {
      key: c.key as keyof MemberListItem,
      title: c.title,
      align: (c as any).align,
      truncate: (c as any).truncate,
      tooltip: (c as any).tooltip,
      sortable: (c as any).sortable,
      hideBelow: (c as any).hideBelow as "sm" | "md" | "lg" | undefined,
      weight: (c as any).weight as number | undefined,
      width: (c as any).width as string | undefined,
    };

    return base;
  });

  const rtSortConfig: SortConfig | undefined = sortConfig.key
    ? { key: String(sortConfig.key), direction: sortConfig.direction }
    : undefined;

  function renderMemberCell(row: MemberListItem, col: ColumnConfig<MemberListItem>) {
    if (col.key === "actions") {
      return (
        <div className="flex items-center justify-center gap-2">
          <Tooltip content="View" offset={20}>
            <Link
              to={`${ROUTES.PRIVATE.MEMBERS}/${row.id}/view`}
              aria-label={`View member ${row.id}`}
              onClick={(e) => e.stopPropagation()}
              className="p-1 rounded hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-200"
            >
              <Eye className="w-5 h-5 text-sky-600" />
            </Link>
          </Tooltip>

          <Tooltip content="Edit" offset={20}>
            <Link
              to={`${ROUTES.PRIVATE.MEMBERS}/${row.id}/edit`}
              aria-label={`Edit member ${row.id}`}
              onClick={(e) => e.stopPropagation()}
              className="p-1 rounded hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-200"
            >
              <Pencil className="w-5 h-5 text-sky-600" />
            </Link>
          </Tooltip>
        </div>
      );
    }
    return undefined;
  }

  return (
    <div className="space-y-4 flex flex-col h-[calc(98vh-8rem)]">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-semibold">{PRIVATE.MEMBERS_TITLE}</h1>
          <p className="text-text-muted">{PRIVATE.MEMBERS_DESC}</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search members by ID, Name, Father, Mother, Gotra, Village…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm w-72 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Link
            to={`${ROUTES.PRIVATE.MEMBERS}/new`}
            className="hidden md:flex items-center justify-center px-4 py-2 rounded-md bg-primary text-white shadow-sm hover:shadow transition"
          >
            Add Member
          </Link>
          <Link
            to={`${ROUTES.PRIVATE.MEMBERS}/new`}
            className="flex md:hidden items-center justify-center w-9 h-9 rounded-full bg-primary text-white shadow-sm hover:shadow transition text-lg font-bold"
          >
            +
          </Link>
        </div>
      </div>

      {/* 🔹 Loading */}
      {isLoading && <MembersSkeleton />}

      {/* 🔹 Error */}
      {isError && (
        <div className="bg-white rounded-xl shadow p-4">
          <div className="text-sm text-danger">Failed to load members.</div>
        </div>
      )}

      {/* 🔹 Data Table + Pagination */}
      {!isLoading && !isError && data && (
        <div className="flex-1 bg-white rounded-xl shadow overflow-hidden flex flex-col">
          <div className="p-0">
            <ResponsiveTable<MemberListItem>
              columns={responsiveColumns}
              data={filteredAndSorted}
              sortConfig={rtSortConfig}
              onSort={(key) => handleSort(key as keyof MemberListItem)}
              renderCell={renderMemberCell}
              rowKey={(r) => r.id}
            />
          </div>

          {data.totalPages > 1 && (
            <div className="flex justify-center py-2 text-xs text-gray-600 border-t bg-gray-50">
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
                    p === page
                      ? "font-bold text-primary underline"
                      : "hover:underline"
                  }`}
                  onClick={() => setPage(p)}
                >
                  {p + 1}
                </span>
              ))}

              <span
                className={`cursor-pointer mx-1 ${
                  page >= data.totalPages - 1
                    ? "text-gray-400 cursor-not-allowed"
                    : "hover:underline"
                }`}
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
