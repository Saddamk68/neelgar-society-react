import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Plus, CheckCircle2, Ban } from "lucide-react";
import { listEvents, publishEvent, cancelEvent, deleteEvent } from "@/features/events/services/eventService";
import { SocietyEvent } from "@/features/events/event-types";
import { useAuth } from "@/context/AuthContext";
import { useNotify } from "@/services/notifications";
import PageHeader from "@/components/layout/PageHeader";
import ConfirmDialog from "@/components/ConfirmDialog";
import { ROUTES } from "@/constants/routes";
import HolidaySyncPanel from "@/features/events/components/HolidaySyncPanel";
import EventCalendar from "@/features/events/components/EventCalendar";

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  PUBLISHED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  COMPLETED: "bg-blue-100 text-blue-700",
};

export default function Events() {
  const { user } = useAuth();
  const notify = useNotify();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const societyId = user?.societyId ?? 0;
  const [cancelTarget, setCancelTarget] = useState<SocietyEvent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SocietyEvent | null>(null);

  const { data: events = [], isLoading, isError } = useQuery<SocietyEvent[]>({
    queryKey: ["events", societyId],
    queryFn: () => listEvents(societyId),
    enabled: societyId > 0,
  });

  const publishMutation = useMutation({
    mutationFn: (id: number) => publishEvent(id),
    onSuccess: () => {
      notify.success("Event published.");
      qc.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (err: any) => notify.error(err?.response?.data?.message || "Failed to publish."),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => cancelEvent(id),
    onSuccess: () => {
      notify.success("Event cancelled.");
      qc.invalidateQueries({ queryKey: ["events"] });
      setCancelTarget(null);
    },
    onError: (err: any) => notify.error(err?.response?.data?.message || "Failed to cancel."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteEvent(id),
    onSuccess: () => {
      notify.success("Event deleted.");
      qc.invalidateQueries({ queryKey: ["events"] });
      setDeleteTarget(null);
    },
    onError: (err: any) => notify.error(err?.response?.data?.message || "Failed to delete."),
  });

  return (
    <div className="w-full space-y-4">
      <PageHeader
        title="Events"
        subtitle="Manage Samuhik Vivah, meetings, camps and other society events."
        actions={
          <button
            onClick={() => navigate(`${ROUTES.PRIVATE.EVENTS}/new`)}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-white text-sm hover:bg-primary/90 transition"
          >
            <Plus className="w-4 h-4" />
            Add Event
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div className="lg:col-span-2 space-y-4">
          <HolidaySyncPanel />
          <div className="bg-white rounded-xl shadow overflow-hidden">
            {isLoading && <div className="p-6 text-sm text-slate-400">Loading events…</div>}
            {isError && <div className="p-6 text-sm text-red-500">Failed to load events.</div>}
            {!isLoading && !isError && events.length === 0 && (
              <div className="p-10 text-center text-slate-400 text-sm">
                No events yet. Click "Add Event" to create the first one.
              </div>
            )}

            {!isLoading && !isError && events.length > 0 && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50/60 text-left">
                    <th className="px-4 py-3 font-medium text-slate-500">Title</th>
                    <th className="px-4 py-3 font-medium text-slate-500">Type</th>
                    <th className="px-4 py-3 font-medium text-slate-500">Start</th>
                    <th className="px-4 py-3 font-medium text-slate-500">Status</th>
                    <th className="px-4 py-3 font-medium text-slate-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((e) => (
                    <tr key={e.id} className="border-b last:border-0 hover:bg-slate-50/50 transition">
                      <td className="px-4 py-3 font-medium text-slate-800">{e.title}</td>
                      <td className="px-4 py-3 text-slate-600">{e.eventType.replace("_", " ")}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {new Date(e.startDateTime).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[e.status]}`}>
                          {e.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {e.status === "DRAFT" && (
                            <button
                              onClick={() => publishMutation.mutate(e.id)}
                              disabled={publishMutation.isPending}
                              className="p-1.5 rounded-lg hover:bg-green-50 transition text-green-600 disabled:opacity-40"
                              title="Publish"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          {(e.status === "DRAFT" || e.status === "PUBLISHED") && (
                            <button
                              onClick={() => setCancelTarget(e)}
                              className="p-1.5 rounded-lg hover:bg-amber-50 transition text-amber-600"
                              title="Cancel"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => navigate(`${ROUTES.PRIVATE.EVENTS}/${e.id}/edit`)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 transition text-primary"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {e.status === "DRAFT" && (
                            <button
                              onClick={() => setDeleteTarget(e)}
                              className="p-1.5 rounded-lg hover:bg-red-50 transition text-red-500"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="lg:col-span-1 lg:sticky lg:top-4">
          <EventCalendar />
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => cancelTarget && cancelMutation.mutate(cancelTarget.id)}
        title="Cancel event"
        message={`Cancel "${cancelTarget?.title}"? It will be removed from the public calendar.`}
        confirmLabel="Cancel Event"
        variant="warning"
        loading={cancelMutation.isPending}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title="Delete event"
        message={`Permanently delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
