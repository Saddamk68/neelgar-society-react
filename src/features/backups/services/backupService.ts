import { api } from "@/services/apiClient";
import { ENDPOINTS } from "@/config/endpoints";

function unwrap<T>(res: any): T {
    return res.data?.data ?? res.data;
}

export interface BackupFile {
  fileName: string;
  filePath: string;
  sizeBytes: number;
  createdAt: string;
}

export async function listBackups(): Promise<BackupFile[]> {
    const res = await api.get(ENDPOINTS.backups.list);
    return unwrap<BackupFile[]>(res);
}

export async function triggerBackup(): Promise<string> {
    // A full mysqldump can take a while on a large DB — override the
    // shared client's 15s timeout for this call only.
    const res = await api.post(ENDPOINTS.backups.trigger, null, { timeout: 5 * 60 * 1000 });
    return unwrap<string>(res);
}
