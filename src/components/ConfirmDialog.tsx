import { useEffect, useRef } from "react";
import { AlertTriangle, Info, CheckCircle, XCircle } from "lucide-react";

type Variant = "danger" | "warning" | "info" | "success";

type ConfirmDialogProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: Variant;
    loading?: boolean;
};

const VARIANT_STYLES: Record<
    Variant,
    { icon: React.ReactNode; confirmBtn: string; iconBg: string }
> = {
    danger: {
        icon: <XCircle className="w-6 h-6 text-red-500" />,
        confirmBtn:
            "bg-red-600 hover:bg-red-700 text-white disabled:opacity-60",
        iconBg: "bg-red-50",
    },
    warning: {
        icon: <AlertTriangle className="w-6 h-6 text-amber-500" />,
        confirmBtn:
            "bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-60",
        iconBg: "bg-amber-50",
    },
    info: {
        icon: <Info className="w-6 h-6 text-blue-500" />,
        confirmBtn:
            "bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60",
        iconBg: "bg-blue-50",
    },
    success: {
        icon: <CheckCircle className="w-6 h-6 text-green-500" />,
        confirmBtn:
            "bg-green-600 hover:bg-green-700 text-white disabled:opacity-60",
        iconBg: "bg-green-50",
    },
};

export default function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    variant = "danger",
    loading = false,
}: ConfirmDialogProps) {
    const confirmBtnRef = useRef<HTMLButtonElement>(null);
    const styles = VARIANT_STYLES[variant];

    // Close on ESC
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !loading) onClose();
        };
        if (isOpen) document.addEventListener("keydown", handleEsc);
        return () => document.removeEventListener("keydown", handleEsc);
    }, [isOpen, onClose, loading]);

    // Focus confirm button when opened
    useEffect(() => {
        if (isOpen) {
            requestAnimationFrame(() => confirmBtnRef.current?.focus());
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => !loading && onClose()}
        >
            <div
                className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6 flex flex-col gap-4"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Icon + title */}
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${styles.iconBg} shrink-0`}>
                        {styles.icon}
                    </div>
                    <h3 className="font-semibold text-slate-800 text-base">{title}</h3>
                </div>

                {/* Message */}
                <p className="text-sm text-slate-500 leading-relaxed">{message}</p>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-1">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50 transition disabled:opacity-60"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        ref={confirmBtnRef}
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className={`px-4 py-2 text-sm rounded-lg transition font-medium ${styles.confirmBtn}`}
                    >
                        {loading ? "Please wait…" : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
