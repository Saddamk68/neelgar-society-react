import { api } from "../../../services/apiClient";
import { ENDPOINTS } from "../../../config/endpoints";
import { MemberFormValues, DuplicateCheckValues } from "../member.schema";
import { Member, DuplicateCandidate, MemberEditRequest } from "../types";

// ── Shared response unwrapper ─────────────────────────────────────────────────
// All REST responses are wrapped in SocApiResponse<T> with shape { data, message }
function unwrap<T>(res: any): T {
  return res.data?.data ?? res.data;
}

// ── List members (paginated) ──────────────────────────────────────────────────

export type MemberPage = {
  content: Member[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
};

export async function listMembers(
  societyId: number | undefined,
  page = 0,
  size = 30,
  search = "",
  active = true           // ← add this parameter
): Promise<MemberPage> {
  const res = await api.get(ENDPOINTS.members.list(), {
    params: {
      ...(societyId ? { societyId } : {}),
      page,
      size,
      ...(search ? { search } : {}),
      active,             // ← pass to backend
    },
  });
  return unwrap<MemberPage>(res);
}

// ── Get single member ─────────────────────────────────────────────────────────

export async function getMember(memberCode: string): Promise<Member> {
  const res = await api.get(ENDPOINTS.members.get(memberCode));
  return unwrap<Member>(res);
}

// ── Duplicate check ───────────────────────────────────────────────────────────

export async function checkDuplicates(
  values: DuplicateCheckValues
): Promise<DuplicateCandidate[]> {
  const payload = {
    firstName: values.firstName,
    lastName: values.lastName || undefined,
    dob: values.dob || undefined,
  };
  const res = await api.post(ENDPOINTS.members.checkDuplicate(), payload);
  return unwrap<DuplicateCandidate[]>(res);
}

// ── Create member ─────────────────────────────────────────────────────────────

export async function createMember(
  values: MemberFormValues,
  createdBy: string
): Promise<Member> {
  const payload = {
    societyId: values.societyId,
    familyId: values.familyId,
    firstName: values.firstName,
    lastName: values.lastName || undefined,
    gender: values.gender || undefined,
    dob: values.dob || undefined,
    dod: values.dod || undefined,
    contactNumber: values.contactNumber || undefined,
    education: values.education || undefined,
    occupation: values.occupation || undefined,
    maritalStatus: values.maritalStatus || undefined,
    gotraId: values.gotraId || undefined,
    currentAddress: {
      geoUnitId: values.currentAddress.geoUnitId,
    },
    parentalAddress: values.parentalAddress?.geoUnitId
      ? {
        geoUnitId: values.parentalAddress.geoUnitId,
      }
      : undefined,
    createAccount: values.createAccount,
    email: values.createAccount ? values.email || undefined : undefined,
  };

  const res = await api.post(ENDPOINTS.members.create(), payload, {
    headers: { "X-Created-By": createdBy },
  });
  // createMember returns MemberCreationResponse which has a `person` field
  const created = unwrap<any>(res);
  return created.person ?? created;
}

// ── Deactivate member ─────────────────────────────────────────────────────────

export async function deactivateMember(
  memberCode: string,
  updatedBy: string,
  force: boolean = false
): Promise<void> {
  await api.patch(ENDPOINTS.members.deactivate(memberCode), null, {
    headers: { "X-Created-By": updatedBy },
    params: force ? { force: true } : undefined,
  });
}

// ── Reactivate member ─────────────────────────────────────────────────────────

export async function reactivateMember(
  memberCode: string,
  updatedBy: string
): Promise<void> {
  await api.patch(ENDPOINTS.members.reactivate(memberCode), null, {
    headers: { "X-Created-By": updatedBy },
  });
}

// ── Update member ─────────────────────────────────────────────────────────────

export async function updateMember(
  memberCode: string,
  values: MemberFormValues,
  updatedBy: string
): Promise<Member> {
  const payload = {
    societyId: values.societyId,
    familyId: values.familyId,
    firstName: values.firstName,
    lastName: values.lastName || undefined,
    gender: values.gender || undefined,
    dob: values.dob || undefined,
    dod: values.dod || undefined,
    contactNumber: values.contactNumber || undefined,
    education: values.education || undefined,
    occupation: values.occupation || undefined,
    maritalStatus: values.maritalStatus || undefined,
    gotraId: values.gotraId > 0 ? values.gotraId : undefined,
    currentAddress: {
      geoUnitId: values.currentAddress.geoUnitId,
    },
    parentalAddress: values.parentalAddress?.geoUnitId
      ? {
        geoUnitId: values.parentalAddress.geoUnitId,
      }
      : undefined,
    createAccount: false,  // not relevant on update
    email: undefined,
  };

  const res = await api.put(ENDPOINTS.members.update(memberCode), payload, {
    headers: { "X-Created-By": updatedBy },
  });
  return unwrap<Member>(res);
}

// ── Search members ────────────────────────────────────────────────────────────

export async function searchMembers(query: string): Promise<Member[]> {
  const res = await api.get(ENDPOINTS.members.search(), {
    params: { query },
  });
  return unwrap<Member[]>(res);
}

export async function updateBirthOrder(memberCode: string, birthOrder: number) {
  const res = await api.patch(ENDPOINTS.members.birthOrder(memberCode), { birthOrder });
  return unwrap(res);
}

// ── Self-edit requests ────────────────────────────────────────────────────────

export async function submitEditRequest(
  memberCode: string,
  payload: { contactNumber?: string; education?: string; occupation?: string }
): Promise<MemberEditRequest> {
  const res = await api.post(ENDPOINTS.members.submitEditRequest(memberCode), payload);
  return unwrap<MemberEditRequest>(res);
}

export async function getMyLatestEditRequest(memberCode: string): Promise<MemberEditRequest | null> {
  const res = await api.get(ENDPOINTS.members.myEditRequest(memberCode));
  return unwrap<MemberEditRequest | null>(res);
}
