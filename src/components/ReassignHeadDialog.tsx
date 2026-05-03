import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { getFamilyMembers } from "@/features/members/services/familyService";
import { reassignFamilyHead } from "@/features/members/services/familyService";
import { Member } from "@/features/members/types";
import { useAuth } from "@/context/AuthContext";
import { useNotify } from "@/services/notifications";

type Props = {
  member: Member;             // the head member being deactivated
  onClose: () => void;
  onSuccess: () => void;      // called after reassign + deactivate both succeed
  onDeactivate: (member: Member) => void; // triggers the normal deactivate flow
};

export default function ReassignHeadDialog({ member, onClose, onSuccess, onDeactivate }: Props) {
  const { user } = useAuth();
  const notify = useNotify();
  const [selectedCode, setSelectedCode] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch active family members excluding the current head
  const { data: familyMembers = [], isLoading } = useQuery<Member[]>({
    queryKey: ["family-members", member.familyCode],
    queryFn: () => getFamilyMembers(member.familyCode),
  });

  const otherMembers = familyMembers.filter(
    (m) => m.memberCode !== member.memberCode
  );

  const handleConfirm = async () => {
    if (!selectedCode) return;
    setLoading(true);
    try {
      // Step 1 — reassign head
      await reassignFamilyHead(
        member.familyCode,
        selectedCode,
        user?.username ?? "system"
      );
      notify.success("Family head reassigned successfully.");

      // Step 2 — now trigger the normal deactivate confirm dialog
      onClose();
      onDeactivate(member);
    } catch (err: any) {
      notify.error(err.message || "Failed to reassign family head.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={() => !loading && onClose()}
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
          is the family head. Please select a new head before deactivating.
        </p>

        {/* Dropdown */}
        {isLoading ? (
          <p className="text-sm text-slate-400">Loading family members…</p>
        ) : otherMembers.length === 0 ? (
          <p className="text-sm text-red-500">
            No other active members in this family. Cannot deactivate the only member.
          </p>
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
            disabled={loading}
            className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50 transition disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedCode || loading || otherMembers.length === 0}
            className="px-4 py-2 text-sm rounded-lg font-medium bg-amber-500 hover:bg-amber-600 text-white transition disabled:opacity-50"
          >
            {loading ? "Reassigning…" : "Reassign & Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
