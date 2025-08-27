import { api } from "../../../services/apiClient";
import { ENDPOINTS } from "../../../config/endpoints";
import { FEATURES } from "../../../config/features";
import type { Member } from "../types";

// simple mock data (local only until backend is ready)
const MOCK_MEMBERS: Member[] = [
  { id: "1", name: "Asha Patel", flatNo: "A-101", phone: "9876543210", email: "asha@example.com" },
  { id: "2", name: "Rohit Kumar", flatNo: "B-204", phone: "9876501234", email: "rohit@example.com" },
  { id: "3", name: "Neha Singh", flatNo: "C-305", phone: "9867002233", email: "neha@example.com" },
];

export async function listMembers(): Promise<Member[]> {
  if (FEATURES.USE_MOCK_API) {
    // simulate network
    await new Promise((r) => setTimeout(r, 250));
    return MOCK_MEMBERS;
  }
  const res = await api.get(ENDPOINTS.members.base);
  return res.data;
}

export async function createMember(payload: Omit<Member, "id" | "createdAt">): Promise<Member> {
  if (FEATURES.USE_MOCK_API) {
    await new Promise((r) => setTimeout(r, 250));
    return { id: String(Date.now()), createdAt: new Date().toISOString(), ...payload };
  }
  const res = await api.post(ENDPOINTS.members.base, payload);
  return res.data;
}
