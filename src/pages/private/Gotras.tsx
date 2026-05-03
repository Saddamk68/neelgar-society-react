import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Plus, X, Check } from "lucide-react";
import {
  listGotras,
  createGotra,
  updateGotra,
  deactivateGotra,
} from "../../features/gotras/services/gotraService";
import { useAuth } from "../../context/AuthContext";
import { useNotify } from "../../services/notifications";
import { Gotra } from "@/features/gotras/gotra-types";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function Gotras() {
  const { user } = useAuth();
  const notify = useNotify();
  const qc = useQueryClient();

  const societyId = user?.societyId ?? 0;

  // ── State ───────────────────────────────────────────────────────────────────
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState("");
  const [addError, setAddError] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editError, setEditError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<Gotra | null>(null);

  // ── Fetch ───────────────────────────────────────────────────────────────────
  const { data: gotras = [], isLoading, isError } = useQuery<Gotra[]>({
    queryKey: ["gotras", societyId],
    queryFn: () => listGotras(societyId),
    enabled: societyId > 0,
  });

  // ── Mutations ───────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: () => createGotra(societyId, addName.trim(), user?.username ?? "system"),
    onSuccess: () => {
      notify.success(`Gotra "${addName.trim()}" created.`);
      qc.invalidateQueries({ queryKey: ["gotras"] });
      setAddName("");
      setShowAdd(false);
    },
    onError: (err: any) => {
      setAddError(err?.response?.data?.message || err?.message || "Failed to create gotra.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => updateGotra(editingId!, societyId, editName.trim(), user?.username ?? "system"),
    onSuccess: () => {
      notify.success(`Gotra updated.`);
      qc.invalidateQueries({ queryKey: ["gotras"] });
      setEditingId(null);
    },
    onError: (err: any) => {
      setEditError(err?.response?.data?.message || err?.message || "Failed to update gotra.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deactivateGotra(id, user?.username ?? "system"),
    onSuccess: () => {
      notify.success("Gotra deactivated.");
      qc.invalidateQueries({ queryKey: ["gotras"] });
    },
    onError: (err: any) =>
      notify.error(err?.response?.data?.message || err?.message || "Failed to deactivate."),
  });

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function startEdit(g: Gotra) {
    setEditingId(g.id);
    setEditName(g.name);
    setEditError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditError("");
  }

  function submitAdd() {
    if (!addName.trim()) { setAddError("Name is required."); return; }
    setAddError("");
    createMutation.mutate();
  }

  function submitEdit() {
    if (!editName.trim()) { setEditError("Name is required."); return; }
    setEditError("");
    updateMutation.mutate();
  }

  function confirmDelete(g: Gotra) {
    setDeleteTarget(g);
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Gotra's</h1>
          <p className="text-slate-500 text-sm">
            Manage gotra's available for members in this society.
          </p>
        </div>
        {!showAdd && (
          <button
            onClick={() => { setShowAdd(true); setAddName(""); setAddError(""); }}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-white text-sm hover:bg-primary/90 transition"
          >
            <Plus className="w-4 h-4" />
            Add Gotra
          </button>
        )}
      </div>

      {/* Add row */}
      {showAdd && (
        <div className="bg-white rounded-xl shadow p-4 border-2 border-primary/20">
          <p className="text-sm font-medium text-slate-700 mb-2">New Gotra</p>
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <input
                autoFocus
                value={addName}
                onChange={(e) => { setAddName(e.target.value); setAddError(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") submitAdd(); if (e.key === "Escape") setShowAdd(false); }}
                placeholder="Enter gotra name…"
                className={[
                  "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 transition",
                  addError ? "border-red-400 ring-1 ring-red-400" : "border-slate-300 focus:ring-primary/40",
                ].join(" ")}
              />
              {addError && <p className="text-xs text-red-500 mt-1">{addError}</p>}
            </div>
            <button
              onClick={submitAdd}
              disabled={createMutation.isPending}
              className="px-3 py-2 rounded-lg bg-primary text-white text-sm hover:bg-primary/90 disabled:opacity-60 transition flex items-center gap-1"
            >
              <Check className="w-4 h-4" />
              {createMutation.isPending ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="px-3 py-2 rounded-lg border border-slate-300 text-sm hover:bg-slate-50 transition"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-xl shadow overflow-hidden">

        {isLoading && (
          <div className="p-6 text-sm text-slate-400">Loading gotras…</div>
        )}

        {isError && (
          <div className="p-6 text-sm text-red-500">Failed to load gotras.</div>
        )}

        {!isLoading && !isError && gotras.length === 0 && (
          <div className="p-10 text-center text-slate-400 text-sm">
            No gotras yet. Click "Add Gotra" to create the first one.
          </div>
        )}

        {!isLoading && !isError && gotras.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50/60 text-left">
                <th className="px-4 py-3 font-medium text-slate-500 w-10">#</th>
                <th className="px-4 py-3 font-medium text-slate-500">Name</th>
                <th className="px-4 py-3 font-medium text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {gotras.map((g, i) => (
                <tr key={g.id} className="border-b last:border-0 hover:bg-slate-50/50 transition">

                  {/* Index */}
                  <td className="px-4 py-3 text-slate-400">{i + 1}</td>

                  {/* Name — inline edit or display */}
                  <td className="px-4 py-3">
                    {editingId === g.id ? (
                      <div>
                        <input
                          autoFocus
                          value={editName}
                          onChange={(e) => { setEditName(e.target.value); setEditError(""); }}
                          onKeyDown={(e) => { if (e.key === "Enter") submitEdit(); if (e.key === "Escape") cancelEdit(); }}
                          className={[
                            "w-full rounded-lg border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 transition",
                            editError ? "border-red-400 ring-1 ring-red-400" : "border-slate-300 focus:ring-primary/40",
                          ].join(" ")}
                        />
                        {editError && <p className="text-xs text-red-500 mt-1">{editError}</p>}
                      </div>
                    ) : (
                      <span className="font-medium text-slate-800">{g.name}</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {editingId === g.id ? (
                        <>
                          <button
                            onClick={submitEdit}
                            disabled={updateMutation.isPending}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-xs hover:bg-primary/90 disabled:opacity-60 transition"
                          >
                            <Check className="w-3.5 h-3.5" />
                            {updateMutation.isPending ? "Saving…" : "Save"}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs hover:bg-slate-50 transition"
                          >
                            <X className="w-3.5 h-3.5" />
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(g)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 transition text-primary"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => confirmDelete(g)}
                            disabled={deleteMutation.isPending}
                            className="p-1.5 rounded-lg hover:bg-red-50 transition text-red-500 disabled:opacity-40"
                            title="Deactivate"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Footer count */}
        {gotras.length > 0 && (
          <div className="px-4 py-2 border-t bg-slate-50/60 text-xs text-slate-400">
            {gotras.length} gotra{gotras.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
          setDeleteTarget(null);
        }}
        title="Deactivate gotra"
        message={`Deactivate "${deleteTarget?.name}"? Members with this gotra will retain it but it won't appear in dropdowns.`}
        confirmLabel="Deactivate"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
