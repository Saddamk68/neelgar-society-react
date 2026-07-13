import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";

import FieldLabel from "@/components/form/FieldLabel";
import DatePicker from "@/components/form/DatePicker";
import Select from "@/components/form/Select";
import PublicGeoUnitCascadeSelect, {
    GeoSelection,
} from "@/features/public-membership/components/PublicGeoUnitCascadeSelect";
import PublicGotraSelect from "@/features/public-membership/components/PublicGotraSelect";
import {
    emailSchema,
    otpSchema,
    applicationDetailsSchema,
    EmailValues,
    OtpValues,
    ApplicationDetailsValues,
} from "@/features/public-membership/public-membership.schema";
import {
    sendOtp,
    verifyOtp,
    submitApplication,
} from "@/features/public-membership/services/publicMembershipService";
import { useNotify } from "@/services/notifications";
import { ROUTES } from "@/constants/routes";
import { DEFAULT_SOCIETY_ID } from "@/constants/society";

type Step = 1 | 2 | 3;

function inputClass(hasError?: boolean) {
    return [
        "w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 transition",
        hasError
            ? "border-red-400 ring-1 ring-red-400 focus:ring-red-400"
            : "border-slate-300 focus:ring-primary/40",
    ].join(" ");
}

function StepBar({ current }: { current: Step }) {
    const steps = [
        { n: 1, label: "Verify Email" },
        { n: 2, label: "Your Details" },
        { n: 3, label: "Submitted" },
    ];
    return (
        <div className="flex items-center gap-2 mb-8">
            {steps.map((s, i) => (
                <div key={s.n} className="flex items-center gap-2">
                    <div
                        className={[
                            "flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold border-2",
                            current === s.n
                                ? "border-primary bg-primary text-white"
                                : current > s.n
                                    ? "border-green-500 bg-green-500 text-white"
                                    : "border-slate-300 bg-white text-slate-400",
                        ].join(" ")}
                    >
                        {current > s.n ? "✓" : s.n}
                    </div>
                    <span
                        className={[
                            "text-sm",
                            current === s.n ? "font-semibold text-primary" : "text-slate-400",
                        ].join(" ")}
                    >
                        {s.label}
                    </span>
                    {i < steps.length - 1 && (
                        <div className={["w-12 h-0.5 mx-1", current > s.n ? "bg-green-500" : "bg-slate-200"].join(" ")} />
                    )}
                </div>
            ))}
        </div>
    );
}

export default function MembershipApplication() {
    const notify = useNotify();
    const navigate = useNavigate();

    const [step, setStep] = useState<Step>(1);
    const [otpSent, setOtpSent] = useState(false);
    const [verifiedEmail, setVerifiedEmail] = useState("");
    const [verificationToken, setVerificationToken] = useState("");
    const [referenceCode, setReferenceCode] = useState("");
    const [sendingOtp, setSendingOtp] = useState(false);
    const [verifyingOtp, setVerifyingOtp] = useState(false);
    const [geo, setGeo] = useState<GeoSelection>({});

    // ── Step 1 forms: email + otp ────────────────────────────────────────────
    const emailForm = useForm<EmailValues>({ resolver: zodResolver(emailSchema), mode: "onBlur" });
    const otpForm = useForm<OtpValues>({ resolver: zodResolver(otpSchema), mode: "onBlur" });

    // ── Step 2 form: application details ─────────────────────────────────────
    const detailsForm = useForm<ApplicationDetailsValues>({
        resolver: zodResolver(applicationDetailsSchema) as any,
        mode: "onBlur",
        defaultValues: {
            firstName: "",
            lastName: "",
            dob: "",
            contactNumber: "",
            claimedFamilyCode: "",
            relationshipClaim: "",
            gotraId: undefined as unknown as number,
            geoUnitId: undefined as unknown as number,
        },
    });
    const {
        register,
        watch,
        setValue,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = detailsForm;

    const dob = watch("dob");
    const gender = watch("gender");
    const maritalStatus = watch("maritalStatus");
    const gotraId = watch("gotraId");

    // ── Step 1 handlers ───────────────────────────────────────────────────────

    async function handleSendOtp(data: EmailValues) {
        setSendingOtp(true);
        try {
            await sendOtp(data.email);
            setVerifiedEmail(data.email);
            setOtpSent(true);
            notify.success("OTP sent to your email");
        } catch (err: any) {
            notify.error(err.message || "Failed to send OTP");
        } finally {
            setSendingOtp(false);
        }
    }

    async function handleVerifyOtp(data: OtpValues) {
        setVerifyingOtp(true);
        try {
            const token = await verifyOtp(verifiedEmail, data.otp);
            setVerificationToken(token);
            notify.success("Email verified");
            setStep(2);
        } catch (err: any) {
            notify.error(err.message || "Invalid OTP");
        } finally {
            setVerifyingOtp(false);
        }
    }

    // ── Step 2 handler ────────────────────────────────────────────────────────

    const handleSubmitApplication = handleSubmit(async (data) => {
        try {
            const response = await submitApplication({
                ...data,
                contactNumber: data.contactNumber || undefined,
                claimedFamilyCode: data.claimedFamilyCode || undefined,
                relationshipClaim: data.relationshipClaim || undefined,
                email: verifiedEmail,
                otpVerificationToken: verificationToken,
            });
            setReferenceCode(response.referenceCode);
            setStep(3);
        } catch (err: any) {
            notify.error(err.message || "Failed to submit application");
        }
    });

    function handleGeoChange(next: GeoSelection) {
        setGeo(next);
        setValue("geoUnitId", next.villageTownId as number, { shouldValidate: true, shouldDirty: true });
    }

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="bg-background text-text-primary min-h-screen">
            <section className="bg-surface border-b">
                <div className="max-w-3xl mx-auto px-6 py-16">
                    <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-widest uppercase mb-5">
                        Membership Application
                    </span>
                    <h1 className="text-3xl md:text-4xl font-extrabold leading-tight tracking-tight text-text-primary">
                        Join Neelgar Society
                    </h1>
                    <p className="mt-3 text-text-muted leading-relaxed max-w-xl">
                        Submit your details below. Your local President/Secretary will verify and approve your
                        application before your member login is created.
                    </p>
                </div>
            </section>

            <section className="py-12">
                <div className="max-w-3xl mx-auto px-6">
                    <StepBar current={step} />

                    {/* ── Step 1: Email + OTP ── */}
                    {step === 1 && (
                        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
                            {!otpSent ? (
                                <form onSubmit={emailForm.handleSubmit(handleSendOtp)} className="space-y-4">
                                    <div>
                                        <FieldLabel required>Email Address</FieldLabel>
                                        <input
                                            type="email"
                                            className={inputClass(!!emailForm.formState.errors.email)}
                                            placeholder="you@example.com"
                                            {...emailForm.register("email")}
                                        />
                                        {emailForm.formState.errors.email && (
                                            <p className="text-xs text-red-500 mt-1">{emailForm.formState.errors.email.message}</p>
                                        )}
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={sendingOtp}
                                        className="px-5 py-2.5 rounded-md bg-primary text-white text-sm font-semibold disabled:opacity-50"
                                    >
                                        {sendingOtp ? "Sending…" : "Send Verification Code"}
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={otpForm.handleSubmit(handleVerifyOtp)} className="space-y-4">
                                    <p className="text-sm text-text-muted">
                                        A 6-digit code was sent to <span className="font-semibold">{verifiedEmail}</span>.
                                    </p>
                                    <div>
                                        <FieldLabel required>Verification Code</FieldLabel>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={6}
                                            className={inputClass(!!otpForm.formState.errors.otp)}
                                            placeholder="123456"
                                            {...otpForm.register("otp")}
                                        />
                                        {otpForm.formState.errors.otp && (
                                            <p className="text-xs text-red-500 mt-1">{otpForm.formState.errors.otp.message}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="submit"
                                            disabled={verifyingOtp}
                                            className="px-5 py-2.5 rounded-md bg-primary text-white text-sm font-semibold disabled:opacity-50"
                                        >
                                            {verifyingOtp ? "Verifying…" : "Verify Code"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleSendOtp({ email: verifiedEmail })}
                                            disabled={sendingOtp}
                                            className="text-sm text-primary font-medium hover:underline"
                                        >
                                            Resend code
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}

                    {/* ── Step 2: Application details ── */}
                    {step === 2 && (
                        <form onSubmit={handleSubmitApplication} className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <FieldLabel required>First Name</FieldLabel>
                                    <input className={inputClass(!!errors.firstName)} {...register("firstName")} />
                                    {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName.message}</p>}
                                </div>
                                <div>
                                    <FieldLabel required>Last Name</FieldLabel>
                                    <input className={inputClass(!!errors.lastName)} {...register("lastName")} />
                                    {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName.message}</p>}
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
                                    {errors.gender && <p className="text-xs text-red-500 mt-1">{errors.gender.message as string}</p>}
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
                                    {errors.dob && <p className="text-xs text-red-500 mt-1">{errors.dob.message}</p>}
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
                                    {errors.maritalStatus && (
                                        <p className="text-xs text-red-500 mt-1">{errors.maritalStatus.message as string}</p>
                                    )}
                                </div>
                                <div>
                                    <FieldLabel required>Gotra</FieldLabel>
                                    <PublicGotraSelect
                                        societyId={DEFAULT_SOCIETY_ID}
                                        value={gotraId}
                                        onChange={(id) => setValue("gotraId", id, { shouldValidate: true })}
                                        hasError={!!errors.gotraId}
                                    />
                                    {errors.gotraId && <p className="text-xs text-red-500 mt-1">{errors.gotraId.message}</p>}
                                </div>
                            </div>

                            <div>
                                <FieldLabel>Contact Number (optional)</FieldLabel>
                                <input
                                    className={inputClass(!!errors.contactNumber)}
                                    placeholder="10-digit mobile number"
                                    {...register("contactNumber")}
                                />
                                {errors.contactNumber && <p className="text-xs text-red-500 mt-1">{errors.contactNumber.message}</p>}
                            </div>

                            <div>
                                <FieldLabel required>State / District / Tehsil / Village-Town</FieldLabel>
                                <PublicGeoUnitCascadeSelect value={geo} onChange={handleGeoChange} />
                                {errors.geoUnitId && <p className="text-xs text-red-500 mt-1">{errors.geoUnitId.message}</p>}
                            </div>

                            <div>
                                <FieldLabel>Family Code (optional — leave blank if unknown)</FieldLabel>
                                <input className={inputClass()} placeholder="e.g. FAM-2024-000123" {...register("claimedFamilyCode")} />
                                <p className="text-xs text-text-muted mt-1">
                                    If you don't know your family code, leave this blank — your local President/Secretary will link
                                    it during review.
                                </p>
                            </div>

                            <div>
                                <FieldLabel>Relationship to an existing member (optional)</FieldLabel>
                                <input
                                    className={inputClass()}
                                    placeholder="e.g. Son of [member name / member code]"
                                    {...register("relationshipClaim")}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-6 py-2.5 rounded-md bg-primary text-white text-sm font-semibold disabled:opacity-50"
                            >
                                {isSubmitting ? "Submitting…" : "Submit Application"}
                            </button>
                        </form>
                    )}

                    {/* ── Step 3: Confirmation ── */}
                    {step === 3 && (
                        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4">
                            <h2 className="text-xl font-bold text-text-primary">Application Submitted</h2>
                            <p className="text-text-muted">
                                Your reference code is:
                            </p>
                            <p className="text-2xl font-mono font-bold text-primary">{referenceCode}</p>
                            <p className="text-sm text-text-muted max-w-md mx-auto">
                                Save this code — you'll need it to check your application status. Your local
                                President/Secretary will review it shortly.
                            </p>
                            <button
                                onClick={() => navigate(ROUTES.PUBLIC.APPLICATION_STATUS)}
                                className="mt-2 px-5 py-2.5 rounded-md bg-primary text-white text-sm font-semibold"
                            >
                                Check Application Status
                            </button>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
