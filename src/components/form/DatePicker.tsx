/**
 * DatePicker.tsx — Modern enterprise date picker
 *
 * Design: Two-panel layout — year/month selector on left, calendar grid on right.
 * Blue primary header showing selected date. Consistent with app theme.
 *
 * Usage:
 *   import DatePicker from "@/components/form/DatePicker";
 *
 *   <DatePicker
 *     value="2024-07-19"
 *     onChange={(val) => ...}
 *     hasError={!!errors.dob}
 *     maxDate={new Date()}
 *   />
 */

import { useEffect, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 1900;

function parseDate(value: string): Date | null {
    if (!value) return null;
    const d = new Date(value + "T00:00:00");
    return isNaN(d.getTime()) ? null : d;
}

function daysInMonth(y: number, m: number) {
    return new Date(y, m + 1, 0).getDate();
}

function firstDayOfMonth(y: number, m: number) {
    return new Date(y, m, 1).getDay();
}

function toYMD(y: number, m: number, d: number) {
    return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export default function DatePicker({
    value,
    onChange,
    hasError,
    maxDate,
    minDate,
    placeholder = "Select date",
}: {
    value: string;
    onChange: (val: string) => void;
    hasError?: boolean;
    maxDate?: Date;
    minDate?: Date;
    placeholder?: string;
}) {
    const selected = parseDate(value);
    const maxY = maxDate ? maxDate.getFullYear() : CURRENT_YEAR;
    const minY = minDate ? minDate.getFullYear() : MIN_YEAR;

    const [open, setOpen] = useState(false);
    const [viewYear, setViewYear] = useState(() => selected?.getFullYear() ?? CURRENT_YEAR);
    const [viewMonth, setViewMonth] = useState(() => selected?.getMonth() ?? new Date().getMonth());

    useEffect(() => {
        if (selected) {
            setViewYear(selected.getFullYear());
            setViewMonth(selected.getMonth());
        }
    }, [value]);

    const containerRef = useRef<HTMLDivElement>(null);
    const yearScrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function onMouseDown(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        if (open) document.addEventListener("mousedown", onMouseDown);
        return () => document.removeEventListener("mousedown", onMouseDown);
    }, [open]);

    useEffect(() => {
        if (!open || !yearScrollRef.current) return;
        const el = yearScrollRef.current.querySelector<HTMLElement>("[data-selected='true']");
        if (el) el.scrollIntoView({ block: "center", behavior: "instant" });
    }, [open]);

    function prevMonth() {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => Math.max(minY, y - 1)); }
        else setViewMonth(m => m - 1);
    }

    function nextMonth() {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => Math.min(maxY, y + 1)); }
        else setViewMonth(m => m + 1);
    }

    function isDisabled(day: number) {
        const d = new Date(viewYear, viewMonth, day);
        if (maxDate) { const max = new Date(maxDate); max.setHours(23, 59, 59, 999); if (d > max) return true; }
        if (minDate) { const min = new Date(minDate); min.setHours(0, 0, 0, 0); if (d < min) return true; }
        return false;
    }

    function isSelected(day: number) {
        return !!(selected &&
            selected.getFullYear() === viewYear &&
            selected.getMonth() === viewMonth &&
            selected.getDate() === day);
    }

    function isToday(day: number) {
        const t = new Date();
        return t.getFullYear() === viewYear && t.getMonth() === viewMonth && t.getDate() === day;
    }

    function selectDay(day: number) {
        if (isDisabled(day)) return;
        onChange(toYMD(viewYear, viewMonth, day));
        setOpen(false);
    }

    const totalDays = daysInMonth(viewYear, viewMonth);
    const startDay = firstDayOfMonth(viewYear, viewMonth);
    const cells: (number | null)[] = [
        ...Array(startDay).fill(null),
        ...Array.from({ length: totalDays }, (_, i) => i + 1),
    ];

    const years = Array.from({ length: maxY - minY + 1 }, (_, i) => maxY - i);

    const display = selected
        ? selected.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
        : "";

    return (
        <div className="relative" ref={containerRef}>

            {/* Trigger */}
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className={[
                    "w-full flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm bg-white transition-all duration-150 focus:outline-none",
                    hasError
                        ? "border-red-400 ring-2 ring-red-100"
                        : open
                            ? "border-primary ring-2 ring-blue-100"
                            : "border-slate-300 hover:border-slate-400",
                ].join(" ")}
            >
                <div className="flex items-center gap-2 min-w-0">
                    <Calendar className={`w-4 h-4 shrink-0 ${display ? "text-primary" : "text-slate-400"}`} />
                    <span className={display ? "text-slate-800 font-medium" : "text-slate-400"}>
                        {display || placeholder}
                    </span>
                </div>
                {display && (
                    <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => { e.stopPropagation(); onChange(""); }}
                        onKeyDown={(e) => e.key === "Enter" && (e.stopPropagation(), onChange(""))}
                        className="text-slate-300 hover:text-slate-500 transition shrink-0 cursor-pointer"
                    >
                        <X className="w-3.5 h-3.5" />
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute z-50 mt-1.5 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden" style={{ minWidth: "22rem" }}>

                    {/* Header bar */}
                    <div className="bg-primary px-4 py-3">
                        <p className="text-blue-100 text-xs font-semibold uppercase tracking-widest mb-0.5">
                            Selected Date
                        </p>
                        <p className="text-white text-base font-semibold leading-tight">
                            {selected
                                ? selected.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long", year: "numeric" })
                                : <span className="text-blue-200 font-normal italic text-sm">No date selected</span>}
                        </p>
                    </div>

                    {/* Two panels */}
                    <div className="flex">

                        {/* Left — Year + Month */}
                        <div className="w-[6.5rem] border-r border-slate-100 bg-slate-50/60 flex flex-col py-2 gap-2">

                            {/* Year scroll */}
                            <div className="px-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 mb-1">Year</p>
                                <div
                                    ref={yearScrollRef}
                                    className="h-32 overflow-y-auto app-scroll rounded-lg"
                                >
                                    {years.map(y => (
                                        <button
                                            key={y}
                                            type="button"
                                            data-selected={y === viewYear ? "true" : "false"}
                                            onClick={() => setViewYear(y)}
                                            className={[
                                                "w-full text-left px-2 py-[3px] rounded-md text-xs transition-all font-medium",
                                                y === viewYear
                                                    ? "bg-primary text-white"
                                                    : "text-slate-600 hover:bg-white hover:shadow-sm",
                                                y > maxY || y < minY ? "opacity-30 pointer-events-none" : "",
                                            ].join(" ")}
                                        >
                                            {y}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Month grid */}
                            <div className="px-2 border-t border-slate-200 pt-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 mb-1">Month</p>
                                <div className="grid grid-cols-3 gap-0.5">
                                    {MONTHS_SHORT.map((m, i) => (
                                        <button
                                            key={m}
                                            type="button"
                                            onClick={() => setViewMonth(i)}
                                            className={[
                                                "py-1 rounded-md text-[11px] font-medium transition-all",
                                                i === viewMonth
                                                    ? "bg-primary text-white shadow-sm"
                                                    : "text-slate-500 hover:bg-white hover:text-slate-700 hover:shadow-sm",
                                            ].join(" ")}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right — Calendar */}
                        <div className="flex-1 p-3">

                            {/* Month/year nav */}
                            <div className="flex items-center justify-between mb-2">
                                <button
                                    type="button"
                                    onClick={prevMonth}
                                    className="p-1 rounded-lg hover:bg-slate-100 transition text-slate-500 hover:text-slate-700"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-sm font-semibold text-slate-700 tabular-nums">
                                    {MONTHS_FULL[viewMonth]} {viewYear}
                                </span>
                                <button
                                    type="button"
                                    onClick={nextMonth}
                                    className="p-1 rounded-lg hover:bg-slate-100 transition text-slate-500 hover:text-slate-700"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Day headers */}
                            <div className="grid grid-cols-7 mb-1">
                                {DAYS_SHORT.map(d => (
                                    <div key={d} className="text-center text-[11px] font-semibold text-slate-400 py-0.5">
                                        {d}
                                    </div>
                                ))}
                            </div>

                            {/* Day cells */}
                            <div className="grid grid-cols-7 gap-y-0.5">
                                {cells.map((day, i) =>
                                    day === null ? (
                                        <div key={`e-${i}`} />
                                    ) : (
                                        <button
                                            key={day}
                                            type="button"
                                            disabled={isDisabled(day)}
                                            onClick={() => selectDay(day)}
                                            className={[
                                                "w-8 h-8 mx-auto flex items-center justify-center text-xs rounded-full transition-all duration-100 font-medium",
                                                isSelected(day)
                                                    ? "bg-primary text-white shadow shadow-blue-200 scale-110"
                                                    : isToday(day)
                                                        ? "text-primary ring-2 ring-primary/30 bg-blue-50"
                                                        : isDisabled(day)
                                                            ? "text-slate-300 cursor-not-allowed"
                                                            : "text-slate-700 hover:bg-blue-50 hover:text-primary cursor-pointer",
                                            ].join(" ")}
                                        >
                                            {day}
                                        </button>
                                    )
                                )}
                            </div>

                            {/* Footer */}
                            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const today = new Date();
                                        setViewYear(today.getFullYear());
                                        setViewMonth(today.getMonth());
                                        if (!isDisabled(today.getDate())) {
                                            onChange(toYMD(today.getFullYear(), today.getMonth(), today.getDate()));
                                            setOpen(false);
                                        }
                                    }}
                                    className="text-xs text-primary font-semibold hover:underline transition"
                                >
                                    Today
                                </button>
                                {selected && (
                                    <button
                                        type="button"
                                        onClick={() => { onChange(""); setOpen(false); }}
                                        className="text-xs text-slate-400 hover:text-red-500 transition font-medium"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
