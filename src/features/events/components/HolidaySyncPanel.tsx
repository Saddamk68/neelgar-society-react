import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { api } from "@/services/apiClient";
import { useNotify } from "@/services/notifications";

async function syncHolidays(year: number) {
    await api.post(`/holidays/sync`, null, { params: { year } });
}

export default function HolidaySyncPanel() {
    const notify = useNotify();
    const [year, setYear] = useState(new Date().getFullYear());

    const mutation = useMutation({
        mutationFn: (y: number) => syncHolidays(y),
        onSuccess: () => notify.success(`Hijri calendar synced for ${year}.`),
        onError: (err: any) =>
            notify.error(err?.response?.data?.message || "Sync failed. Check server logs."),
    });

    return (
        <div className="bg-white rounded-xl shadow p-5 flex items-center justify-between gap-4 flex-wrap">
            <div>
                <h3 className="text-sm font-semibold text-slate-700">Hijri Calendar Sync</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                    Fetches Hijri dates + Islamic holidays for a year from AlAdhan.
                </p>
            </div>
            <div className="flex items-center gap-2">
                <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-24 border border-slate-300 rounded-md px-3 py-2 text-sm"
                />
                <button
                    onClick={() => mutation.mutate(year)}
                    disabled={mutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-white text-sm hover:bg-primary/90 disabled:opacity-60 transition"
                >
                    <RefreshCw className={`w-4 h-4 ${mutation.isPending ? "animate-spin" : ""}`} />
                    {mutation.isPending ? "Syncing…" : "Sync Year"}
                </button>
            </div>
        </div>
    );
}
