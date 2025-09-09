// src/features/members/tableConfig.ts
export const MEMBER_COLUMNS = [
  { key: "id", title: "ID", weight: 2, sortable: true },
  { key: "name", title: "Name", weight: 22, truncate: true, tooltip: true, sortable: true },
  { key: "fatherName", title: "Father Name", weight: 22, truncate: true, tooltip: true, hideBelow: "sm", sortable: true },
  { key: "motherName", title: "Mother Name", weight: 22, truncate: true, tooltip: true, hideBelow: "sm", sortable: true },
  { key: "gotra", title: "Gotra", weight: 10, truncate: true, tooltip: true, hideBelow: "sm", sortable: true },
  { key: "currentVillage", title: "Village", truncate: true, tooltip: true, hideBelow: "sm", weight: 14, sortable: true },
  { key: "phone", title: "Phone", weight: 6, truncate: true, tooltip: true, hideBelow: "sm" },
  { key: "actions", title: "Actions", weight: 2, align: "center" },
] as const;
