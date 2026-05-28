import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
    title: string;
    subtitle?: string;
    /**
     * Where the back button navigates to.
     * - Pass a path string (e.g. ROUTES.PRIVATE.MEMBERS) to go to a specific page.
     * - Pass "back" to go to the previous page in browser history (navigate(-1)).
     *   Use "back" whenever the caller can be reached from multiple places
     *   (e.g. Members list active tab, inactive tab, search results) so the
     *   correct origin is always restored.
     */
    backTo?: string | "back";
    actions?: ReactNode;
};

export default function PageHeader({ title, subtitle, backTo, actions }: Props) {
    const navigate = useNavigate();

    function handleBack() {
        if (backTo === "back") {
            navigate(-1);
        } else if (backTo) {
            navigate(backTo);
        }
    }

    return (
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">

            {/* Left — back button + title */}
            <div className="flex items-start gap-3">
                {backTo && (
                    <button
                        onClick={handleBack}
                        className="mt-1 p-1.5 rounded-md hover:bg-slate-100 transition text-slate-500 hover:text-slate-800"
                        aria-label="Go back"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                )}
                <div>
                    <h1 className="text-2xl font-semibold text-slate-800">{title}</h1>
                    {subtitle && (
                        <p className="text-slate-500 text-sm mt-0.5">{subtitle}</p>
                    )}
                </div>
            </div>

            {/* Right — action buttons */}
            {actions && (
                <div className="flex items-center gap-2 flex-wrap">
                    {actions}
                </div>
            )}

        </div>
    );
}
