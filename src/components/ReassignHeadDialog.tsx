import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { getFamilyMembers, reassignFamilyHead } from "@/features/members/services/familyService";
import { deactivateMember } from "@/features/members/services/memberService";
import { Member } from "@/features/members/types";
import { useAuth } from "@/context/AuthContext";
import { useNotify } from "@/services/notifications";

type Props = {
  member: Member;
  onClose: () => void;
  onSuccess: () => void;
  onDeactivate: (member: Member) => void;
  mode?: "deactivate" | "reassign"; // deactivate = from Members page, reassign = from Families page
};

export default function ReassignHeadDialog({
  member,
  onClose,
  onSuccess,
  onDeactivate,
  mode = "deactivate",
}: Props) {
  const { user } = useAuth();
  const notify = useNotify();
  const queryClient = useQueryClient();

  const [selectedCode, setSelectedCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [forceLoading, setForceLoading] = useState(false);

  const { data: familyMembers = [], isLoading } = useQuery<Member[]>({
    queryKey: ["family-members", member.familyCode],
    queryFn: () => getFamilyMembers(member.familyCode),
  });

  const otherMembers = familyMembers.filter(
    (m) => m.memberCode !== member.memberCode
  );

  // ── Reassign then hand off to deactivate (deactivate mode) ───────────────
  const handleConfirm = async () => {
    if (!selectedCode) return;
    setLoading(true);
    try {
      await reassignFamilyHead(
        member.familyCode,
        selectedCode,
        user?.username ?? "system"
      );
      notify.success("Family head reassigned successfully.");
      onClose();
      if (mode === "deactivate") {
        onDeactivate(member);  // hand off to normal deactivate confirm
      } else {
        onSuccess();           // pure reassign — just refresh
      }
    } catch (err: any) {
      notify.error(err.message || "Failed to reassign family head.");
    } finally {
      setLoading(false);
    }
  };

  // ── Force deactivate member + family (deactivate mode only) ──────────────
  const handleForceDeactivate = async () => {
    setForceLoading(true);
    try {
      await deactivateMember(member.memberCode, user?.username ?? "system", true);
      notify.success(
        `${member.firstName} ${member.lastName ?? ""} and their family have been deactivated.`
      );
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["families"] });
      onSuccess();
    } catch (err: any) {
      notify.error(err.message || "Failed to deactivate member and family.");
    } finally {
      setForceLoading(false);
    }
  };

  // ── Empty state content — differs by mode ────────────────────────────────
  const emptyState = mode === "deactivate" ? (
    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 space-y-3">
      <p className="text-sm text-amber-800 leading-relaxed">
        <span className="font-medium">
          {member.firstName} {member.lastName ?? ""}
        </span>{" "}
        is the only active member in this family. Deactivating them will also
        permanently deactivate the entire family. This cannot be undone easily.
      </p>
      <button
        type="button"
        onClick={handleForceDeactivate}
        disabled={forceLoading}
        className="w-full px-4 py-2 text-sm rounded-lg font-medium bg-red-600 hover:bg-red-700 text-white transition disabled:opacity-60"
      >
        {forceLoading ? "Deactivating…" : "Deactivate member and family"}
      </button>
    </div>
  ) : (
    <p className="text-sm text-slate-500">
      There are no other active members in this family to reassign as head.
      Add a new member to the family first before reassigning.
    </p>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={() => !loading && !forceLoading && onClose()}
    >
      <div
        className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon + title */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-amber-50 shrink-0">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
          </div>
          <h3 className="font-semibold text-slate-800 text-base">
            Reassign family head
          </h3>
        </div>

        {/* Message */}
        <p className="text-sm text-slate-500 leading-relaxed">
          <span className="font-medium text-slate-700">
            {member.firstName} {member.lastName ?? ""}
          </span>{" "}
          is the family head. Please select a new head
          {mode === "deactivate" ? " before deactivating." : "."}
        </p>

        {/* Dropdown or empty state */}
        {isLoading ? (
          <p className="text-sm text-slate-400">Loading family members…</p>
        ) : otherMembers.length === 0 ? (
          emptyState
        ) : (
          <select
            value={selectedCode}
            onChange={(e) => setSelectedCode(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="">— Select new head —</option>
            {otherMembers.map((m) => (
              <option key={m.memberCode} value={m.memberCode}>
                {m.firstName} {m.lastName ?? ""} ({m.memberCode})
              </option>
            ))}
          </select>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={loading || forceLoading}
            className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50 transition disabled:opacity-60"
          >
            Cancel
          </button>
          {otherMembers.length > 0 && (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selectedCode || loading}
              className="px-4 py-2 text-sm rounded-lg font-medium bg-amber-500 hover:bg-amber-600 text-white transition disabled:opacity-50"
            >
              {loading
                ? "Reassigning…"
                : mode === "deactivate"
                  ? "Reassign & Continue"
                  : "Reassign Head"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
