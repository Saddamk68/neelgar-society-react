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
 * Search: opening the panel shows a text input (auto-focused) that
 * filters options by label (case-insensitive substring match).
 * Keyboard behavior matches native <select> otherwise:
 *  - ArrowDown/ArrowUp: open the panel (if closed) or move the
 *    highlighted option among the filtered results.
 *  - Enter: confirm the highlighted option.
 *  - Escape: close without changing anything.
 *  - Typing while closed: type-ahead jumps to the next option whose
 *    label starts with what you've typed (resets after a short pause).
 *  - Typing while open: filters the list via the search box.
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
    const [searchTerm, setSearchTerm] = useState("");

    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const typeaheadRef = useRef<{ buffer: string; timeout: ReturnType<typeof setTimeout> | null }>({
        buffer: "",
        timeout: null,
    });

    const selectedIndex = options.findIndex((o) => String(o.value) === String(value));
    const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;
    const isDisabled = disabled || loading;

    // ── Filtered options (search) ────────────────────────────────────────────

    const filteredOptions = searchTerm.trim()
        ? options.filter((o) => o.label.toLowerCase().includes(searchTerm.trim().toLowerCase()))
        : options;

    // Reset highlight to top of results whenever the search term changes.
    useEffect(() => {
        if (open) setHighlightedIndex(filteredOptions.length > 0 ? 0 : -1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm]);

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
        window.visualViewport?.addEventListener("resize", handle);
        window.visualViewport?.addEventListener("scroll", handle);
        return () => {
            window.removeEventListener("scroll", handle, true);
            window.removeEventListener("resize", handle);
            window.visualViewport?.removeEventListener("resize", handle);
            window.visualViewport?.removeEventListener("scroll", handle);
        };
    }, [open]);

    // Focus the search input as soon as the panel opens. Using
    // useLayoutEffect (not useEffect+rAF) matters here: it fires
    // synchronously in the same tick as the tap/click that opened the
    // panel, which is what lets iOS/Android reliably treat this as
    // part of the user gesture and pop the on-screen keyboard on
    // tablets/phones — a focus() deferred by even one frame is often
    // silently ignored on iOS Safari.
    useLayoutEffect(() => {
        if (open && coords) searchInputRef.current?.focus();
    }, [open, coords]);

    // ── Open/close helpers ───────────────────────────────────────────────────

    function openPanel(startIndex?: number) {
        if (isDisabled) return;
        setSearchTerm("");
        setHighlightedIndex(startIndex !== undefined ? startIndex : selectedIndex >= 0 ? selectedIndex : 0);
        setOpen(true);
    }

    function closePanel() {
        setOpen(false);
        setSearchTerm("");
    }

    function commitIndex(index: number) {
        const opt = filteredOptions[index];
        if (!opt) return;
        onChange(String(opt.value));
        closePanel();
        triggerRef.current?.focus();
    }

    // Scroll the highlighted option into view whenever it changes.
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

    // ── Type-ahead search (used only while the trigger is closed) ────────────

    function handleTypeahead(char: string) {
        const ta = typeaheadRef.current;
        if (ta.timeout) clearTimeout(ta.timeout);
        ta.buffer += char.toLowerCase();
        ta.timeout = setTimeout(() => {
            ta.buffer = "";
        }, TYPEAHEAD_RESET_MS);

        const startAt = selectedIndex >= 0 ? selectedIndex : -1;
        const ordered = [
            ...options.slice(startAt + 1),
            ...options.slice(0, startAt + 1),
        ];
        const match = ordered.find((o) => o.label.toLowerCase().startsWith(ta.buffer));
        if (!match) return;
        onChange(String(match.value));
    }

    // ── Keyboard handling — trigger (only relevant while panel is closed) ────

    function handleTriggerKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
        if (isDisabled) return;

        if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openPanel();
            return;
        }
        if (e.key.length === 1 && /\S/.test(e.key)) {
            e.preventDefault();
            handleTypeahead(e.key);
        }
    }

    // ── Keyboard handling — search input (while panel is open) ──────────────

    function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setHighlightedIndex((i) => Math.min(i + 1, filteredOptions.length - 1));
                break;
            case "ArrowUp":
                e.preventDefault();
                setHighlightedIndex((i) => Math.max(i - 1, 0));
                break;
            case "Enter":
                e.preventDefault();
                commitIndex(highlightedIndex);
                break;
            case "Escape":
                e.preventDefault();
                closePanel();
                triggerRef.current?.focus();
                break;
            case "Tab":
                closePanel();
                break;
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
                        {/* Search box */}
                        <div className="px-3 py-2.5 border-b border-slate-100">
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={handleSearchKeyDown}
                                placeholder="Search…"
                                className="w-full text-base outline-none placeholder:text-slate-400 px-2 py-1"
                            />
                        </div>

                        <div className="max-h-64 overflow-y-auto py-1">
                            {filteredOptions.length === 0 ? (
                                <p className="px-3 py-2 text-sm text-slate-400">
                                    {searchTerm ? "No matches" : "No options"}
                                </p>
                            ) : (
                                filteredOptions.map((opt, index) => (
                                    <button
                                        key={opt.value}
                                        ref={(el) => { optionRefs.current[index] = el; }}
                                        type="button"
                                        onMouseEnter={() => setHighlightedIndex(index)}
                                        onClick={() => commitIndex(index)}
                                        className={[
                                            "w-full text-left px-3 py-2.5 text-sm transition-colors",
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
