import type { UserProfile, UserRecord } from "../types";
import type { Role } from "../../../constants/roles";
import { api } from "../../../services/apiClient";
import { ENDPOINTS } from "../../../config/endpoints";

/**
 * Fetch all users
 */
export async function listUsers(): Promise<UserRecord[]> {
  try {
    const response = await api.get(ENDPOINTS.users.getAll());
    const content = response.data?.content ?? [];

    return content.map((u: any) => ({
      id: u.id,
      name: u.username,
      email: u.email,
      role: (u.role ?? "MEMBER").toUpperCase() as Role,
      active: u.active ?? true,
      createdAt: u.createdAt ?? null,
    })) as UserRecord[];
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
}

/**
 * Update user role (Admin-only endpoint)
 */
export async function updateUserRole(userId: number, role: Role) {
  try {
    const response = await api.patch(ENDPOINTS.users.update(userId), {
      role,
      active: true, // preserve active flag unless you want to edit it
    });

    return response.data;
  } catch (error) {
    console.error(`Error updating role for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Fetch the authenticated user's profile
 */
export async function getCurrentUser(): Promise<UserProfile> {
  try {
    const response = await api.get(ENDPOINTS.users.current());
    return response.data;
  } catch (error) {
    console.error("Error fetching current user:", error);
    throw error;
  }
}
