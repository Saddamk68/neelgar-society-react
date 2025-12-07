import { api, getAuthToken } from "../../../services/apiClient";
import { ENV } from "@/config/env";

/**
 * Types that mirror backend DTOs
 * --------------------------------
 * Backend:
 *   - ExportJobDto in com.neelgar.society.dto.ExportJobDto
 *   - ImportJobDto in com.neelgar.society.dto.ImportJobDto
 *   - JobStatus in com.neelgar.society.enums.JobStatus
 */

export type JobStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "GENERATED"
  | "DOWNLOADED"
  | "UPLOADED"
  | "FAILED";

export type ExportJobDto = {
  exportId: number;
  status: JobStatus;
  rowCount: number | null;
  fileSizeBytes: number | null;
  errorMessage: string | null;
  downloadUrl: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdBy: string | null;
  createdAt: string | null;
};

export type ImportJobDto = {
  importId: number;
  status: JobStatus;
  rowCount: number | null;
  errorCount: number | null;
  errorFileUrl: string | null;
  createdAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
};

const EXPORT_BASE_PATH = "/member/export";
const IMPORT_BASE_PATH = "/member/import";

const API_BASE = (ENV.API_BASE_URL ?? "").replace(/\/$/, "");
const EXPORT_BASE_URL = `${API_BASE}${EXPORT_BASE_PATH}`;
const IMPORT_BASE_URL = `${API_BASE}${IMPORT_BASE_PATH}`;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * ================
 * EXPORT HELPERS
 * ================
 */

/**
 * Create a member export job for the given member IDs.
 * This calls POST /api/v1/member/export with body: { memberIds: number[] }
 */
export async function createMemberExportJob(
  memberIds: Array<number | string>
): Promise<ExportJobDto> {
  if (!memberIds.length) {
    throw new Error("No members selected to export.");
  }

  const numericIds = memberIds.map((id) => Number(id));

  const res = await api.post<ExportJobDto>(EXPORT_BASE_URL, {
    memberIds: numericIds,
  });

  return res.data;
}

/**
 * Get export job status: GET /api/v1/member/export/{exportId}
 */
export async function getExportJob(exportId: number): Promise<ExportJobDto> {
  const res = await api.get<ExportJobDto>(`${EXPORT_BASE_URL}/${exportId}`);
  return res.data;
}

/**
 * Wait until the export job is GENERATED or FAILED.
 * Throws on timeout or FAILED.
 */
export async function waitForExportReady(
  exportId: number,
  {
    pollIntervalMs = 1500,
    timeoutMs = 60_000,
  }: { pollIntervalMs?: number; timeoutMs?: number } = {}
): Promise<ExportJobDto> {
  const start = Date.now();

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const job = await getExportJob(exportId);

    if (job.status === "GENERATED" || job.status === "DOWNLOADED") {
      return job;
    }

    if (job.status === "FAILED") {
      throw new Error(job.errorMessage || "Export failed on server.");
    }

    if (Date.now() - start > timeoutMs) {
      throw new Error("Timed out while waiting for export to finish.");
    }

    await sleep(pollIntervalMs);
  }
}

/**
 * Download the generated export file as an .xlsx.
 *
 * Backend endpoint:
 *   GET /api/v1/member/export/{exportId}/download
 */
export async function downloadExportFile(exportId: number): Promise<void> {
  const token = getAuthToken();

  const url = `${EXPORT_BASE_URL}/${exportId}/download`;

  const resp = await fetch(url, {
    method: "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      Accept:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/octet-stream",
    },
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    let msg = `Failed to download export file (HTTP ${resp.status}).`;
    if (text) {
      msg += ` ${text}`;
    }
    throw new Error(msg);
  }

  const blob = await resp.blob();
  const cd = resp.headers.get("Content-Disposition");
  let filename = "members-export.xlsx";

  if (cd) {
    const match = /filename="?([^"]+)"?/i.exec(cd);
    if (match && match[1]) {
      filename = match[1];
    }
  }

  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(blobUrl);
}

/**
 * Convenience helper: create job, wait until it's ready, then download.
 * This is what the Members page will call.
 */
export async function exportMembersToExcel(
  memberIds: Array<number | string>
): Promise<void> {
  const job = await createMemberExportJob(memberIds);
  const readyJob = await waitForExportReady(job.exportId);
  await downloadExportFile(readyJob.exportId);
}

/**
 * ================
 * IMPORT HELPERS
 * ================
 */

/**
 * Upload Excel file and create an import job.
 * Endpoint: POST /api/v1/member/import (multipart/form-data, field "file")
 */
export async function createMemberImportJob(
  file: File
): Promise<ImportJobDto> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await api.post<ImportJobDto>(IMPORT_BASE_URL, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
}

/**
 * Get import job status: GET /api/v1/member/import/{importId}
 */
export async function getImportJob(importId: number): Promise<ImportJobDto> {
  const res = await api.get<ImportJobDto>(`${IMPORT_BASE_URL}/${importId}`);
  return res.data;
}

/**
 * Wait until the import job finishes (UPLOADED or FAILED).
 */
export async function waitForImportFinished(
  importId: number,
  {
    pollIntervalMs = 1500,
    timeoutMs = 60_000,
  }: { pollIntervalMs?: number; timeoutMs?: number } = {}
): Promise<ImportJobDto> {
  const start = Date.now();

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const job = await getImportJob(importId);

    if (job.status === "UPLOADED") {
      return job;
    }

    if (job.status === "FAILED") {
      // when FAILED, errorFileUrl may contain a link we can use to download the error Excel
      throw new Error("Import failed on server.");
    }

    if (Date.now() - start > timeoutMs) {
      throw new Error("Timed out while waiting for import to finish.");
    }

    await sleep(pollIntervalMs);
  }
}

/**
 * Download validation error Excel for a FAILED import job.
 * Endpoint: GET /api/v1/member/import/{importId}/errors
 */
export async function downloadImportErrorFile(
  importId: number
): Promise<void> {
  const token = getAuthToken();
  const url = `${IMPORT_BASE_URL}/${importId}/errors`;

  const resp = await fetch(url, {
    method: "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      Accept:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/octet-stream",
    },
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    let msg = `Failed to download import error file (HTTP ${resp.status}).`;
    if (text) {
      msg += ` ${text}`;
    }
    throw new Error(msg);
  }

  const blob = await resp.blob();
  const cd = resp.headers.get("Content-Disposition");
  let filename = `member-import-errors-${importId}.xlsx`;

  if (cd) {
    const match = /filename="?([^"]+)"?/i.exec(cd);
    if (match && match[1]) {
      filename = match[1];
    }
  }

  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(blobUrl);
}

/**
 * Download the blank import template Excel.
 * Endpoint: GET /api/v1/member/import/template
 */
export async function downloadImportTemplate(): Promise<void> {
  const token = getAuthToken();
  const url = `${IMPORT_BASE_URL}/template`;

  const resp = await fetch(url, {
    method: "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      Accept:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/octet-stream",
    },
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    let msg = `Failed to download import template (HTTP ${resp.status}).`;
    if (text) {
      msg += ` ${text}`;
    }
    throw new Error(msg);
  }

  const blob = await resp.blob();
  const cd = resp.headers.get("Content-Disposition");
  let filename = "member-import-template.xlsx";

  if (cd) {
    const match = /filename="?([^"]+)"?/i.exec(cd);
    if (match && match[1]) {
      filename = match[1];
    }
  }

  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(blobUrl);
}

/**
 * High-level helper: upload + wait.
 * The Members page can use this for a simple "Import" flow.
 */
export async function importMembersFromFile(file: File): Promise<ImportJobDto> {
  const job = await createMemberImportJob(file);
  const finalJob = await waitForImportFinished(job.importId);
  return finalJob;
}
