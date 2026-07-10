import { ENV } from "@/config/env";
import { CalendarMonth } from "../calendar-types";
import { PublicEvent } from "../calendar-types";


// API_BASE_URL is ".../api/v1" — this endpoint lives at ".../api/public/..."
const PUBLIC_API_BASE = ENV.API_BASE_URL.replace(/\/api\/v1\/?$/, "/api");

export async function getPublicCalendarMonth(month: number, year: number): Promise<CalendarMonth> {
    const res = await fetch(`${PUBLIC_API_BASE}/public/calendar?month=${month}&year=${year}`);
    if (!res.ok) throw new Error("Failed to load calendar");
    const json = await res.json();
    return json.data ?? json;
}

export async function getUpcomingEvents(limit = 5): Promise<PublicEvent[]> {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [current, next] = await Promise.all([
    getPublicCalendarMonth(now.getMonth() + 1, now.getFullYear()),
    getPublicCalendarMonth(nextMonthDate.getMonth() + 1, nextMonthDate.getFullYear()),
  ]);

  return [...current.events, ...next.events]
    .filter((e) => new Date(e.startDateTime).getTime() >= startOfToday.getTime())
    .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime())
    .slice(0, limit);
}
