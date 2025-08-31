// Central RBAC matrix: each permission lists which roles have it.
export const PERMISSIONS = {
  VIEW_DASHBOARD: ["admin", "member", "ROLE_ADMIN"],
  VIEW_MEMBERS: ["admin", "member", "ROLE_ADMIN"],
  VIEW_LOGS: ["admin", "ROLE_ADMIN"],
  MANAGE_USERS: ["admin", "ROLE_ADMIN"],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function roleHasPermission(role: string, perm: Permission) {
  return PERMISSIONS[perm].includes(role as any);
}
