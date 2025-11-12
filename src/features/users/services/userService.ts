import type { UserProfile, UserRecord } from "../types";
import { api } from "../../../services/apiClient";
import { ENDPOINTS } from "../../../config/endpoints";

/**
 * Fetch all users from the backend (admin-only endpoint).
 * Maps backend UserDto objects to frontend UserRecord format.
 */
export async function listUsers(): Promise<UserRecord[]> {
  try {
    const response = await api.get(ENDPOINTS.users.getAll());
    const content = response.data?.content ?? [];

    return content.map((u: any) => ({
      id: u.id,
      name: u.username,
      email: u.email,
      role: (u.role ?? "MEMBER").toLowerCase(),
      active: u.active ?? true,
      createdAt: u.createdAt ?? null,
    })) as UserRecord[];
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
}

/**
 * Fetch the authenticated user's profile.
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
