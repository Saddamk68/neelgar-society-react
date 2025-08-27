import { useQuery } from "@tanstack/react-query";
import { USER_COLUMNS } from "../../features/users/tableConfig";
import { listUsers } from "../../features/users/services/userService";
import type { UserRecord } from "../../features/users/types";
import { USERS_UI } from "../../constants/messages";

export default function Users() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["users", "list"],
    queryFn: listUsers,
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">{USERS_UI.TITLE}</h1>
        <p className="text-text-muted">{USERS_UI.DESC}</p>
      </div>

      <div className="bg-white rounded-xl shadow p-4 overflow-x-auto">
        {isLoading && <div className="text-sm text-text-muted">Loading users…</div>}
        {isError && <div className="text-sm text-danger">Failed to load users.</div>}

        {!isLoading && !isError && (
          <table className="min-w-[640px] w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                {USER_COLUMNS.map((col) => (
                  <th key={col.key as string} scope="col" className="py-2 pr-4 font-medium text-text-muted">
                    {col.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data && data.length > 0 ? (
                data.map((u: UserRecord) => (
                  <tr key={u.id} className="border-b last:border-b-0 hover:bg-slate-50/60">
                    <td className="py-2 pr-4">{u.name}</td>
                    <td className="py-2 pr-4">{u.email}</td>
                    <td className="py-2 pr-4">
                      <span
                        className={[
                          "px-2 py-0.5 rounded text-xs",
                          u.role === "admin" ? "bg-indigo-100 text-indigo-800" : "bg-slate-100 text-slate-800",
                        ].join(" ")}
                      >
                        {u.role}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={USER_COLUMNS.length} className="py-6 text-center text-text-muted">
                    No users found.
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
