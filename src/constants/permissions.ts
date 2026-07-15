/**
 * Permission constants — names match backend @PreAuthorize strings exactly.
 * Real authorization is always enforced server-side via JWT claims.
 * These constants are used purely for UI gating.
 */
export const PERM = {
  VIEW_DASHBOARD: "VIEW_DASHBOARD",
  MEMBER_VIEW: "MEMBER_VIEW",
  MEMBER_CREATE: "MEMBER_CREATE",
  MEMBER_UPDATE: "MEMBER_UPDATE",
  MEMBER_DEACTIVATE: "MEMBER_DEACTIVATE",
  IMPORT_MEMBERS: "IMPORT_MEMBERS",
  FAMILY_VIEW: "FAMILY_VIEW",
  FAMILY_CREATE: "FAMILY_CREATE",
  RELATIONSHIP_MANAGE: "RELATIONSHIP_MANAGE",
  ADDRESS_MANAGE: "ADDRESS_MANAGE",
  USER_MANAGE: "USER_MANAGE",
  USER_APPROVE: "USER_APPROVE",
  USER_REJECT: "USER_REJECT",
  VIEW_LOGS: "VIEW_LOGS",
  GOTRA_MANAGE: "GOTRA_MANAGE",
  GEO_UNIT_MANAGE: "GEO_UNIT_MANAGE",
  DB_BACKUP_MANAGE: "DB_BACKUP_MANAGE",
  EVENT_MANAGE: "EVENT_MANAGE",
  MEMBER_APPLICATION_REVIEW: "MEMBER_APPLICATION_REVIEW",
  EMAIL_SETTINGS_MANAGE: "EMAIL_SETTINGS_MANAGE",
} as const;

export type Perm = typeof PERM[keyof typeof PERM];

// Alias kept so existing imports of `Permission` type still compile during migration
export type Permission = Perm;
