import type { Step } from "react-joyride";
import type { Role } from "@/constants/roles";

// The sidebar is rendered twice in the DOM (desktop + mobile drawer), both
// carrying the same data-tour attribute. This picks whichever copy is
// actually visible right now, so the tour works on both layouts.
function visibleTarget(key: string) {
    return () => {
        const candidates = Array.from(
            document.querySelectorAll<HTMLElement>(`[data-tour="${key}"]`)
        );
        return candidates.find((el) => el.offsetParent !== null) ?? candidates[0] ?? null;
    };
}

export const TOURS: Record<string, Step[]> = {
    LOCAL_AUTHORITY: [
        {
            target: visibleTarget("dashboard"),
            title: "Dashboard",
            content: "Your home screen — a quick overview of society activity.",
            skipBeacon: true,
        },
        {
            target: visibleTarget("member-edit-requests"),
            title: "Edit Requests",
            content: "Members can request changes to their own details — approve or reject those requests here.",
        },
        {
            target: visibleTarget("families"),
            title: "Families",
            content: "View and manage family records for your area.",
        },
        {
            target: visibleTarget("members"),
            title: "Members",
            content: "View and manage individual member records.",
        },
    ],
    SOCIETY_PRESIDENT: [
        {
            target: visibleTarget("dashboard"),
            title: "Dashboard",
            content: "Your home screen — a quick overview of society activity.",
            skipBeacon: true,
        },
        {
            target: visibleTarget("member-applications"),
            title: "Applications",
            content: "Review and approve or reject new membership applications submitted by the public.",
        },
        {
            target: visibleTarget("member-edit-requests"),
            title: "Edit Requests",
            content: "Review member-submitted requests to change their own details.",
        },
        {
            target: visibleTarget("users"),
            title: "Users",
            content: "Approve, reject, or manage login accounts for society members.",
        },
        {
            target: visibleTarget("local-authority"),
            title: "Local Leadership",
            content: "Assign Local President/Secretary responsibilities for specific villages/towns.",
        },
        {
            target: visibleTarget("logs"),
            title: "Audit Logs",
            content: "Review a history of actions taken across the system.",
        },
    ],
    SECRETARY: [
        {
            target: visibleTarget("dashboard"),
            title: "Dashboard",
            content: "Your home screen — a quick overview of society activity.",
            skipBeacon: true,
        },
        {
            target: visibleTarget("member-applications"),
            title: "Applications",
            content: "Review and approve or reject new membership applications submitted by the public.",
        },
        {
            target: visibleTarget("member-edit-requests"),
            title: "Edit Requests",
            content: "Review member-submitted requests to change their own details.",
        },
        {
            target: visibleTarget("families"),
            title: "Families",
            content: "View and manage family records.",
        },
        {
            target: visibleTarget("members"),
            title: "Members",
            content: "View and manage individual member records.",
        },
    ],
    EDITOR: [
        {
            target: visibleTarget("dashboard"),
            title: "Dashboard",
            content: "Your home screen — a quick overview of society activity.",
            skipBeacon: true,
        },
        {
            target: visibleTarget("members"),
            title: "Members",
            content: "View, add, and update member records here.",
        },
        {
            target: visibleTarget("families"),
            title: "Families",
            content: "View and add family records here.",
        },
    ],
    ADMIN: [
        {
            target: visibleTarget("dashboard"),
            title: "Dashboard",
            content: "Your home screen — a quick overview of society activity.",
            skipBeacon: true,
        },
        {
            target: visibleTarget("users"),
            title: "Users",
            content: "Approve, reject, or manage login accounts for society members.",
        },
        {
            target: visibleTarget("local-authority"),
            title: "Local Leadership",
            content: "Assign President/Secretary responsibilities for local areas.",
        },
        {
            target: visibleTarget("permissions"),
            title: "Permissions",
            content: "Fine-tune what each role is allowed to do across the app.",
        },
        {
            target: visibleTarget("logs"),
            title: "Audit Logs",
            content: "Review a history of actions taken across the system.",
        },
    ],
};

type NavigateFn = (path: string) => void;

// MEMBER's tour actually drives real navigation (opens the profile menu, visits
// pages) between steps, so it needs callbacks the other static tours don't.
export function getMemberTourSteps(
    openProfileMenu: () => void,
    closeProfileMenu: () => void,
    navigate: NavigateFn,
    closeMobileMenu: () => void,
    memberCode: string
): Step[] {
    const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

    return [
        {
            target: visibleTarget("dashboard"),
            title: "Dashboard",
            content: "Your home screen — a quick overview of society activity and upcoming events.",
            skipBeacon: true,
        },
        {
            target: visibleTarget("view-full-details"),
            title: "Your Record",
            data: {
                onBeforeShow: async () => {
                    closeMobileMenu();
                    navigate("/app/dashboard");
                    await wait(300);
                },
            },
            targetWaitTimeout: 5000,
            content: "Scroll down to your profile card, then click \"View Full Details\" to open your record.",
        },
        {
            target: visibleTarget("ellipsis-menu"),
            title: "More Options",
            data: {
                onBeforeShow: async () => {
                    navigate(`/app/members/${memberCode}/view`);
                    await wait(300);
                },
            },
            targetWaitTimeout: 5000,
            content: "Click this menu for more options.",
        },
        {
            target: "body",
            placement: "center",
            title: "Requesting Changes",
            content: "Select \"Request Changes\" from the menu to suggest edits — a local authority will review and approve them.",
        },
        {
            target: visibleTarget("profile-menu"),
            title: "Your Account",
            data: {
                onBeforeShow: async () => {
                    closeMobileMenu();
                    await wait(200);
                },
            },
            content: "Click your avatar to open your account menu.",
        },
        {
            target: visibleTarget("view-profile-link"),
            title: "View Profile",
            data: {
                onBeforeShow: async () => {
                    openProfileMenu();
                    await wait(200);
                },
            },
            content: "Click \"View Profile\" to manage your account.",
        },
        {
            target: visibleTarget("password-section"),
            title: "Change Password",
            data: {
                onBeforeShow: async () => {
                    closeProfileMenu();
                    navigate("/app/profile");
                    await wait(300);
                },
            },
            targetWaitTimeout: 5000,
            content: "Change your password here anytime.",
        },
    ];
}

export function getTourKeyForRole(role: Role): string | null {
    if (role === "LOCAL_PRESIDENT" || role === "LOCAL_SECRETARY") return "LOCAL_AUTHORITY";
    if (role === "PRESIDENT") return "SOCIETY_PRESIDENT";
    if (role === "SECRETARY") return "SECRETARY";
    if (role === "EDITOR") return "EDITOR";
    if (role === "ADMIN" || role === "SUPER_ADMIN") return "ADMIN";
    if (role === "MEMBER") return "MEMBER";
    return null;
}
