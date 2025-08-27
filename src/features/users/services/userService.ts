import { FEATURES } from "../../../config/features";
import type { UserRecord } from "../types";
import { api } from "../../../services/apiClient";
import { ENDPOINTS } from "../../../config/endpoints";

const MOCK_USERS: UserRecord[] = [
  { id: "u1", name: "Admin User", email: "admin@neelgar.org", role: "admin" },
  { id: "u2", name: "Rohit Kumar", email: "rohit@neelgar.org", role: "member" },
  { id: "u3", name: "Asha Patel", email: "asha@neelgar.org", role: "member" },
];

export async function listUsers(): Promise<UserRecord[]> {
  if (FEATURES.USE_MOCK_API) {
    await new Promise((r) => setTimeout(r, 250));
    return MOCK_USERS;
  }
  const res = await api.get(ENDPOINTS.users.base);
  return res.data;
}
