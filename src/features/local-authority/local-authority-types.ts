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
};

export type UserLookup = {
    id: number;
    username: string;
    memberCode: string;
    personName?: string;
    role: string;
};

export type MyLeadership = {
  myGeoUnitName?: string;
  president?: LocalAuthority;
  secretary?: LocalAuthority;
};
