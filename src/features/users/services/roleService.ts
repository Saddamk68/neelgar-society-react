import { api } from "@/services/apiClient";
import { ENDPOINTS } from "@/config/endpoints";

export type RoleRecord = {
    id: number;
    name: string;
    description: string | null;
    isActive: boolean;
    permissions: string[];
};

export type PermissionOverride = {
    permissionName: string;
    granted: boolean;
};

export type UserEffectivePermissions = {
    roleName: string;
    rolePermissions: string[];
    overrides: PermissionOverride[];
    effectivePermissions: string[];
};

export type PermissionMeta = {
  id: number;
  name: string;
  description: string | null;
  displayLabel: string | null;
  displayGroup: string | null;
  dependsOn: string | null;
};

function unwrap<T>(responseData: unknown): T {
    return ((responseData as { data?: T })?.data ?? responseData) as T;
}

export async function listRoles(): Promise<RoleRecord[]> {
    const resp = await api.get(ENDPOINTS.roles.list());
    return unwrap<RoleRecord[]>(resp.data);
}

export async function getUserEffectivePermissions(
    userId: number
): Promise<UserEffectivePermissions> {
    const resp = await api.get(ENDPOINTS.roles.userPermissions(userId));
    return unwrap<UserEffectivePermissions>(resp.data);
}

export async function updateUserPermissions(
    userId: number,
    overrides: PermissionOverride[]
): Promise<void> {
    await api.put(ENDPOINTS.roles.updateUserPermissions(userId), overrides);
}

/** GET /api/v1/roles/permissions — all permissions with metadata */
export async function listAllPermissions(): Promise<PermissionMeta[]> {
  const resp = await api.get(`/roles/permissions`);
  return unwrap<PermissionMeta[]>(resp.data);
}
