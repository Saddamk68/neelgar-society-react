import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listEvents } from "@/features/events/services/eventService";
import { useAuth } from "@/context/AuthContext";
import EventForm from "./EventForm";

export default function EditEvent() {
    const { id } = useParams();
    const { user } = useAuth();
    const societyId = user?.societyId ?? 0;

    // No single-event GET endpoint yet — reuse the list and find by id client-side.
    const { data: events = [], isLoading } = useQuery({
        queryKey: ["events", societyId],
        queryFn: () => listEvents(societyId),
        enabled: societyId > 0,
    });

    if (isLoading) return <div className="p-6 text-sm text-slate-400">Loading…</div>;

    const existing = events.find((e) => e.id === Number(id));
    if (!existing) return <div className="p-6 text-sm text-red-500">Event not found.</div>;

    return <EventForm existing={existing} />;
}
