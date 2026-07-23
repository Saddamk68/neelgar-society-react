import type { Step } from "react-joyride";
import type { Role } from "@/constants/roles";

export const TOURS: Record<string, Step[]> = {
    LOCAL_AUTHORITY: [
        {
            target: '[data-tour="dashboard"]',
            title: "Dashboard",
            content: "Your home screen — a quick overview of society activity.",
            skipBeacon: true,
        },
        {
            target: '[data-tour="member-applications"]',
            title: "Applications",
            content: "Review and approve or reject new membership applications submitted by the public.",
        },
        {
            target: '[data-tour="member-edit-requests"]',
            title: "Edit Requests",
            content: "Members can request changes to their own details — approve or reject those requests here.",
        },
        {
            target: '[data-tour="families"]',
            title: "Families",
            content: "View and manage family records and family trees for your area.",
        },
        {
            target: '[data-tour="members"]',
            title: "Members",
            content: "View and manage individual member records.",
        },
    ],
    EDITOR: [
        {
            target: '[data-tour="dashboard"]',
            title: "Dashboard",
            content: "Your home screen — a quick overview of society activity.",
            skipBeacon: true,
        },
        {
            target: '[data-tour="members"]',
            title: "Members",
            content: "View, add, and update member records here.",
        },
        {
            target: '[data-tour="families"]',
            title: "Families",
            content: "View and add family records here.",
        },
    ],
    ADMIN: [
        {
            target: '[data-tour="dashboard"]',
            title: "Dashboard",
            content: "Your home screen — a quick overview of society activity.",
            skipBeacon: true,
        },
        {
            target: '[data-tour="users"]',
            title: "Users",
            content: "Approve, reject, or manage login accounts for society members.",
        },
        {
            target: '[data-tour="local-authority"]',
            title: "Local Leadership",
            content: "Assign President/Secretary responsibilities for local areas.",
        },
        {
            target: '[data-tour="permissions"]',
            title: "Permissions",
            content: "Fine-tune what each role is allowed to do across the app.",
        },
        {
            target: '[data-tour="logs"]',
            title: "Audit Logs",
            content: "Review a history of actions taken across the system.",
        },
    ],
};

export function getTourKeyForRole(role: Role): string | null {
    if (role === "PRESIDENT" || role === "SECRETARY") return "LOCAL_AUTHORITY";
    if (role === "EDITOR") return "EDITOR";
    if (role === "ADMIN" || role === "SUPER_ADMIN") return "ADMIN";
    return null; // MEMBER — no tour
}
