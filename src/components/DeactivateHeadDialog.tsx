/**
 * DeactivateHeadDialog.tsx
 *
 * Two-step dialog for deactivating a family head member.
 *
 * Step 1 — Warning
 *   Informs the user that this member is the family head and that
 *   both reassignment and deactivation will happen together as one action.
 *   Buttons: Cancel | Continue →
 *
 * Step 2 — Action
 *   A) Other active members exist → dropdown to pick new head.
 *      Buttons: ← Back | Reassign & Deactivate
 *   B) No other active members → warns that the whole family will be deactivated.
 *      Buttons: ← Back | Deactivate Member & Family
 *
 * On confirm:
 *   - Calls reassignFamilyHead (if new head selected) then deactivateMember.
 *   - Both operations are @Transactional server-side.
 *   - On error the dialog stays open on Step 2 so the user can retry or go back.
 *   - On success: calls onSuccess() for the parent to navigate/refresh.
 */

import { useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getFamilyMembers, reassignFamilyHead } from "@/features/members/services/familyService";
import { deactivateMember } from "@/features/members/services/memberService";
import { Member } from "@/features/members/types";
import { useAuth } from "@/context/AuthContext";
import { useNotify } from "@/services/notifications";

type Props = {
    member: Member;
    onClose: () => void;
    onSuccess: () => void;
    // Optional: called instead of deactivateMember() after reassignment/force-confirm.
    // Used by EditMember's "mark deceased" flow to retry the member update with force
    // instead of doing a plain MANUAL deactivation.
    finalizeAction?: (force: boolean) => Promise<void>;
};

export default function DeactivateHeadDialog({ member, onClose, onSuccess, finalizeAction }: Props) {
    const { user } = useAuth();
    const notify = useNotify();

    const [step, setStep] = useState<1 | 2>(1);
    const [selectedCode, setSelectedCode] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Load other active members of the same family
    const { data: familyMembers = [], isLoading: loadingMembers } = useQuery<Member[]>({
        queryKey: ["family-members", member.familyCode],
        queryFn: () => getFamilyMembers(member.familyCode),
        enabled: step === 2, // only fetch when user reaches step 2
    });

    const otherMembers = familyMembers.filter(
        (m) => m.memberCode !== member.memberCode && m.isActive
    );

    const hasOtherMembers = otherMembers.length > 0;

    // Reset state when dialog is mounted
    useEffect(() => {
        setStep(1);
        setSelectedCode("");
    }, [member.memberCode]);

    // Close on Escape — but only if not submitting
    useEffect(() => {
        function handleKey(e: KeyboardEvent) {
            if (e.key === "Escape" && !submitting) onClose();
        }
        document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, [submitting, onClose]);

    async function handleConfirm() {
        setSubmitting(true);
        try {
            if (hasOtherMembers) {
                // Step A — reassign head then deactivate
                if (!selectedCode) {
                    notify.error("Please select a new family head.");
                    return;
                }
                await reassignFamilyHead(
                    member.familyCode,
                    selectedCode,
                    user?.username ?? "system"
                );
                if (finalizeAction) {
                    await finalizeAction(false);
                } else {
                    await deactivateMember(
                        member.memberCode,
                        user?.username ?? "system",
                        false
                    );
                }
                notify.success(
                    `${member.firstName} deactivated and family head reassigned successfully.`
                );
            } else {
                // Step B — force deactivate (deactivates member + family)
                if (finalizeAction) {
                    await finalizeAction(true);
                } else {
                    await deactivateMember(
                        member.memberCode,
                        user?.username ?? "system",
                        true
                    );
                }
                notify.success(
                    `${member.firstName} and ${member.familyCode} have been deactivated.`
                );
            }
            onSuccess();
        } catch (err: any) {
            notify.error(err.message || "Failed to deactivate member. Please try again.");
            // Stay on step 2 so the user can retry or go back
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => !submitting && onClose()}
        >
            <div
                className="bg-white rounded-xl shadow-xl w-full max-w-md flex flex-col gap-5 p-6"
                onClick={(e) => e.stopPropagation()}
            >

                {/* ── Step 1 — Warning ─────────────────────────────────────────────── */}
                {step === 1 && (
                    <>
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-amber-50 shrink-0">
                                    <AlertTriangle className="w-6 h-6 text-amber-500" />
                                </div>
                                <h3 className="font-semibold text-slate-800 text-base">
                                    This member is the family head
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="text-slate-400 hover:text-slate-600 shrink-0"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
                            <p>
                                <span className="font-medium text-slate-800">
                                    {member.firstName} {member.lastName ?? ""}
                                </span>{" "}
                                is currently the head of{" "}
                                <span className="font-medium text-slate-800">
                                    {member.familyCode}
                                </span>.
                            </p>
                            <p>
                                To deactivate this member, a new family head must be selected.
                                Both the reassignment and deactivation will happen together in
                                a single action — nothing will be committed until you confirm
                                on the next screen.
                            </p>
                            <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-amber-800 text-xs">
                                This action cannot be undone easily. Proceed only if you are sure.
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-2 pt-1">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => setStep(2)}
                                className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg font-medium bg-amber-500 hover:bg-amber-600 text-white transition"
                            >
                                Continue
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </>
                )}

                {/* ── Step 2 — Action ──────────────────────────────────────────────── */}
                {step === 2 && (
                    <>
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-red-50 shrink-0">
                                    <AlertTriangle className="w-6 h-6 text-red-500" />
                                </div>
                                <h3 className="font-semibold text-slate-800 text-base">
                                    {hasOtherMembers || loadingMembers
                                        ? "Reassign Family Head"
                                        : "No other members in this family"}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={submitting}
                                className="text-slate-400 hover:text-slate-600 shrink-0 disabled:opacity-40"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        {loadingMembers ? (
                            <p className="text-sm text-slate-400">Loading family members…</p>
                        ) : hasOtherMembers ? (
                            /* A — has other members: show dropdown */
                            <div className="space-y-4">
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    Select a new head for{" "}
                                    <span className="font-medium text-slate-800">
                                        {member.familyCode}
                                    </span>
                                    . Once you confirm,{" "}
                                    <span className="font-medium text-slate-800">
                                        {member.firstName} {member.lastName ?? ""}
                                    </span>{" "}
                                    will be deactivated and the new head will be assigned —
                                    both in one action.
                                </p>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1.5">
                                        New family head
                                    </label>
                                    <select
                                        value={selectedCode}
                                        onChange={(e) => setSelectedCode(e.target.value)}
                                        disabled={submitting}
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
                                    >
                                        <option value="">— Select new head —</option>
                                        {otherMembers.map((m) => (
                                            <option key={m.memberCode} value={m.memberCode}>
                                                {m.firstName} {m.lastName ?? ""} ({m.memberCode})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ) : (
                            /* B — no other members: warn family will also be deactivated */
                            <div className="space-y-3">
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    <span className="font-medium text-slate-800">
                                        {member.firstName} {member.lastName ?? ""}
                                    </span>{" "}
                                    is the only active member in{" "}
                                    <span className="font-medium text-slate-800">
                                        {member.familyCode}
                                    </span>
                                    . Deactivating them will also deactivate the entire family.
                                </p>
                                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-red-800 text-xs">
                                    Both the member and the family will be marked inactive.
                                    This cannot be undone easily.
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-between gap-2 pt-1">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                disabled={submitting}
                                className="flex items-center gap-2 px-4 py-2 text-sm border rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back
                            </button>

                            <button
                                type="button"
                                onClick={handleConfirm}
                                disabled={
                                    submitting ||
                                    loadingMembers ||
                                    (hasOtherMembers && !selectedCode)
                                }
                                className="px-4 py-2 text-sm rounded-lg font-medium bg-red-600 hover:bg-red-700 text-white transition disabled:opacity-50"
                            >
                                {submitting
                                    ? "Processing…"
                                    : hasOtherMembers
                                        ? "Reassign & Deactivate"
                                        : "Deactivate Member & Family"}
                            </button>
                        </div>
                    </>
                )}

            </div>
        </div>
    );
}
