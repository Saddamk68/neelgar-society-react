// Central RBAC matrix: each permission lists which roles have it.
export const PERMISSIONS = {
  VIEW_DASHBOARD: ["ADMIN", "PRESIDENT", "EDITOR"],
  VIEW_MEMBERS: ["ADMIN", "PRESIDENT", "EDITOR"],
  VIEW_LOGS: ["ADMIN", "PRESIDENT"],
  MANAGE_USERS: ["ADMIN", "PRESIDENT"],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function roleHasPermission(role: string, perm: Permission) {
  return PERMISSIONS[perm].includes(role as any);
}
