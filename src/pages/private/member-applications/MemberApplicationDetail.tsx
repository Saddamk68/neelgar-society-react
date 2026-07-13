import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Mail, Phone, CheckCircle2, XCircle } from "lucide-react";
import {
    getApplicationDetail,
    approveApplication,
    rejectApplication,
    requestMoreInfo,
    markMobileVerified,
    MemberApplicationDetail as ApplicationDetailType,
} from "@/features/member-applications/services/memberApplicationService";
import { useNotify } from "@/services/notifications";
import { ROUTES } from "@/constants/routes";

type ActionModal = "approve" | "reject" | "needsInfo" | null;

function Field({ label, value }: { label: string; value?: React.ReactNode }) {
    return (
        <div>
            <p className="text-xs text-slate-400">{label}</p>
            <p className="text-sm text-slate-800">{value || <span className="text-slate-300">—</span>}</p>
        </div>
    );
}

const STATUS_BADGE: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700 border-amber-200",
    UNDER_REVIEW: "bg-blue-50 text-blue-700 border-blue-200",
    NEEDS_INFO: "bg-orange-50 text-orange-700 border-orange-200",
    APPROVED: "bg-green-50 text-green-700 border-green-200",
    REJECTED: "bg-red-50 text-red-700 border-red-200",
    WITHDRAWN: "bg-slate-50 text-slate-600 border-slate-200",
};

export default function MemberApplicationDetail() {
    const { id } = useParams<{ id: string }>();
    const applicationId = Number(id);
    const navigate = useNavigate();
    const notify = useNotify();
    const queryClient = useQueryClient();

    const [modal, setModal] = useState<ActionModal>(null);
    const [reasonText, setReasonText] = useState("");
    const [familyIdInput, setFamilyIdInput] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const { data, isLoading, isError } = useQuery({
        queryKey: ["member-application", applicationId],
        queryFn: () => getApplicationDetail(applicationId),
        enabled: !!applicationId,
    });

    function closeModal() {
        setModal(null);
        setReasonText("");
        setFamilyIdInput("");
    }

    async function handleApprove() {
        setSubmitting(true);
        try {
            await approveApplication(applicationId, {
                resolvedFamilyId: familyIdInput ? Number(familyIdInput) : undefined,
                notes: reasonText || undefined,
            });
            notify.success("Application approved");
            queryClient.invalidateQueries({ queryKey: ["member-application", applicationId] });
            queryClient.invalidateQueries({ queryKey: ["member-applications"] });
            closeModal();
        } catch (err: any) {
            notify.error(err?.response?.data?.message || "Failed to approve application");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleReject() {
        if (!reasonText.trim()) {
            notify.error("Rejection reason is required");
            return;
        }
        setSubmitting(true);
        try {
            await rejectApplication(applicationId, reasonText.trim());
            notify.success("Application rejected");
            queryClient.invalidateQueries({ queryKey: ["member-application", applicationId] });
            queryClient.invalidateQueries({ queryKey: ["member-applications"] });
            closeModal();
        } catch (err: any) {
            notify.error(err?.response?.data?.message || "Failed to reject application");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleNeedsInfo() {
        if (!reasonText.trim()) {
            notify.error("Notes are required");
            return;
        }
        setSubmitting(true);
        try {
            await requestMoreInfo(applicationId, reasonText.trim());
            notify.success("Applicant notified — more information requested");
            queryClient.invalidateQueries({ queryKey: ["member-application", applicationId] });
            queryClient.invalidateQueries({ queryKey: ["member-applications"] });
            closeModal();
        } catch (err: any) {
            notify.error(err?.response?.data?.message || "Failed to request more information");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleMarkMobileVerified() {
        setSubmitting(true);
        try {
            await markMobileVerified(applicationId);
            notify.success("Mobile marked as verified");
            queryClient.invalidateQueries({ queryKey: ["member-application", applicationId] });
        } catch (err: any) {
            notify.error(err?.response?.data?.message || "Failed to update");
        } finally {
            setSubmitting(false);
        }
    }

    if (isLoading) {
        return <div className="bg-white p-6 rounded-xl shadow text-slate-400 text-sm text-center">Loading…</div>;
    }

    if (isError || !data) {
        return (
            <div className="bg-white p-4 rounded shadow text-red-500 text-sm">
                Failed to load application. <Link to={ROUTES.PRIVATE.MEMBER_APPLICATIONS} className="underline">Go back</Link>
            </div>
        );
    }

    const isFinalized = ["APPROVED", "REJECTED", "WITHDRAWN"].includes(data.status);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <Link to={ROUTES.PRIVATE.MEMBER_APPLICATIONS} className="p-1.5 rounded hover:bg-slate-100">
                    <ArrowLeft className="w-4 h-4 text-slate-600" />
                </Link>
                <div>
                    <h1 className="text-xl font-semibold flex items-center gap-2">
                        {data.firstName} {data.lastName}
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_BADGE[data.status]}`}>
                            {data.status.replace("_", " ")}
                        </span>
                    </h1>
                    <p className="text-xs text-slate-400 font-mono">{data.referenceCode}</p>
                </div>
            </div>

            {/* Verification badges */}
            <div className="flex gap-3">
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${data.emailVerified ? "text-green-700 bg-green-50 border-green-200" : "text-slate-400 bg-slate-50 border-slate-200"
                    }`}>
                    <Mail className="w-3.5 h-3.5" /> {data.emailVerified ? "Email Verified" : "Email Not Verified"}
                </span>
                <button
                    disabled={data.mobileVerified || submitting || isFinalized}
                    onClick={handleMarkMobileVerified}
                    className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition ${data.mobileVerified
                            ? "text-green-700 bg-green-50 border-green-200"
                            : "text-slate-500 bg-white border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                        }`}
                >
                    <Phone className="w-3.5 h-3.5" />
                    {data.mobileVerified ? "Mobile Verified" : "Mark Mobile Verified"}
                </button>
            </div>

            {/* Personal details */}
            <div className="bg-white rounded-xl shadow p-5 grid grid-cols-2 md:grid-cols-3 gap-4">
                <Field label="Gender" value={data.gender} />
                <Field label="Date of Birth" value={new Date(data.dob).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} />
                <Field label="Marital Status" value={data.maritalStatus} />
                <Field label="Gotra" value={data.gotraName} />
                <Field label="Contact Number" value={data.contactNumber} />
                <Field label="Email" value={data.email} />
            </div>

            {/* Address */}
            <div className="bg-white rounded-xl shadow p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
                <Field label="State" value={data.state} />
                <Field label="District" value={data.district} />
                <Field label="Tehsil" value={data.tahsil} />
                <Field label="Village/Town" value={data.village} />
            </div>

            {/* Family / relationship */}
            <div className="bg-white rounded-xl shadow p-5 grid grid-cols-2 md:grid-cols-3 gap-4">
                <Field label="Claimed Family Code" value={data.claimedFamilyCode} />
                <Field label="Resolved Family" value={data.resolvedFamilyCode} />
                <Field label="Relationship Claim" value={data.relationshipClaim} />
            </div>

            {/* Duplicate candidates */}
            {data.duplicateCandidates?.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                    <p className="text-sm font-semibold text-amber-800 mb-2">
                        Possible duplicate — {data.duplicateCandidates.length} existing member(s) with same name, DOB, and village
                    </p>
                    <ul className="text-sm text-amber-900 space-y-1">
                        {data.duplicateCandidates.map((c) => (
                            <li key={c.id}>
                                {c.firstName} {c.lastName} — <span className="font-mono text-xs">{c.memberCode}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Review notes / rejection reason if already reviewed */}
            {data.reviewNotes && (
                <div className="bg-slate-50 border rounded-xl p-4">
                    <p className="text-xs font-semibold text-slate-500 mb-1">Review Notes</p>
                    <p className="text-sm text-slate-700">{data.reviewNotes}</p>
                </div>
            )}
            {data.rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-xs font-semibold text-red-600 mb-1">Rejection Reason</p>
                    <p className="text-sm text-red-800">{data.rejectionReason}</p>
                </div>
            )}
            {data.approvedMemberCode && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="text-xs font-semibold text-green-700 mb-1">Approved Member Code</p>
                    <p className="text-sm font-mono text-green-900">{data.approvedMemberCode}</p>
                </div>
            )}

            {/* Actions */}
            {!isFinalized && (
                <div className="flex gap-3 pt-2">
                    <button
                        onClick={() => setModal("approve")}
                        className="px-5 py-2.5 rounded-md bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition flex items-center gap-2"
                    >
                        <CheckCircle2 className="w-4 h-4" /> Approve
                    </button>
                    <button
                        onClick={() => setModal("needsInfo")}
                        className="px-5 py-2.5 rounded-md bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition"
                    >
                        Needs Info
                    </button>
                    <button
                        onClick={() => setModal("reject")}
                        className="px-5 py-2.5 rounded-md bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition flex items-center gap-2"
                    >
                        <XCircle className="w-4 h-4" /> Reject
                    </button>
                </div>
            )}

            {/* Action modal */}
            {modal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 space-y-4">
                        <h2 className="text-lg font-semibold">
                            {modal === "approve" && "Approve Application"}
                            {modal === "reject" && "Reject Application"}
                            {modal === "needsInfo" && "Request More Information"}
                        </h2>

                        {modal === "approve" && (
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">
                                    Existing Family ID (optional — leave blank to create a new family)
                                </label>
                                <input
                                    type="number"
                                    value={familyIdInput}
                                    onChange={(e) => setFamilyIdInput(e.target.value)}
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                                    placeholder="e.g. 10000042"
                                />
                            </div>
                        )}

                        {modal !== "approve" && (
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">
                                    {modal === "reject" ? "Rejection Reason" : "Notes for Applicant"} (required)
                                </label>
                                <textarea
                                    value={reasonText}
                                    onChange={(e) => setReasonText(e.target.value)}
                                    rows={4}
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                                    placeholder={modal === "reject" ? "Explain why this application isn't approved…" : "What additional information is needed…"}
                                />
                            </div>
                        )}

                        {modal === "approve" && (
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Notes (optional)</label>
                                <textarea
                                    value={reasonText}
                                    onChange={(e) => setReasonText(e.target.value)}
                                    rows={2}
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                                />
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-2">
                            <button onClick={closeModal} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">
                                Cancel
                            </button>
                            <button
                                disabled={submitting}
                                onClick={modal === "approve" ? handleApprove : modal === "reject" ? handleReject : handleNeedsInfo}
                                className={`px-5 py-2 rounded-md text-white text-sm font-semibold disabled:opacity-50 ${modal === "reject" ? "bg-red-600 hover:bg-red-700" : modal === "needsInfo" ? "bg-orange-500 hover:bg-orange-600" : "bg-green-600 hover:bg-green-700"
                                    }`}
                            >
                                {submitting ? "Submitting…" : "Confirm"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
