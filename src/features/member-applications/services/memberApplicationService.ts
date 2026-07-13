import { api } from "@/services/apiClient";
import { ENDPOINTS } from "@/config/endpoints";

function unwrap<T>(res: any): T {
    return res.data?.data ?? res.data;
}

// ── Types ─────────────────────────────────────────────────────────────────

export type ApplicationStatus =
    | "PENDING"
    | "UNDER_REVIEW"
    | "NEEDS_INFO"
    | "APPROVED"
    | "REJECTED"
    | "WITHDRAWN";

export interface MemberApplicationSummary {
    id: number;
    referenceCode: string;
    status: ApplicationStatus;
    firstName: string;
    lastName: string;
    dob: string;
    geoUnitName: string;
    emailVerified: boolean;
    mobileVerified: boolean;
    submittedAt: string;
}

export interface PersonDuplicateCandidate {
    id: number;
    memberCode: string;
    firstName: string;
    lastName: string;
    dob?: string;
}

export interface MemberApplicationDetail {
    id: number;
    referenceCode: string;
    status: ApplicationStatus;
    firstName: string;
    lastName: string;
    gender: string;
    dob: string;
    maritalStatus: string;
    gotraId: number;
    gotraName: string;
    contactNumber?: string;
    email: string;
    emailVerified: boolean;
    mobileVerified: boolean;
    geoUnitId: number;
    geoUnitName: string;
    village?: string;
    tahsil?: string;
    district?: string;
    state?: string;
    claimedFamilyCode?: string;
    resolvedFamilyId?: number;
    resolvedFamilyCode?: string;
    photoPath?: string;
    relationshipClaim?: string;
    approvedMemberCode?: string;
    reviewedBy?: string;
    reviewedAt?: string;
    reviewNotes?: string;
    rejectionReason?: string;
    submittedAt: string;
    duplicateCandidates: PersonDuplicateCandidate[];
}

export type ApplicationPage = {
    content: MemberApplicationSummary[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
};

// ── Service functions ────────────────────────────────────────────────────

export async function listApplications(
    status: ApplicationStatus,
    page = 0,
    size = 30
): Promise<ApplicationPage> {
    const res = await api.get(ENDPOINTS.memberApplications.list(), {
        params: { status, page, size },
    });
    return unwrap<ApplicationPage>(res);
}

export async function getApplicationDetail(id: number): Promise<MemberApplicationDetail> {
    const res = await api.get(ENDPOINTS.memberApplications.get(id));
    return unwrap<MemberApplicationDetail>(res);
}

export async function approveApplication(
    id: number,
    payload: { resolvedFamilyId?: number; notes?: string }
): Promise<MemberApplicationDetail> {
    const res = await api.patch(ENDPOINTS.memberApplications.approve(id), payload);
    return unwrap<MemberApplicationDetail>(res);
}

export async function rejectApplication(
    id: number,
    rejectionReason: string
): Promise<MemberApplicationDetail> {
    const res = await api.patch(ENDPOINTS.memberApplications.reject(id), { rejectionReason });
    return unwrap<MemberApplicationDetail>(res);
}

export async function requestMoreInfo(
    id: number,
    notes: string
): Promise<MemberApplicationDetail> {
    const res = await api.patch(ENDPOINTS.memberApplications.needsInfo(id), { notes });
    return unwrap<MemberApplicationDetail>(res);
}

export async function markMobileVerified(id: number): Promise<MemberApplicationDetail> {
    const res = await api.patch(ENDPOINTS.memberApplications.markMobileVerified(id), {});
    return unwrap<MemberApplicationDetail>(res);
}
