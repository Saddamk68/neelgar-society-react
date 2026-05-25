import { useEffect, useState, useRef } from "react";
import {
    fetchMemberPhotoUrl,
    fetchMemberThumbUrl,
    revokeMemberPhotoUrl,
} from "../features/members/services/photoService";

type Props = {
    memberCode: string;
    firstName: string;
    lastName?: string;
    hasPhoto: boolean;
    size?: "thumb" | "sm" | "md" | "lg";
    className?: string;
};

const SIZE_MAP = {
    thumb: { container: "w-8 h-8", text: "text-xs" },
    sm: { container: "w-10 h-10", text: "text-sm" },
    md: { container: "w-20 h-20", text: "text-2xl" },
    lg: { container: "w-32 h-32", text: "text-4xl" },
};

const COLORS = [
    "bg-blue-500", "bg-indigo-500", "bg-violet-500",
    "bg-pink-500", "bg-rose-500", "bg-orange-500",
    "bg-amber-500", "bg-teal-500", "bg-cyan-500",
    "bg-green-500",
];

function colorFor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return COLORS[Math.abs(hash) % COLORS.length];
}

export default function MemberAvatar({
    memberCode,
    firstName,
    lastName,
    hasPhoto,
    size = "md",
    className = "",
}: Props) {
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const [imgError, setImgError] = useState(false);
    const [visible, setVisible] = useState(false);
    const objectUrlRef = useRef<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // ── IntersectionObserver — only fetch when the avatar scrolls into view ──
    useEffect(() => {
        if (!hasPhoto) return;

        const el = containerRef.current;
        if (!el) return;

        // If IntersectionObserver not available (very old browsers) — load immediately
        if (!("IntersectionObserver" in window)) {
            setVisible(true);
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setVisible(true);
                    observer.disconnect();
                }
            },
            { rootMargin: "100px" } // start loading 100px before it enters the viewport
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [hasPhoto]);

    // ── Fetch photo once visible ─────────────────────────────────────────────
    useEffect(() => {
        if (!hasPhoto || !visible) return;

        let cancelled = false;

        // Use thumb endpoint for small sizes, full for larger
        const fetcher = (size === "thumb" || size === "sm")
            ? fetchMemberThumbUrl
            : fetchMemberPhotoUrl;

        fetcher(memberCode)
            .then((url) => {
                if (cancelled) { revokeMemberPhotoUrl(url); return; }
                objectUrlRef.current = url;
                setPhotoUrl(url);
                setImgError(false);
            })
            .catch(() => setImgError(true));

        return () => {
            cancelled = true;
            if (objectUrlRef.current) {
                revokeMemberPhotoUrl(objectUrlRef.current);
                objectUrlRef.current = null;
            }
        };
    }, [memberCode, hasPhoto, visible, size]);

    const { container, text } = SIZE_MAP[size];
    const initials = `${firstName.charAt(0)}${lastName?.charAt(0) ?? ""}`.toUpperCase();
    const bgColor = colorFor(firstName + (lastName ?? ""));

    if (hasPhoto && photoUrl && !imgError) {
        return (
            <div
                ref={containerRef}
                className={`${container} rounded-full overflow-hidden shrink-0 ring-1 ring-slate-200 ${className}`}
            >
                <img
                    src={photoUrl}
                    alt={`${firstName} ${lastName ?? ""}`}
                    className="w-full h-full object-cover"
                    style={{ imageRendering: "auto" }}
                    onError={() => setImgError(true)}
                />
            </div>
        );
    }

    // Initials fallback — also acts as placeholder while photo loads
    return (
        <div
            ref={containerRef}
            className={`${container} rounded-full flex items-center justify-center shrink-0 ring-1 ring-slate-200 ${bgColor} ${className}`}
        >
            <span className={`${text} font-semibold text-white select-none`}>
                {initials}
            </span>
        </div>
    );
}
