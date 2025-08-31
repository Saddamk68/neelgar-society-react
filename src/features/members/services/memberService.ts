import { api } from "../../../services/apiClient";
import { ENDPOINTS } from "../../../config/endpoints";

export type MemberListItem = {
  id: number | string;
  name: string;
  flatNo: string;
  phone?: string;
  email?: string;
  createdAt?: string;
};

export type CreateMemberInput = {
  name: string;
  flatNo: string;
  phone?: string;
  email?: string;
  // You can expand this once your backend accepts more fields
};

export async function listMembers(): Promise<MemberListItem[]> {
  const res = await api.get(ENDPOINTS.members.list());
  // adapt if your API returns a wrapper { data: [...] }
  return Array.isArray(res.data) ? res.data : res.data?.data ?? [];
}

export async function getMember(id: string | number): Promise<MemberListItem> {
  const res = await api.get(ENDPOINTS.members.get(id));
  return res.data?.data ?? res.data;
}

export async function createMember(payload: CreateMemberInput): Promise<MemberListItem> {
  const res = await api.post(ENDPOINTS.members.create(), payload);
  return res.data?.data ?? res.data;
}

export async function updateMember(id: string | number, payload: Partial<CreateMemberInput>) {
  const res = await api.put(ENDPOINTS.members.update(id), payload);
  return res.data?.data ?? res.data;
}

export async function deleteMember(id: string | number) {
  const res = await api.delete(ENDPOINTS.members.remove(id));
  return res.data?.data ?? res.data;
}
