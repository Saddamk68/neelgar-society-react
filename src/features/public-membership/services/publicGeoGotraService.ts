import { ENV } from "@/config/env";

const PUBLIC_API_BASE = ENV.API_BASE_URL.replace(/\/api\/v1\/?$/, "/api");

export interface PublicGeoUnit {
    id: number;
    name: string;
    unitType?: string;
}

export interface PublicGotra {
    id: number;
    name: string;
}

async function unwrap<T>(res: Response): Promise<T> {
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.message || "Request failed");
    return json?.data ?? json;
}

export async function listGeoUnitsByLevel(level: string): Promise<PublicGeoUnit[]> {
    const res = await fetch(`${PUBLIC_API_BASE}/public/geo-units?level=${level}`);
    return unwrap<PublicGeoUnit[]>(res);
}

export async function listGeoUnitChildren(parentId: number): Promise<PublicGeoUnit[]> {
    const res = await fetch(`${PUBLIC_API_BASE}/public/geo-units/${parentId}/children`);
    return unwrap<PublicGeoUnit[]>(res);
}

export async function listGotrasBySociety(societyId: number): Promise<PublicGotra[]> {
    const res = await fetch(`${PUBLIC_API_BASE}/public/gotras?societyId=${societyId}`);
    return unwrap<PublicGotra[]>(res);
}
