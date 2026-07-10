import { z } from "zod";

export const eventSchema = z.object({
    societyId: z.number(),
    title: z.string().min(1, "Title is required").max(150),
    eventType: z.enum([
        "SAMUHIK_VIVAH",
        "GENERAL_MEETING",
        "MEDICAL_CAMP",
        "SOCIAL",
        "RELIGIOUS",
        "OTHER",
    ]),
    description: z.string().optional(),
    venue: z.string().max(255).optional(),
    startDateTime: z.string().min(1, "Start date/time is required"),
    endDateTime: z.string().optional(),
    bannerImageUrl: z.string().optional(),
});

export type EventFormValues = z.infer<typeof eventSchema>;
