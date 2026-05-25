import { api, getAuthToken } from "../../../services/apiClient";
import { ENDPOINTS } from "../../../config/endpoints";

// ── Types matching ImportReportResponse from the REST API ─────────────────────

export type ImportRowResult = {
  rowNumber: number;
  personRef?: string;
  status: "SUCCESS" | "ERROR";
  memberCode?: string;   // populated on SUCCESS
  message?: string;      // populated on ERROR
};

export type ImportReportResponse = {
  totalRows: number;
  successCount: number;
  errorCount: number;
  committed: boolean;   // true = saved, false = rolled back
  summary?: string;
  rows: ImportRowResult[];
};

// ── Download import template ──────────────────────────────────────────────────
// GET /api/v1/import/template — returns an .xlsx file

export async function downloadImportTemplate(): Promise<void> {
  const token = getAuthToken();

  const resp = await fetch(
    // Build full URL from the api baseURL
    `${(api.defaults.baseURL ?? "").replace(/\/$/, "")}${ENDPOINTS.importMembers.template()}`,
    {
      method: "GET",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        Accept:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    }
  );

  if (!resp.ok) {
    throw new Error(`Failed to download template (HTTP ${resp.status})`);
  }

  const blob = await resp.blob();
  const cd = resp.headers.get("Content-Disposition");
  let filename = "neelgar_import_template.xlsx";

  if (cd) {
    const match = /filename="?([^"]+)"?/i.exec(cd);
    if (match?.[1]) filename = match[1];
  }

  triggerDownload(blob, filename);
}

// ── Upload members Excel file ─────────────────────────────────────────────────
// POST /api/v1/import/members (multipart: file + societyId)
// Returns the full ImportReportResponse — committed=true means saved,
// committed=false means rolled back with per-row errors.

export async function importMembers(
  file: File,
  societyId: number,
  createdBy: string
): Promise<ImportReportResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("societyId", String(societyId));

  const res = await api.post(ENDPOINTS.importMembers.upload(), formData, {
    headers: { "X-Created-By": createdBy },
    // axios removes Content-Type for FormData automatically (lets browser set boundary)
  });

  const report: ImportReportResponse = res.data?.data ?? res.data;
  return report;
}

// ── Private helper ────────────────────────────────────────────────────────────

function triggerDownload(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
