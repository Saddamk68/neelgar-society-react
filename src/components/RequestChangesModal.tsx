import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Member } from "@/features/members/types";
import { submitEditRequest, getMyLatestEditRequest } from "@/features/members/services/memberService";
import { useNotify } from "@/services/notifications";

export default function RequestChangesModal({
    member,
    onClose,
}: {
    member: Member;
    onClose: () => void;
}) {
    const notify = useNotify();
    const queryClient = useQueryClient();

    const [contactNumber, setContactNumber] = useState(member.contactNumber ?? "");
    const [education, setEducation] = useState(member.education ?? "");
    const [occupation, setOccupation] = useState(member.occupation ?? "");
    const [submitting, setSubmitting] = useState(false);

    const { data: latestRequest, isLoading } = useQuery({
        queryKey: ["my-edit-request", member.memberCode],
        queryFn: () => getMyLatestEditRequest(member.memberCode),
        staleTime: 1000 * 30,
    });

    const isPending = latestRequest?.status === "PENDING";
    const isRejected = latestRequest?.status === "REJECTED";

    async function handleSubmit() {
        setSubmitting(true);
        try {
            await submitEditRequest(member.memberCode, { contactNumber, education, occupation });
            notify.success("Change request submitted for review.");
            queryClient.invalidateQueries({ queryKey: ["my-edit-request", member.memberCode] });
            onClose();
        } catch (err: any) {
            const msg = err?.response?.data?.message ?? "Failed to submit change request.";
            notify.error(msg);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">

                <h2 className="text-base font-semibold text-slate-800 mb-1">
                    Request Detail Changes
                </h2>
                <p className="text-sm text-slate-500 mb-4">
                    Submit updated contact number, education, or occupation for review. Changes
                    won't take effect until approved.
                </p>

                {isLoading && <p className="text-sm text-slate-400 mb-4">Checking status…</p>}

                {isPending && (
                    <div className="bg-amber-50 border border-amber-200 rounded-md px-3 py-2 text-sm text-amber-800 mb-4">
                        You already have a request pending review, submitted{" "}
                        {new Date(latestRequest!.submittedAt).toLocaleDateString()}. You can't submit
                        another until it's reviewed.
                    </div>
                )}

                {isRejected && (
                    <div className="bg-red-50 border border-red-200 rounded-md px-3 py-2 text-sm text-red-700 mb-4">
                        Your last request was rejected: "{latestRequest!.rejectionReason}"
                    </div>
                )}

                {!isPending && (
                    <div className="space-y-3 mb-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Contact Number</label>
                            <input
                                type="text"
                                value={contactNumber}
                                onChange={e => setContactNumber(e.target.value)}
                                className="w-full border rounded-md px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/40"
                                disabled={submitting}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Education</label>
                            <input
                                type="text"
                                value={education}
                                onChange={e => setEducation(e.target.value)}
                                className="w-full border rounded-md px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/40"
                                disabled={submitting}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Occupation</label>
                            <input
                                type="text"
                                value={occupation}
                                onChange={e => setOccupation(e.target.value)}
                                className="w-full border rounded-md px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/40"
                                disabled={submitting}
                            />
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm rounded-md border hover:bg-slate-50 transition"
                        disabled={submitting}
                    >
                        {isPending ? "Close" : "Cancel"}
                    </button>
                    {!isPending && (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="px-4 py-2 text-sm rounded-md bg-primary text-white hover:bg-primary/90 transition disabled:opacity-60"
                        >
                            {submitting ? "Submitting…" : "Submit Request"}
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
}
