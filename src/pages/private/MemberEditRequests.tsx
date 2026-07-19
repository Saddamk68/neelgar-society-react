import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { useAuth } from "@/context/AuthContext";
import { useNotify } from "@/services/notifications";
import { MemberEditRequest } from "@/features/members/types";
import {
    listPendingEditRequests,
    approveEditRequest,
    rejectEditRequest,
} from "@/features/members/services/memberEditRequestService";

const FIELD_LABELS: Record<string, string> = {
    contactNumber: "Contact Number",
    education: "Education",
    occupation: "Occupation",
};

function DiffRow({ field, oldValue, newValue }: { field: string; oldValue?: string; newValue?: string }) {
    return (
        <div className="grid grid-cols-3 gap-2 text-sm py-1.5 border-b border-slate-50 last:border-0">
            <div className="text-slate-500">{FIELD_LABELS[field] ?? field}</div>
            <div className="text-slate-400 line-through">{oldValue || "—"}</div>
            <div className="text-slate-800 font-medium">{newValue}</div>
        </div>
    );
}

function RequestCard({ request, onDone }: { request: MemberEditRequest; onDone: () => void }) {
    const notify = useNotify();
    const [rejecting, setRejecting] = useState(false);
    const [reason, setReason] = useState("");
    const [busy, setBusy] = useState(false);

    const fields = Object.keys(request.newValues);

    async function handleApprove() {
        setBusy(true);
        try {
            await approveEditRequest(request.id);
            notify.success(`Approved changes for ${request.personName}`);
            onDone();
        } catch (err: any) {
            notify.error(err?.response?.data?.message ?? "Failed to approve request.");
        } finally {
            setBusy(false);
        }
    }

    async function handleReject() {
        if (!reason.trim()) {
            notify.error("A rejection reason is required.");
            return;
        }
        setBusy(true);
        try {
            await rejectEditRequest(request.id, reason.trim());
            notify.success(`Rejected changes for ${request.personName}`);
            onDone();
        } catch (err: any) {
            notify.error(err?.response?.data?.message ?? "Failed to reject request.");
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="bg-white rounded-xl shadow p-5">
            <div className="flex items-center justify-between mb-3">
                <div>
                    <div className="text-sm font-semibold text-slate-800">{request.personName}</div>
                    <div className="text-xs text-slate-400 font-mono">{request.memberCode}</div>
                </div>
                <div className="text-xs text-slate-400">
                    {new Date(request.submittedAt).toLocaleDateString()}
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                <div>Field</div>
                <div>Current</div>
                <div>Requested</div>
            </div>
            {fields.map(f => (
                <DiffRow key={f} field={f} oldValue={request.oldValues[f]} newValue={request.newValues[f]} />
            ))}

            {!rejecting ? (
                <div className="flex justify-end gap-2 mt-4">
                    <button
                        onClick={() => setRejecting(true)}
                        disabled={busy}
                        className="flex items-center gap-1 px-3 py-2 rounded-md border text-sm text-red-600 hover:bg-red-50 transition"
                    >
                        <X className="w-4 h-4" /> Reject
                    </button>
                    <button
                        onClick={handleApprove}
                        disabled={busy}
                        className="flex items-center gap-1 px-3 py-2 rounded-md bg-primary text-white text-sm hover:bg-primary/90 transition disabled:opacity-60"
                    >
                        <Check className="w-4 h-4" /> {busy ? "Approving…" : "Approve"}
                    </button>
                </div>
            ) : (
                <div className="mt-4 space-y-2">
                    <input
                        type="text"
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        placeholder="Reason for rejection…"
                        className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                        disabled={busy}
                        autoFocus
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => { setRejecting(false); setReason(""); }}
                            disabled={busy}
                            className="px-3 py-2 rounded-md border text-sm hover:bg-slate-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleReject}
                            disabled={busy}
                            className="px-3 py-2 rounded-md bg-red-600 text-white text-sm hover:bg-red-700 transition disabled:opacity-60"
                        >
                            {busy ? "Rejecting…" : "Confirm Reject"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function MemberEditRequests() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { data: requests = [], isLoading, isError, refetch } = useQuery({
        queryKey: ["member-edit-requests", user?.societyId],
        queryFn: () => listPendingEditRequests(user!.societyId!),
        enabled: !!user?.societyId,
        staleTime: 1000 * 30,
    });

    function handleDone() {
        queryClient.invalidateQueries({ queryKey: ["member-edit-requests", user?.societyId] });
    }

    return (
        <div className="space-y-4 max-w-3xl mx-auto">
            <PageHeader title="Member Edit Requests" subtitle="Pending self-service change requests awaiting review" backTo="back" />

            {isLoading && <p className="text-sm text-slate-400">Loading…</p>}

            {isError && (
                <div className="bg-white rounded-xl shadow p-6 text-sm text-red-500">
                    Failed to load requests.{" "}
                    <button onClick={() => refetch()} className="underline">Retry</button>
                </div>
            )}

            {!isLoading && !isError && requests.length === 0 && (
                <div className="bg-white rounded-xl shadow p-6 text-sm text-slate-400">
                    No pending requests.
                </div>
            )}

            {!isLoading && !isError && requests.length > 0 && (
                <div className="space-y-4">
                    {requests.map(r => (
                        <RequestCard key={r.id} request={r} onDone={handleDone} />
                    ))}
                </div>
            )}
        </div>
    );
}
