import { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  listMembers,
  MemberListItem,
} from "../../features/members/services/memberService";
import { MEMBER_COLUMNS } from "../../features/members/tableConfig";
import { ROUTES } from "../../constants/routes";
import { PRIVATE } from "../../constants/messages";
import { useNotify } from "../../services/notifications";

type SortConfig = {
  key: keyof MemberListItem | null;
  direction: "asc" | "desc";
};

export default function Members() {
  const notify = useNotify();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["members", "list"],
    queryFn: listMembers,
  });

  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: null,
    direction: "asc",
  });

  useEffect(() => {
    if (isError) {
      notify.error("Failed to load members.");
    }
  }, [isError, notify]);

  // Filter + Sort
  const filteredAndSorted = useMemo(() => {
    if (!data) return [];

    let filtered = data.filter((m) =>
      [m.name, m.fatherName, m.motherName, m.gotra]
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

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-semibold">{PRIVATE.MEMBERS_TITLE}</h1>
          <p className="text-text-muted">{PRIVATE.MEMBERS_DESC}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Search bar */}
          <input
            type="text"
            placeholder="Search members…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm w-60 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {/* Add Member button */}
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

      {/* Loading & Error */}
      {(isLoading || isError) && (
        <div className="bg-white rounded-xl shadow p-4">
          {isLoading && (
            <div className="text-sm text-text-muted">Loading members…</div>
          )}
          {isError && (
            <div className="text-sm text-danger">Failed to load members.</div>
          )}
        </div>
      )}

      {/* Data Table */}
      {!isLoading && !isError && data && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <div className="max-h-[70vh] overflow-y-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="sticky top-0 z-10 bg-gray-200 shadow-sm">
                  <tr>
                    {MEMBER_COLUMNS.map((col) => {
                      const isSortable =
                        ["name", "fatherName", "motherName", "gotra"].includes(
                          col.key as string
                        );
                      const isActive = sortConfig.key === col.key;

                      return (
                        <th
                          key={col.key as string}
                          scope="col"
                          className={`py-3 px-4 text-left font-bold text-gray-800 text-sm uppercase tracking-wide border-b ${
                            isSortable ? "cursor-pointer select-none" : ""
                          }`}
                          onClick={
                            isSortable
                              ? () => handleSort(col.key as keyof MemberListItem)
                              : undefined
                          }
                        >
                          {col.title}
                          {isActive && (
                            <span className="ml-1">
                              {sortConfig.direction === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSorted.length > 0 ? (
                    filteredAndSorted.map((row, idx) => (
                      <tr
                        key={row.id}
                        className={`${
                          idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                        } hover:bg-primary/5 transition-colors`}
                      >
                        {MEMBER_COLUMNS.map((col) => (
                          <td
                            key={col.key as string}
                            className="py-2 px-4 border-b"
                          >
                            {(row as any)[col.key]}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={MEMBER_COLUMNS.length}
                        className="py-6 text-center text-text-muted"
                      >
                        No members found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
