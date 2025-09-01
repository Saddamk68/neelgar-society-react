// Column schema for Members table (config-driven)
export const MEMBER_COLUMNS = [
  { key: "id", title: "ID" },
  { key: "name", title: "Name" },
  { key: "fatherName", title: "Father Name" },
  { key: "motherName", title: "Mother Name" },
  { key: "gotra", title: "Gotra" },
  { key: "phone", title: "Phone" },
] as const;
