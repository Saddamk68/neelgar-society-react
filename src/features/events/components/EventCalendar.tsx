import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, CalendarCheck, ChevronDown } from "lucide-react";
import { getPublicCalendarMonth } from "../services/publicCalendarService";
import { PublicEvent, HijriDay } from "../calendar-types";
import Select from "@/components/form/Select";
import { findAkhriJummaDate, isMajorHoliday, majorHolidayLabel } from "../major-holidays";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAYS_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const MONTH_OPTIONS = MONTHS.map((m, i) => ({ value: i + 1, label: m }));

function yearOptions(current: number) {
  const options = [];
  for (let y = current - 20; y <= current + 20; y++) {
    options.push({ value: y, label: String(y) });
  }
  return options;
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function EventCalendar() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1); // 1-12
  const [year, setYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showMinorHolidays, setShowMinorHolidays] = useState(false);

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

  const akhriJummaDate = useMemo(() => findAkhriJummaDate(data?.hijriDays ?? []), [data]);

  // Holidays for the visible month, sorted by date
  const monthHolidays = useMemo(() => {
    return (data?.hijriDays ?? [])
      .filter((h) => isMajorHoliday(h.hijriMonth, h.hijriDay) || h.gregorianDate === akhriJummaDate)
      .sort((a, b) => a.gregorianDate.localeCompare(b.gregorianDate));
  }, [data, akhriJummaDate]);

  // Minor holidays for the visible month, sorted by date
  const monthMinorHolidays = useMemo(() => {
    return (data?.hijriDays ?? [])
      .filter((h) => !!h.holidayName && !isMajorHoliday(h.hijriMonth, h.hijriDay))
      .sort((a, b) => a.gregorianDate.localeCompare(b.gregorianDate));
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
  function goToday() {
    setSelectedDate(null);
    setMonth(today.getMonth() + 1);
    setYear(today.getFullYear());
  }

  const selectedEvents = selectedDate ? eventsByDate.get(selectedDate) ?? [] : [];
  const selectedHijri = selectedDate ? hijriByDate.get(selectedDate) : undefined;

  return (
    <div className="bg-white rounded-xl shadow p-5">
      {/* Header: nav + custom month/year picker + today */}
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-100 transition shrink-0">
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 flex-1 min-w-0 justify-center">
          <div className="w-36">
            <Select
              value={month}
              onChange={(v) => { setMonth(Number(v)); setSelectedDate(null); }}
              options={MONTH_OPTIONS}
            />
          </div>
          <div className="w-24">
            <Select
              value={year}
              onChange={(v) => { setYear(Number(v)); setSelectedDate(null); }}
              options={yearOptions(today.getFullYear())}
            />
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={goToday}
            className="px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition text-xs font-medium text-slate-500"
          >
            Today
          </button>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-slate-100 transition">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
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
              const isAkhriJumma = key === akhriJummaDate;
              const isMajor = isMajorHoliday(hijri?.hijriMonth, hijri?.hijriDay) || isAkhriJumma;
              const isMinorHoliday = !!hijri?.holidayName && !isMajor;
              const isFriday = date.getDay() === 5;
              const isGreenDay = isMajor || isFriday;
              const isToday = key === ymd(today);
              const isSelected = key === selectedDate;
              const hasUrgent = dayEvents.some((e) => e.urgent);

              return (
                <button
                  key={key}
                  onClick={() => setSelectedDate(isSelected ? null : key)}
                  className={[
                    "relative aspect-square rounded-lg border text-left p-1.5 flex flex-col justify-between transition",
                    isSelected ? "border-primary ring-2 ring-primary/30" : "border-slate-100 hover:border-slate-300",
                    isToday ? "ring-2 ring-primary bg-primary/5" : "",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary",
                    isGreenDay ? "bg-green-100" : "",
                  ].join(" ")}
                >
                  {isMajor && (
                    <span
                      className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-green-600"
                      title={isAkhriJumma ? "Akhri Jumma" : majorHolidayLabel(hijri?.hijriMonth, hijri?.hijriDay, hijri?.holidayName)}
                    />
                  )}
                  {isMinorHoliday && (
                    <span
                      className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400"
                      title={hijri?.holidayName ?? undefined}
                    />
                  )}
                  <span className="text-sm font-medium text-slate-800">{date.getDate()}</span>
                  {hijri && (
                    <span className="text-[10px] text-slate-400 leading-none">
                      {hijri.hijriDay} {hijri.hijriMonthName?.slice(0, 3)}
                    </span>
                  )}
                  <div className="flex gap-0.5 flex-wrap items-center">
                    {dayEvents.slice(0, 3).map((e) => (
                      <span
                        key={e.id}
                        className={`w-1.5 h-1.5 rounded-full ${e.urgent ? "bg-red-500" : "bg-primary"}`}
                        title={e.title}
                      />
                    ))}
                    {hasUrgent && <CalendarCheck className="w-2.5 h-2.5 text-red-500" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t text-[11px] text-slate-400 flex-wrap">
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" /> Event</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" /> Urgent</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-600 inline-block" /> Holiday</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" /> Other Observance</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full ring-2 ring-primary inline-block" /> Today</span>
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
                  {isMajorHoliday(selectedHijri.hijriMonth, selectedHijri.hijriDay) && (
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-[11px]">
                      {majorHolidayLabel(selectedHijri.hijriMonth, selectedHijri.hijriDay, selectedHijri.holidayName)}
                    </span>
                  )}
                </p>
              )}
              {selectedEvents.length === 0 && (
                <p className="text-sm text-slate-400">No events on this day.</p>
              )}
              {selectedEvents.map((e) => (
                <div key={e.id} className={`rounded-lg p-3 ${e.urgent ? "bg-red-50 border border-red-100" : "bg-slate-50"}`}>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-800">{e.title}</p>
                    {e.urgent && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                        URGENT
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {new Date(e.startDateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {e.venue && ` · ${e.venue}`}
                  </p>
                  {e.description && <p className="text-xs text-slate-500 mt-1">{e.description}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Holidays this month — pale green strip */}
          {monthHolidays.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Holidays this month
              </h3>
              <div className="space-y-1.5">
                {monthHolidays.slice(0, 4).map((h) => (
                  <div key={h.gregorianDate} className="flex items-center justify-between px-3 py-2 rounded-lg bg-green-100 border border-green-200">
                    <span className="text-sm font-medium text-green-900">
                      {h.gregorianDate === akhriJummaDate ? "Akhri Jumma" : majorHolidayLabel(h.hijriMonth, h.hijriDay, h.holidayName)}
                    </span>
                    <span className="text-xs text-green-700">{formatFullDate(h.gregorianDate)}</span>
                  </div>
                ))}
                {monthHolidays.length > 4 && (
                  <p className="text-xs text-slate-400 px-1">+{monthHolidays.length - 4} more this month</p>
                )}
              </div>
            </div>
          )}

          {/* Other observances — collapsed by default, minor holidays */}
          {monthMinorHolidays.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <button
                onClick={() => setShowMinorHolidays((v) => !v)}
                className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 uppercase tracking-wide hover:text-amber-800 transition"
              >
                Other observances this month ({monthMinorHolidays.length})
                <ChevronDown className={`w-3 h-3 transition-transform ${showMinorHolidays ? "rotate-180" : ""}`} />
              </button>

              {showMinorHolidays && (
                <div className="mt-2 space-y-1.5">
                  {monthMinorHolidays.map((h) => (
                    <div
                      key={h.gregorianDate}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-amber-50 border border-amber-100"
                    >
                      <span className="text-sm text-amber-800">{h.holidayName}</span>
                      <span className="text-xs text-amber-600">{formatFullDate(h.gregorianDate)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </>
      )}
    </div>
  );
}
