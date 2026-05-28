import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileSpreadsheet, Upload, CheckCircle, XCircle } from "lucide-react";
import {
    importMembers,
    downloadImportTemplate,
    ImportReportResponse,
    ImportRowResult,
} from "../../../features/members/services/memberImportExportService";
import { useAuth } from "../../../context/AuthContext";
import { useNotify } from "../../../services/notifications";
import { ROUTES } from "../../../constants/routes";

// ── Row result badge ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ImportRowResult["status"] }) {
    return status === "SUCCESS" ? (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
            <CheckCircle className="w-3 h-3" /> Success
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
            <XCircle className="w-3 h-3" /> Error
        </span>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ImportMembers() {
    const navigate = useNavigate();
    const notify = useNotify();
    const { user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [report, setReport] = useState<ImportReportResponse | null>(null);

    // ── File selection ────────────────────────────────────────────────────────

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith(".xlsx")) {
            notify.error("Only .xlsx files are supported.");
            return;
        }

        setSelectedFile(file);
        setReport(null); // clear previous report
    };

    // ── Upload ────────────────────────────────────────────────────────────────

    const handleUpload = async () => {
        if (!selectedFile) {
            notify.error("Please select a file first.");
            return;
        }
        if (!user?.societyId) {
            notify.error("Society information missing. Please re-login.");
            return;
        }

        setUploading(true);
        try {
            const result = await importMembers(
                selectedFile,
                user.societyId,
                user.username
            );
            setReport(result);

            if (result.committed) {
                notify.success(result.summary ?? `${result.successCount} members imported.`);
            } else {
                notify.error(`Import failed — ${result.errorCount} error(s). No data was saved.`);
            }
        } catch (err: any) {
            notify.error(err.message || "Import failed.");
        } finally {
            setUploading(false);
            // Reset file input so same file can be re-uploaded after fixing
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="max-w-3xl mx-auto space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Import Members</h1>
                    <p className="text-slate-500 text-sm mt-0.5">
                        Bulk import members from an Excel file.
                    </p>
                </div>
                <button
                    onClick={() => navigate(ROUTES.PRIVATE.MEMBERS)}
                    className="flex items-center gap-2 px-3 py-2 rounded-md border text-sm hover:bg-slate-50 transition"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>
            </div>

            {/* Instructions */}
            <section className="bg-white rounded-xl shadow p-6 space-y-4">
                <h2 className="text-base font-semibold">How to Import</h2>
                <ol className="text-sm text-slate-600 space-y-2 list-decimal list-inside">
                    <li>Download the import template below.</li>
                    <li>Fill in your member data — columns marked with <span className="text-red-500">*</span> are required.</li>
                    <li>Save the file as <span className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded">.xlsx</span> and upload it.</li>
                    <li>Review the import report. If any row has an error, nothing is saved — fix and re-upload.</li>
                </ol>

                <button
                    onClick={() => {
                        if (!user?.societyId) {
                            notify.error("Society information missing. Please re-login.");
                            return;
                        }
                        downloadImportTemplate(user.societyId);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-slate-300 text-sm hover:bg-slate-50 transition"
                >
                    <FileSpreadsheet className="w-4 h-4 text-green-600" />
                    Download Template
                </button>
            </section>

            {/* Upload */}
            <section className="bg-white rounded-xl shadow p-6 space-y-4">
                <h2 className="text-base font-semibold">Upload File</h2>

                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 px-4 py-2 rounded-md border border-slate-300 text-sm cursor-pointer hover:bg-slate-50 transition">
                        <Upload className="w-4 h-4" />
                        {selectedFile ? selectedFile.name : "Choose .xlsx file…"}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </label>

                    <button
                        onClick={handleUpload}
                        disabled={!selectedFile || uploading}
                        className="px-4 py-2 rounded-md bg-primary text-white text-sm hover:bg-primary/90 disabled:opacity-60 transition"
                    >
                        {uploading ? "Uploading…" : "Upload & Import"}
                    </button>
                </div>

                {selectedFile && (
                    <p className="text-xs text-slate-400">
                        Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </p>
                )}
            </section>

            {/* Import report */}
            {report && (
                <section className="bg-white rounded-xl shadow p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-semibold">Import Report</h2>
                        <span
                            className={[
                                "text-xs font-medium px-3 py-1 rounded-full",
                                report.committed
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700",
                            ].join(" ")}
                        >
                            {report.committed ? "✓ Committed" : "✗ Rolled Back"}
                        </span>
                    </div>

                    {/* Summary counts */}
                    <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="bg-slate-50 rounded-lg p-3 text-center">
                            <div className="text-xl font-semibold">{report.totalRows}</div>
                            <div className="text-slate-500 text-xs mt-0.5">Total Rows</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3 text-center">
                            <div className="text-xl font-semibold text-green-700">{report.successCount}</div>
                            <div className="text-slate-500 text-xs mt-0.5">Successful</div>
                        </div>
                        <div className="bg-red-50 rounded-lg p-3 text-center">
                            <div className="text-xl font-semibold text-red-600">{report.errorCount}</div>
                            <div className="text-slate-500 text-xs mt-0.5">Errors</div>
                        </div>
                    </div>

                    {report.summary && (
                        <p className="text-sm text-slate-600">{report.summary}</p>
                    )}

                    {/* Per-row results */}
                    {report.rows && report.rows.length > 0 && (
                        <div className="overflow-auto max-h-80 border rounded-lg">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b sticky top-0">
                                    <tr>
                                        <th className="text-left px-3 py-2 text-xs font-medium text-slate-500">Row</th>
                                        <th className="text-left px-3 py-2 text-xs font-medium text-slate-500">Ref</th>
                                        <th className="text-left px-3 py-2 text-xs font-medium text-slate-500">Status</th>
                                        <th className="text-left px-3 py-2 text-xs font-medium text-slate-500">Member Code / Error</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {report.rows.map((row) => (
                                        <tr
                                            key={row.rowNumber}
                                            className={row.status === "ERROR" ? "bg-red-50" : ""}
                                        >
                                            <td className="px-3 py-2 text-slate-500">{row.rowNumber}</td>
                                            <td className="px-3 py-2 font-mono text-xs">{row.personRef ?? "—"}</td>
                                            <td className="px-3 py-2">
                                                <StatusBadge status={row.status} />
                                            </td>
                                            <td className="px-3 py-2 text-slate-700">
                                                {row.status === "SUCCESS"
                                                    ? row.memberCode ?? "—"
                                                    : <span className="text-red-600">{row.message}</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Action after successful import */}
                    {report.committed && (
                        <div className="flex justify-end">
                            <button
                                onClick={() => navigate(ROUTES.PRIVATE.MEMBERS)}
                                className="px-4 py-2 rounded-md bg-primary text-white text-sm hover:bg-primary/90 transition"
                            >
                                View Members
                            </button>
                        </div>
                    )}
                </section>
            )}
        </div>
    );
}
