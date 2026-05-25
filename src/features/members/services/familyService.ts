import { api } from "../../../services/apiClient";
import { ENDPOINTS } from "../../../config/endpoints";
import { Family, Member } from "../types";

function unwrap<T>(res: any): T {
    return res.data?.data ?? res.data;
}

// ── Get all families under a society ─────────────────────────────────────────

export async function getFamiliesBySociety(
    societyId: number,
    clanCode?: string,
    isActive: boolean = true
): Promise<Family[]> {
    const res = await api.get(ENDPOINTS.families.list(), {
        params: {
            societyId,
            isActive,
            ...(clanCode ? { clanCode } : {}),
        },
    });
    return unwrap<Family[]>(res);
}

// ── Search families (by head name or village) ─────────────────────────────────

export async function searchFamilies(
    societyId: number,
    headName?: string,
    village?: string
): Promise<Family[]> {
    const res = await api.get(ENDPOINTS.families.search(), {
        params: {
            societyId,
            ...(headName ? { headName } : {}),
            ...(village ? { village } : {}),
        },
    });
    return unwrap<Family[]>(res);
}

// ── Create a new family ───────────────────────────────────────────────────────

export async function createFamily(
    societyId: number,
    village: string,
    createdBy: string,
    clanCode?: string,
    clanName?: string,
): Promise<Family> {
    const res = await api.post(
        ENDPOINTS.families.create(),
        { societyId, village, clanCode, clanName },
        { headers: { "X-Created-By": createdBy } }
    );
    return unwrap<Family>(res);
}

// ── Get family by code ────────────────────────────────────────────────────────

export async function getFamily(familyCode: string): Promise<Family> {
    const res = await api.get(ENDPOINTS.families.get(familyCode));
    return unwrap<Family>(res);
}

// ── Get members of a family ───────────────────────────────────────────────────

export async function getFamilyMembers(
    familyCode: string,
    includeInactive: boolean = false
): Promise<Member[]> {
    const res = await api.get(ENDPOINTS.families.members(familyCode), {
        params: includeInactive ? { includeInactive: true } : undefined,
    });
    return unwrap<Member[]>(res);
}

// ── Update family details ─────────────────────────────────────────────────────

export async function updateFamily(
    familyCode: string,
    societyId: number,
    village: string,
    updatedBy: string,
    clanCode?: string,
    clanName?: string,
): Promise<Family> {
    const res = await api.patch(
        ENDPOINTS.families.get(familyCode),
        {
            societyId,
            village,
            clanCode: clanCode?.trim().toUpperCase() || undefined,
            clanName: clanName?.trim() || undefined,
        },
        { headers: { "X-Updated-By": updatedBy } }
    );
    return unwrap<Family>(res);
}

// ── Reassign family head ──────────────────────────────────────────────────────

export async function reassignFamilyHead(
    familyCode: string,
    newHeadMemberCode: string,
    updatedBy: string
): Promise<Family> {
    const res = await api.patch(
        ENDPOINTS.families.reassignHead(familyCode),
        { newHeadMemberCode },
        { headers: { "X-Created-By": updatedBy } }
    );
    return unwrap<Family>(res);
}

// ── Get distinct clan codes for a society ────────────────────────────────────

export async function getDistinctClans(societyId: number): Promise<string[]> {
    const res = await api.get(ENDPOINTS.families.clans(), {
        params: { societyId },
    });
    return unwrap<string[]>(res);
}

// ── Family reassignment ───────────────────────────────────────────────────────

export type ReassignmentReason = "MARRIAGE" | "ADMINISTRATIVE";

export type FamilyReassignmentPayload = {
  personMemberCode: string;
  targetFamilyCode?: string;       // omit to create a new family
  reason: ReassignmentReason;
  spouseMemberCode?: string;       // only for MARRIAGE
  effectiveDate?: string;          // ISO date string e.g. "2025-04-01"
  additionalMemberCodes?: string[];
};

export type FamilyReassignmentResult = {
  person: import("../types").Member;
  sourceFamily: import("../types").Family | null;
  targetFamily: import("../types").Family;
};

export async function reassignFamily(
  payload: FamilyReassignmentPayload,
  updatedBy: string
): Promise<FamilyReassignmentResult> {
  const res = await api.post(
    ENDPOINTS.families.reassign(),
    payload,
    { headers: { "X-Created-By": updatedBy } }
  );
  return unwrap<FamilyReassignmentResult>(res);
}
