export type AuditAction =
  | "LOGIN" | "LOGIN_FAILED" | "LOGOUT" | "PASSWORD_CHANGED"
  | "MEMBER_CREATED" | "MEMBER_UPDATED" | "MEMBER_DEACTIVATED" | "MEMBER_REACTIVATED" | "DOD_SET"
  | "PHOTO_UPLOADED" | "PHOTO_DELETED"
  | "SPOUSE_LINKED" | "SPOUSE_ENDED" | "PARENT_LINKED"
  | "FAMILY_CREATED" | "FAMILY_UPDATED" | "FAMILY_DEACTIVATED" | "FAMILY_REASSIGNED" | "HEAD_REASSIGNED"
  | "USER_CREATED" | "USER_DEACTIVATED" | "USER_ROLE_CHANGED";

export type DeviceType = "DESKTOP" | "MOBILE" | "TABLET" | "BOT" | "UNKNOWN";

export type AuditLog = {
  id: number;
  timestamp: string;
  actorMemberCode?: string;
  actorUsername?: string;
  actorRole?: string;
  action: AuditAction;
  entityType?: string;
  entityCode?: string;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceType?: DeviceType;
  societyId?: number;
  societyCode?: string;
};

export type AuditLogPage = {
  content: AuditLog[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
};

export type AuditLogFilters = {
  action?: AuditAction | "";
  entityType?: string;
  actorCode?: string;
  from?: string;
  to?: string;
};
