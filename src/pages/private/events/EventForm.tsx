import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import PageHeader from "@/components/layout/PageHeader";
import Select from "@/components/form/Select";
import { eventSchema, EventFormValues } from "@/features/events/event.schema";
import { EVENT_TYPE_OPTIONS, SocietyEvent } from "@/features/events/event-types";
import { createEvent, updateEvent } from "@/features/events/services/eventService";
import { useAuth } from "@/context/AuthContext";
import { useNotify } from "@/services/notifications";
import { ROUTES } from "@/constants/routes";

function inputClass(hasError?: boolean) {
    return [
        "w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 transition",
        hasError ? "border-red-400 ring-1 ring-red-400" : "border-slate-300 focus:ring-primary/40",
    ].join(" ");
}

export default function EventForm({ existing }: { existing?: SocietyEvent }) {
    const { user } = useAuth();
    const notify = useNotify();
    const qc = useQueryClient();
    const navigate = useNavigate();
    const isEdit = !!existing;

    const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<EventFormValues>({
        resolver: zodResolver(eventSchema),
        defaultValues: existing
            ? {
                societyId: existing.societyId,
                title: existing.title,
                eventType: existing.eventType,
                description: existing.description ?? "",
                venue: existing.venue ?? "",
                startDateTime: existing.startDateTime?.slice(0, 16), // trim to datetime-local format
                endDateTime: existing.endDateTime?.slice(0, 16) ?? "",
                bannerImageUrl: existing.bannerImageUrl ?? "",
            }
            : {
                societyId: user?.societyId ?? 0,
                title: "",
                eventType: "GENERAL_MEETING",
                description: "",
                venue: "",
                startDateTime: "",
                endDateTime: "",
                bannerImageUrl: "",
            },
    });

    const mutation = useMutation({
        mutationFn: (values: EventFormValues) =>
            isEdit ? updateEvent(existing!.id, values) : createEvent(values),
        onSuccess: () => {
            notify.success(isEdit ? "Event updated." : "Event created.");
            qc.invalidateQueries({ queryKey: ["events"] });
            navigate(ROUTES.PRIVATE.EVENTS);
        },
        onError: (err: any) =>
            notify.error(err?.response?.data?.message || "Failed to save event."),
    });

    return (
        <div className="max-w-2xl mx-auto space-y-4">
            <PageHeader title={isEdit ? "Edit Event" : "Add Event"} backTo={ROUTES.PRIVATE.EVENTS} />

            <form
                onSubmit={handleSubmit((v) => mutation.mutate(v))}
                className="bg-white rounded-xl shadow p-6 space-y-4"
            >
                <div>
                    <label className="text-sm font-medium text-slate-700">Title</label>
                    <input {...register("title")} className={inputClass(!!errors.title)} placeholder="Event title" />
                    {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
                </div>

                <div>
                    <label className="text-sm font-medium text-slate-700">Event Type</label>
                    <Select
                        value={watch("eventType")}
                        onChange={(v) => setValue("eventType", v as EventFormValues["eventType"])}
                        options={EVENT_TYPE_OPTIONS}
                        hasError={!!errors.eventType}
                    />
                </div>

                <div>
                    <label className="text-sm font-medium text-slate-700">Description</label>
                    <textarea {...register("description")} rows={3} className={inputClass()} placeholder="Optional description" />
                </div>

                <div>
                    <label className="text-sm font-medium text-slate-700">Venue</label>
                    <input {...register("venue")} className={inputClass()} placeholder="Optional venue" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-slate-700">Start Date & Time</label>
                        <input
                            type="datetime-local"
                            {...register("startDateTime")}
                            className={inputClass(!!errors.startDateTime)}
                        />
                        {errors.startDateTime && <p className="text-xs text-red-500 mt-1">{errors.startDateTime.message}</p>}
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700">End Date & Time</label>
                        <input type="datetime-local" {...register("endDateTime")} className={inputClass()} />
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <button
                        type="button"
                        onClick={() => navigate(ROUTES.PRIVATE.EVENTS)}
                        className="px-4 py-2 rounded-md border border-slate-300 text-sm hover:bg-slate-50 transition"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={mutation.isPending}
                        className="px-4 py-2 rounded-md bg-primary text-white text-sm hover:bg-primary/90 disabled:opacity-60 transition"
                    >
                        {mutation.isPending ? "Saving…" : isEdit ? "Save Changes" : "Create Event"}
                    </button>
                </div>
            </form>
        </div>
    );
}
