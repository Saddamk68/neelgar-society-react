import { z } from "zod";

/* ===========================================================
   🧩 Enums (match backend enums exactly)
   =========================================================== */
export const GenderEnum = z.enum(["MALE", "FEMALE", "OTHER"]);
export const MaritalStatusEnum = z.enum(["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"]);
export const RoleEnum = z.enum(["ADMIN", "PRESIDENT", "SECRETARY", "EDITOR", "MEMBER"]);

/* ===========================================================
   📦 Sub-DTO Schemas (Address, Spouse, Child)
   =========================================================== */

// 🏠 AddressDto
export const AddressZ = z.object({
  id: z.number().optional(),
  memberId: z.number().optional(),
  currentState: z.string().optional().nullable(),
  currentDistrict: z.string().optional().nullable(),
  currentTahsil: z.string().optional().nullable(),
  currentVillage: z.string().optional().nullable(),
  paternalState: z.string().optional().nullable(),
  paternalDistrict: z.string().optional().nullable(),
  paternalTahsil: z.string().optional().nullable(),
  paternalVillage: z.string().optional().nullable(),
});
export type AddressFormValues = z.input<typeof AddressZ>;

// 💍 SpouseDto
export const SpouseZ = z.object({
  id: z.number().optional(),
  memberId: z.number().optional(),
  name: z.string().min(2, "Spouse name is required").optional(),
  dob: z.string().optional().nullable(),
  gotra: z.string().optional().nullable(),
  education: z.string().optional().nullable(),
  occupation: z.string().optional().nullable(),
  photoId: z.string().uuid().optional().nullable(),
});
export type SpouseFormValues = z.input<typeof SpouseZ>;

// 👶 ChildDto
export const ChildZ = z.object({
  id: z.number().optional(),
  memberId: z.number().optional(),
  name: z.string().min(2, "Child name is required"),
  dob: z.string().optional().nullable(),
  education: z.string().optional().nullable(),
  occupation: z.string().optional().nullable(),
  photoId: z.string().uuid().optional().nullable(),
});
export type ChildFormValues = z.input<typeof ChildZ>;

/* ===========================================================
   👤 MemberDto (Main Schema)
   =========================================================== */
const phoneRegex = /^[0-9]{10}$/;

export const MemberZ = z
  .object({
    id: z.number().optional(),
    name: z.string().min(2, "Name is required"),
    role: RoleEnum.default("MEMBER").optional(),
    fatherName: z.string().min(2, "Father's name is required"),
    motherName: z.string().min(2, "Mother's name is required"),
    motherGotra: z.string().min(2, "Mother's gotra is required"),
    dob: z.string().optional().nullable(),
    education: z.string().optional().nullable(),
    occupation: z.string().optional().nullable(),
    gotra: z.string().min(2, "Gotra is required"),
    contactNumber: z.string().regex(phoneRegex, "Enter valid 10 digit phone"),
    photoId: z.string().uuid().optional().nullable(),
    maritalStatus: MaritalStatusEnum.default("MARRIED"),
    gender: GenderEnum.optional(),
    isActive: z.boolean().default(true),

    // 🧩 Nested DTOs
    address: AddressZ.optional(),
    spouse: SpouseZ.optional(),
    children: z.array(ChildZ).default([]),
  })
  .superRefine((val, ctx) => {
    if (val.maritalStatus === "MARRIED" && !val.spouse?.name?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["spouse", "name"],
        message: "Spouse name is required for married members",
      });
    }
  });

export type MemberFormValues = z.input<typeof MemberZ>;

/* ===========================================================
   🧱 Default Values (for new member form)
   =========================================================== */
export const defaultMemberValues: MemberFormValues = {
  name: "ABC Khan",
  role: "MEMBER",
  fatherName: "Rashid Khan",
  motherName: "Fatima Khan",
  motherGotra: "Chand",
  dob: "1990-05-10",
  education: "B.Sc Computer Science",
  occupation: "Software Engineer",
  gotra: "Khan",
  contactNumber: "9876543210",
  gender: "MALE",
  maritalStatus: "MARRIED",
  isActive: true,

  address: {
    currentState: "Maharashtra",
    currentDistrict: "Pune",
    currentTahsil: "Haveli",
    currentVillage: "Wakad",
    paternalState: "Maharashtra",
    paternalDistrict: "Aurangabad",
    paternalTahsil: "Sillod",
    paternalVillage: "Deogaon Rangari",
  },

  spouse: {
    name: "Zara Khan",
    dob: "1992-08-14",
    gotra: "Sayed",
    education: "M.Com",
    occupation: "Teacher",
  },

  children: [
    {
      name: "Rehan Khan",
      dob: "2015-03-21",
      education: "Primary School",
      occupation: null,
    },
    {
      name: "Sara Khan",
      dob: "2018-09-09",
      education: "Kindergarten",
      occupation: null,
    },
  ],
};
