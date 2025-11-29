import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { USER_COLUMNS } from "../../features/users/tableConfig";
import { listUsers, updateUserRole } from "../../features/users/services/userService";
import type { UserRecord } from "../../features/users/types";
import { USERS_UI } from "../../constants/messages";
import { useAuth } from "@/context/AuthContext"; 
import type { Role } from "../../constants/roles";
import { useState } from "react";
import { Pencil } from "lucide-react";


export default function Users() {
  const { role: loggedInRole } = useAuth();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role>("MEMBER");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["users", "list"],
    queryFn: listUsers,
  });

  const canEditRoles = loggedInRole === "ADMIN" || loggedInRole === "PRESIDENT";

  const roleMutation = useMutation({
    mutationFn: ({ userId, newRole }: { userId: number; newRole: Role }) =>
      updateUserRole(userId, newRole),
    onSuccess: () => {
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["users", "list"] });
    },
  });

  const ROLE_OPTIONS: Role[] = ["ADMIN", "PRESIDENT", "SECRETARY", "EDITOR", "MEMBER"];

  const startEdit = (user: UserRecord) => {
    setEditingId(user.id);
    setSelectedRole(user.role.toUpperCase() as Role);
  };

  const saveRole = (userId: number) => {
    roleMutation.mutate({ userId, newRole: selectedRole });
  };

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
                  <th key={col.key as string} className="py-2 pr-4 font-medium text-text-muted">
                    {col.title}
                  </th>
                ))}
                <th className="py-2 pr-4 font-medium text-text-muted">Actions</th>
              </tr>
            </thead>

            <tbody>
              {data && data.length > 0 ? (
                data.map((u: UserRecord) => (
                  <tr key={u.id} className="border-b last:border-b-0 hover:bg-slate-50/60">
                    <td className="py-2 pr-4">{u.name}</td>
                    <td className="py-2 pr-4">{u.email}</td>

                    <td className="py-2 pr-4">
                      {/* Editing mode */}
                      {editingId === u.id ? (
                        <select
                          className="border rounded px-2 py-1 text-sm"
                          value={selectedRole}
                          onChange={(e) => setSelectedRole(e.target.value as Role)}
                        >
                          {ROLE_OPTIONS.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className={[
                            "px-2 py-0.5 rounded text-xs",
                            u.role === "ADMIN" || u.role === "PRESIDENT"
                              ? "bg-indigo-100 text-indigo-800"
                              : "bg-slate-100 text-slate-800",
                          ].join(" ")}
                        >
                          {u.role}
                        </span>
                      )}
                    </td>

                    <td className="py-2 pr-4">
                      {canEditRoles && (
                        <>
                          {editingId === u.id ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => saveRole(u.id)}
                                className="px-2 py-1 bg-primary text-white rounded text-xs"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="px-2 py-1 border rounded text-xs"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEdit(u)}
                              className="text-primary hover:text-primary/80"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={USER_COLUMNS.length + 1} className="py-6 text-center text-text-muted">
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
