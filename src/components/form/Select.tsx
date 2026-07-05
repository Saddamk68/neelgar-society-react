/**
 * Select.tsx — Themed dropdown replacement for native <select>
 *
 * Matches the app's existing custom-input style (see DatePicker.tsx):
 * bordered trigger button + floating panel, same focus/error ring colors.
 *
 * The panel renders through a portal into document.body with fixed
 * positioning computed from the trigger's bounding rect — this is
 * necessary because several call sites (e.g. the Users table via
 * ResponsiveTable) wrap content in overflow-x-auto/overflow-y-auto
 * containers, which would otherwise clip an absolutely-positioned
 * panel. Portaling to body means the panel always renders on top of
 * the page, never gets clipped, and flips above the trigger
 * automatically if there isn't enough room below.
 *
 * Keyboard behavior matches native <select>:
 *  - ArrowDown/ArrowUp: open the panel (if closed) or move the
 *    highlighted option; opening always starts highlighted on the
 *    current value and scrolls it into view, same as a real <select>.
 *  - Enter / Space: confirm the highlighted option.
 *  - Escape: close without changing anything.
 *  - Typing letters: type-ahead jumps to the next option whose label
 *    starts with what you've typed (resets after a short pause),
 *    exactly like native <select> keyboard search.
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
const TYPEAHEAD_RESET_MS = 600;

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
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const typeaheadRef = useRef<{ buffer: string; timeout: ReturnType<typeof setTimeout> | null }>({
        buffer: "",
        timeout: null,
    });

    const selectedIndex = options.findIndex((o) => String(o.value) === String(value));
    const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;
    const isDisabled = disabled || loading;

    // ── Positioning (portal escapes overflow-clipped ancestors) ─────────────

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

    // ── Open/close helpers ───────────────────────────────────────────────────

    function openPanel(startIndex?: number) {
        if (isDisabled) return;
        setHighlightedIndex(startIndex !== undefined ? startIndex : selectedIndex >= 0 ? selectedIndex : 0);
        setOpen(true);
    }

    function closePanel() {
        setOpen(false);
    }

    function commitIndex(index: number) {
        const opt = options[index];
        if (!opt) return;
        onChange(String(opt.value));
        closePanel();
    }

    // Scroll the highlighted option into view whenever it changes —
    // this is what makes opening the panel show the current selection
    // (like native <select> starting keyboard focus on the current value).
    useEffect(() => {
        if (!open || !coords) return;
        const el = optionRefs.current[highlightedIndex];
        if (el) el.scrollIntoView({ block: "nearest" });
    }, [open, highlightedIndex, coords]);

    // ── Outside click ────────────────────────────────────────────────────────

    useEffect(() => {
        function handler(e: MouseEvent) {
            const target = e.target as Node;
            if (
                triggerRef.current && !triggerRef.current.contains(target) &&
                panelRef.current && !panelRef.current.contains(target)
            ) {
                closePanel();
            }
        }
        if (open) document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    // ── Type-ahead search (used both open and closed) ───────────────────────

    function handleTypeahead(char: string) {
        const ta = typeaheadRef.current;
        if (ta.timeout) clearTimeout(ta.timeout);
        ta.buffer += char.toLowerCase();
        ta.timeout = setTimeout(() => {
            ta.buffer = "";
        }, TYPEAHEAD_RESET_MS);

        const searchFrom = open ? highlightedIndex : selectedIndex;
        const startAt = searchFrom >= 0 ? searchFrom : -1;

        // Search forward from just after the current position first (so
        // repeated presses of the same letter cycle through matches),
        // then wrap around the whole list.
        const ordered = [
            ...options.slice(startAt + 1),
            ...options.slice(0, startAt + 1),
        ];
        const match = ordered.find((o) => o.label.toLowerCase().startsWith(ta.buffer));
        if (!match) return;
        const matchIndex = options.indexOf(match);

        if (open) {
            setHighlightedIndex(matchIndex);
        } else {
            onChange(String(match.value));
        }
    }

    // ── Keyboard handling ────────────────────────────────────────────────────

    function handleTriggerKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
        if (isDisabled) return;

        if (!open) {
            if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openPanel();
                return;
            }
            if (e.key.length === 1 && /\S/.test(e.key)) {
                e.preventDefault();
                handleTypeahead(e.key);
            }
            return;
        }

        // Panel is open — arrow/enter/escape/typeahead all handled here too,
        // so keyboard works whether or not focus visually moved into the panel.
        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setHighlightedIndex((i) => Math.min(i + 1, options.length - 1));
                break;
            case "ArrowUp":
                e.preventDefault();
                setHighlightedIndex((i) => Math.max(i - 1, 0));
                break;
            case "Home":
                e.preventDefault();
                setHighlightedIndex(0);
                break;
            case "End":
                e.preventDefault();
                setHighlightedIndex(options.length - 1);
                break;
            case "Enter":
            case " ":
                e.preventDefault();
                commitIndex(highlightedIndex);
                break;
            case "Escape":
                e.preventDefault();
                closePanel();
                break;
            case "Tab":
                closePanel();
                break;
            default:
                if (e.key.length === 1 && /\S/.test(e.key)) {
                    e.preventDefault();
                    handleTypeahead(e.key);
                }
        }
    }

    return (
        <>
            {/* ── Trigger ── */}
            <button
                ref={triggerRef}
                type="button"
                disabled={isDisabled}
                onClick={() => (open ? closePanel() : openPanel())}
                onKeyDown={handleTriggerKeyDown}
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
                                options.map((opt, index) => (
                                    <button
                                        key={opt.value}
                                        ref={(el) => { optionRefs.current[index] = el; }}
                                        type="button"
                                        onMouseEnter={() => setHighlightedIndex(index)}
                                        onClick={() => commitIndex(index)}
                                        className={[
                                            "w-full text-left px-3 py-2 text-sm transition-colors",
                                            String(opt.value) === String(value)
                                                ? "bg-primary text-white font-medium"
                                                : index === highlightedIndex
                                                    ? "bg-blue-50 text-primary"
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
