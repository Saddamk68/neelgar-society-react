import { useState } from "react";
import { CheckCircle2, Clock, XCircle, AlertCircle, Search } from "lucide-react";
import type { ReactNode } from "react";
import FieldLabel from "@/components/form/FieldLabel";
import { getApplicationStatus } from "@/features/public-membership/services/publicMembershipService";
import { MemberApplicationStatusResponse } from "@/features/public-membership/public-membership-types";
import { useNotify } from "@/services/notifications";

function inputClass(hasError?: boolean) {
    return [
        "w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 transition",
        hasError
            ? "border-red-400 ring-1 ring-red-400 focus:ring-red-400"
            : "border-slate-300 focus:ring-primary/40",
    ].join(" ");
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: ReactNode }> = {
    PENDING: {
        label: "Pending Review",
        color: "text-amber-600 bg-amber-50 border-amber-200",
        icon: <Clock className="w-5 h-5" />,
    },
    UNDER_REVIEW: {
        label: "Under Review",
        color: "text-blue-600 bg-blue-50 border-blue-200",
        icon: <Clock className="w-5 h-5" />,
    },
    NEEDS_INFO: {
        label: "Needs More Information",
        color: "text-orange-600 bg-orange-50 border-orange-200",
        icon: <AlertCircle className="w-5 h-5" />,
    },
    APPROVED: {
        label: "Approved",
        color: "text-green-600 bg-green-50 border-green-200",
        icon: <CheckCircle2 className="w-5 h-5" />,
    },
    REJECTED: {
        label: "Not Approved",
        color: "text-red-600 bg-red-50 border-red-200",
        icon: <XCircle className="w-5 h-5" />,
    },
    WITHDRAWN: {
        label: "Withdrawn",
        color: "text-slate-600 bg-slate-50 border-slate-200",
        icon: <XCircle className="w-5 h-5" />,
    },
};

export default function ApplicationStatus() {
    const notify = useNotify();
    const [referenceCode, setReferenceCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<MemberApplicationStatusResponse | null>(null);
    const [searched, setSearched] = useState(false);

    async function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        if (!referenceCode.trim()) return;

        setLoading(true);
        setSearched(true);
        setResult(null);
        try {
            const response = await getApplicationStatus(referenceCode.trim());
            setResult(response);
        } catch (err: any) {
            notify.error(err.message || "Application not found");
        } finally {
            setLoading(false);
        }
    }

    const statusInfo = result ? STATUS_CONFIG[result.status] : null;

    return (
        <div className="bg-background text-text-primary min-h-screen">
            <section className="bg-surface border-b">
                <div className="max-w-2xl mx-auto px-6 py-16">
                    <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-widest uppercase mb-5">
                        Application Status
                    </span>
                    <h1 className="text-3xl md:text-4xl font-extrabold leading-tight tracking-tight text-text-primary">
                        Check Your Application
                    </h1>
                    <p className="mt-3 text-text-muted leading-relaxed max-w-xl">
                        Enter the reference code you received when you submitted your membership application.
                    </p>
                </div>
            </section>

            <section className="py-12">
                <div className="max-w-2xl mx-auto px-6">
                    <form onSubmit={handleSearch} className="bg-white border border-slate-200 rounded-xl p-6 flex gap-3 items-end">
                        <div className="flex-1">
                            <FieldLabel required>Reference Code</FieldLabel>
                            <input
                                className={inputClass()}
                                placeholder="APP-2026-4F7A9C"
                                value={referenceCode}
                                onChange={(e) => setReferenceCode(e.target.value.toUpperCase())}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-5 py-2.5 rounded-md bg-primary text-white text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
                        >
                            <Search className="w-4 h-4" />
                            {loading ? "Checking…" : "Check Status"}
                        </button>
                    </form>

                    {searched && !loading && !result && (
                        <div className="mt-6 bg-white border border-slate-200 rounded-xl p-6 text-center text-text-muted">
                            No application found for this reference code. Please check and try again.
                        </div>
                    )}

                    {result && statusInfo && (
                        <div className="mt-6 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
                            <div>
                                <p className="text-xs text-text-muted mb-1">Reference Code</p>
                                <p className="font-mono font-bold text-lg">{result.referenceCode}</p>
                            </div>

                            <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border ${statusInfo.color}`}>
                                {statusInfo.icon}
                                <span className="font-semibold">{statusInfo.label}</span>
                            </div>

                            {/* Verification badges — only rendered if true, per design */}
                            {(result.emailVerified || result.mobileVerified) && (
                                <div className="flex gap-3">
                                    {result.emailVerified && (
                                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Email Verified
                                        </span>
                                    )}
                                    {result.mobileVerified && (
                                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Mobile Verified
                                        </span>
                                    )}
                                </div>
                            )}

                            {result.status === "NEEDS_INFO" && result.reviewNotes && (
                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                    <p className="text-sm font-semibold text-orange-700 mb-1">Note from reviewer</p>
                                    <p className="text-sm text-orange-900">{result.reviewNotes}</p>
                                </div>
                            )}

                            {result.status === "REJECTED" && result.rejectionReason && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <p className="text-sm font-semibold text-red-700 mb-1">Reason</p>
                                    <p className="text-sm text-red-900">{result.rejectionReason}</p>
                                </div>
                            )}

                            {result.status === "APPROVED" && result.approvedMemberCode && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <p className="text-sm font-semibold text-green-700 mb-1">Your Member Code</p>
                                    <p className="text-lg font-mono font-bold text-green-900">{result.approvedMemberCode}</p>
                                    <p className="text-xs text-green-700 mt-2">
                                        Your login credentials have been sent to your registered email address.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
