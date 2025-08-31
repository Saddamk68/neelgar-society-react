import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { listMembers } from "../../features/members/services/memberService";
import { MEMBER_COLUMNS } from "../../features/members/tableConfig";
import { ROUTES } from "../../constants/routes";
import { PRIVATE } from "../../constants/messages";
import { useNotify } from "../../services/notifications";

export default function Members() {
  const notify = useNotify();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["members", "list"],
    queryFn: listMembers,
  });

  useEffect(() => {
    if (isError) {
      notify.error("Failed to load members.");
    }
  }, [isError, notify]);

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{PRIVATE.MEMBERS_TITLE}</h1>
          <p className="text-text-muted">{PRIVATE.MEMBERS_DESC}</p>
        </div>
        <Link
          to={`${ROUTES.PRIVATE.MEMBERS}/new`}
          className="px-4 py-2 rounded-md bg-primary text-white shadow-sm hover:shadow transition"
        >
          Add Member
        </Link>
      </div>

      {/* Loading & Error states */}
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
                    {MEMBER_COLUMNS.map((col) => (
                      <th
                        key={col.key as string}
                        scope="col"
                        className="py-3 px-4 text-left font-bold text-gray-800 text-sm uppercase tracking-wide border-b"
                      >
                        {col.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.length > 0 ? (
                    data.map((row, idx) => (
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
