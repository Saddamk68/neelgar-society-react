import { z } from "zod";

// ── Step 1: email + OTP ──────────────────────────────────────────────────────

export const emailSchema = z.object({
    email: z.string().min(1, "Email is required").email("Invalid email address"),
});
export type EmailValues = z.infer<typeof emailSchema>;

export const otpSchema = z.object({
    otp: z
        .string()
        .min(1, "OTP is required")
        .regex(/^[0-9]{6}$/, "OTP must be 6 digits"),
});
export type OtpValues = z.infer<typeof otpSchema>;

// ── Step 2: application details ──────────────────────────────────────────────

export const applicationDetailsSchema = z.object({
    firstName: z.string().min(1, "First name is required").max(100),
    lastName: z.string().min(1, "Last name is required").max(100),
    gender: z.enum(["MALE", "FEMALE", "OTHER"], { error: "Gender is required" }),
    dob: z.string().min(1, "Date of birth is required"),
    maritalStatus: z.enum(["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"], {
        error: "Marital status is required",
    }),
    gotraId: z.coerce
        .number({ error: "Gotra is required" })
        .int()
        .positive("Please select a gotra"),
    contactNumber: z
        .string()
        .optional()
        .or(z.literal(""))
        .refine((val) => !val || /^[0-9]{10}$/.test(val), {
            message: "Contact number must be exactly 10 digits",
        }),
    geoUnitId: z.coerce
        .number({ error: "Village/Town is required" })
        .int()
        .positive("Please select your village/town"),
    claimedFamilyCode: z.string().max(20).optional().or(z.literal("")),
    relationshipClaim: z.string().max(255).optional().or(z.literal("")),
});

export type ApplicationDetailsValues = z.infer<typeof applicationDetailsSchema>;
