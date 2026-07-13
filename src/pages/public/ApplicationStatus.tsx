import { useState } from "react";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Clock, XCircle, AlertCircle, Search } from "lucide-react";
import FieldLabel from "@/components/form/FieldLabel";
import DatePicker from "@/components/form/DatePicker";
import Select from "@/components/form/Select";
import PublicGeoUnitCascadeSelect, {
    GeoSelection,
} from "@/features/public-membership/components/PublicGeoUnitCascadeSelect";
import PublicGotraSelect from "@/features/public-membership/components/PublicGotraSelect";
import {
    otpSchema,
    applicationDetailsSchema,
    OtpValues,
    ApplicationDetailsValues,
} from "@/features/public-membership/public-membership.schema";
import {
    getApplicationStatus,
    sendOtp,
    verifyOtp,
    getEditableDetails,
    resubmitApplication,
} from "@/features/public-membership/services/publicMembershipService";
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
    PENDING: { label: "Pending Review", color: "text-amber-600 bg-amber-50 border-amber-200", icon: <Clock className="w-5 h-5" /> },
    UNDER_REVIEW: { label: "Under Review", color: "text-blue-600 bg-blue-50 border-blue-200", icon: <Clock className="w-5 h-5" /> },
    NEEDS_INFO: { label: "Needs More Information", color: "text-orange-600 bg-orange-50 border-orange-200", icon: <AlertCircle className="w-5 h-5" /> },
    APPROVED: { label: "Approved", color: "text-green-600 bg-green-50 border-green-200", icon: <CheckCircle2 className="w-5 h-5" /> },
    REJECTED: { label: "Not Approved", color: "text-red-600 bg-red-50 border-red-200", icon: <XCircle className="w-5 h-5" /> },
    WITHDRAWN: { label: "Withdrawn", color: "text-slate-600 bg-slate-50 border-slate-200", icon: <XCircle className="w-5 h-5" /> },
};

type ResubmitStage = "closed" | "email" | "otp" | "form" | "done";

export default function ApplicationStatus() {
    const notify = useNotify();
    const [referenceCode, setReferenceCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<MemberApplicationStatusResponse | null>(null);
    const [searched, setSearched] = useState(false);

    // ── Resubmit flow state ──────────────────────────────────────────────────
    const [stage, setStage] = useState<ResubmitStage>("closed");
    const [email, setEmail] = useState("");
    const [verificationToken, setVerificationToken] = useState("");
    const [sendingOtp, setSendingOtp] = useState(false);
    const [geo, setGeo] = useState<GeoSelection>({});

    const otpForm = useForm<OtpValues>({ resolver: zodResolver(otpSchema), mode: "onBlur" });
    const detailsForm = useForm<ApplicationDetailsValues>({
        resolver: zodResolver(applicationDetailsSchema) as any,
        mode: "onBlur",
    });
    const {
        register,
        watch,
        setValue,
        reset: resetDetailsForm,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = detailsForm;

    const dob = watch("dob");
    const gender = watch("gender");
    const maritalStatus = watch("maritalStatus");
    const gotraId = watch("gotraId");

    async function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        if (!referenceCode.trim()) return;

        setLoading(true);
        setSearched(true);
        setResult(null);
        setStage("closed");
        try {
            const response = await getApplicationStatus(referenceCode.trim());
            setResult(response);
        } catch (err: any) {
            notify.error(err.message || "Application not found");
        } finally {
            setLoading(false);
        }
    }

    function startResubmit() {
        setStage("email");
    }

    async function handleSendOtpForResubmit() {
        if (!email.trim()) {
            notify.error("Please enter the email used on your application");
            return;
        }
        setSendingOtp(true);
        try {
            await sendOtp(email.trim());
            notify.success("OTP sent to your email");
            setStage("otp");
        } catch (err: any) {
            notify.error(err.message || "Failed to send OTP");
        } finally {
            setSendingOtp(false);
        }
    }

    async function handleVerifyForResubmit(data: OtpValues) {
        try {
            const token = await verifyOtp(email.trim(), data.otp);
            setVerificationToken(token);

            const details = await getEditableDetails(referenceCode.trim(), email.trim(), token);
            resetDetailsForm({
                firstName: details.firstName,
                lastName: details.lastName,
                gender: details.gender,
                dob: details.dob,
                maritalStatus: details.maritalStatus,
                gotraId: details.gotraId,
                contactNumber: details.contactNumber || "",
                geoUnitId: details.geoUnitId,
                claimedFamilyCode: details.claimedFamilyCode || "",
                relationshipClaim: details.relationshipClaim || "",
            });
            setGeo({ villageTownId: details.geoUnitId });
            setStage("form");
        } catch (err: any) {
            notify.error(err.message || "Verification failed");
        }
    }

    const handleResubmit = handleSubmit(async (data) => {
        try {
            const response = await resubmitApplication(referenceCode.trim(), {
                ...data,
                contactNumber: data.contactNumber || undefined,
                claimedFamilyCode: data.claimedFamilyCode || undefined,
                relationshipClaim: data.relationshipClaim || undefined,
                otpVerificationToken: verificationToken,
            });
            setResult(response);
            setStage("done");
            notify.success("Application resubmitted — back in the review queue");
        } catch (err: any) {
            notify.error(err.message || "Failed to resubmit");
        }
    });

    function handleGeoChange(next: GeoSelection) {
        setGeo(next);
        setValue("geoUnitId", next.villageTownId as number, { shouldValidate: true, shouldDirty: true });
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

                            {result.status === "NEEDS_INFO" && stage === "closed" && (
                                <button
                                    onClick={startResubmit}
                                    className="w-full px-5 py-2.5 rounded-md bg-primary text-white text-sm font-semibold"
                                >
                                    Update & Resubmit
                                </button>
                            )}

                            {/* ── Resubmit: step 1, confirm email ── */}
                            {stage === "email" && (
                                <div className="border-t pt-5 space-y-3">
                                    <p className="text-sm text-text-muted">
                                        Enter the email address you used on this application to verify your identity.
                                    </p>
                                    <input
                                        type="email"
                                        className={inputClass()}
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                    <button
                                        onClick={handleSendOtpForResubmit}
                                        disabled={sendingOtp}
                                        className="px-5 py-2.5 rounded-md bg-primary text-white text-sm font-semibold disabled:opacity-50"
                                    >
                                        {sendingOtp ? "Sending…" : "Send Verification Code"}
                                    </button>
                                </div>
                            )}

                            {/* ── Resubmit: step 2, OTP ── */}
                            {stage === "otp" && (
                                <form onSubmit={otpForm.handleSubmit(handleVerifyForResubmit)} className="border-t pt-5 space-y-3">
                                    <p className="text-sm text-text-muted">
                                        A 6-digit code was sent to <span className="font-semibold">{email}</span>.
                                    </p>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        className={inputClass(!!otpForm.formState.errors.otp)}
                                        placeholder="123456"
                                        {...otpForm.register("otp")}
                                    />
                                    {otpForm.formState.errors.otp && (
                                        <p className="text-xs text-red-500">{otpForm.formState.errors.otp.message}</p>
                                    )}
                                    <button
                                        type="submit"
                                        className="px-5 py-2.5 rounded-md bg-primary text-white text-sm font-semibold"
                                    >
                                        Verify & Continue
                                    </button>
                                </form>
                            )}

                            {/* ── Resubmit: step 3, editable form ── */}
                            {stage === "form" && (
                                <form onSubmit={handleResubmit} className="border-t pt-5 space-y-4">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <FieldLabel required>First Name</FieldLabel>
                                            <input className={inputClass(!!errors.firstName)} {...register("firstName")} />
                                        </div>
                                        <div>
                                            <FieldLabel required>Last Name</FieldLabel>
                                            <input className={inputClass(!!errors.lastName)} {...register("lastName")} />
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <FieldLabel required>Gender</FieldLabel>
                                            <Select
                                                value={gender ?? ""}
                                                onChange={(v) => setValue("gender", v as any, { shouldValidate: true })}
                                                options={[
                                                    { value: "MALE", label: "Male" },
                                                    { value: "FEMALE", label: "Female" },
                                                    { value: "OTHER", label: "Other" },
                                                ]}
                                                placeholder="Select gender…"
                                                hasError={!!errors.gender}
                                            />
                                        </div>
                                        <div>
                                            <FieldLabel required>Date of Birth</FieldLabel>
                                            <DatePicker
                                                value={dob ?? ""}
                                                onChange={(v) => setValue("dob", v, { shouldValidate: true })}
                                                hasError={!!errors.dob}
                                                maxDate={new Date()}
                                                minDate={new Date("1900-01-01")}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <FieldLabel required>Marital Status</FieldLabel>
                                            <Select
                                                value={maritalStatus ?? ""}
                                                onChange={(v) => setValue("maritalStatus", v as any, { shouldValidate: true })}
                                                options={[
                                                    { value: "SINGLE", label: "Single" },
                                                    { value: "MARRIED", label: "Married" },
                                                    { value: "DIVORCED", label: "Divorced" },
                                                    { value: "WIDOWED", label: "Widowed" },
                                                ]}
                                                placeholder="Select…"
                                                hasError={!!errors.maritalStatus}
                                            />
                                        </div>
                                        <div>
                                            <FieldLabel required>Gotra</FieldLabel>
                                            <PublicGotraSelect
                                                societyId={10000001}
                                                value={gotraId}
                                                onChange={(id) => setValue("gotraId", id, { shouldValidate: true })}
                                                hasError={!!errors.gotraId}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <FieldLabel>Contact Number (optional)</FieldLabel>
                                        <input className={inputClass(!!errors.contactNumber)} {...register("contactNumber")} />
                                        {errors.contactNumber && <p className="text-xs text-red-500 mt-1">{errors.contactNumber.message}</p>}
                                    </div>

                                    <div>
                                        <FieldLabel required>State / District / Tehsil / Village-Town</FieldLabel>
                                        <PublicGeoUnitCascadeSelect value={geo} onChange={handleGeoChange} />
                                    </div>

                                    <div>
                                        <FieldLabel>Family Code (optional)</FieldLabel>
                                        <input className={inputClass()} {...register("claimedFamilyCode")} />
                                    </div>

                                    <div>
                                        <FieldLabel>Relationship to an existing member (optional)</FieldLabel>
                                        <input className={inputClass()} {...register("relationshipClaim")} />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full px-5 py-2.5 rounded-md bg-primary text-white text-sm font-semibold disabled:opacity-50"
                                    >
                                        {isSubmitting ? "Resubmitting…" : "Resubmit Application"}
                                    </button>
                                </form>
                            )}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
