import { SocietyEvent } from "./event-types";

export type HijriDay = {
    gregorianDate: string; // "YYYY-MM-DD"
    hijriDay: number;
    hijriMonth: number;
    hijriMonthName: string;
    hijriYear: number;
    holidayName?: string;
};

export type PublicEvent = Pick<SocietyEvent, "id" | "title" | "eventType" | "description" | "venue" | "startDateTime" | "endDateTime" | "bannerImageUrl">;

export type CalendarMonth = {
    month: number;
    year: number;
    events: PublicEvent[];
    hijriDays: HijriDay[];
};
