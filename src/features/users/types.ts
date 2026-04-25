import type { Role } from "@/constants/roles";

export type UserStatus = "PENDING" | "APPROVED" | "REJECTED";

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

export type UpdateRoleRequest = { role: string; };
export type AdminResetPasswordRequest = { newPassword: string; };
