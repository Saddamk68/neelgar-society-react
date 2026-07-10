import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { MapPin, ArrowRight } from "lucide-react";
import { getUpcomingEvents } from "../services/publicCalendarService";

const EVENT_TYPE_LABELS: Record<string, string> = {
    SAMUHIK_VIVAH: "Samuhik Vivah",
    GENERAL_MEETING: "Meeting",
    MEDICAL_CAMP: "Medical Camp",
    SOCIAL: "Social",
    RELIGIOUS: "Religious",
    OTHER: "Event",
};

export default function UpcomingEventsWidget({
    limit = 5,
    calendarRoute,
}: {
    limit?: number;
    calendarRoute: string;
}) {
    const { data: events = [], isLoading, isError } = useQuery({
        queryKey: ["upcoming-events", limit],
        queryFn: () => getUpcomingEvents(limit),
        staleTime: 1000 * 60 * 5,
    });

    return (
        <div className="bg-white rounded-xl shadow p-5">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                    Upcoming Events
                </h2>
                <Link
                    to={calendarRoute}
                    className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                >
                    View calendar <ArrowRight className="w-3 h-3" />
                </Link>
            </div>

            {isLoading && <p className="text-sm text-slate-400">Loading…</p>}
            {isError && <p className="text-sm text-red-500">Could not load events.</p>}
            {!isLoading && !isError && events.length === 0 && (
                <p className="text-sm text-slate-400">No upcoming events scheduled.</p>
            )}

            {!isLoading && !isError && events.length > 0 && (
                <ul className="space-y-3">
                    {events.map((e) => {
                        const start = new Date(e.startDateTime);
                        return (
                            <li key={e.id} className="flex items-start gap-3">
                                <div className="flex flex-col items-center justify-center w-11 h-11 rounded-lg bg-primary/10 text-primary shrink-0">
                                    <span className="text-[10px] font-medium leading-none">
                                        {start.toLocaleDateString(undefined, { month: "short" }).toUpperCase()}
                                    </span>
                                    <span className="text-sm font-bold leading-none mt-0.5">{start.getDate()}</span>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-slate-800 truncate">{e.title}</p>
                                    <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                                        <span>{EVENT_TYPE_LABELS[e.eventType] ?? e.eventType}</span>
                                        {e.venue && (
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-3 h-3" /> {e.venue}
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
