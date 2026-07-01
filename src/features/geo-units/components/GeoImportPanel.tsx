import { useState, useEffect, useRef } from "react";
import { useNotify } from "@/services/notifications";
import {
    runImport,
    getImportStatus,
    cancelImport,
    GeoImportJobResponse,
} from "../services/geoImportService";
import ConfirmDialog from "@/components/ConfirmDialog";

const POLL_INTERVAL_MS = 3000;

function StatusBadge({ status }: { status: GeoImportJobResponse["status"] }) {
    const cfg = {
        PENDING:   "bg-yellow-100 text-yellow-700",
        RUNNING:   "bg-blue-100 text-blue-700",
        COMPLETED: "bg-green-100 text-green-700",
        CANCELED:  "bg-slate-100 text-slate-600",
        FAILED:    "bg-red-100 text-red-700",
    }[status];
    return (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${cfg}`}>
            {status}
        </span>
    );
}

function ReportSummary({ job }: { job: GeoImportJobResponse }) {
    const r = job.report;
    if (!r) return null;
    return (
        <div className="mt-4 space-y-3 text-sm">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                    ["States", r.stateCount],
                    ["Districts", r.districtCount],
                    ["Tehsils", r.tehsilCount],
                    ["Cities / Towns", r.cityTownCount],
                    ["Villages (included)", r.villagesIncluded],
                    ["Absorbed into ULBs", r.villagesSkippedAbsorbed],
                    ["Inactive (forest)", r.villagesInactiveForest],
                    ["Total rows scanned", r.villageRowsProcessed],
                    ["No census code", r.rowsWithNoCensusCode],
                ].map(([label, val]) => (
                    <div key={String(label)} className="bg-slate-50 rounded-lg p-3">
                        <div className="text-xs text-slate-400 mb-0.5">{label}</div>
                        <div className="font-semibold text-slate-700">{Number(val).toLocaleString()}</div>
                    </div>
                ))}
            </div>

            {r.failedBatches && r.failedBatches.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <p className="font-medium text-orange-700 mb-1">
                        ⚠ {r.failedBatches.length} batch(es) partially failed — rows skipped, safe to re-run
                    </p>
                    <ul className="text-xs text-orange-600 space-y-0.5 list-disc ml-4">
                        {r.failedBatches.map((b, i) => (
                            <li key={i}>{b.level}: {b.batchSize} row(s) — {b.errorMessage}</li>
                        ))}
                    </ul>
                </div>
            )}

            {r.duplicateNameCollisions && r.duplicateNameCollisions.length > 0 && (
                <p className="text-xs text-slate-400">
                    {r.duplicateNameCollisions.length} duplicate name collision(s) detected (villages with identical names under same tehsil).
                </p>
            )}

            {r.orphanRowWarnings && r.orphanRowWarnings.length > 0 && (
                <p className="text-xs text-slate-400">
                    {r.orphanRowWarnings.length} orphan row warning(s) — ULBs with no resolvable parent tehsil, skipped.
                </p>
            )}

            {job.status === "COMPLETED" && !r.failedBatches?.length && (
                <p className="text-green-700 font-medium text-xs">
                    ✓ Import completed successfully with no failures.
                </p>
            )}
        </div>
    );
}

export default function GeoImportPanel() {
    const notify = useNotify();
    const [activeJob, setActiveJob] = useState<GeoImportJobResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const isRunning = activeJob?.status === "PENDING" || activeJob?.status === "RUNNING";

    function stopPolling() {
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
    }

    async function poll(jobId: number) {
        try {
            const status = await getImportStatus(jobId);
            setActiveJob(status);
            if (status.status === "COMPLETED" || status.status === "FAILED") {
                stopPolling();
                if (status.status === "FAILED") {
                    notify.error(`Import failed: ${status.errorMessage}`);
                } else {
                    notify.success(status.report?.dryRun ? "Dry-run completed." : "Import completed successfully.");
                }
            }
        } catch {
            stopPolling();
        }
    }

    function startPolling(jobId: number) {
        stopPolling();
        poll(jobId);
        pollRef.current = setInterval(() => poll(jobId), POLL_INTERVAL_MS);
    }

    useEffect(() => () => stopPolling(), []);

    async function handleRun(dryRun: boolean) {
        setLoading(true);
        try {
            const jobId = await runImport(dryRun);
            const initial: GeoImportJobResponse = { jobId, status: "PENDING", dryRun };
            setActiveJob(initial);
            startPolling(jobId);
        } catch (err: any) {
            notify.error(err?.response?.data?.message || "Failed to start import job.");
        } finally {
            setLoading(false);
        }
    }

    async function handleCancel() {
        if (!activeJob) return;
        try {
            await cancelImport(activeJob.jobId);
            setShowCancelConfirm(false);
            notify.success("Cancellation requested — job will stop at the next batch checkpoint.");
        } catch {
            notify.error("Failed to send cancel request.");
        }
    }

    return (
        <section className="bg-white rounded-xl shadow p-6 space-y-4">
            <div>
                <h2 className="text-lg font-semibold">LGD Geo Data Import</h2>
                <p className="text-sm text-slate-400 mt-0.5">
                    Import State / District / Tehsil / Village data from the LGD staging folder.
                    Always run a dry-run first and review the report before committing.
                </p>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
                <button
                    type="button"
                    onClick={() => handleRun(true)}
                    disabled={isRunning || loading}
                    className="px-4 py-2 rounded-lg border border-primary text-primary text-sm font-medium hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                    {isRunning && activeJob?.dryRun ? "Running dry-run…" : "Run Dry-Run"}
                </button>

                <button
                    type="button"
                    onClick={() => handleRun(false)}
                    disabled={isRunning || loading}
                    className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                    {isRunning && !activeJob?.dryRun ? "Importing…" : "Commit Import"}
                </button>

                {isRunning && (
                    <button
                        type="button"
                        onClick={() => setShowCancelConfirm(true)}
                        className="px-4 py-2 rounded-lg border border-red-300 text-red-600 text-sm hover:bg-red-50 transition"
                    >
                        Cancel
                    </button>
                )}
            </div>

            {activeJob && (
                <div className="border rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                        <StatusBadge status={activeJob.status} />
                        <span className="text-xs text-slate-400">
                            Job #{activeJob.jobId} · {activeJob.dryRun ? "Dry-run" : "Commit"}
                        </span>
                        {isRunning && activeJob.currentPhase && (
                            <span className="text-xs text-blue-600">
                                Phase: {activeJob.currentPhase}
                                {activeJob.processedRows != null
                                    ? ` — ${activeJob.processedRows.toLocaleString()} rows processed`
                                    : ""}
                            </span>
                        )}
                        {isRunning && (
                            <span className="text-xs text-slate-400 animate-pulse">Polling every 3s…</span>
                        )}
                    </div>

                    {activeJob.errorMessage && activeJob.status === "FAILED" && (
                        <p className="text-xs text-red-600 bg-red-50 rounded p-2">{activeJob.errorMessage}</p>
                    )}

                    {activeJob.startedAt && (
                        <p className="text-xs text-slate-400">
                            Started: {new Date(activeJob.startedAt).toLocaleString()}
                            {activeJob.completedAt
                                ? ` · Completed: ${new Date(activeJob.completedAt).toLocaleString()}`
                                : ""}
                        </p>
                    )}

                    <ReportSummary job={activeJob} />
                </div>
            )}
            
            <ConfirmDialog
                isOpen={showCancelConfirm}
                onClose={() => setShowCancelConfirm(false)}
                onConfirm={handleCancel}
                variant="warning"
                title="Cancel Import Job?"
                message={`Job #${activeJob?.jobId} (${activeJob?.dryRun ? "Dry-run" : "Commit"}) is currently running. Already-committed rows are safe — the import can be re-run at any time without creating duplicates. The job will stop at the next batch checkpoint.`}
                confirmLabel="Yes, Cancel Job"
                cancelLabel="Keep Running"
            />
            
        </section>
    );
}
