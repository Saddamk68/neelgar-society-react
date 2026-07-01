import { z } from "zod";

// ── Address block (reusable) ──────────────────────────────────────────────────

export const addressSchema = z.object({
  geoUnitId: z.coerce.number().optional().refine(
    (v) => v !== undefined && !Number.isNaN(v) && v >= 1,
    { message: "Village/Town is required" }
  ),
});

export type AddressValues = z.infer<typeof addressSchema>;

// ── Duplicate check ───────────────────────────────────────────────────────────

export const duplicateCheckSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().max(100).optional().or(z.literal("")),
  dob: z.string().optional().or(z.literal("")),
});

export type DuplicateCheckValues = z.infer<typeof duplicateCheckSchema>;

// ── Main member form ──────────────────────────────────────────────────────────

export const memberSchema = z.object({
  societyId: z.number({ error: "Society ID is required" }),
  familyId: z.number({ error: "Family ID is required" }),

  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().max(100).optional().or(z.literal("")),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  dob: z.string().optional().or(z.literal("")),
  dod: z.string().optional().or(z.literal("")),
  contactNumber: z.string().max(20).optional().or(z.literal("")),
  education: z.string().max(120).optional().or(z.literal("")),
  occupation: z.string().max(120).optional().or(z.literal("")),
  maritalStatus: z
    .enum(["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"])
    .optional(),
  gotraId: z.coerce.number({ error: "Gotra is required" })
    .int()
    .positive("Please select a gotra"),

  currentAddress: addressSchema,
  parentalAddress: addressSchema.optional(),

  createAccount: z.boolean().default(false),
  email: z.string().email("Invalid email").max(150).optional().or(z.literal("")),
}).refine(
  (data) => !data.createAccount || (data.email && data.email.length > 0),
  { message: "Email is required when creating an account", path: ["email"] }
);

export type MemberFormValues = z.infer<typeof memberSchema>;
