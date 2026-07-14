import { useEffect, useRef, useState } from "react";

interface OtpInputBoxesProps {
    length?: number;
    value: string;
    onChange: (value: string) => void;
    onComplete?: (value: string) => void;
    /** Increment this on every failed verify attempt — triggers flash-red-and-clear each time, even on consecutive failures. */
    errorSignal?: number;
    disabled?: boolean;
}

export default function OtpInputBoxes({
    length = 6,
    value,
    onChange,
    onComplete,
    errorSignal = 0,
    disabled,
}: OtpInputBoxesProps) {
    const [flash, setFlash] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const lastHandledSignal = useRef(0);
    const digits = value.split("").slice(0, length);
    while (digits.length < length) digits.push("");

    useEffect(() => {
        if (errorSignal > 0 && errorSignal !== lastHandledSignal.current) {
            lastHandledSignal.current = errorSignal;
            setFlash(true);
            const timer = setTimeout(() => {
                setFlash(false);
                onChange("");
                inputRefs.current[0]?.focus();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [errorSignal]);

    function setDigitAt(index: number, digit: string) {
        const next = [...digits];
        next[index] = digit;
        const joined = next.join("");
        onChange(joined);
        if (joined.length === length && !joined.includes("")) {
            onComplete?.(joined);
        }
    }

    function handleChange(index: number, raw: string) {
        const digit = raw.replace(/[^0-9]/g, "").slice(-1);
        setDigitAt(index, digit);
        if (digit && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    }

    function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Backspace") {
            if (digits[index]) {
                setDigitAt(index, "");
            } else if (index > 0) {
                inputRefs.current[index - 1]?.focus();
                setDigitAt(index - 1, "");
            }
        } else if (e.key === "ArrowLeft" && index > 0) {
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === "ArrowRight" && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    }

    function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
        const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, length);
        if (!pasted) return;
        e.preventDefault();
        onChange(pasted.padEnd(length, "").slice(0, length).replace(/ /g, ""));
        const filled = pasted.length;
        if (filled === length) {
            onComplete?.(pasted);
            inputRefs.current[length - 1]?.blur();
        } else {
            inputRefs.current[Math.min(filled, length - 1)]?.focus();
        }
    }

    return (
        <div className="flex gap-2.5 justify-center">
            {digits.map((digit, i) => (
                <input
                    key={i}
                    ref={(el) => {
                        inputRefs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    disabled={disabled}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onPaste={handlePaste}
                    className={[
                        "w-12 h-14 md:w-14 md:h-16 text-2xl md:text-3xl font-semibold text-center rounded-lg border-2",
                        "focus:outline-none focus:ring-2 focus:ring-primary/40 transition",
                        flash
                            ? "border-red-400 bg-red-50 text-red-600 animate-pulse"
                            : digit
                                ? "border-primary/50 text-slate-800"
                                : "border-slate-300 text-slate-800",
                        disabled ? "opacity-50" : "",
                    ].join(" ")}
                />
            ))}
        </div>
    );
}
