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
    width: "170px",
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
    width: "120px",
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
    width: "140px",
    truncate: true,
    tooltip: true,
  },
  {
    key: "userAgent",
    title: "User Agent",
    width: "200px",
    truncate: true,
    tooltip: true,
  },
  {
    key: "metadata",
    title: "Log Details",
    width: "300px",
    truncate: true,
    tooltip: true,
  },
] as const;
