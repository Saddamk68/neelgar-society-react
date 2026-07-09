import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getPublicCalendarMonth } from "../services/publicCalendarService";
import { PublicEvent, HijriDay } from "../calendar-types";

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];
const DAYS_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function ymd(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function EventCalendar() {
    const today = new Date();
    const [month, setMonth] = useState(today.getMonth() + 1); // 1-12
    const [year, setYear] = useState(today.getFullYear());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const { data, isLoading, isError } = useQuery({
        queryKey: ["public-calendar", month, year],
        queryFn: () => getPublicCalendarMonth(month, year),
        staleTime: 1000 * 60 * 10,
    });

    const eventsByDate = useMemo(() => {
        const map = new Map<string, PublicEvent[]>();
        (data?.events ?? []).forEach((e) => {
            const key = ymd(new Date(e.startDateTime));
            map.set(key, [...(map.get(key) ?? []), e]);
        });
        return map;
    }, [data]);

    const hijriByDate = useMemo(() => {
        const map = new Map<string, HijriDay>();
        (data?.hijriDays ?? []).forEach((h) => map.set(h.gregorianDate, h));
        return map;
    }, [data]);

    const firstOfMonth = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const startWeekday = firstOfMonth.getDay(); // 0=Sunday

    const cells: (Date | null)[] = [
        ...Array(startWeekday).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month - 1, i + 1)),
    ];

    function prevMonth() {
        setSelectedDate(null);
        if (month === 1) { setMonth(12); setYear(year - 1); } else { setMonth(month - 1); }
    }
    function nextMonth() {
        setSelectedDate(null);
        if (month === 12) { setMonth(1); setYear(year + 1); } else { setMonth(month + 1); }
    }

    const selectedEvents = selectedDate ? eventsByDate.get(selectedDate) ?? [] : [];
    const selectedHijri = selectedDate ? hijriByDate.get(selectedDate) : undefined;

    return (
        <div className="bg-white rounded-xl shadow p-5">
            {/* Header: nav + month/year jump */}
            <div className="flex items-center justify-between mb-4">
                <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-100 transition">
                    <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2">
                    <select
                        value={month}
                        onChange={(e) => { setMonth(Number(e.target.value)); setSelectedDate(null); }}
                        className="text-sm font-semibold border rounded-md px-2 py-1"
                    >
                        {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                    </select>
                    <input
                        type="number"
                        value={year}
                        onChange={(e) => { setYear(Number(e.target.value)); setSelectedDate(null); }}
                        className="text-sm font-semibold border rounded-md px-2 py-1 w-20"
                    />
                </div>

                <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-slate-100 transition">
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            {isLoading && <div className="text-sm text-slate-400 py-6 text-center">Loading calendar…</div>}
            {isError && <div className="text-sm text-red-500 py-6 text-center">Failed to load calendar.</div>}

            {!isLoading && !isError && (
                <>
                    {/* Weekday header */}
                    <div className="grid grid-cols-7 text-xs font-medium text-slate-400 mb-1">
                        {DAYS_SHORT.map((d) => <div key={d} className="text-center py-1">{d}</div>)}
                    </div>

                    {/* Day grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {cells.map((date, i) => {
                            if (!date) return <div key={i} />;
                            const key = ymd(date);
                            const dayEvents = eventsByDate.get(key) ?? [];
                            const hijri = hijriByDate.get(key);
                            const isToday = key === ymd(today);
                            const isSelected = key === selectedDate;

                            return (
                                <button
                                    key={key}
                                    onClick={() => setSelectedDate(isSelected ? null : key)}
                                    className={[
                                        "aspect-square rounded-lg border text-left p-1.5 flex flex-col justify-between transition",
                                        isSelected ? "border-primary ring-2 ring-primary/30" : "border-slate-100 hover:border-slate-300",
                                        isToday ? "bg-primary/5" : "",
                                    ].join(" ")}
                                >
                                    <span className="text-sm font-medium text-slate-800">{date.getDate()}</span>
                                    {hijri && (
                                        <span className="text-[10px] text-slate-400 leading-none">
                                            {hijri.hijriDay} {hijri.hijriMonthName?.slice(0, 3)}
                                        </span>
                                    )}
                                    <div className="flex gap-0.5 flex-wrap">
                                        {dayEvents.slice(0, 3).map((e) => (
                                            <span key={e.id} className="w-1.5 h-1.5 rounded-full bg-primary" title={e.title} />
                                        ))}
                                        {hijri?.holidayName && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title={hijri.holidayName} />
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Selected day detail */}
                    {selectedDate && (
                        <div className="mt-4 pt-4 border-t space-y-2">
                            <p className="text-sm font-semibold text-slate-700">
                                {new Date(selectedDate).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                            </p>
                            {selectedHijri && (
                                <p className="text-xs text-slate-500">
                                    {selectedHijri.hijriDay} {selectedHijri.hijriMonthName} {selectedHijri.hijriYear} AH
                                    {selectedHijri.holidayName && (
                                        <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[11px]">
                                            {selectedHijri.holidayName}
                                        </span>
                                    )}
                                </p>
                            )}
                            {selectedEvents.length === 0 && (
                                <p className="text-sm text-slate-400">No events on this day.</p>
                            )}
                            {selectedEvents.map((e) => (
                                <div key={e.id} className="bg-slate-50 rounded-lg p-3">
                                    <p className="text-sm font-medium text-slate-800">{e.title}</p>
                                    <p className="text-xs text-slate-500">
                                        {new Date(e.startDateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                        {e.venue && ` · ${e.venue}`}
                                    </p>
                                    {e.description && <p className="text-xs text-slate-500 mt-1">{e.description}</p>}
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
