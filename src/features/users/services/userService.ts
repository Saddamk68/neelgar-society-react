import type { UserRecord } from "../types";
import { api } from "../../../services/apiClient";
import { ENDPOINTS } from "../../../config/endpoints";

/**
 * Fetch all users from the backend (admin-only endpoint).
 * Maps backend UserDto objects to frontend UserRecord format.
 */
export async function listUsers(): Promise<UserRecord[]> {
  try {
    const response = await api.get(`${ENDPOINTS.users.base}/get-all-users`);
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
