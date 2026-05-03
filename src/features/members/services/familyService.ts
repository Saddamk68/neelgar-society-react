import { api } from "../../../services/apiClient";
import { ENDPOINTS } from "../../../config/endpoints";
import { Family, Member } from "../types";

function unwrap<T>(res: any): T {
    return res.data?.data ?? res.data;
}

// ── Get all families under a society ─────────────────────────────────────────

export async function getFamiliesBySociety(societyId: number): Promise<Family[]> {
    const res = await api.get(ENDPOINTS.families.list(), {
        params: { societyId },
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
    createdBy: string
): Promise<Family> {
    const res = await api.post(
        ENDPOINTS.families.create(),
        { societyId, village },
        { headers: { "X-Created-By": createdBy } }
    );
    return unwrap<Family>(res);
}

// ── Get family by code ────────────────────────────────────────────────────────

export async function getFamily(familyCode: string): Promise<Family> {
    const res = await api.get(ENDPOINTS.families.get(familyCode));
    return unwrap<Family>(res);
}

// ── Get all active members of a family ────────────────────────────────────────

export async function getFamilyMembers(familyCode: string): Promise<Member[]> {
  const res = await api.get(ENDPOINTS.families.members(familyCode));
  return unwrap<Member[]>(res);
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
