import { api } from "../../../services/apiClient";
import { ENDPOINTS } from "../../../config/endpoints";

function unwrap<T>(res: any): T {
    return res.data?.data ?? res.data;
}

export type GeoImportStatus = "PENDING" | "RUNNING" | "COMPLETED" | "CANCELED" | "FAILED";

export interface GeoImportJobResponse {
    jobId: number;
    status: GeoImportStatus;
    dryRun: boolean;
    startedAt?: string;
    completedAt?: string;
    errorMessage?: string;
    currentPhase?: string;
    processedRows?: number;
    totalRows?: number;
    report?: {
        dryRun: boolean;
        stateCount: number;
        districtCount: number;
        tehsilCount: number;
        cityTownCount: number;
        villageRowsProcessed: number;
        villagesIncluded: number;
        villagesSkippedAbsorbed: number;
        villagesInactiveForest: number;
        rowsWithNoCensusCode: number;
        type21UnmappedFallbackCount: number;
        duplicateNameCollisions?: { level: string; name: string; occurrences: number }[];
        ambiguousUlbParents?: { localBodyCode: string; localBodyName: string }[];
        orphanRowWarnings?: string[];
        failedBatches?: { level: string; batchSize: number; errorMessage: string; lgdCodesInBatch: string[] }[];
        cancelled?: boolean;
    };
}

export async function runImport(dryRun: boolean): Promise<number> {
    const res = await api.post(ENDPOINTS.geoImport.run(dryRun));
    return unwrap<number>(res);
}

export async function getImportStatus(jobId: number): Promise<GeoImportJobResponse> {
    const res = await api.get(ENDPOINTS.geoImport.status(jobId));
    return unwrap<GeoImportJobResponse>(res);
}

export async function cancelImport(jobId: number): Promise<void> {
    await api.post(ENDPOINTS.geoImport.cancel(jobId));
}
