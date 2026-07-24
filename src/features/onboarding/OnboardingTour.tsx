import { Joyride, EventData, STATUS } from "react-joyride";
import { TOURS } from "./tourSteps";
import TourTooltip from "./TourTooltip";

type OnboardingTourProps = {
    tourKey: string | null;
    run: boolean;
    onFinish: () => void;
};

export default function OnboardingTour({ tourKey, run, onFinish }: OnboardingTourProps) {
    if (!tourKey) return null;
    const steps = TOURS[tourKey] ?? [];
    if (steps.length === 0) return null;

    function handleEvent(data: EventData) {
        const { status } = data;
        if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
            onFinish();
        }
    }

    return (
        <Joyride
            steps={steps}
            run={run}
            continuous
            scrollToFirstStep
            onEvent={handleEvent}
            tooltipComponent={TourTooltip}
            options={{
                zIndex: 10000,
                arrowColor: "var(--color-surface)",
                overlayColor: "rgba(17, 24, 39, 0.5)",
            }}
        />
    );
}
