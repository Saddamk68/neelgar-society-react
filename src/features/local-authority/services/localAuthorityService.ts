import { api } from "@/services/apiClient";
import { ENDPOINTS } from "@/config/endpoints";
import { LocalAuthority, LocalAuthorityRole, MyLeadership, UserLookup } from "../local-authority-types";

function unwrap<T>(res: any): T {
    return res.data?.data ?? res.data;
}

export async function getByGeoUnit(geoUnitId: number): Promise<LocalAuthority[]> {
    const res = await api.get(ENDPOINTS.localAuthority.byGeoUnit(geoUnitId));
    return unwrap<LocalAuthority[]>(res);
}

export async function assignLocalAuthority(
    userId: number,
    geoUnitId: number,
    roleName: LocalAuthorityRole,
    isPublicVisible: boolean = false
): Promise<LocalAuthority> {
    const res = await api.post(ENDPOINTS.localAuthority.assign(), {
        userId,
        geoUnitId,
        roleName,
        isPublicVisible,
    });
    return unwrap<LocalAuthority>(res);
}

export async function revokeLocalAuthority(scopeId: number): Promise<void> {
    await api.delete(ENDPOINTS.localAuthority.revoke(scopeId));
}

export async function lookupUserByMemberCode(memberCode: string): Promise<UserLookup> {
    const res = await api.get(ENDPOINTS.users.lookupByMemberCode(memberCode));
    return unwrap<UserLookup>(res);
}

export async function getMyLeadership(): Promise<MyLeadership> {
    const res = await api.get(ENDPOINTS.localAuthority.myLeadership());
    return unwrap<MyLeadership>(res);
}
