import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  CheckCircle,
  XCircle,
  Pencil,
  UserX,
  KeyRound,
  ChevronLeft,
  ChevronRight,
  UserCheck,
} from "lucide-react";
import {
  listUsers,
  approveUser,
  rejectUser,
  updateUserRole,
  deactivateUser,
  adminResetPassword,
  reactivateUser,
} from "@/features/users/services/userService";
import type { UserRecord, UserStatus } from "@/features/users/types";
import { useAuth } from "@/context/AuthContext";
import { useNotify } from "@/services/notifications";
import type { Role } from "@/constants/roles";
import { ALL_ROLES, REACTIVATE_ROLES } from "@/constants/roles";
import Tooltip from "@/components/Tooltip";

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<UserStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100   text-red-700",
  INACTIVE: "bg-slate-100 text-slate-500",
};

function StatusBadge({ status, isActive }: { status: UserStatus; isActive: boolean }) {
  // If user is deactivated, show Inactive regardless of their status field
  const displayStatus: UserStatus = !isActive ? "INACTIVE" : status;
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[displayStatus]}`}>
      {displayStatus.charAt(0) + displayStatus.slice(1).toLowerCase()}
    </span>
  );
}

// ── Role badge ────────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const isAdmin = ["SUPER_ADMIN", "ADMIN", "PRESIDENT"].includes(role);
  return (
    <span className={`px-2 py-0.5 rounded text-xs ${isAdmin ? "bg-indigo-100 text-indigo-800" : "bg-slate-100 text-slate-700"}`}>
      {role}
    </span>
  );
}

// ── Inline role editor ────────────────────────────────────────────────────────

function RoleEditor({
  user,
  onDone,
}: {
  user: UserRecord;
  onDone: () => void;
}) {
  const notify = useNotify();
  const queryClient = useQueryClient();
  const [role, setRole] = useState<Role>(user.role);

  const mutation = useMutation({
    mutationFn: () => updateUserRole(user.id, role),
    onSuccess: () => {
      notify.success(`Role updated to ${role}`);
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onDone();
    },
    onError: (err: any) => {
      notify.error(err?.message || "Failed to update role.");
    },
  });

  return (
    <div className="flex items-center gap-2">
      <select
        value={role}
        onChange={(e) => setRole(e.target.value as Role)}
        className="border rounded px-2 py-1 text-xs"
        disabled={mutation.isPending}
      >
        {ALL_ROLES.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
      <button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending || role === user.role}
        className="px-2 py-1 bg-primary text-white rounded text-xs disabled:opacity-50"
      >
        Save
      </button>
      <button
        onClick={onDone}
        disabled={mutation.isPending}
        className="px-2 py-1 border rounded text-xs hover:bg-slate-50"
      >
        Cancel
      </button>
    </div>
  );
}

// ── Reset password modal ──────────────────────────────────────────────────────

function ResetPasswordModal({
  user,
  onClose,
  onConfirm,
  loading,
}: {
  user: UserRecord;
  onClose: () => void;
  onConfirm: (pwd: string) => void;
  loading: boolean;
}) {
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (pwd.length < 8) { setErr("Password must be at least 8 characters."); return; }
    if (pwd !== confirm) { setErr("Passwords do not match."); return; }
    onConfirm(pwd);
  };

  return (
    // Backdrop
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6">

        <h3 className="font-semibold text-base mb-1">Reset password</h3>
        <p className="text-sm text-text-muted mb-4">
          Setting a new password for <strong>{user.personName || user.username}</strong>.
          Share it securely — they should change it after logging in.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">New password</label>
            <input
              type="password"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              placeholder="Min. 8 characters"
              className="border rounded-lg px-3 py-2 text-sm"
              required
              disabled={loading}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Confirm password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat new password"
              className="border rounded-lg px-3 py-2 text-sm"
              required
              disabled={loading}
            />
          </div>

          {err && <p className="text-sm text-red-600">{err}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-60"
            >
              {loading ? "Resetting…" : "Reset password"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

// ── Status tabs ───────────────────────────────────────────────────────────────

const TABS: { label: string; value: UserStatus | "" }[] = [
  { label: "All", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Inactive", value: "INACTIVE" },
];

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Users() {
  const { user: authUser } = useAuth();
  const canReactivate = !!authUser && REACTIVATE_ROLES.includes(authUser.role);
  const notify = useNotify();
  const queryClient = useQueryClient();

  const [statusTab, setStatusTab] = useState<UserStatus | "">("");
  const [page, setPage] = useState(0);
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
  const [resetTarget, setResetTarget] = useState<UserRecord | null>(null);

  // ── Fetch users ─────────────────────────────────────────────────────────
  const { data, isLoading, isError } = useQuery({
    queryKey: ["users", statusTab, page],
    queryFn: () => listUsers({ status: statusTab || undefined, page, size: 20 }),
  });

  const users = data?.content ?? [];
  const total = data?.totalElements ?? 0;
  const totalPg = data?.totalPages ?? 0;

  // ── Approve ─────────────────────────────────────────────────────────────
  const approveMutation = useMutation({
    mutationFn: (id: number) => approveUser(id),
    onSuccess: (u) => {
      notify.success(`${u.username} approved.`);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: any) => notify.error(err?.message || "Failed to approve."),
  });

  // ── Reject ──────────────────────────────────────────────────────────────
  const rejectMutation = useMutation({
    mutationFn: (id: number) => rejectUser(id),
    onSuccess: (u) => {
      notify.success(`${u.username} rejected.`);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: any) => notify.error(err?.message || "Failed to reject."),
  });

  // ── Deactivate ──────────────────────────────────────────────────────────
  const deactivateMutation = useMutation({
    mutationFn: (id: number) => deactivateUser(id),
    onSuccess: () => {
      notify.success("User deactivated.");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: any) => notify.error(err?.message || "Failed to deactivate."),
  });

  // ── Deactivate ──────────────────────────────────────────────────────────
  const reactivateMutation = useMutation({
    mutationFn: (id: number) => reactivateUser(id),
    onSuccess: (u) => {
      notify.success(`${u.username} reactivated.`);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: any) => notify.error(err?.message || "Failed to reactivate."),
  });

  // ── Reset password ──────────────────────────────────────────────────────
  const resetMutation = useMutation({
    mutationFn: ({ id, pwd }: { id: number; pwd: string }) =>
      adminResetPassword(id, pwd),
    onSuccess: () => {
      notify.success("Password reset successfully.");
      setResetTarget(null);
    },
    onError: (err: any) => notify.error(err?.message || "Failed to reset password."),
  });

  return (
    <div className="space-y-4">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="text-text-muted text-sm">
          Manage accounts, approvals, roles and passwords.
        </p>
      </div>

      {/* Status tabs */}
      <div className="flex items-center gap-1 border-b">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatusTab(tab.value); setPage(0); }}
            className={[
              "px-4 py-2 text-sm font-medium transition",
              statusTab === tab.value
                ? "border-b-2 border-primary text-primary"
                : "text-text-muted hover:text-text-primary",
            ].join(" ")}
          >
            {tab.label}
            {/* Show count badge on Pending tab */}
            {tab.value === "PENDING" && statusTab !== "PENDING" && (
              <PendingBadge />
            )}
          </button>
        ))}
        <span className="ml-auto text-xs text-text-muted pr-1">
          {total} total
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">

        {isLoading && (
          <div className="p-6 text-sm text-text-muted">Loading…</div>
        )}

        {isError && (
          <div className="p-6 text-sm text-red-600">
            Failed to load users. Please try again.
          </div>
        )}

        {!isLoading && !isError && (
          <>
            <table className="min-w-[820px] w-full text-sm">
              <thead>
                <tr className="text-left border-b bg-slate-50/60">
                  <th className="py-2.5 px-4 font-medium text-text-muted">Name</th>
                  <th className="py-2.5 px-4 font-medium text-text-muted">Username</th>
                  <th className="py-2.5 px-4 font-medium text-text-muted">Email</th>
                  <th className="py-2.5 px-4 font-medium text-text-muted">Role</th>
                  <th className="py-2.5 px-4 font-medium text-text-muted">Status</th>
                  <th className="py-2.5 px-4 font-medium text-text-muted">Member code</th>
                  <th className="py-2.5 px-4 font-medium text-text-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-text-muted">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((u: UserRecord) => (
                    <tr
                      key={u.id}
                      className={[
                        "border-b last:border-b-0 hover:bg-slate-50/60 transition",
                        !u.isActive ? "opacity-50" : "",
                      ].join(" ")}
                    >
                      <td className="py-2.5 px-4 font-medium">
                        {u.personName || "—"}
                      </td>
                      <td className="py-2.5 px-4 text-text-muted">{u.username}</td>
                      <td className="py-2.5 px-4 text-text-muted">{u.email || "—"}</td>

                      {/* Role — switches to inline editor on pencil click */}
                      <td className="py-2.5 px-4">
                        {editingRoleId === u.id ? (
                          <RoleEditor
                            user={u}
                            onDone={() => setEditingRoleId(null)}
                          />
                        ) : (
                          <RoleBadge role={u.role} />
                        )}
                      </td>

                      <td className="py-2.5 px-4">
                        <StatusBadge status={u.status} isActive={u.isActive} />
                      </td>

                      <td className="py-2.5 px-4 text-text-muted font-mono text-xs">
                        {u.memberCode || "—"}
                      </td>

                      {/* Action buttons */}
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-3">

                          {/* Approve / Reject — only for PENDING users */}
                          {u.status === "PENDING" && (
                            <>
                              <button
                                title="Approve"
                                onClick={() => approveMutation.mutate(u.id)}
                                disabled={approveMutation.isPending}
                                className="text-green-600 hover:text-green-700 transition"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                title="Reject"
                                onClick={() => rejectMutation.mutate(u.id)}
                                disabled={rejectMutation.isPending}
                                className="text-red-500 hover:text-red-600 transition"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {/* Edit role */}
                          {editingRoleId !== u.id && (
                            <button
                              title="Edit role"
                              onClick={() => setEditingRoleId(u.id)}
                              className="text-primary hover:text-primary/80 transition"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}

                          {/* Reset password */}
                          <button
                            title="Reset password"
                            onClick={() => setResetTarget(u)}
                            className="text-amber-600 hover:text-amber-700 transition"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          {/* Deactivate — hide for own account to prevent self-lockout */}
                          {u.isActive && u.username !== authUser?.username && (
                            <button
                              title="Deactivate"
                              onClick={() => deactivateMutation.mutate(u.id)}
                              disabled={deactivateMutation.isPending}
                              className="text-slate-400 hover:text-red-500 transition"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          )}

                          {/* Reactivate — only for inactive users, only for authorized roles */}
                          {!u.isActive && (
                            <Tooltip content={canReactivate ? "Reactivate" : "No permission"}>
                              <button
                                title={canReactivate ? "Reactivate" : "No permission to reactivate"}
                                onClick={() => canReactivate && reactivateMutation.mutate(u.id)}
                                disabled={!canReactivate || reactivateMutation.isPending}
                                className={[
                                  "transition",
                                  canReactivate
                                    ? "text-slate-400 hover:text-green-600 cursor-pointer"
                                    : "text-slate-300 cursor-not-allowed",
                                ].join(" ")}
                              >
                                <UserCheck className="w-4 h-4" />
                              </button>
                            </Tooltip>
                          )}

                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPg > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t text-sm">
                <span className="text-text-muted">
                  Page {page + 1} of {totalPg}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => p - 1)}
                    disabled={data?.first}
                    className="flex items-center gap-1 px-3 py-1.5 border rounded hover:bg-slate-50 disabled:opacity-40 transition"
                  >
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </button>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={data?.last}
                    className="flex items-center gap-1 px-3 py-1.5 border rounded hover:bg-slate-50 disabled:opacity-40 transition"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Reset password modal — rendered outside the table so it overlays everything */}
      {resetTarget && (
        <ResetPasswordModal
          user={resetTarget}
          onClose={() => setResetTarget(null)}
          onConfirm={(pwd) => resetMutation.mutate({ id: resetTarget.id, pwd })}
          loading={resetMutation.isPending}
        />
      )}

    </div>
  );
}

// Small component to show a dot on the Pending tab when there are pending users
function PendingBadge() {
  const { data } = useQuery({
    queryKey: ["users", "PENDING", 0],
    queryFn: () => listUsers({ status: "PENDING", page: 0, size: 1 }),
    staleTime: 30_000,
  });
  if (!data?.totalElements) return null;
  return (
    <span className="ml-1.5 px-1.5 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full">
      {data.totalElements}
    </span>
  );
}
