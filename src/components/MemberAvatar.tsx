import { useEffect, useState, useRef } from "react";
import { fetchMemberPhotoUrl, revokeMemberPhotoUrl } from "../features/members/services/photoService";

type Props = {
    memberCode: string;
    firstName: string;
    lastName?: string;
    hasPhoto: boolean;
    size?: "sm" | "md" | "lg";
    className?: string;
};

const SIZE_MAP = {
    sm: { container: "w-10 h-10", text: "text-sm" },
    md: { container: "w-20 h-20", text: "text-2xl" },
    lg: { container: "w-32 h-32", text: "text-4xl" },
};

// Deterministic color from name — same name always gets same color
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
    const objectUrlRef = useRef<string | null>(null);

    useEffect(() => {
        if (!hasPhoto) return;

        let cancelled = false;

        fetchMemberPhotoUrl(memberCode)
            .then((url) => {
                if (cancelled) {
                    revokeMemberPhotoUrl(url);
                    return;
                }
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
    }, [memberCode, hasPhoto]);

    const { container, text } = SIZE_MAP[size];
    const initials = `${firstName.charAt(0)}${lastName?.charAt(0) ?? ""}`.toUpperCase();
    const bgColor = colorFor(firstName + (lastName ?? ""));

    // Show photo if available and no load error
    if (hasPhoto && photoUrl && !imgError) {
        return (
            <div className={`${container} rounded-full overflow-hidden shrink-0 ${className}`}>
                <img
                    src={photoUrl}
                    alt={`${firstName} ${lastName ?? ""}`}
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                />
            </div>
        );
    }

    // Initials fallback
    return (
        <div
            className={`${container} rounded-full flex items-center justify-center shrink-0 ${bgColor} ${className}`}
        >
            <span className={`${text} font-semibold text-white select-none`}>
                {initials}
            </span>
        </div>
    );
}
