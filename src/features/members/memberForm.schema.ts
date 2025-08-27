import { z } from "zod";

// ---------- Zod validation ----------
const phoneRegex = /^[0-9]{10}$/;
const pinRegex = /^[0-9]{6}$/;

export const MemberZ = z.object({
  // Member Details
  name: z.string().min(2, "Name is required"),
  dob: z.string().optional(), // ISO date string (optional for now)
  gender: z.enum(["male", "female", "other"]).optional(),
  maritalStatus: z.enum(["single", "married", "widowed", "divorced"]).default("single"),
  occupation: z.string().optional(),
  ownershipStatus: z.enum(["owner", "tenant"]).default("owner"),

  // Contact
  phone: z.string().regex(phoneRegex, "Enter 10 digit phone"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),

  // Address
  building: z.string().optional(),
  wing: z.string().optional(),
  flatNo: z.string().min(1, "Flat number is required"),
  floor: z.string().optional(),
  block: z.string().optional(),
  street: z.string().optional(),
  area: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().regex(pinRegex, "Enter 6 digit PIN").optional().or(z.literal("")),

  // IDs
  aadhaar: z.string().optional(),
  pan: z.string().optional(),

  // Spouse (conditional)
  spouseName: z.string().optional(),
  spousePhone: z.string().optional(),
  spouseEmail: z.string().optional(),

  // Children (dynamic)
  children: z
    .array(
      z.object({
        name: z.string().min(2, "Child name required"),
        dob: z.string().optional(),
      })
    )
    .default([]),

  // Vehicles (dynamic)
  vehicles: z
    .array(
      z.object({
        type: z.string().optional(), // car/bike/scooter
        number: z.string().optional(),
      })
    )
    .default([]),

  // Other
  whatsapp: z.string().optional(),
  altPhone: z.string().optional(),
  notes: z.string().optional(),

  // System
  active: z.boolean().default(true),
  joinDate: z.string().optional(),
});

export type MemberFormValues = z.input<typeof MemberZ>;

// ---------- Form config (sections & fields) ----------
export type FieldType =
  | "text"
  | "email"
  | "tel"
  | "date"
  | "select"
  | "textarea"
  | "checkbox"
  | "group-array";

export type FieldConfig = {
  name: keyof MemberFormValues | string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: { value: string; label: string }[];
  cols?: number; // 1 or 2 (within a grid)
  showIf?: (values: MemberFormValues) => boolean;
};

export type SectionConfig = {
  key: string;
  title: string;
  description?: string;
  gridCols?: number; // default 2
  fields: FieldConfig[];
};

export const MemberFormSections: SectionConfig[] = [
  {
    key: "memberDetails",
    title: "Member Details",
    gridCols: 2,
    fields: [
      { name: "name", label: "Full Name", type: "text" },
      { name: "dob", label: "Date of Birth", type: "date" },
      { name: "gender", label: "Gender", type: "select" },
      { name: "maritalStatus", label: "Marital Status", type: "select" },
      { name: "occupation", label: "Occupation", type: "text" },
      { name: "ownershipStatus", label: "Ownership", type: "select" },
    ],
  },
  {
    key: "contact",
    title: "Contact",
    gridCols: 2,
    fields: [
      { name: "phone", label: "Phone", type: "tel" },
      { name: "email", label: "Email", type: "email" },
      { name: "whatsapp", label: "WhatsApp", type: "tel" },
      { name: "altPhone", label: "Alternate Phone", type: "tel" },
    ],
  },
  {
    key: "address",
    title: "Address",
    gridCols: 3,
    fields: [
      { name: "building", label: "Building/Wing", type: "text" },
      { name: "wing", label: "Wing", type: "text" },
      { name: "flatNo", label: "Flat No.", type: "text" },
      { name: "floor", label: "Floor", type: "text" },
      { name: "block", label: "Block/Tower", type: "text" },
      { name: "street", label: "Street", type: "text" },
      { name: "area", label: "Area", type: "text" },
      { name: "city", label: "City", type: "text" },
      { name: "state", label: "State", type: "select" },
      { name: "pincode", label: "PIN Code", type: "text" },
    ],
  },
  {
    key: "ids",
    title: "IDs",
    gridCols: 2,
    fields: [
      { name: "aadhaar", label: "Aadhaar", type: "text" },
      { name: "pan", label: "PAN", type: "text" },
    ],
  },
  {
    key: "spouse",
    title: "Spouse",
    gridCols: 2,
    fields: [
      {
        name: "spouseName",
        label: "Spouse Name",
        type: "text",
        showIf: (v) => v.maritalStatus === "married",
      },
      {
        name: "spousePhone",
        label: "Spouse Phone",
        type: "tel",
        showIf: (v) => v.maritalStatus === "married",
      },
      {
        name: "spouseEmail",
        label: "Spouse Email",
        type: "email",
        showIf: (v) => v.maritalStatus === "married",
      },
    ],
  },
  {
    key: "children",
    title: "Children",
    fields: [
      { name: "children", label: "Children", type: "group-array" },
    ],
  },
  {
    key: "vehicles",
    title: "Vehicles",
    fields: [
      { name: "vehicles", label: "Vehicles", type: "group-array" },
    ],
  },
  {
    key: "other",
    title: "Other",
    gridCols: 1,
    fields: [
      { name: "notes", label: "Notes/Remarks", type: "textarea" },
      { name: "active", label: "Active Member", type: "checkbox" },
      { name: "joinDate", label: "Join Date", type: "date" },
    ],
  },
];

// ---------- Defaults ----------
export const defaultMemberValues: MemberFormValues = {
  name: "",
  dob: "",
  gender: "male",
  maritalStatus: "single",
  occupation: "",
  ownershipStatus: "owner",
  phone: "",
  email: "",
  building: "",
  wing: "",
  flatNo: "",
  floor: "",
  block: "",
  street: "",
  area: "",
  city: "",
  state: "",
  pincode: "",
  aadhaar: "",
  pan: "",
  spouseName: "",
  spousePhone: "",
  spouseEmail: "",
  children: [],
  vehicles: [],
  whatsapp: "",
  altPhone: "",
  notes: "",
  active: true,
  joinDate: "",
};
