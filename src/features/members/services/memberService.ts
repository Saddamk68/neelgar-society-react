import { api, getAuthToken } from "../../../services/apiClient";
import { ENDPOINTS } from "../../../config/endpoints";
import { MemberFormValues } from "../member.schema";
import { toBackendPayload, fromBackendResponse } from "../member.mapper";

export type MemberListItem = {
  id: number | string;
  name: string;
  fatherName?: string;
  motherName?: string;
  gotra?: string;
  phone?: string;
  currentVillage?: string;
};

export type PaginatedResponse<T> = {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
};

export async function listMembers(
  page = 0,
  size = 30,
  search = ""
): Promise<PaginatedResponse<MemberListItem>> {
  const res = await api.get(ENDPOINTS.members.list(), { params: { page, size, search } });
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
      currentVillage: m.address?.currentVillage ?? "",
    })),
  };
}

export async function getMember(id: string | number): Promise<MemberFormValues> {
  const res = await api.get(ENDPOINTS.members.get(id));
  const member = res.data?.data ?? res.data;

  // ✅ return data directly (don’t transform or strip fields)
  return member;
}


export async function createMember(payload: MemberFormValues): Promise<MemberFormValues> {
  const res = await api.post(ENDPOINTS.members.create(), toBackendPayload(payload));
  const m = res.data?.data ?? res.data;
  return fromBackendResponse(m);
}

export async function updateMember(id: string | number, payload: MemberFormValues): Promise<MemberFormValues> {
  const res = await api.patch(ENDPOINTS.members.update(id), toBackendPayload(payload));
  const m = res.data?.data ?? res.data;
  return fromBackendResponse(m);
}

export async function deleteMember(id: string | number) {
  const res = await api.delete(ENDPOINTS.members.remove(id));
  return res.data?.data ?? res.data;
}

// Upload file and return FileResponseDto (UUID)
export async function uploadFile(file: File, createdBy = "system") {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("createdBy", createdBy);

  const token = getAuthToken();

  const res = await api.post("/files/upload", formData, {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  });

  return res.data; // FileResponseDto with id, etc.
}

