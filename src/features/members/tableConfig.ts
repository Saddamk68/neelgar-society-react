export const MEMBER_COLUMNS = [
  { key: "memberCode", title: "Member", weight: 26, sortable: false },
  { key: "contactNumber", title: "Phone", weight: 14, truncate: true, tooltip: true, hideBelow: "sm" },
  { key: "familyCode", title: "Family", weight: 12, truncate: true, tooltip: true, hideBelow: "sm", sortable: true },
  { key: "occupation", title: "Occupation", weight: 14, truncate: true, tooltip: true, hideBelow: "sm" },
  { key: "actions", title: "Actions", weight: 8, align: "center" },
] as const;
