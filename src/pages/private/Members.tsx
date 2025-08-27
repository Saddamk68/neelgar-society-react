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

      <div className="bg-white rounded-xl shadow p-4 overflow-x-auto">
        {isLoading && <div className="text-sm text-text-muted">Loading members…</div>}
        {isError && <div className="text-sm text-danger">Failed to load members.</div>}
        {!isLoading && !isError && (
          <table className="min-w-[640px] w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                {MEMBER_COLUMNS.map((col) => (
                  <th key={col.key as string} scope="col" className="py-2 pr-4 font-medium text-text-muted">
                    {col.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data && data.length > 0 ? (
                data.map((row) => (
                  <tr key={row.id} className="border-b last:border-b-0 hover:bg-slate-50/60">
                    {MEMBER_COLUMNS.map((col) => (
                      <td key={col.key as string} className="py-2 pr-4">
                        {(row as any)[col.key]}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={MEMBER_COLUMNS.length} className="py-6 text-center text-text-muted">
                    No members found.
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
