import { SOCIETY } from "../../constants/society";
import EventCalendar from "@/features/events/components/EventCalendar";

export default function EventsCalendar() {
    return (
        <div className="bg-background text-text-primary">
            {/* Hero */}
            <section className="bg-surface border-b">
                <div className="max-w-5xl mx-auto px-6 py-16">
                    <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-widest uppercase mb-5">
                        {SOCIETY.name}
                    </span>
                    <h1 className="text-4xl font-extrabold tracking-tight">Events Calendar</h1>
                    <p className="mt-3 text-text-muted max-w-xl">
                        Samuhik Vivah Samelan, meetings and other {SOCIETY.name} events, alongside the Hijri/Islamic calendar.
                    </p>
                </div>
            </section>

            {/* Calendar */}
            <section className="py-16">
                <div className="max-w-3xl mx-auto px-6">
                    <EventCalendar />
                </div>
            </section>
        </div>
    );
}
