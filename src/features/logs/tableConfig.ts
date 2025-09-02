import type { LogEntry } from "./types";

export type ColumnConfig<T> = {
  key: keyof T;
  title: string;
  width?: string;
  align?: "left" | "center" | "right";
  truncate?: boolean;
  tooltip?: boolean;
  sortable?: boolean;
};

export const LOGS_COLUMNS: ColumnConfig<LogEntry>[] = [
  {
    key: "eventTime",
    title: "Event Time",
    width: "150px",
    sortable: true,
  },
  {
    key: "level",
    title: "Level",
    width: "90px",
    align: "center",
    sortable: true,
  },
  {
    key: "actor",
    title: "Actor",
    width: "90px",
    truncate: true,
    tooltip: true,
    sortable: true,
  },
  {
    key: "action",
    title: "Action",
    width: "140px",
    truncate: true,
    tooltip: true,
    sortable: true,
  },
  {
    key: "ipAddress",
    title: "IP Address",
    width: "120px",
    truncate: true,
    tooltip: true,
  },
  {
    key: "userAgent",
    title: "User Agent",
    width: "160px",
    truncate: true,
    tooltip: true,
  },
  {
    key: "metadata",
    title: "Log Details",
    width: "380px",
    truncate: true,
    tooltip: true,
  },
] as const;
