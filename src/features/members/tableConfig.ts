export const MEMBER_COLUMNS = [
  { key: "memberCode", title: "Code", weight: 10, sortable: true },
  { key: "firstName", title: "First Name", weight: 16, truncate: true, tooltip: true, sortable: true },
  { key: "lastName", title: "Last Name", weight: 16, truncate: true, tooltip: true, sortable: true },
  { key: "contactNumber", title: "Phone", weight: 12, truncate: true, tooltip: true, hideBelow: "sm" },
  { key: "familyCode", title: "Family", weight: 12, truncate: true, tooltip: true, hideBelow: "sm", sortable: true },
  { key: "occupation", title: "Occupation", weight: 14, truncate: true, tooltip: true, hideBelow: "sm" },
  { key: "actions", title: "Actions", weight: 8, align: "center" },
] as const;
