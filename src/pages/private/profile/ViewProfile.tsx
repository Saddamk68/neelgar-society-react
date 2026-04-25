import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { api } from "@/services/apiClient";
import { getAuthToken } from "@/services/apiClient";
import { ENV } from "@/config/env";
import { ENDPOINTS } from "@/config/endpoints";
import { useAuth } from "@/context/AuthContext";
import { useNotify } from "@/services/notifications";
import { ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react";
import type { UserProfile, UserStatus, ChangePasswordRequest } from "@/features/users/types";

// ── Fetch helpers ─────────────────────────────────────────────────────────────

async function getCurrentUserProfile(): Promise<UserProfile> {
    const resp = await api.get(ENDPOINTS.users.me());
    return resp.data?.data ?? resp.data;
}

async function changePassword(req: ChangePasswordRequest): Promise<void> {
    await api.post(ENDPOINTS.users.changePassword(), req);
}

// ── Small reusable components ─────────────────────────────────────────────────

function Row({ label, value }: { label: string; value?: string | number | null }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-3 text-sm py-2 border-b last:border-b-0">
            <span className="w-40 shrink-0 text-text-muted text-xs uppercase tracking-wide">
                {label}
            </span>
            <span className="font-medium break-all">{value ?? "—"}</span>
        </div>
    );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <h3 className="text-xs font-semibold uppercase tracking-widest text-text-muted mt-6 mb-1">
            {children}
        </h3>
    );
}

const STATUS_STYLES: Record<UserStatus, string> = {
    PENDING: "bg-amber-100 text-amber-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100   text-red-700",
};

// ── Secure image (needs auth token to load) ───────────────────────────────────

function SecureImage({ imageId, alt }: { imageId?: string | null; alt: string }) {
    const [src, setSrc] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const token = getAuthToken();
    const baseUrl = ENV.API_BASE_URL;

    useEffect(() => {
        if (!imageId) return;
        const controller = new AbortController();
        setLoading(true);

        fetch(`${baseUrl}/files/${imageId}/view`, {
            headers: { Authorization: token ? `Bearer ${token}` : "" },
            signal: controller.signal,
        })
            .then((r) => (r.ok ? r.blob() : Promise.reject()))
            .then((blob) => setSrc(URL.createObjectURL(blob)))
            .catch(() => setSrc(null))
            .finally(() => setLoading(false));

        return () => controller.abort();
    }, [imageId, token, baseUrl]);

    if (loading) return <div className="text-xs text-text-muted">Loading…</div>;
    if (!imageId || !src) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-slate-100 text-text-muted text-xs rounded-lg">
                No photo
            </div>
        );
    }
    return <img src={src} alt={alt} className="w-full h-full object-cover rounded-lg" />;
}

// ── Change password section ───────────────────────────────────────────────────

function ChangePasswordSection({ onSuccess }: { onSuccess: () => void }) {
    const notify = useNotify();

    const [open, setOpen] = useState(false);
    const [currentPwd, setCurrentPwd] = useState("");
    const [newPwd, setNewPwd] = useState("");
    const [confirmPwd, setConfirmPwd] = useState("");
    const [showPwd, setShowPwd] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    const mutation = useMutation({
        mutationFn: () =>
            changePassword({ currentPassword: currentPwd, newPassword: newPwd }),
        onSuccess: () => {
            notify.success("Password changed. Signing you out…");
            setOpen(false);
            // Short delay so the user sees the success message before logout
            setTimeout(onSuccess, 1500);
        },
        onError: (err: any) => {
            setLocalError(err?.message || "Failed to change password. Check your current password.");
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);
        if (newPwd.length < 8) {
            setLocalError("New password must be at least 8 characters.");
            return;
        }
        if (newPwd !== confirmPwd) {
            setLocalError("Passwords do not match.");
            return;
        }
        if (newPwd === currentPwd) {
            setLocalError("New password must be different from current password.");
            return;
        }
        mutation.mutate();
    };

    const handleClose = () => {
        setOpen(false);
        setCurrentPwd("");
        setNewPwd("");
        setConfirmPwd("");
        setLocalError(null);
    };

    return (
        <div className="bg-white rounded-xl shadow">

            {/* Collapsible header */}
            <button
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center justify-between px-6 py-4 text-sm font-semibold hover:bg-slate-50/60 transition rounded-xl"
            >
                <span>Change password</span>
                {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {open && (
                <div className="px-6 pb-6 border-t pt-4">
                    <p className="text-sm text-text-muted mb-4">
                        Changing your password will sign you out from all devices.
                    </p>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-sm">

                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium">Current password</label>
                            <input
                                type={showPwd ? "text" : "password"}
                                value={currentPwd}
                                onChange={(e) => setCurrentPwd(e.target.value)}
                                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                                required
                                disabled={mutation.isPending}
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium">New password</label>
                            <div className="relative">
                                <input
                                    type={showPwd ? "text" : "password"}
                                    value={newPwd}
                                    onChange={(e) => setNewPwd(e.target.value)}
                                    placeholder="Min. 8 characters"
                                    className="w-full border rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                                    required
                                    disabled={mutation.isPending}
                                />
                                {/* Toggle show/hide */}
                                <button
                                    type="button"
                                    onClick={() => setShowPwd((v) => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
                                    tabIndex={-1}
                                >
                                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium">Confirm new password</label>
                            <input
                                type={showPwd ? "text" : "password"}
                                value={confirmPwd}
                                onChange={(e) => setConfirmPwd(e.target.value)}
                                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                                required
                                disabled={mutation.isPending}
                            />
                        </div>

                        {localError && (
                            <p className="text-sm text-red-600">{localError}</p>
                        )}

                        <div className="flex gap-2 pt-1">
                            <button
                                type="submit"
                                disabled={mutation.isPending}
                                className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 transition disabled:opacity-60"
                            >
                                {mutation.isPending ? "Saving…" : "Change password"}
                            </button>
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={mutation.isPending}
                                className="px-4 py-2 border rounded-lg text-sm hover:bg-slate-50 transition"
                            >
                                Cancel
                            </button>
                        </div>

                    </form>
                </div>
            )}
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ViewProfile() {
    const notify = useNotify();
    const { logout } = useAuth();

    const { data: profile, isLoading, isError, refetch } = useQuery({
        queryKey: ["currentUserProfile"],
        queryFn: getCurrentUserProfile,
        staleTime: 1000 * 60 * 5,
    });

    useEffect(() => {
        if (isError) notify.error("Failed to load profile.");
    }, [isError, notify]);

    const fullName = [profile?.firstName, profile?.lastName]
        .filter(Boolean)
        .join(" ") || "—";

    const status = profile?.status as UserStatus | undefined;

    return (
        <div className="space-y-4 max-w-3xl">

            {/* Page header */}
            <div>
                <h1 className="text-2xl font-semibold">My Profile</h1>
                <p className="text-text-muted text-sm">Your account and personal details</p>
            </div>

            {/* Account status notices */}
            {status === "PENDING" && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                    Your account is pending admin approval. Some features may be limited.
                </div>
            )}
            {status === "REJECTED" && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                    Your account has been rejected. Please contact the administrator.
                </div>
            )}

            {/* Loading */}
            {isLoading && (
                <div className="bg-white rounded-xl shadow p-6 text-sm text-text-muted">
                    Loading profile…
                </div>
            )}

            {/* Error */}
            {isError && (
                <div className="bg-white rounded-xl shadow p-6 text-sm text-red-600">
                    Failed to load profile.{" "}
                    <button onClick={() => refetch()} className="underline">Retry</button>
                </div>
            )}

            {/* Profile card */}
            {!isLoading && !isError && profile && (
                <div className="bg-white rounded-xl shadow p-6">

                    {/* Top: avatar + name + status */}
                    <div className="flex flex-col sm:flex-row gap-6 mb-4">
                        <div className="shrink-0">
                            <div className="w-28 h-28 rounded-lg overflow-hidden border">
                                <SecureImage imageId={profile.image} alt={`${profile.username} photo`} />
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h2 className="text-xl font-semibold">{fullName}</h2>
                                {status && (
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[status]}`}>
                                        {status.charAt(0) + status.slice(1).toLowerCase()}
                                    </span>
                                )}
                                {!profile.isActive && (
                                    <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600">
                                        Inactive
                                    </span>
                                )}
                            </div>
                            <p className="text-text-muted text-sm mt-1">{profile.role}</p>
                            {profile.societyName && (
                                <p className="text-text-muted text-sm">{profile.societyName}</p>
                            )}
                        </div>
                    </div>

                    {/* Account section */}
                    <SectionTitle>Account</SectionTitle>
                    <Row label="Username" value={profile.username} />
                    <Row label="Email" value={profile.email} />
                    <Row label="Role" value={profile.role} />
                    <Row label="Member code" value={profile.memberCode} />
                    <Row
                        label="Member since"
                        value={
                            profile.createdAt
                                ? new Date(profile.createdAt).toLocaleDateString("en-IN", {
                                    day: "numeric", month: "long", year: "numeric",
                                })
                                : null
                        }
                    />

                    {/* Personal section */}
                    <SectionTitle>Personal details</SectionTitle>
                    <Row label="Full name" value={fullName} />
                    <Row label="Gender" value={profile.gender} />
                    <Row
                        label="Date of birth"
                        value={
                            profile.dob
                                ? new Date(profile.dob).toLocaleDateString("en-IN", {
                                    day: "numeric", month: "long", year: "numeric",
                                })
                                : null
                        }
                    />
                    <Row label="Contact" value={profile.contactNumber} />
                    <Row label="Education" value={profile.education} />
                    <Row label="Occupation" value={profile.occupation} />

                    {/* Society section — only shown if data exists */}
                    {(profile.societyName || profile.familyCode) && (
                        <>
                            <SectionTitle>Society</SectionTitle>
                            {profile.societyName && (
                                <Row
                                    label="Society"
                                    value={`${profile.societyName}${profile.societyCode ? ` (${profile.societyCode})` : ""}`}
                                />
                            )}
                            {profile.familyCode && (
                                <Row label="Family code" value={profile.familyCode} />
                            )}
                        </>
                    )}

                </div>
            )}

            {/* Change password — always shown once page loads */}
            {!isLoading && (
                <ChangePasswordSection onSuccess={logout} />
            )}

        </div>
    );
}
