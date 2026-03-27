import { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Eye, Pencil, Upload, Download, FileSpreadsheet } from "lucide-react";
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
import MembersSkeleton from "../../components/skeletons/MembersSkeleton";
import {
  exportMembersToExcel,
  importMembersFromFile,
  downloadImportTemplate,
} from "../../features/members/services/memberImportExportService";

type LocalSortConfig = {
  key: keyof MemberListItem | null;
  direction: "asc" | "desc";
};

export default function Members() {
  const notify = useNotify();

  const [importing, setImporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [size] = useState(30);
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

  // Filter + Sort
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

  // Checkbox: select all on page
  const toggleSelectAll = () => {
    if (!data) return;

    const pageIds = filteredAndSorted.map((m) => m.id);
    const allSelected = pageIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      // unselect all
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      // select all
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const toggleSelectRow = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const isAllSelected =
    filteredAndSorted.length > 0 &&
    filteredAndSorted.every((m) => selectedIds.includes(m.id));

  // IMPORT
  const handleImportFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      notify.info("Import started…");

      const job = await importMembersFromFile(file);

      notify.success(`Import completed: ${job.rowCount} rows processed.`);
    } catch (err: any) {
      notify.error(err.message || "Import failed.");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  // EXPORT
  const handleExport = async () => {
    try {
      const validIds = selectedIds.filter((id) => Number(id) > 0);

      if (validIds.length === 0) {
        notify.error("Please select at least one member to export.");
        return;
      }

      console.log("Sending member IDs:", validIds);

      notify.info("Export started…");

      await exportMembersToExcel(validIds);

      notify.success("Export completed. File downloaded.");
    } catch (err: any) {
      notify.error(err.message || "Export failed.");
    }
  };

  // TABLE COLUMNS WITH CHECKBOX COLUMN ADDED IN FRONT
  const responsiveColumns: ColumnConfig<MemberListItem>[] = [
    {
      key: "select",
      title: "",
      width: "40px",
      align: "center",
      headerRenderer: () => (
        <input
          type="checkbox"
          checked={isAllSelected}
          onChange={toggleSelectAll}
          className="cursor-pointer"
        />
      ),
    },
    ...MEMBER_COLUMNS.map((c) => ({
      key: c.key as keyof MemberListItem,
      title: c.title,
      align: (c as any).align,
      truncate: (c as any).truncate,
      tooltip: (c as any).tooltip,
      sortable: (c as any).sortable,
      hideBelow: (c as any).hideBelow,
      weight: (c as any).weight,
      width: (c as any).width,
    })),
  ];

  const rtSortConfig: SortConfig | undefined = sortConfig.key
    ? { key: String(sortConfig.key), direction: sortConfig.direction }
    : undefined;

  // CELL RENDERER
  const renderMemberCell = (
    row: MemberListItem,
    col: ColumnConfig<MemberListItem>
  ) => {
    if (col.key === "select") {
      return (
        <input
          type="checkbox"
          checked={selectedIds.includes(row.id)}
          onChange={() => toggleSelectRow(row.id)}
          onClick={(e) => e.stopPropagation()}
          className="cursor-pointer"
        />
      );
    }

    if (col.key === "actions") {
      return (
        <div className="flex items-center justify-center gap-2">
          <Tooltip content="View" offset={20}>
            <Link
              to={`${ROUTES.PRIVATE.MEMBERS}/${row.id}/view`}
              onClick={(e) => e.stopPropagation()}
              className="p-1 rounded hover:bg-sky-50"
            >
              <Eye className="w-5 h-5 text-primary" />
            </Link>
          </Tooltip>

          <Tooltip content="Edit" offset={20}>
            <Link
              to={`${ROUTES.PRIVATE.MEMBERS}/${row.id}/edit`}
              onClick={(e) => e.stopPropagation()}
              className="p-1 rounded hover:bg-sky-50"
            >
              <Pencil className="w-5 h-5 text-primary" />
            </Link>
          </Tooltip>
        </div>
      );
    }

    return undefined;
  };

  return (
    <div className="space-y-4 flex flex-col h-[calc(98vh-8rem)]">
      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-semibold">{PRIVATE.MEMBERS_TITLE}</h1>
          <p className="text-text-muted">{PRIVATE.MEMBERS_DESC}</p>
        </div>

        {/* Search + Add */}
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Search members…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="px-3 py-2 border rounded-md text-sm w-72 focus:ring-primary"
          />

          <Link
            to={`${ROUTES.PRIVATE.MEMBERS}/new`}
            className="hidden md:flex items-center px-4 py-2 rounded-md bg-primary text-white"
          >
            Add Member
          </Link>

          <Link
            to={`${ROUTES.PRIVATE.MEMBERS}/new`}
            className="md:hidden flex items-center justify-center w-9 h-9 bg-primary text-white rounded-full"
          >
            +
          </Link>
        </div>
      </div>

      {/* TEXT LINKS BELOW SEARCH BAR */}
      <div className="flex justify-end items-center gap-4 pr-1 text-sm">
        <button
          onClick={handleExport}
          className="flex items-center gap-1 text-primary hover:underline"
        >
          <Upload className="w-3 h-3" />
          Export
        </button>

        <button
          onClick={() =>
            document.getElementById("member-import-input")?.click()
          }
          className="flex items-center gap-1 text-primary hover:underline"
        >
          <Download className="w-3 h-3" />
          Import
        </button>

        <input
          id="member-import-input"
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleImportFileChange}
        />

        <button
          onClick={() => downloadImportTemplate()}
          className="flex items-center gap-1 text-primary hover:underline"
        >
          <FileSpreadsheet className="w-3 h-3" />
          Template
        </button>
      </div>

      {/* TABLE */}
      {isLoading && <MembersSkeleton />}

      {isError && (
        <div className="bg-white p-4 rounded shadow">
          <div className="text-danger text-sm">Failed to load members.</div>
        </div>
      )}

      {!isLoading && !isError && data && (
        <div className="flex-1 bg-white rounded-xl shadow overflow-hidden flex flex-col">
          <ResponsiveTable<MemberListItem>
            columns={responsiveColumns}
            data={filteredAndSorted}
            sortConfig={rtSortConfig}
            onSort={(key) => handleSort(key as keyof MemberListItem)}
            renderCell={renderMemberCell}
            rowKey={(r) => r.id}
          />

          {data.totalPages > 1 && (
            <div className="flex justify-center py-2 text-xs text-gray-600 border-t bg-gray-50">
              <span
                className={`cursor-pointer mx-1 ${page === 0 ? "text-gray-400" : "hover:underline"
                  }`}
                onClick={() => page > 0 && setPage(page - 1)}
              >
                Prev
              </span>

              {Array.from(
                { length: data.totalPages },
                (_, i) => i
              ).map((p) => (
                <span
                  key={p}
                  className={`cursor-pointer mx-1 ${p === page
                      ? "font-bold text-primary underline"
                      : "hover:underline"
                    }`}
                  onClick={() => setPage(p)}
                >
                  {p + 1}
                </span>
              ))}

              <span
                className={`cursor-pointer mx-1 ${page >= data.totalPages - 1 ? "text-gray-400" : "hover:underline"
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
