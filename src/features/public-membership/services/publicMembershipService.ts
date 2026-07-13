import { ENV } from "@/config/env";
import {
    MemberApplicationStatusResponse,
    MemberApplicationSubmitPayload,
} from "../public-membership-types";

// Same pattern as publicNoticeService.ts — public endpoints live under /api/public,
// not /api/v1, and must never carry the Bearer token (no session exists yet).
const PUBLIC_API_BASE = ENV.API_BASE_URL.replace(/\/api\/v1\/?$/, "/api");

function unwrap<T>(json: any): T {
    return json?.data ?? json;
}

async function handle<T>(res: Response): Promise<T> {
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(json?.message || "Request failed");
    }
    return unwrap<T>(json);
}

export async function sendOtp(email: string): Promise<void> {
    const res = await fetch(`${PUBLIC_API_BASE}/public/member-applications/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
    });
    await handle<void>(res);
}

export async function verifyOtp(email: string, otp: string): Promise<string> {
    const res = await fetch(`${PUBLIC_API_BASE}/public/member-applications/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
    });
    const data = await handle<{ verificationToken: string }>(res);
    return data.verificationToken;
}

export async function submitApplication(
    payload: MemberApplicationSubmitPayload
): Promise<MemberApplicationStatusResponse> {
    const res = await fetch(`${PUBLIC_API_BASE}/public/member-applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    return handle<MemberApplicationStatusResponse>(res);
}

export async function getApplicationStatus(
    referenceCode: string
): Promise<MemberApplicationStatusResponse> {
    const res = await fetch(
        `${PUBLIC_API_BASE}/public/member-applications/status/${encodeURIComponent(referenceCode)}`
    );
    return handle<MemberApplicationStatusResponse>(res);
}
