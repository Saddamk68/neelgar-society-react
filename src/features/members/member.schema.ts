import { z } from "zod";

// ---------- Regex ----------
const phoneRegex = /^[0-9]{10}$/;
const aadhaarRegex = /^[0-9]{12}$/;
const panRegex = /^[A-Z0-9]{10}$/;

// ---------- Zod validation ----------
export const MemberZ = z
  .object({
    // Basic Info
    id: z.string().optional(), 
    name: z.string().min(2, "Name is required"),
    fatherName: z.string().min(2, "Father's name is required"),
    motherName: z.string().min(2, "Mother's name is required"),
    motherGotra: z.string().min(2, "Mother's gotra is required"),
    dob: z.string().optional(),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
    maritalStatus: z.enum(["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"]).default("MARRIED"),
    education: z.string().optional(),
    occupation: z.string().optional(),
    gotra: z.string().min(2, "Gotra is required"),
    photoPath: z.string().optional(),

    // Contact
    contactNumber: z.string().regex(phoneRegex, "Enter valid 10 digit phone"),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    active: z.boolean().default(true),

    // IDs
    aadhaar: z.string().regex(aadhaarRegex, "Enter valid 12 digit Aadhaar").optional().or(z.literal("")),
    pan: z.string().regex(panRegex, "Enter valid PAN").optional().or(z.literal("")),

    // Address (current + paternal)
    currentState: z.string().optional(),
    currentDistrict: z.string().optional(),
    currentTahsil: z.string().optional(),
    currentVillage: z.string().optional(),

    paternalState: z.string().optional(),
    paternalDistrict: z.string().optional(),
    paternalTahsil: z.string().optional(),
    paternalVillage: z.string().optional(),

    // Spouse (conditional)
    spouseName: z.string().optional(),
    spouseDob: z.string().optional(),
    spouseEducation: z.string().optional(),
    spouseOccupation: z.string().optional(),
    spouseGotra: z.string().optional(),
    spousePhotoPath: z.string().optional(),

    // Children
    children: z
      .array(
        z.object({
          name: z.string().min(2, "Child name required"),
          dob: z.string().optional(),
          education: z.string().optional(),
          occupation: z.string().optional(),
          photoPath: z.string().optional(),
        })
      )
      .default([]),
  })
  .superRefine((val, ctx) => {
    // If married → spouse name is required
    if (val.maritalStatus === "MARRIED" && !val.spouseName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["spouseName"],
        message: "Spouse name is required",
      });
    }
  });

// IMPORTANT: use input type so resolver matches form inputs
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
  cols?: number;
  showIf?: (values: MemberFormValues) => boolean;
};

export type SectionConfig = {
  key: string;
  title: string;
  description?: string;
  gridCols?: number;
  fields: FieldConfig[];
  showIf?: (values: MemberFormValues) => boolean;
};

export const MemberFormSections: SectionConfig[] = [
  {
    key: "basic",
    title: "Basic Information",
    gridCols: 2,
    fields: [
      { name: "name", label: "Full Name", type: "text" },
      { name: "dob", label: "Date of Birth", type: "date" },
      { name: "gender", label: "Gender", type: "select", options: [
        { value: "MALE", label: "Male" },
        { value: "FEMALE", label: "Female" },
        { value: "OTHER", label: "Other" },
      ]},
      { name: "maritalStatus", label: "Marital Status", type: "select", options: [
        { value: "SINGLE", label: "Single" },
        { value: "MARRIED", label: "Married" },
        { value: "WIDOWED", label: "Widowed" },
        { value: "DIVORCED", label: "Divorced" },
      ]},
      { name: "fatherName", label: "Father's Name", type: "text" },
      { name: "motherName", label: "Mother's Name", type: "text" },
      { name: "motherGotra", label: "Mother's Gotra", type: "text" },
      { name: "occupation", label: "Occupation", type: "text" },
      { name: "education", label: "Education", type: "text" },
      { name: "gotra", label: "Gotra", type: "text" },
      { name: "photoPath", label: "Photo Path (URL)", type: "text" },
    ],
  },
  {
    key: "contact",
    title: "Contact",
    gridCols: 2,
    fields: [
      { name: "contactNumber", label: "Phone", type: "tel" },
      { name: "email", label: "Email", type: "email" },
      { name: "active", label: "Active Member", type: "checkbox" },
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
    key: "addressCurrent",
    title: "Current Address",
    gridCols: 2,
    fields: [
      { name: "currentVillage", label: "Village", type: "text" },
      { name: "currentTahsil", label: "Tahsil", type: "text" },
      { name: "currentDistrict", label: "District", type: "text" },
      { name: "currentState", label: "State", type: "text" },
    ],
  },
  {
    key: "addressPaternal",
    title: "Paternal Address",
    gridCols: 2,
    fields: [
      { name: "paternalVillage", label: "Village", type: "text" },
      { name: "paternalTahsil", label: "Tahsil", type: "text" },
      { name: "paternalDistrict", label: "District", type: "text" },
      { name: "paternalState", label: "State", type: "text" },
    ],
  },
  {
    key: "spouse",
    title: "Spouse",
    gridCols: 2,
    showIf: (v) => v.maritalStatus === "MARRIED",
    fields: [
      { name: "spouseName", label: "Spouse Name", type: "text" },
      { name: "spouseDob", label: "Spouse DOB", type: "date" },
      { name: "spouseEducation", label: "Spouse Education", type: "text" },
      { name: "spouseOccupation", label: "Spouse Occupation", type: "text" },
      { name: "spouseGotra", label: "Spouse Gotra", type: "text" },
      { name: "spousePhotoPath", label: "Spouse Photo Path", type: "text" },
    ],
  },
  {
    key: "children",
    title: "Children",
    showIf: (v) => v.maritalStatus !== "SINGLE",
    fields: [{ name: "children", label: "Children", type: "group-array" }],
  },
];

// ---------- Defaults ----------
export const defaultMemberValues: MemberFormValues = {
  id: "",
  name: "Saddam Khan",
  fatherName: "Akhtar Ali",
  motherName: "Jamila Bano",
  motherGotra: "Sikarwar",
  dob: "1992-07-10",
  gender: "MALE",
  maritalStatus: "MARRIED",
  occupation: "Engineer",
  education: "B.E.",
  gotra: "Gadobbar",
  photoPath: "",
  contactNumber: "9784561250",
  email: "saddam@gmail.com",
  active: true,
  aadhaar: "745885215236",
  pan: "",
  currentState: "Madhya Pradesh",
  currentDistrict: "Sheopur",
  currentTahsil: "Sheopur",
  currentVillage: "Sheopur",
  paternalState: "",
  paternalDistrict: "",
  paternalTahsil: "",
  paternalVillage: "",
  spouseName: "Shahnaz Bano",
  spouseDob: "1998-07-28",
  spouseEducation: "10",
  spouseOccupation: "Housewife",
  spouseGotra: "Pathan",
  spousePhotoPath: "",
  children: [],
};
