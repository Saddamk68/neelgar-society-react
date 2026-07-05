import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/services/notifications";
import { listBackups, triggerBackup } from "../services/backupService";

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function BackupPanel() {
    const notify = useNotify();
    const qc = useQueryClient();
    const [triggering, setTriggering] = useState(false);

    const { data: backups = [], isLoading } = useQuery({
        queryKey: ["backups"],
        queryFn: listBackups,
    });

    async function handleTrigger() {
        setTriggering(true);
        try {
            const fileName = await triggerBackup();
            notify.success(`Backup created: ${fileName}`);
            qc.invalidateQueries({ queryKey: ["backups"] });
        } catch (err: any) {
            notify.error(err?.response?.data?.message || err?.message || "Backup failed.");
        } finally {
            setTriggering(false);
        }
    }

    return (
        <section className="bg-white rounded-xl shadow p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-lg font-semibold">Database Backups</h2>
                    <p className="text-sm text-slate-400 mt-0.5">
                        Runs automatically every night. Backups older than 15 days are removed automatically.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={handleTrigger}
                    disabled={triggering}
                    className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition shrink-0"
                >
                    {triggering ? "Running backup…" : "Backup Now"}
                </button>
            </div>

            <div className="border rounded-xl overflow-hidden">
                {isLoading ? (
                    <p className="text-sm text-slate-400 p-4">Loading backups…</p>
                ) : backups.length === 0 ? (
                    <p className="text-sm text-slate-400 p-4">No backups yet.</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-left text-xs text-slate-400">
                            <tr>
                                <th className="px-4 py-2 font-medium">File Path</th>
                                <th className="px-4 py-2 font-medium">Size</th>
                                <th className="px-4 py-2 font-medium">Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            {backups.map((b) => (
                                <tr key={b.fileName} className="border-t">
                                    <td className="px-4 py-2 text-slate-700 font-mono text-xs break-all">{b.filePath}</td>
                                    <td className="px-4 py-2 text-slate-500">{formatBytes(b.sizeBytes)}</td>
                                    <td className="px-4 py-2 text-slate-500">{new Date(b.createdAt).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </section>
    );
}
