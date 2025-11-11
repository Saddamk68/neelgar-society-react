// Central RBAC matrix: each permission lists which roles have it.
export const PERMISSIONS = {
  VIEW_DASHBOARD: ["ROLE_ADMIN", "ROLE_PRESIDENT", "ROLE_EDITOR"],
  VIEW_MEMBERS: ["ROLE_ADMIN", "ROLE_PRESIDENT", "ROLE_EDITOR"],
  VIEW_LOGS: ["ROLE_ADMIN", "ROLE_PRESIDENT"],
  MANAGE_USERS: ["ROLE_ADMIN", "ROLE_PRESIDENT"],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function roleHasPermission(role: string, perm: Permission) {
  return PERMISSIONS[perm].includes(role as any);
}
