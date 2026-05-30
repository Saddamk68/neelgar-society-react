import { api } from "@/services/apiClient";
import { ENDPOINTS } from "@/config/endpoints";
import type {
  UserRecord,
  UserStatus,
  PageResponse,
  UpdateRoleRequest,
  AdminResetPasswordRequest,
} from "../types";
import type { Role } from "@/constants/roles";

// Unwrap Spring's { success, message, data: T } envelope
function unwrap<T>(responseData: any): T {
  return (responseData?.data ?? responseData) as T;
}

function mapToUserRecord(u: any): UserRecord {
  return {
    id: u.id,
    username: u.username,
    email: u.email ?? null,
    role: (u.role ?? "MEMBER").toUpperCase() as Role,
    status: (u.status ?? "PENDING") as UserStatus,
    isActive: u.isActive ?? false,
    personName: u.personName ?? null,
    memberCode: u.memberCode ?? null,
    createdAt: u.createdAt ?? null,
    failedAttempts: u.failedAttempts ?? null,
    lockUntil: u.lockUntil ?? null,
  };
}

// ── List users (paginated, filterable by status) ──────────────────────────────

export async function listUsers(params?: {
  status?: UserStatus | "";
  page?: number;
  size?: number;
}): Promise<PageResponse<UserRecord>> {
  const query: Record<string, any> = {
    page: params?.page ?? 0,
    size: params?.size ?? 20,
    sort: "createdAt,desc",
  };
  if (params?.status) query.status = params.status;

  const resp = await api.get(ENDPOINTS.users.list(), { params: query });
  const page = unwrap<any>(resp.data);

  return {
    content: (page.content ?? []).map(mapToUserRecord),
    totalElements: page.totalElements ?? 0,
    totalPages: page.totalPages ?? 0,
    number: page.number ?? 0,
    size: page.size ?? 20,
    first: page.first ?? true,
    last: page.last ?? true,
  };
}

// ── List users by active status (paginated, filterable by status) ──────────────────────────────

export async function listUsersByActiveStatus(params?: {
  isActive?: boolean;
  page?: number;
  size?: number;
}): Promise<PageResponse<UserRecord>> {

  const query = {
    page: params?.page ?? 0,
    size: params?.size ?? 20,
    sort: "createdAt,desc",
  };

  const resp = await api.get(
    ENDPOINTS.users.listByActiveStatus(params?.isActive ?? true),
    { params: query }
  );

  const page = unwrap<any>(resp.data);

  return {
    content: (page.content ?? []).map(mapToUserRecord),
    totalElements: page.totalElements ?? 0,
    totalPages: page.totalPages ?? 0,
    number: page.number ?? 0,
    size: page.size ?? 20,
    first: page.first ?? true,
    last: page.last ?? true,
  };
}

// ── Approve user ──────────────────────────────────────────────────────────────

export async function approveUser(id: number): Promise<UserRecord> {
  const resp = await api.patch(ENDPOINTS.users.approve(id));
  return mapToUserRecord(unwrap(resp.data));
}

// ── Reject user ───────────────────────────────────────────────────────────────

export async function rejectUser(id: number): Promise<UserRecord> {
  const resp = await api.patch(ENDPOINTS.users.reject(id));
  return mapToUserRecord(unwrap(resp.data));
}

// ── Update role ───────────────────────────────────────────────────────────────

export async function updateUserRole(id: number, role: Role): Promise<UserRecord> {
  const body: UpdateRoleRequest = { role };
  const resp = await api.patch(ENDPOINTS.users.updateRole(id), body);
  return mapToUserRecord(unwrap(resp.data));
}

// ── Deactivate user ───────────────────────────────────────────────────────────

export async function deactivateUser(id: number): Promise<void> {
  await api.patch(ENDPOINTS.users.deactivate(id));
}

// ── Reactivate user ───────────────────────────────────────────────────────────

export async function reactivateUser(id: number): Promise<UserRecord> {
  const resp = await api.patch(ENDPOINTS.users.reactivate(id));
  return mapToUserRecord(unwrap(resp.data));
}

// ── Admin reset password ──────────────────────────────────────────────────────

export async function adminResetPassword(
  id: number,
  newPassword: string
): Promise<void> {
  const body: AdminResetPasswordRequest = { newPassword };
  await api.post(ENDPOINTS.users.resetPassword(id), body);
}

// ── Provision account for existing member ─────────────────────────────────────

export async function provisionUserAccount(
  personId: number,
  email?: string
): Promise<void> {
  await api.post(ENDPOINTS.users.provision(), { personId, email: email ?? null });
}

// ── Unlock account ────────────────────────────────────────────────────────────

export async function unlockUserAccount(username: string): Promise<void> {
  await api.post(ENDPOINTS.users.unlock(username));
}
