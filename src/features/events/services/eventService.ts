import { api } from "@/services/apiClient";
import { ENDPOINTS } from "@/config/endpoints";
import { SocietyEvent } from "../event-types";
import { EventFormValues } from "../event.schema";

function unwrap<T>(res: any): T {
    return res.data?.data ?? res.data;
}

export async function listEvents(societyId: number): Promise<SocietyEvent[]> {
    const res = await api.get(ENDPOINTS.events.list(), { params: { societyId } });
    return unwrap<SocietyEvent[]>(res);
}

export async function createEvent(values: EventFormValues): Promise<SocietyEvent> {
    const res = await api.post(ENDPOINTS.events.create(), values);
    return unwrap<SocietyEvent>(res);
}

export async function updateEvent(id: number, values: EventFormValues): Promise<SocietyEvent> {
    const res = await api.put(ENDPOINTS.events.update(id), values);
    return unwrap<SocietyEvent>(res);
}

export async function publishEvent(id: number): Promise<SocietyEvent> {
    const res = await api.post(ENDPOINTS.events.publish(id));
    return unwrap<SocietyEvent>(res);
}

export async function cancelEvent(id: number): Promise<SocietyEvent> {
    const res = await api.post(ENDPOINTS.events.cancel(id));
    return unwrap<SocietyEvent>(res);
}

export async function deleteEvent(id: number): Promise<void> {
    await api.delete(ENDPOINTS.events.delete(id));
}
