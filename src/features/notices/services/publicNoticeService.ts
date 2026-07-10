import { ENV } from "@/config/env";
import { Notice } from "../notice-types";

const PUBLIC_API_BASE = ENV.API_BASE_URL.replace(/\/api\/v1\/?$/, "/api");

export async function getActiveNotices(): Promise<Notice[]> {
    const res = await fetch(`${PUBLIC_API_BASE}/public/notices`);
    if (!res.ok) throw new Error("Failed to load notices");
    const json = await res.json();
    return json.data ?? json;
}
