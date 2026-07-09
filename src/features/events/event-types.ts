export type EventType =
    | "SAMUHIK_VIVAH"
    | "GENERAL_MEETING"
    | "MEDICAL_CAMP"
    | "SOCIAL"
    | "RELIGIOUS"
    | "OTHER";

export type EventStatus = "DRAFT" | "PUBLISHED" | "CANCELLED" | "COMPLETED";

export const EVENT_TYPE_OPTIONS: { value: EventType; label: string }[] = [
    { value: "SAMUHIK_VIVAH", label: "Samuhik Vivah Samelan" },
    { value: "GENERAL_MEETING", label: "General Meeting" },
    { value: "MEDICAL_CAMP", label: "Medical Camp" },
    { value: "SOCIAL", label: "Social" },
    { value: "RELIGIOUS", label: "Religious" },
    { value: "OTHER", label: "Other" },
];

export type SocietyEvent = {
    id: number;
    title: string;
    eventType: EventType;
    description?: string;
    venue?: string;
    startDateTime: string;   // ISO string from backend
    endDateTime?: string;
    bannerImageUrl?: string;
    status: EventStatus;
    societyId: number;
    createdAt?: string;
    createdBy?: string;
    updatedAt?: string;
    updatedBy?: string;
};
