import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Megaphone, CalendarClock, ChevronDown } from "lucide-react";
import { getActiveNotices } from "../services/publicNoticeService";

export default function NoticesBanner() {
    const [expanded, setExpanded] = useState(false);
    const { data: notices = [], isLoading } = useQuery({
        queryKey: ["active-notices"],
        queryFn: getActiveNotices,
        staleTime: 1000 * 60 * 5,
    });

    if (isLoading || notices.length === 0) return null;

    const [primary, ...rest] = notices;

    return (
        <div className="rounded-xl border-l-4 border-amber-400 bg-amber-50/60 p-4">
            <NoticeRow notice={primary} />

            {rest.length > 0 && (
                <>
                    {expanded && (
                        <div className="mt-2 pt-2 border-t border-amber-200 space-y-2">
                            {rest.map((n, i) => <NoticeRow key={i} notice={n} />)}
                        </div>
                    )}
                    <button
                        onClick={() => setExpanded((v) => !v)}
                        className="mt-2 flex items-center gap-1 text-xs font-medium text-amber-700 hover:underline"
                    >
                        {expanded ? "Show less" : `${rest.length} more notice${rest.length > 1 ? "s" : ""}`}
                        <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
                    </button>
                </>
            )}
        </div>
    );
}

function NoticeRow({ notice }: { notice: { type: string; title: string; message?: string; date: string } }) {
    const Icon = notice.type === "EVENT" ? CalendarClock : Megaphone;
    return (
        <div className="flex items-start gap-3">
            <Icon className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800">{notice.title}</p>
                {notice.message && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notice.message}</p>}
            </div>
        </div>
    );
}
