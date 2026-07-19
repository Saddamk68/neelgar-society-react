import { api } from "../../../services/apiClient";
import { ENDPOINTS } from "../../../config/endpoints";
import { MemberEditRequest } from "../types";

function unwrap<T>(res: any): T {
    return res.data?.data ?? res.data;
}

export async function listPendingEditRequests(societyId: number): Promise<MemberEditRequest[]> {
    const res = await api.get(ENDPOINTS.memberEditRequests.listPending(), {
        params: { societyId },
    });
    return unwrap<MemberEditRequest[]>(res);
}

export async function approveEditRequest(id: number): Promise<MemberEditRequest> {
    const res = await api.patch(ENDPOINTS.memberEditRequests.approve(id));
    return unwrap<MemberEditRequest>(res);
}

export async function rejectEditRequest(id: number, reason: string): Promise<MemberEditRequest> {
    const res = await api.patch(ENDPOINTS.memberEditRequests.reject(id), { reason });
    return unwrap<MemberEditRequest>(res);
}
