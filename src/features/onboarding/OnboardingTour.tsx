import { Joyride, EventData, STATUS } from "react-joyride";
import { TOURS } from "./tourSteps";

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
            options={{
                showProgress: true,
                buttons: ["back", "skip", "primary"],
                zIndex: 10000,
                primaryColor: "var(--color-primary)",
                backgroundColor: "var(--color-surface)",
                textColor: "var(--color-text-primary)",
                arrowColor: "var(--color-surface)",
                overlayColor: "rgba(17, 24, 39, 0.5)",
            }}
        />
    );
}
