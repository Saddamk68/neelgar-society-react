import { api } from "../../../services/apiClient";
import { ENDPOINTS } from "../../../config/endpoints";

export type MemberListItem = {
  id: number | string;
  name: string;
  fatherName?: string;
  motherName?: string;
  gotra?: string;
  phone?: string;
};

export type CreateMemberInput = {
  name: string;
  fatherName?: string;
  motherName?: string;
  gotra?: string;
  phone?: string;
};

export async function listMembers(): Promise<MemberListItem[]> {
  const res = await api.get(ENDPOINTS.members.list());

  const raw = Array.isArray(res.data) ? res.data : res.data?.data ?? [];

  // map backend fields -> frontend fields
  return raw.map((m: any) => ({
    id: m.id,
    name: m.name,
    fatherName: m.fatherName ?? "-",  // backend doesn’t provide it → fallback
    motherName: m.motherName ?? "",
    gotra: m.gotra ?? "",
    phone: m.contactNumber ?? m.phone ?? "",
  }));
}

export async function getMember(id: string | number): Promise<MemberListItem> {
  const res = await api.get(ENDPOINTS.members.get(id));
  const m = res.data?.data ?? res.data;
  return {
    id: m.id,
    name: m.name,
    fatherName: m.fatherName ?? "-",
    motherName: m.motherName ?? "",
    gotra: m.gotra ?? "",
    phone: m.contactNumber ?? m.phone ?? "",
  };
}

export async function createMember(payload: CreateMemberInput): Promise<MemberListItem> {
  const res = await api.post(ENDPOINTS.members.create(), payload);
  const m = res.data?.data ?? res.data;
  return {
    id: m.id,
    name: m.name,
    fatherName: m.fatherName ?? "-",
    motherName: m.motherName ?? "",
    gotra: m.gotra ?? "",
    phone: m.contactNumber ?? m.phone ?? "",
  };
}

export async function updateMember(id: string | number, payload: Partial<CreateMemberInput>) {
  const res = await api.put(ENDPOINTS.members.update(id), payload);
  return res.data?.data ?? res.data;
}

export async function deleteMember(id: string | number) {
  const res = await api.delete(ENDPOINTS.members.remove(id));
  return res.data?.data ?? res.data;
}
