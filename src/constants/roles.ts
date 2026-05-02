export type Role =
    | "SUPER_ADMIN"
    | "ADMIN"
    | "PRESIDENT"
    | "SECRETARY"
    | "EDITOR"
    | "MEMBER";

/** Roles that have admin privileges — used for UI gating */
export const ADMIN_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN", "PRESIDENT"];

/** Full list for dropdowns */
export const ALL_ROLES: Role[] = [
    "SUPER_ADMIN",
    "ADMIN",
    "PRESIDENT",
    "SECRETARY",
    "EDITOR",
    "MEMBER",
];

/** Roles that can reactivate members/users */
export const REACTIVATE_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN", "PRESIDENT", "SECRETARY"];
