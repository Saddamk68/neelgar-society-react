export const MEMBER_COLUMNS = [
  { key: "memberCode", title: "Member", weight: 18, sortable: false },
  { key: "fatherName", title: "Father Name", weight: 14, truncate: true, tooltip: true, hideBelow: "md" },
  { key: "dob", title: "DOB", weight: 10, hideBelow: "md" },
  { key: "familyCode", title: "Family", weight: 12, truncate: true, tooltip: true, hideBelow: "sm", sortable: true },
  { key: "residenceName", title: "Residence", weight: 14, truncate: true, tooltip: true, hideBelow: "sm" },
  { key: "contactNumber", title: "Phone", weight: 14, truncate: true, tooltip: true, hideBelow: "sm" },
  { key: "occupation", title: "Occupation", weight: 14, truncate: true, tooltip: true, hideBelow: "sm" },
  { key: "actions", title: "Actions", weight: 10, align: "center" },
] as const;
