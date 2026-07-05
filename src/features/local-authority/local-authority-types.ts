export type LocalAuthorityRole = "LOCAL_PRESIDENT" | "LOCAL_SECRETARY";

const ROLE_LABELS: Record<LocalAuthorityRole, string> = {
    LOCAL_PRESIDENT: "Local President",
    LOCAL_SECRETARY: "Local Secretary",
};

export function formatLocalAuthorityRole(roleName: string): string {
    return ROLE_LABELS[roleName as LocalAuthorityRole] ?? roleName;
}

export type LocalAuthority = {
    id: number;
    userId: number;
    username: string;
    personName?: string;
    geoUnitId: number;
    geoUnitName: string;
    roleName: LocalAuthorityRole;
    validFrom: string;
    validTo?: string;
    isActive: boolean;
    accountAutoProvisioned?: boolean;
};

export type PersonLookup = {
    personId: number;
    memberCode: string;
    personName?: string;
    hasUserAccount: boolean;
    currentRole: string | null;
};

export type MyLeadership = {
  myGeoUnitName?: string;
  president?: LocalAuthority;
  secretary?: LocalAuthority;
};
