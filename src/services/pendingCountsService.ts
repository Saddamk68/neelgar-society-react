import { api } from "./apiClient";

export async function getPendingApplicationCount(): Promise<number> {
    const res = await api.get("/member-applications/counts");
    const counts = res.data?.data ?? res.data;
    return counts?.PENDING ?? 0;
}

export async function getPendingEditRequestCount(societyId: number): Promise<number> {
    const res = await api.get("/member-edit-requests/count", { params: { societyId } });
    return res.data?.data ?? res.data ?? 0;
}
