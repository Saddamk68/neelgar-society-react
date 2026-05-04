/**
 * Client-side only — controls what UI elements are visible.
 * Real authorization is always enforced server-side via JWT claims.
 */
export const PERMISSIONS = {
  VIEW_DASHBOARD: ["SUPER_ADMIN", "ADMIN", "PRESIDENT", "EDITOR", "MEMBER"],
  VIEW_MEMBERS: ["SUPER_ADMIN", "ADMIN", "PRESIDENT", "SECRETARY", "EDITOR"],
  VIEW_FAMILIES: ["SUPER_ADMIN", "ADMIN", "PRESIDENT", "SECRETARY", "EDITOR"],
  VIEW_LOGS: ["SUPER_ADMIN", "ADMIN", "PRESIDENT"],
  MANAGE_USERS: ["SUPER_ADMIN", "ADMIN", "PRESIDENT"],
  MANAGE_GOTRAS: ["SUPER_ADMIN", "ADMIN", "PRESIDENT"],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function roleHasPermission(role: string, perm: Permission): boolean {
  return (PERMISSIONS[perm] as readonly string[]).includes(role);
}
