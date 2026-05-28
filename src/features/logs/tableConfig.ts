import type { AuditLog } from "./types";

export type ColumnConfig<T> = {
  key: keyof T;
  title: string;
  width?: string;
  align?: "left" | "center" | "right";
  truncate?: boolean;
  tooltip?: boolean;
  sortable?: boolean;
};

export const LOGS_COLUMNS: ColumnConfig<AuditLog>[] = [
  {
    key: "timestamp",
    title: "Time",
    width: "160px",
    sortable: true,
  },
  {
    key: "actorUsername",
    title: "Actor",
    width: "140px",
    truncate: true,
  },
  {
    key: "action",
    title: "Action",
    width: "180px",
  },
  {
    key: "entityType",
    title: "Entity",
    width: "120px",
  },
  {
    key: "entityCode",
    title: "Code",
    width: "140px",
    truncate: true,
  },
  {
    key: "ipAddress",
    title: "IP Address",
    width: "130px",
  },
  {
    key: "actorRole",
    title: "Role",
    width: "110px",
  },
] as const;
