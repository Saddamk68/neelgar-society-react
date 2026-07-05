export type LocalAuthorityRole = "VILLAGE_PRESIDENT" | "VILLAGE_SECRETARY";

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
