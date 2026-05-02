/**
 * DatePicker.tsx — Drill-down date picker
 *
 * 3-step flow: Year → Month → Day
 * Clicking the header breadcrumb navigates back up.
 *
 * Usage:
 *   import DatePicker from "@/components/form/DatePicker";
 *
 *   <DatePicker
 *     value="2024-07-19"
 *     onChange={(val) => ...}   // "YYYY-MM-DD" or ""
 *     hasError={!!errors.dob}
 *     maxDate={new Date()}
 *     minDate={new Date("1900-01-01")}
 *   />
 */

import { useEffect, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────────────────

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 1900;
const YEARS_PER_PAGE = 16; // 4×4 grid

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseDate(v: string): Date | null {
    if (!v) return null;
    const d = new Date(v + "T00:00:00");
    return isNaN(d.getTime()) ? null : d;
}

function toYMD(y: number, m: number, d: number) {
    return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function daysInMonth(y: number, m: number) {
    return new Date(y, m + 1, 0).getDate();
}

function firstDayOfMonth(y: number, m: number) {
    return new Date(y, m, 1).getDay();
}

type Step = "year" | "month" | "day";

// ── Component ─────────────────────────────────────────────────────────────────

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
    const [step, setStep] = useState<Step>("year");
    const [pickYear, setPickYear] = useState<number>(selected?.getFullYear() ?? CURRENT_YEAR);
    const [pickMonth, setPickMonth] = useState<number>(selected?.getMonth() ?? 0);

    // Which page of years we're on (each page = YEARS_PER_PAGE years)
    // Page 0 = most recent years, page 1 = older, etc.
    const [yearPage, setYearPage] = useState<number>(() => {
        const startYear = selected?.getFullYear() ?? CURRENT_YEAR;
        return Math.floor((maxY - startYear) / YEARS_PER_PAGE);
    });

    const containerRef = useRef<HTMLDivElement>(null);

    // Reset step to year when opening
    function handleOpen() {
        if (selected) {
            setPickYear(selected.getFullYear());
            setPickMonth(selected.getMonth());
            // Open at month step if date already selected — feels more natural for edits
            setStep("month");
            setYearPage(Math.floor((maxY - selected.getFullYear()) / YEARS_PER_PAGE));
        } else {
            setStep("year");
            setYearPage(0);
        }
        setOpen(true);
    }

    // Close on outside click
    useEffect(() => {
        function handler(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        if (open) document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    // ── Year page helpers ───────────────────────────────────────────────────────

    // Years for the current page — descending (newest first)
    const totalPages = Math.ceil((maxY - minY + 1) / YEARS_PER_PAGE);

    function yearsOnPage(page: number): number[] {
        // page 0 = maxY down to maxY - YEARS_PER_PAGE + 1
        const start = maxY - page * YEARS_PER_PAGE;
        const end = Math.max(minY, start - YEARS_PER_PAGE + 1);
        const result: number[] = [];
        for (let y = start; y >= end; y--) result.push(y);
        return result;
    }

    const pageYears = yearsOnPage(yearPage);
    const pageStart = pageYears[pageYears.length - 1];
    const pageEnd = pageYears[0];

    // ── Day helpers ─────────────────────────────────────────────────────────────

    function isDayDisabled(day: number) {
        const d = new Date(pickYear, pickMonth, day);
        if (maxDate) { const m = new Date(maxDate); m.setHours(23, 59, 59, 999); if (d > m) return true; }
        if (minDate) { const m = new Date(minDate); m.setHours(0, 0, 0, 0); if (d < m) return true; }
        return false;
    }

    function isYearDisabled(y: number) {
        if (maxDate && y > maxDate.getFullYear()) return true;
        if (minDate && y < minDate.getFullYear()) return true;
        return false;
    }

    function isMonthDisabled(m: number) {
        if (maxDate && pickYear === maxDate.getFullYear() && m > maxDate.getMonth()) return true;
        if (minDate && pickYear === minDate.getFullYear() && m < minDate.getMonth()) return true;
        return false;
    }

    const totalDays = daysInMonth(pickYear, pickMonth);
    const startDay = firstDayOfMonth(pickYear, pickMonth);
    const cells: (number | null)[] = [
        ...Array(startDay).fill(null),
        ...Array.from({ length: totalDays }, (_, i) => i + 1),
    ];

    // ── Display ─────────────────────────────────────────────────────────────────

    const display = selected
        ? selected.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
        : "";

    // ── Header breadcrumb text ──────────────────────────────────────────────────
    // Shows where the user is and what they can click to go back

    function headerContent() {
        if (step === "year") {
            return (
                <div className="flex items-center justify-between w-full">
                    <button
                        type="button"
                        onClick={() => yearPage < totalPages - 1 && setYearPage(p => p + 1)}
                        disabled={yearPage >= totalPages - 1}
                        className="p-1.5 rounded-lg hover:bg-white/20 disabled:opacity-30 transition"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-semibold">
                        {pageStart} – {pageEnd}
                    </span>
                    <button
                        type="button"
                        onClick={() => yearPage > 0 && setYearPage(p => p - 1)}
                        disabled={yearPage === 0}
                        className="p-1.5 rounded-lg hover:bg-white/20 disabled:opacity-30 transition"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            );
        }

        if (step === "month") {
            return (
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setStep("year")}
                        className="flex items-center gap-1 font-bold hover:underline text-sm transition"
                    >
                        {pickYear}
                    </button>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                    <span className="text-sm opacity-90">Select month</span>
                </div>
            );
        }

        // day step
        return (
            <div className="flex items-center gap-2 text-sm">
                <button
                    type="button"
                    onClick={() => setStep("year")}
                    className="font-bold hover:underline transition"
                >
                    {pickYear}
                </button>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                <button
                    type="button"
                    onClick={() => setStep("month")}
                    className="font-bold hover:underline transition"
                >
                    {MONTHS_SHORT[pickMonth]}
                </button>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                <span className="opacity-90">Select day</span>
            </div>
        );
    }

    // ── Render ──────────────────────────────────────────────────────────────────

    return (
        <div className="relative" ref={containerRef}>

            {/* ── Trigger ── */}
            <button
                type="button"
                onClick={() => open ? setOpen(false) : handleOpen()}
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

            {/* ── Dropdown ── */}
            {open && (
                <div className="absolute z-50 mt-1.5 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden w-72">

                    {/* Header */}
                    <div className="bg-primary text-white px-4 py-3 flex items-center justify-between min-h-[3.25rem]">
                        {headerContent()}
                    </div>

                    {/* ── Step 1: Year grid ── */}
                    {step === "year" && (
                        <div className="p-3">
                            <div className="grid grid-cols-4 gap-1.5">
                                {pageYears.map(y => (
                                    <button
                                        key={y}
                                        type="button"
                                        disabled={isYearDisabled(y)}
                                        onClick={() => {
                                            if (isYearDisabled(y)) return;
                                            setPickYear(y);
                                            setStep("month");
                                        }}
                                        className={[
                                            "py-2 rounded-xl text-sm font-medium transition-all",
                                            selected?.getFullYear() === y
                                                ? "bg-primary text-white shadow-sm shadow-blue-200 scale-105"
                                                : isYearDisabled(y)
                                                    ? "text-slate-300 cursor-not-allowed"
                                                    : "text-slate-700 hover:bg-blue-50 hover:text-primary",
                                        ].join(" ")}
                                    >
                                        {y}
                                    </button>
                                ))}
                            </div>
                            {/* Quick jump: today's year */}
                            <div className="mt-2 pt-2 border-t border-slate-100 text-center">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const y = CURRENT_YEAR;
                                        setPickYear(y);
                                        setYearPage(0);
                                        setStep("month");
                                    }}
                                    className="text-xs text-primary font-semibold hover:underline transition"
                                >
                                    Jump to {CURRENT_YEAR}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Step 2: Month grid ── */}
                    {step === "month" && (
                        <div className="p-3">
                            <div className="grid grid-cols-3 gap-1.5">
                                {MONTHS.map((m, i) => (
                                    <button
                                        key={m}
                                        type="button"
                                        disabled={isMonthDisabled(i)}
                                        onClick={() => {
                                            if (isMonthDisabled(i)) return;
                                            setPickMonth(i);
                                            setStep("day");
                                        }}
                                        className={[
                                            "py-2.5 rounded-xl text-sm font-medium transition-all",
                                            selected?.getFullYear() === pickYear && selected?.getMonth() === i
                                                ? "bg-primary text-white shadow-sm shadow-blue-200"
                                                : isMonthDisabled(i)
                                                    ? "text-slate-300 cursor-not-allowed"
                                                    : "text-slate-700 hover:bg-blue-50 hover:text-primary",
                                        ].join(" ")}
                                    >
                                        {MONTHS_SHORT[i]}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Step 3: Day calendar ── */}
                    {step === "day" && (
                        <div className="p-3">
                            {/* Day name headers */}
                            <div className="grid grid-cols-7 mb-1">
                                {DAYS_SHORT.map(d => (
                                    <div key={d} className="text-center text-[11px] font-semibold text-slate-400 py-1">
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
                                            disabled={isDayDisabled(day)}
                                            onClick={() => {
                                                if (isDayDisabled(day)) return;
                                                onChange(toYMD(pickYear, pickMonth, day));
                                                setOpen(false);
                                            }}
                                            className={[
                                                "w-8 h-8 mx-auto flex items-center justify-center text-xs rounded-full transition-all font-medium",
                                                selected &&
                                                    selected.getFullYear() === pickYear &&
                                                    selected.getMonth() === pickMonth &&
                                                    selected.getDate() === day
                                                    ? "bg-primary text-white shadow shadow-blue-200 scale-110"
                                                    : (() => {
                                                        const t = new Date();
                                                        return t.getFullYear() === pickYear && t.getMonth() === pickMonth && t.getDate() === day;
                                                    })()
                                                        ? "text-primary ring-2 ring-primary/30 bg-blue-50"
                                                        : isDayDisabled(day)
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
                                        const t = new Date();
                                        if (!maxDate || t <= maxDate) {
                                            setPickYear(t.getFullYear());
                                            setPickMonth(t.getMonth());
                                            setStep("day");
                                            onChange(toYMD(t.getFullYear(), t.getMonth(), t.getDate()));
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
                    )}

                </div>
            )}
        </div>
    );
}
