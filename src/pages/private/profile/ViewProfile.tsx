import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/features/users/services/userService";
import { useNotify } from "@/services/notifications";
import { useEffect, useState } from "react";
import { getAuthToken } from "@/services/apiClient";
import { ENV } from "@/config/env";

/* ===========================================================
   Reusable Row
   =========================================================== */
function Row({ label, value }: { label: string; value?: string | number | null }) {
    return (
        <div className="flex flex-col sm:flex-row sm:gap-2 text-sm">
            <div className="w-40 text-text-muted">{label}</div>
            <div className="font-medium break-all">{value ?? "-"}</div>
        </div>
    );
}

/* ===========================================================
   Secure Authenticated Image
   =========================================================== */
function SecureImage({ photoId, alt }: { photoId?: string | null; alt: string }) {
    const [src, setSrc] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const token = getAuthToken();
    const baseUrl = ENV.API_BASE_URL;

    useEffect(() => {
        if (!photoId) return;
        const controller = new AbortController();

        async function fetchImage() {
            setLoading(true);
            try {
                const res = await fetch(`${baseUrl}/files/${photoId}/view`, {
                    headers: { Authorization: token ? `Bearer ${token}` : "" },
                    signal: controller.signal,
                });
                if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
                const blob = await res.blob();
                setSrc(URL.createObjectURL(blob));
            } catch (err) {
                console.error("SecureImage error:", err);
                setSrc(null);
            } finally {
                setLoading(false);
            }
        }

        fetchImage();
        return () => controller.abort();
    }, [photoId, token, baseUrl]);

    if (loading) return <div className="text-gray-400 text-sm">Loading…</div>;
    if (!photoId || !src) return <div className="text-gray-400 text-sm">No photo</div>;
    return <img src={src} alt={alt} className="w-full h-full object-cover rounded-md" />;
}

/* ===========================================================
   View Profile Page
   =========================================================== */
export default function ViewProfile() {
    const notify = useNotify();

    const {
        data: user,
        isLoading,
        isError,
        refetch,
    } = useQuery({
        queryKey: ["currentUser"],
        queryFn: getCurrentUser,
        staleTime: 1000 * 60 * 5,
    });

    useEffect(() => {
        if (isError) notify.error("Failed to load profile data.");
    }, [isError, notify]);

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-semibold">View Profile</h1>
                <p className="text-text-muted">Your personal account details</p>
            </div>

            {/* Loading / Error */}
            {isLoading && (
                <div className="bg-white rounded-xl shadow p-4 text-text-muted text-sm">
                    Loading profile…
                </div>
            )}
            {isError && (
                <div className="bg-white rounded-xl shadow p-4 text-danger text-sm">
                    Failed to load profile.{" "}
                    <button onClick={() => refetch()} className="underline">
                        Retry
                    </button>
                </div>
            )}

            {/* Details */}
            {!isLoading && !isError && user && (
                <div className="bg-white rounded-xl shadow p-6 flex flex-col md:flex-row gap-6">
                    {/* Left: Avatar */}
                    <div className="flex-shrink-0 self-center md:self-start">
                        <div className="w-36 h-36 bg-gray-100 border rounded-md overflow-hidden flex items-center justify-center">
                            <SecureImage photoId={user.userImage} alt={`${user.username} profile`} />
                        </div>
                    </div>

                    {/* Right: Info */}
                    <div className="flex-1 space-y-3">
                        <Row label="Username" value={user.username} />
                        <Row label="Email" value={user.email} />
                        <Row label="Role" value={user.role} />
                        <Row label="Status" value={user.active ? "Active" : "Inactive"} />
                        <Row
                            label="Created At"
                            value={user.createdAt ? new Date(user.createdAt).toLocaleString() : "-"}
                        />
                        <Row
                            label="Updated At"
                            value={user.updatedAt ? new Date(user.updatedAt).toLocaleString() : "-"}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
