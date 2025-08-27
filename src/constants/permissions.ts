// Central RBAC matrix: each permission lists which roles have it.
export const PERMISSIONS = {
  VIEW_DASHBOARD: ["admin", "member"],
  VIEW_MEMBERS: ["admin", "member"],
  VIEW_LOGS: ["admin"],
  MANAGE_USERS: ["admin"],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function roleHasPermission(role: string, perm: Permission) {
  return PERMISSIONS[perm].includes(role as any);
}
