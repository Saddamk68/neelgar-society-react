import { ENV } from "@/config/env";

export type PublicOfficer = {
    status: "VACANT" | "ASSIGNED" | "ASSIGNED_PRIVATE";
    name?: string;
    since?: string;
};

export type PublicVillageLeadership = {
    geoUnitId: number;
    villageName: string;
    districtName?: string;
    stateName?: string;
    president: PublicOfficer;
    secretary: PublicOfficer;
};

// API_BASE_URL is ".../api/v1" — this endpoint lives at ".../api/public/..."
const PUBLIC_API_BASE = ENV.API_BASE_URL.replace(/\/api\/v1\/?$/, "/api");

export async function getPublicLeadershipDirectory(): Promise<PublicVillageLeadership[]> {
    const res = await fetch(`${PUBLIC_API_BASE}/public/leadership`);
    if (!res.ok) throw new Error("Failed to load leadership directory");
    const json = await res.json();
    return json.data ?? json;
}
