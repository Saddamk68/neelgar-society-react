import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Phone, CheckCircle2, XCircle } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import {
    getApplicationDetail,
    approveApplication,
    rejectApplication,
    requestMoreInfo,
    markMobileVerified,
} from "@/features/member-applications/services/memberApplicationService";
import { getFamily } from "@/features/members/services/familyService";
import { useNotify } from "@/services/notifications";
import { ROUTES } from "@/constants/routes";

type ActionModal = "approve" | "reject" | "needsInfo" | null;

// ── Row / Section — matches ViewMember.tsx conventions ───────────────────────

function Row({ label, value }: { label: string; value?: string | number | null }) {
    return (
        <div className="flex gap-2 text-sm">
            <div className="w-40 text-slate-500 shrink-0">{label}</div>
            <div className="flex-1 font-medium text-slate-800">{value || "—"}</div>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">{title}</h3>
            {children}
        </div>
    );
}

const STATUS_BADGE: Record<string, string> = {
    PENDING: "bg-warning/10 text-warning",
    UNDER_REVIEW: "bg-secondary/10 text-secondary",
    NEEDS_INFO: "bg-warning/10 text-warning",
    APPROVED: "bg-success/10 text-success",
    REJECTED: "bg-danger/10 text-danger",
    WITHDRAWN: "bg-slate-100 text-slate-500",
};

export default function MemberApplicationDetail() {
    const { id } = useParams<{ id: string }>();
    const applicationId = Number(id);
    const notify = useNotify();
    const queryClient = useQueryClient();

    const [modal, setModal] = useState<ActionModal>(null);
    const [reasonText, setReasonText] = useState("");
    const [familyCodeInput, setFamilyCodeInput] = useState("");
    const [familyLookupError, setFamilyLookupError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["member-application", applicationId],
        queryFn: () => getApplicationDetail(applicationId),
        enabled: !!applicationId,
    });

    function closeModal() {
        setModal(null);
        setReasonText("");
        setFamilyCodeInput("");
        setFamilyLookupError("");
    }

    function invalidate() {
        queryClient.invalidateQueries({ queryKey: ["member-application", applicationId] });
        queryClient.invalidateQueries({ queryKey: ["member-applications"] });
    }

    async function handleApprove() {
        setSubmitting(true);
        setFamilyLookupError("");
        try {
            let resolvedFamilyId: number | undefined;
            if (familyCodeInput.trim()) {
                try {
                    const family = await getFamily(familyCodeInput.trim());
                    resolvedFamilyId = family.id;
                } catch {
                    setFamilyLookupError(`Family code "${familyCodeInput.trim()}" not found`);
                    setSubmitting(false);
                    return;
                }
            }

            await approveApplication(applicationId, {
                resolvedFamilyId,
                notes: reasonText || undefined,
            });
            notify.success("Application approved");
            invalidate();
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
            invalidate();
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
            invalidate();
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
            invalidate();
        } catch (err: any) {
            notify.error(err?.response?.data?.message || "Failed to update");
        } finally {
            setSubmitting(false);
        }
    }

    if (isLoading) {
        return <div className="bg-white rounded-xl shadow p-6 text-sm text-slate-400 text-center">Loading…</div>;
    }

    if (isError || !data) {
        return (
            <div className="bg-white rounded-xl shadow p-6 text-sm text-danger">
                Failed to load application.{" "}
                <button onClick={() => refetch()} className="underline">Retry</button>
            </div>
        );
    }

    const isFinalized = ["APPROVED", "REJECTED", "WITHDRAWN"].includes(data.status);
    // Mobile can only be marked verified if a number was actually provided —
    // there is nothing to verify otherwise.
    const canVerifyMobile = !!data.contactNumber && !data.mobileVerified && !isFinalized;

    return (
        <div className="space-y-4 max-w-3xl mx-auto">
            <PageHeader
                title="Application Review"
                subtitle={`${data.firstName} ${data.lastName}`}
                backTo={ROUTES.PRIVATE.MEMBER_APPLICATIONS}
            />

            <div className="bg-white rounded-xl shadow p-6">
                {/* Identity header */}
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <div>
                        <div className="text-xl font-semibold text-slate-800">
                            {data.firstName} {data.lastName}
                        </div>
                        <div className="text-sm text-slate-500 mt-0.5 font-mono">{data.referenceCode}</div>
                    </div>
                    <span className={`text-xs font-medium px-3 py-1 rounded-full ${STATUS_BADGE[data.status]}`}>
                        {data.status.replace("_", " ")}
                    </span>
                </div>

                {/* Verification badges */}
                <div className="flex flex-wrap gap-3">
                    <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${data.emailVerified ? "bg-success/10 text-success" : "bg-slate-100 text-slate-400"
                            }`}
                    >
                        <Mail className="w-3.5 h-3.5" /> {data.emailVerified ? "Email Verified" : "Email Not Verified"}
                    </span>

                    {data.contactNumber ? (
                        <button
                            disabled={data.mobileVerified || submitting || isFinalized}
                            onClick={handleMarkMobileVerified}
                            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition ${data.mobileVerified
                                ? "bg-success/10 text-success"
                                : "bg-white border border-slate-300 text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                                }`}
                        >
                            <Phone className="w-3.5 h-3.5" />
                            {data.mobileVerified ? "Mobile Verified" : "Mark Mobile Verified"}
                        </button>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-400">
                            <Phone className="w-3.5 h-3.5" /> No Mobile Number Provided
                        </span>
                    )}
                </div>

                {/* Personal details */}
                <Section title="Personal Information">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                        <Row label="Gender" value={data.gender} />
                        <Row
                            label="Date of Birth"
                            value={new Date(data.dob).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        />
                        <Row label="Marital Status" value={data.maritalStatus} />
                        <Row label="Gotra" value={data.gotraName} />
                        <Row label="Contact Number" value={data.contactNumber} />
                        <Row label="Email" value={data.email} />
                    </div>
                </Section>

                {/* Address */}
                <Section title="Address">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                        <Row label="State" value={data.state} />
                        <Row label="District" value={data.district} />
                        <Row label="Tehsil" value={data.tahsil} />
                        <Row label="Village/Town" value={data.village} />
                    </div>
                </Section>

                {/* Family / relationship */}
                <Section title="Family & Relationship">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                        <Row label="Claimed Family Code" value={data.claimedFamilyCode} />
                        <Row label="Resolved Family" value={data.resolvedFamilyCode} />
                        <Row label="Relationship Claim" value={data.relationshipClaim} />
                    </div>
                </Section>

                {/* Duplicate candidates */}
                {data.duplicateCandidates?.length > 0 && (
                    <Section title="Possible Duplicate">
                        <div className="bg-warning/5 border border-warning/30 rounded-lg p-4">
                            <p className="text-sm font-medium text-warning mb-2">
                                {data.duplicateCandidates.length} existing member(s) match this name, date of birth, and village
                            </p>
                            <ul className="text-sm text-slate-700 space-y-1">
                                {data.duplicateCandidates.map((c) => (
                                    <li key={c.id}>
                                        {c.firstName} {c.lastName} — <span className="font-mono text-xs">{c.memberCode}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </Section>
                )}

                {/* Review outcome */}
                {(data.reviewNotes || data.rejectionReason || data.approvedMemberCode) && (
                    <Section title="Review Outcome">
                        {data.reviewNotes && (
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-3">
                                <p className="text-xs font-semibold text-slate-500 mb-1">Review Notes</p>
                                <p className="text-sm text-slate-700">{data.reviewNotes}</p>
                            </div>
                        )}
                        {data.rejectionReason && (
                            <div className="bg-danger/5 border border-danger/30 rounded-lg p-4 mb-3">
                                <p className="text-xs font-semibold text-danger mb-1">Rejection Reason</p>
                                <p className="text-sm text-slate-700">{data.rejectionReason}</p>
                            </div>
                        )}
                        {data.approvedMemberCode && (
                            <div className="bg-success/5 border border-success/30 rounded-lg p-4">
                                <p className="text-xs font-semibold text-success mb-1">Approved Member Code</p>
                                <p className="text-sm font-mono text-slate-800">{data.approvedMemberCode}</p>
                            </div>
                        )}
                    </Section>
                )}

                {/* Actions */}
                {!isFinalized && (
                    <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t">
                        <button
                            onClick={() => setModal("approve")}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-success text-white text-sm font-semibold hover:opacity-90 transition"
                        >
                            <CheckCircle2 className="w-4 h-4" /> Approve
                        </button>
                        <button
                            onClick={() => setModal("needsInfo")}
                            className="px-5 py-2.5 rounded-md bg-warning text-white text-sm font-semibold hover:opacity-90 transition"
                        >
                            Needs Info
                        </button>
                        <button
                            onClick={() => setModal("reject")}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-danger text-white text-sm font-semibold hover:opacity-90 transition"
                        >
                            <XCircle className="w-4 h-4" /> Reject
                        </button>
                    </div>
                )}
            </div>

            {/* Action modal */}
            {modal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 space-y-4">
                        <h2 className="text-lg font-semibold text-slate-800">
                            {modal === "approve" && "Approve Application"}
                            {modal === "reject" && "Reject Application"}
                            {modal === "needsInfo" && "Request More Information"}
                        </h2>

                        {modal === "approve" && (
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">
                                    Existing Family Code (optional — leave blank to create a new family)
                                </label>
                                <input
                                    type="text"
                                    value={familyCodeInput}
                                    onChange={(e) => { setFamilyCodeInput(e.target.value); setFamilyLookupError(""); }}
                                    className={[
                                        "w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 transition",
                                        familyLookupError ? "border-danger ring-1 ring-danger" : "border-slate-300 focus:ring-primary/40",
                                    ].join(" ")}
                                    placeholder="e.g. FAM-0001"
                                />
                                {familyLookupError && <p className="text-xs text-danger mt-1">{familyLookupError}</p>}
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
                                className={`px-5 py-2 rounded-md text-white text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition ${modal === "reject" ? "bg-danger" : modal === "needsInfo" ? "bg-warning" : "bg-success"
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
