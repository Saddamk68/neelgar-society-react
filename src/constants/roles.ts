export type Role =
    | "SUPER_ADMIN"
    | "ADMIN"
    | "PRESIDENT"
    | "SECRETARY"
    | "EDITOR"
    | "LOCAL_PRESIDENT"
    | "LOCAL_SECRETARY"
    | "MEMBER";

/**
 * Static fallback list — used only where the live API hasn't loaded yet.
 * Users page fetches the real list from GET /api/v1/roles.
 */
export const ALL_ROLES: Role[] = [
    "SUPER_ADMIN",
    "ADMIN",
    "PRESIDENT",
    "SECRETARY",
    "EDITOR",
    "LOCAL_PRESIDENT",
    "LOCAL_SECRETARY",
    "MEMBER",
];

// ADMIN_ROLES and REACTIVATE_ROLES removed.
// Use can(PERM.USER_MANAGE) or can(PERM.MEMBER_DEACTIVATE) instead.
