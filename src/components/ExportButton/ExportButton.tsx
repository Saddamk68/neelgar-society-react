import React from "react";
import { useExport } from "../../hooks/useExport";

type Action = "download" | "print" | "newtab";

type Props = {
    path: string;
    query?: Record<string, any>;
    method?: "GET" | "POST";
    body?: any;
    action?: Action;
    useCache?: boolean;
    className?: string;
    children?: React.ReactNode;
};

export default function ExportButton({
    path,
    query,
    method = "GET",
    body,
    action = "newtab",
    useCache = true,
    className = "btn btn-primary",
    children = "Print",
}: Props) {
    const { start, loading } = useExport();

    const onClick = async (e?: React.MouseEvent) => {
        e?.preventDefault();

        try {
            const res = await start(path, { query, method, body, useCache });

            const url = URL.createObjectURL(res.blob);

            switch (action) {
                case "download": {
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = res.filename ?? "document.pdf";
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    break;
                }

                case "print": {
                    const win = window.open(url, "_blank");
                    if (!win) {
                        alert("Popup blocked! Please allow popups for this website.");
                        return;
                    }
                    win.onload = () => {
                        win.focus();
                        win.print();
                    };
                    break;
                }

                case "newtab":
                default: {
                    window.open(url, "_blank");
                    break;
                }
            }

            // Cleanup URL after 5 seconds
            setTimeout(() => URL.revokeObjectURL(url), 5000);

        } catch (err) {
            console.error("Export error", err);
        }
    };

    return (
        <button
            type="button"
            className={className}
            onClick={onClick}
            disabled={loading}
            aria-busy={loading}
        >
            {loading ? "Preparing..." : children ?? "Print"}
        </button>
    );
}
