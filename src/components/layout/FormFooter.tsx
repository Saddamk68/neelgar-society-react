type Props = {
    onCancel: () => void;
    saveLabel?: string;
    saving?: boolean;
    disabled?: boolean;
};

export default function FormFooter({
    onCancel,
    saveLabel = "Save Changes",
    saving = false,
    disabled = false,
}: Props) {
    return (
        <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t">
            <button
                type="button"
                onClick={onCancel}
                disabled={saving}
                className="px-4 py-2 text-sm rounded-md border border-slate-300 hover:bg-slate-50 transition disabled:opacity-50"
            >
                Cancel
            </button>
            <button
                type="submit"
                disabled={saving || disabled}
                className="px-4 py-2 text-sm rounded-md bg-primary text-white hover:bg-primary/90 transition disabled:opacity-50 font-medium"
            >
                {saving ? "Saving…" : saveLabel}
            </button>
        </div>
    );
}
