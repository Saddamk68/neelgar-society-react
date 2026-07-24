import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Joyride, EventData, ACTIONS, EVENTS, STATUS } from "react-joyride";
import { useAuth } from "@/context/AuthContext";
import { TOURS, getMemberTourSteps } from "./tourSteps";
import TourTooltip from "./TourTooltip";

type OnboardingTourProps = {
    tourKey: string | null;
    run: boolean;
    onFinish: () => void;
    onOpenProfileMenu?: () => void;
    onCloseProfileMenu?: () => void;
    onCloseMobileMenu?: () => void;
};

export default function OnboardingTour({
    tourKey,
    run,
    onFinish,
    onOpenProfileMenu,
    onCloseProfileMenu,
    onCloseMobileMenu,
}: OnboardingTourProps) {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [stepIndex, setStepIndex] = useState(0);
    const [ready, setReady] = useState(false);
    const prevRun = useRef(false);

    const baseSteps =
        tourKey === "MEMBER"
            ? getMemberTourSteps(
                () => onOpenProfileMenu?.(),
                () => onCloseProfileMenu?.(),
                (path) => navigate(path),
                () => onCloseMobileMenu?.(),
                user?.memberCode ?? ""
            )
            : tourKey
                ? (TOURS[tourKey] ?? [])
                : [];

    const steps = baseSteps.map((step) => ({
        ...step,
        showProgress: true,
        buttons: ["back", "skip", "primary"] as Array<"back" | "skip" | "primary">,
    }));

    // Runs whenever `run` starts, or whenever we move to a new step (either
    // direction). Waits for that step's side effect (navigating, opening/
    // closing menus) to finish before letting Joyride actually render it —
    // this is what makes Back and Next both work correctly.
    useEffect(() => {
        const justStarted = run && !prevRun.current;
        prevRun.current = run;

        if (!run) {
            setReady(false);
            return;
        }

        const targetIndex = justStarted ? 0 : stepIndex;
        let cancelled = false;

        (async () => {
            setReady(false);
            if (justStarted) setStepIndex(0);
            const onBeforeShow = (steps[targetIndex]?.data as { onBeforeShow?: () => Promise<void> } | undefined)
                ?.onBeforeShow;
            if (onBeforeShow) await onBeforeShow();
            if (!cancelled) setReady(true);
        })();

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [run, stepIndex]);

    if (!tourKey || steps.length === 0) return null;

    function handleEvent(data: EventData) {
        const { status, type, action, index } = data;

        if (type === EVENTS.STEP_AFTER) {
            if (action === ACTIONS.PREV) {
                setStepIndex(Math.max(0, index - 1));
            } else if (action === ACTIONS.NEXT || action === ACTIONS.CLOSE) {
                setStepIndex(index + 1);
            }
        }

        if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
            onFinish();
        }
    }

    return (
        <Joyride
            steps={steps}
            run={run && ready}
            stepIndex={stepIndex}
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
