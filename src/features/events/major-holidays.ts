// Major Islamic holidays fall on fixed Hijri (month, day) dates every year —
// matching on the numeric date is more reliable than matching the holiday
// name text, which AlAdhan doesn't spell consistently.
const MAJOR_HIJRI_DATES: { month: number; day: number; label: string }[] = [
    { month: 1, day: 1, label: "Islamic New Year (Al-Hijra)" },
    { month: 1, day: 10, label: "Ashura" },
    { month: 3, day: 12, label: "Mawlid an-Nabi (Milad-un-Nabi)" },
    { month: 7, day: 27, label: "Isra and Mi'raj" },
    { month: 9, day: 27, label: "Laylat al-Qadr" }, // commonly observed date
    { month: 10, day: 1, label: "Eid al-Fitr" },
    { month: 12, day: 10, label: "Eid al-Adha" },
];

export function isMajorHoliday(hijriMonth?: number, hijriDay?: number): boolean {
    if (!hijriMonth || !hijriDay) return false;
    return MAJOR_HIJRI_DATES.some((d) => d.month === hijriMonth && d.day === hijriDay);
}

// Prefer the API's own name (accurate year-to-year phrasing); fall back
// to our label only if the API didn't return a name for that date.
export function majorHolidayLabel(hijriMonth?: number, hijriDay?: number, apiName?: string | null): string | undefined {
    if (!isMajorHoliday(hijriMonth, hijriDay)) return undefined;
    return apiName || MAJOR_HIJRI_DATES.find((d) => d.month === hijriMonth && d.day === hijriDay)?.label;
}

// Akhri Jumma (last Friday of Ramadan) has no fixed day-number — it shifts
// every year depending on which day Ramadan starts and how many Fridays
// fall within it. Find it by scanning the fetched month's Hijri data for
// Ramadan (month 9) Fridays and picking the one with the highest day number.
export function findAkhriJummaDate(
    hijriDays: { gregorianDate: string; hijriMonth: number; hijriDay: number }[]
): string | undefined {
    const ramadanFridays = hijriDays.filter(
        (h) => h.hijriMonth === 9 && new Date(h.gregorianDate).getDay() === 5
    );
    if (ramadanFridays.length === 0) return undefined;
    return ramadanFridays.reduce((latest, cur) => (cur.hijriDay > latest.hijriDay ? cur : latest)).gregorianDate;
}
