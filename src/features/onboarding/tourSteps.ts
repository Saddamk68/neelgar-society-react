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

export function getTourKeyForRole(role: Role): string | null {
    if (role === "LOCAL_PRESIDENT" || role === "LOCAL_SECRETARY") return "LOCAL_AUTHORITY";
    if (role === "PRESIDENT") return "SOCIETY_PRESIDENT";
    if (role === "SECRETARY") return "SECRETARY";
    if (role === "EDITOR") return "EDITOR";
    if (role === "ADMIN" || role === "SUPER_ADMIN") return "ADMIN";
    return null; // MEMBER — no tour
}
