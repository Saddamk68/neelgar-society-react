import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";

type Props = {
    title: string;
    description: string;
    buttonLabel: string;
    confirmTitle: string;
    confirmMessage: string;
    onConfirm: () => Promise<void>;
    loading?: boolean;
    skipConfirm?: boolean;
};

export default function DangerZone({
    title,
    description,
    buttonLabel,
    confirmTitle,
    confirmMessage,
    onConfirm,
    loading = false,
    skipConfirm = false,
}: Props) {
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);

    async function handleConfirm() {
        setBusy(true);
        try {
            await onConfirm();
        } finally {
            setBusy(false);
            setOpen(false);
        }
    }

    return (
        <>
            <div className="mt-8 border border-red-200 rounded-xl p-5 bg-red-50">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                    <div className="flex-1">
                        <h3 className="text-sm font-semibold text-red-700">{title}</h3>
                        <p className="text-sm text-red-600 mt-1">{description}</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            if (skipConfirm) {
                                onConfirm();
                            } else {
                                setOpen(true);
                            }
                        }}
                        disabled={loading || busy}
                        className="px-3 py-1.5 text-sm rounded-md bg-white border border-red-300 text-red-600 hover:bg-red-100 transition font-medium disabled:opacity-50 shrink-0"
                    >
                        {buttonLabel}
                    </button>
                </div>
            </div>

            <ConfirmDialog
                isOpen={open}
                onClose={() => setOpen(false)}
                onConfirm={handleConfirm}
                title={confirmTitle}
                message={confirmMessage}
                confirmLabel={buttonLabel}
                variant="danger"
                loading={busy}
            />
        </>
    );
}
