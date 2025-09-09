// Column schema for Members table (config-driven)
export const MEMBER_COLUMNS = [
  { key: "id", title: "ID", width: "80px", align: "center", sortable: true },
  { key: "name", title: "Name", width: "160px", truncate: true, tooltip: true, sortable: true },
  { key: "fatherName", title: "Father Name", width: "160px", truncate: true, tooltip: true },
  { key: "motherName", title: "Mother Name", width: "160px", truncate: true, tooltip: true },
  { key: "gotra", title: "Gotra", width: "120px", sortable: true },
  { key: "currentVillage", title: "Village", width: "120px", sortable: true },
  { key: "phone", title: "Phone", width: "140px" },
] as const;
