import { api } from "@/services/apiClient";
import { Announcement } from "../notice-types";

function unwrap<T>(res: any): T {
    return res.data?.data ?? res.data;
}

export async function listAnnouncements(societyId: number): Promise<Announcement[]> {
    const res = await api.get(`/announcements`, { params: { societyId } });
    return unwrap<Announcement[]>(res);
}

export async function createAnnouncement(values: Partial<Announcement>): Promise<Announcement> {
    const res = await api.post(`/announcements`, values);
    return unwrap<Announcement>(res);
}

export async function updateAnnouncement(id: number, values: Partial<Announcement>): Promise<Announcement> {
    const res = await api.put(`/announcements/${id}`, values);
    return unwrap<Announcement>(res);
}

export async function deleteAnnouncement(id: number): Promise<void> {
    await api.delete(`/announcements/${id}`);
}
