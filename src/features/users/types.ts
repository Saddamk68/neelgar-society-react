import type { Role } from "@/constants/roles";

export type UserStatus = "PENDING" | "APPROVED" | "REJECTED" | "INACTIVE";

export type UserRecord = {
  id: number;
  username: string;
  email: string | null;
  role: Role;
  status: UserStatus;
  isActive: boolean;
  personName: string | null;
  memberCode: string | null;
  createdAt: string | null;
  failedAttempts: number | null;
  lockUntil: string | null;
};

export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
};

/**
 * Full user profile — returned by GET /api/v1/users/me
 */
export type UserProfile = {
  // Account
  userId: number;
  username: string;
  email: string | null;
  image: string | null;
  hasPhoto: boolean | null;
  role: string;
  status: UserStatus;
  isActive: boolean;
  createdAt: string | null;

  // Personal details (from linked Person record)
  personId: number | null;
  memberCode: string | null;
  firstName: string | null;
  lastName: string | null;
  gender: string | null;
  dob: string | null;
  contactNumber: string | null;
  education: string | null;
  occupation: string | null;

  // Family + Society
  familyId: number | null;
  familyCode: string | null;
  societyId: number | null;
  societyCode: string | null;
  societyName: string | null;

  // Legal consent
  tncAcceptanceRequired: boolean | null;
};

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

export type ProvisionAccountRequest = {
  personId: number;
  email?: string | null;
};

export type UpdateRoleRequest = { role: Role; };
export type AdminResetPasswordRequest = { newPassword: string; };
