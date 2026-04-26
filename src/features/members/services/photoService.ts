import { api, getAuthToken } from "../../../services/apiClient";
import { ENDPOINTS } from "../../../config/endpoints";
import { ENV } from "../../../config/env";

// ── Upload photo ──────────────────────────────────────────────────────────────

export async function uploadMemberPhoto(
    memberCode: string,
    file: File
): Promise<void> {
    const formData = new FormData();
    formData.append("file", file);

    await api.post(ENDPOINTS.members.uploadPhoto(memberCode), formData);
}

// ── Delete photo ──────────────────────────────────────────────────────────────

export async function deleteMemberPhoto(memberCode: string): Promise<void> {
    await api.delete(ENDPOINTS.members.deletePhoto(memberCode));
}

// ── Build authenticated photo URL ─────────────────────────────────────────────
// Photos are auth-gated — we can't use a plain <img src="..."> tag.
// Instead we fetch the image as a blob and create an object URL.
// Call revokeMemberPhotoUrl() when the component unmounts to free memory.

export async function fetchMemberPhotoUrl(memberCode: string): Promise<string> {
    const token = getAuthToken();
    const url = `${(ENV.API_BASE_URL ?? "").replace(/\/$/, "")}${ENDPOINTS.members.uploadPhoto(memberCode)}`;

    const resp = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!resp.ok) throw new Error("Photo not found");

    const blob = await resp.blob();
    return URL.createObjectURL(blob);
}

export function revokeMemberPhotoUrl(objectUrl: string): void {
    URL.revokeObjectURL(objectUrl);
}
