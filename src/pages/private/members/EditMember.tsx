import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import {
  memberSchema,
  MemberFormValues,
} from "../../../features/members/member.schema";
import { getMember, updateMember } from "../../../features/members/services/memberService";
import { Member } from "../../../features/members/types";
import { useAuth } from "../../../context/AuthContext";
import { useNotify } from "../../../services/notifications";
import { ROUTES } from "../../../constants/routes";
import FieldLabel from "../../../components/form/FieldLabel";

// ── Shared input style ────────────────────────────────────────────────────────

function inputClass(hasError?: boolean) {
  return [
    "w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 transition",
    hasError
      ? "border-red-400 ring-1 ring-red-400 focus:ring-red-400"
      : "border-slate-300 focus:ring-primary/40",
  ].join(" ");
}

// ── Address sub-form ──────────────────────────────────────────────────────────

function AddressFields({
  prefix,
  register,
  errors,
}: {
  prefix: "currentAddress" | "parentalAddress";
  register: any;
  errors: any;
}) {
  const fields = [
    { name: "village", label: "Village", required: prefix === "currentAddress" },
    { name: "tahsil", label: "Tahsil", required: false },
    { name: "district", label: "District", required: false },
    { name: "state", label: "State", required: false },
    { name: "country", label: "Country", required: false },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {fields.map((f) => {
        const err = errors?.[prefix]?.[f.name]?.message;
        return (
          <div key={f.name}>
            <FieldLabel required={f.required}>{f.label}</FieldLabel>
            <input
              {...register(`${prefix}.${f.name}`)}
              className={inputClass(!!err)}
            />
            {err && <p className="text-xs text-red-500 mt-1">{err}</p>}
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function EditMember() {
  const { memberCode } = useParams<{ memberCode: string }>();
  const navigate = useNavigate();
  const notify = useNotify();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [showParentalAddress, setShowParentalAddress] = useState(false);
  const [originalMember, setOriginalMember] = useState<Member | null>(null);

  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema) as any,
    mode: "onBlur",
  });

  const {
    register,
    watch,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  const createAccount = watch("createAccount");

  // ── Load member on mount ──────────────────────────────────────────────────

  useEffect(() => {
    if (!memberCode) return;

    getMember(memberCode)
      .then((m) => {
        setOriginalMember(m);

        // Map Member (PersonResponse) → MemberFormValues for the form
        const formValues: MemberFormValues = {
          societyId: m.societyId,
          familyId: m.familyId,
          firstName: m.firstName,
          lastName: m.lastName ?? "",
          gender: m.gender ?? undefined,
          dob: m.dob ?? "",
          contactNumber: m.contactNumber ?? "",
          education: m.education ?? "",
          occupation: m.occupation ?? "",
          createAccount: false,
          email: "",
          currentAddress: {
            village: (m as any).currentAddress?.village ?? "",
            tahsil: (m as any).currentAddress?.tahsil ?? "",
            district: (m as any).currentAddress?.district ?? "",
            state: (m as any).currentAddress?.state ?? "",
            country: (m as any).currentAddress?.country ?? "",
          },
          parentalAddress: (m as any).parentalAddress?.village
            ? {
              village: (m as any).parentalAddress.village,
              tahsil: (m as any).parentalAddress.tahsil ?? "",
              district: (m as any).parentalAddress.district ?? "",
              state: (m as any).parentalAddress.state ?? "",
              country: (m as any).parentalAddress.country ?? "",
            }
            : undefined,
        };

        reset(formValues);

        // Show parental address section if data exists
        if ((m as any).parentalAddress?.village) {
          setShowParentalAddress(true);
        }
      })
      .catch(() => notify.error("Failed to load member details."))
      .finally(() => setLoading(false));
  }, [memberCode]);

  // ── Submit ────────────────────────────────────────────────────────────────

  const onSubmit: SubmitHandler<MemberFormValues> = async (data) => {
    if (!memberCode) return;
    try {
      await updateMember(memberCode, data, user?.username ?? "system");
      notify.success("Member updated successfully!");
      navigate(`${ROUTES.PRIVATE.MEMBERS}/${memberCode}/view`);
    } catch (err: any) {
      notify.error(err.message || "Failed to update member.");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow p-6 text-sm text-slate-500">
        Loading member…
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Edit Member</h1>
          <p className="text-slate-500 text-sm">
            {originalMember
              ? `${originalMember.firstName} ${originalMember.lastName ?? ""}`.trim()
              : ""}
            {originalMember && (
              <span className="ml-2 text-slate-400">· {originalMember.memberCode}</span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-3 py-2 rounded-md border text-sm hover:bg-slate-50 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      {/* Family info — read-only banner */}
      {originalMember && (
        <div className="mb-4 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-600 flex gap-6">
          <span>
            <span className="text-slate-400">Family: </span>
            <span className="font-medium">{originalMember.familyCode}</span>
          </span>
          <span>
            <span className="text-slate-400">Society: </span>
            <span className="font-medium">{originalMember.societyCode}</span>
          </span>
          <span className="text-slate-400 text-xs italic">
            Family and society cannot be changed here.
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* Personal Info */}
        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <FieldLabel required>First Name</FieldLabel>
              <input {...register("firstName")} className={inputClass(!!errors.firstName)} />
              {errors.firstName && (
                <p className="text-xs text-red-500 mt-1">{errors.firstName.message}</p>
              )}
            </div>
            <div>
              <FieldLabel>Last Name</FieldLabel>
              <input {...register("lastName")} className={inputClass()} />
            </div>
            <div>
              <FieldLabel>Gender</FieldLabel>
              <select {...register("gender")} className={inputClass()}>
                <option value="">Select</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <FieldLabel>Date of Birth</FieldLabel>
              <input type="date" {...register("dob")} className={inputClass()} />
            </div>
            <div>
              <FieldLabel>Contact Number</FieldLabel>
              <input {...register("contactNumber")} className={inputClass()} />
            </div>
            <div>
              <FieldLabel>Education</FieldLabel>
              <input {...register("education")} className={inputClass()} />
            </div>
            <div>
              <FieldLabel>Occupation</FieldLabel>
              <input {...register("occupation")} className={inputClass()} />
            </div>
          </div>
        </section>

        {/* Current Address */}
        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Current Address</h2>
          <AddressFields prefix="currentAddress" register={register} errors={errors} />
        </section>

        {/* Parental Address */}
        <section className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Parental Address</h2>
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={showParentalAddress}
                onChange={(e) => setShowParentalAddress(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Fill parental address
            </label>
          </div>
          {showParentalAddress ? (
            <AddressFields prefix="parentalAddress" register={register} errors={errors} />
          ) : (
            <p className="text-sm text-slate-400">
              Optional — check the box above to edit the parental address.
            </p>
          )}
        </section>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 rounded-md bg-primary text-white text-sm hover:bg-primary/90 disabled:opacity-60 transition"
          >
            {isSubmitting ? "Saving…" : "Save Changes"}
          </button>
          <Link
            to={`${ROUTES.PRIVATE.MEMBERS}/${memberCode}/view`}
            className="px-4 py-2 rounded-md border border-slate-300 text-sm hover:bg-slate-50 transition"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
