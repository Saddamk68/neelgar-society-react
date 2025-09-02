import { api } from "../../../services/apiClient";
import { ENDPOINTS } from "../../../config/endpoints";
import { MemberFormValues } from "../member.schema";
import { toBackendPayload, fromBackendResponse } from "../member.mapper";

// For table listings (summary only)
export type MemberListItem = {
  id: number | string;
  name: string;
  fatherName?: string;
  motherName?: string;
  gotra?: string;
  phone?: string;
};

// ---------- PAGINATED RESPONSE ----------
export type PaginatedResponse<T> = {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number; // current page
};

// ---------- LIST (Paginated) ----------
export async function listMembers(page = 0, size = 30, search = ""): Promise<PaginatedResponse<MemberListItem>> {
  const res = await api.get(ENDPOINTS.members.list(), {
    params: { page, size, search },
  });
  const raw = res.data;

  return {
    ...raw,
    content: raw.content.map((m: any) => ({
      id: m.id,
      name: m.name,
      fatherName: m.fatherName ?? "-",
      motherName: m.motherName ?? "",
      gotra: m.gotra ?? "",
      phone: m.contactNumber ?? m.phone ?? "",
    })),
  };
}

// ---------- GET ----------
export async function getMember(id: string | number): Promise<MemberFormValues> {
  const res = await api.get(ENDPOINTS.members.get(id));
  const m = res.data?.data ?? res.data;
  return fromBackendResponse(m);
}

// ---------- CREATE ----------
export async function createMember(
  payload: MemberFormValues
): Promise<MemberFormValues> {
  const res = await api.post(
    ENDPOINTS.members.create(),
    toBackendPayload(payload)
  );
  const m = res.data?.data ?? res.data;
  return fromBackendResponse(m);
}

// ---------- UPDATE ----------
export async function updateMember(
  id: string | number,
  payload: MemberFormValues
): Promise<MemberFormValues> {
  const res = await api.patch(
    ENDPOINTS.members.update(id),
    toBackendPayload(payload)
  );
  const m = res.data?.data ?? res.data;
  return fromBackendResponse(m);
}

// ---------- DELETE ----------
export async function deleteMember(id: string | number) {
  const res = await api.delete(ENDPOINTS.members.remove(id));
  return res.data?.data ?? res.data;
}
