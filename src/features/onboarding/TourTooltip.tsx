import type { TooltipRenderProps } from "react-joyride";

export default function TourTooltip({
    step,
    index,
    size,
    isLastStep,
    backProps,
    closeProps,
    primaryProps,
    skipProps,
    tooltipProps,
}: TooltipRenderProps) {
    return (
        <div
            {...tooltipProps}
            className="bg-white rounded-xl shadow-lg border w-full max-w-sm flex flex-col"
        >
            <div className="flex items-center justify-between p-4 border-b">
                {step.title && (
                    <h2 className="text-lg font-semibold text-text-primary">{step.title}</h2>
                )}
                <button
                    {...closeProps}
                    className="text-slate-400 hover:text-slate-700 transition text-sm"
                >
                    ✕
                </button>
            </div>

            <div className="p-4 text-sm text-text-primary leading-relaxed">{step.content}</div>

            <div className="flex items-center justify-between px-4 pb-4 pt-1">
                <span className="text-xs text-text-muted">
                    {index + 1} of {size}
                </span>

                <div className="flex items-center gap-2">
                    <button
                        {...skipProps}
                        className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 transition"
                    >
                        Skip
                    </button>
                    {index > 0 && (
                        <button
                            {...backProps}
                            className="px-3 py-1.5 text-sm border rounded-md hover:bg-slate-50 transition"
                        >
                            Back
                        </button>
                    )}
                    <button
                        {...primaryProps}
                        className="px-4 py-1.5 rounded-md bg-primary text-white text-sm font-semibold hover:opacity-90 transition"
                    >
                        {isLastStep ? "Finish" : "Next"}
                    </button>
                </div>
            </div>
        </div>
    );
}
