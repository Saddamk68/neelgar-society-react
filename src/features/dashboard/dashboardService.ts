import { api } from "../../services/apiClient";
import { ENDPOINTS } from "../../config/endpoints";

export type DashboardStats = {
    societyName: string;
    societyCode: string;
    totalMembers: number;
    totalFamilies: number;
    newMembersThisMonth: number;
    pendingUsers?: number; // null/absent for non-admin roles
};

export async function getDashboardStats(): Promise<DashboardStats> {
    const res = await api.get(ENDPOINTS.dashboard.stats());
    return res.data?.data ?? res.data;
}
