/**
 * Select.tsx — Themed dropdown replacement for native <select>
 *
 * Matches the app's existing custom-input style (see DatePicker.tsx):
 * bordered trigger button + floating panel, same focus/error ring colors.
 *
 * The panel renders through a portal into document.body with fixed
 * positioning computed from the trigger's bounding rect. This is
 * necessary because several call sites (e.g. the Users table via
 * ResponsiveTable) wrap content in overflow-x-auto/overflow-y-auto
 * containers, which would otherwise clip an absolutely-positioned
 * panel or force it to scroll along with the table. Portaling to
 * body means the panel always renders on top of the page, never
 * gets clipped, and flips above the trigger automatically if there
 * isn't enough room below.
 *
 * Usage:
 *   <Select
 *     value={gotraId}
 *     onChange={(v) => setGotraId(Number(v))}
 *     options={gotras.map((g) => ({ value: g.id, label: g.name }))}
 *     placeholder="Select gotra…"
 *     hasError={!!errors.gotraId}
 *     disabled={isLoading}
 *   />
 */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
    value: string | number;
    label: string;
}

const PANEL_MAX_HEIGHT = 256; // matches max-h-64
const VIEWPORT_MARGIN = 8;

export default function Select({
    value,
    onChange,
    options,
    placeholder = "Select…",
    hasError,
    disabled,
    loading,
    loadingLabel = "Loading…",
}: {
    value: string | number | undefined;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    hasError?: boolean;
    disabled?: boolean;
    loading?: boolean;
    loadingLabel?: string;
}) {
    const [open, setOpen] = useState(false);
    const [coords, setCoords] = useState<{ top: number; left: number; width: number; openUp: boolean } | null>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    const selected = options.find((o) => String(o.value) === String(value));
    const isDisabled = disabled || loading;

    // Compute (and keep updated) the panel's fixed position relative to the viewport.
    function updatePosition() {
        const trigger = triggerRef.current;
        if (!trigger) return;

        const rect = trigger.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const openUp = spaceBelow < PANEL_MAX_HEIGHT + VIEWPORT_MARGIN && spaceAbove > spaceBelow;

        setCoords({
            top: openUp ? rect.top : rect.bottom,
            left: rect.left,
            width: rect.width,
            openUp,
        });
    }

    useLayoutEffect(() => {
        if (open) updatePosition();
    }, [open]);

    // Reposition on scroll (capture phase catches scrolling inside any
    // ancestor container, e.g. ResponsiveTable's overflow-y-auto) and resize.
    useEffect(() => {
        if (!open) return;
        function handle() {
            updatePosition();
        }
        window.addEventListener("scroll", handle, true);
        window.addEventListener("resize", handle);
        return () => {
            window.removeEventListener("scroll", handle, true);
            window.removeEventListener("resize", handle);
        };
    }, [open]);

    // Close on outside click (checks both trigger and portaled panel)
    useEffect(() => {
        function handler(e: MouseEvent) {
            const target = e.target as Node;
            if (
                triggerRef.current && !triggerRef.current.contains(target) &&
                panelRef.current && !panelRef.current.contains(target)
            ) {
                setOpen(false);
            }
        }
        if (open) document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    // Close on Escape
    useEffect(() => {
        function handler(e: KeyboardEvent) {
            if (e.key === "Escape") setOpen(false);
        }
        if (open) document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [open]);

    return (
        <>
            {/* ── Trigger ── */}
            <button
                ref={triggerRef}
                type="button"
                disabled={isDisabled}
                onClick={() => !isDisabled && setOpen((o) => !o)}
                className={[
                    "w-full flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm bg-white transition-all duration-150 focus:outline-none",
                    isDisabled
                        ? "opacity-60 cursor-not-allowed border-slate-200"
                        : hasError
                            ? "border-red-400 ring-2 ring-red-100"
                            : open
                                ? "border-primary ring-2 ring-blue-100"
                                : "border-slate-300 hover:border-slate-400",
                ].join(" ")}
            >
                <span className={selected ? "text-slate-800 font-medium truncate" : "text-slate-400 truncate"}>
                    {loading ? loadingLabel : selected ? selected.label : placeholder}
                </span>
                <ChevronDown
                    className={`w-4 h-4 shrink-0 text-slate-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
                />
            </button>

            {/* ── Panel — portaled to <body>, fixed-positioned, escapes all overflow/z-index clipping ── */}
            {open && !isDisabled && coords &&
                createPortal(
                    <div
                        ref={panelRef}
                        className="fixed z-[1000] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden"
                        style={{
                            top: coords.openUp ? undefined : coords.top + 6,
                            bottom: coords.openUp ? window.innerHeight - coords.top + 6 : undefined,
                            left: coords.left,
                            width: coords.width,
                        }}
                    >
                        <div className="max-h-64 overflow-y-auto py-1">
                            {options.length === 0 ? (
                                <p className="px-3 py-2 text-sm text-slate-400">No options</p>
                            ) : (
                                options.map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => {
                                            onChange(String(opt.value));
                                            setOpen(false);
                                        }}
                                        className={[
                                            "w-full text-left px-3 py-2 text-sm transition-colors",
                                            String(opt.value) === String(value)
                                                ? "bg-primary text-white font-medium"
                                                : "text-slate-700 hover:bg-blue-50 hover:text-primary",
                                        ].join(" ")}
                                    >
                                        {opt.label}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>,
                    document.body
                )}
        </>
    );
}
