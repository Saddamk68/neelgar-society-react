import { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Pencil, ArrowLeft, Printer } from "lucide-react";
import { getMember } from "../../../features/members/services/memberService";
import { Member } from "../../../features/members/types";
import { useNotify } from "../../../services/notifications";
import { ROUTES } from "../../../constants/routes";
import MemberAvatar from "@/components/MemberAvatar";

// ── Reusable label/value row ──────────────────────────────────────────────────

function Row({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex gap-2 text-sm">
      <div className="w-36 text-slate-500 shrink-0">{label}</div>
      <div className="flex-1 font-medium text-slate-800">{value || "—"}</div>
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ViewMember() {
  const { memberCode } = useParams<{ memberCode: string }>();
  const navigate = useNavigate();
  const notify = useNotify();

  const { data: member, isLoading, isError, refetch } = useQuery<Member>({
    queryKey: ["member", memberCode],
    queryFn: () => {
      if (!memberCode) throw new Error("Missing member code");
      return getMember(memberCode);
    },
    enabled: !!memberCode,
    staleTime: 1000 * 60 * 2,
  });

  useEffect(() => {
    if (isError) notify.error("Failed to load member details.");
  }, [isError]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 max-w-3xl mx-auto">

      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Member Details</h1>
          <p className="text-slate-500 text-sm">
            {member ? `${member.firstName} ${member.lastName ?? ""}`.trim() : "Loading…"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-3 py-2 rounded-md border text-sm hover:bg-slate-50 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {member && (
            <Link
              to={`${ROUTES.PRIVATE.MEMBERS}/${member.memberCode}/edit`}
              className="flex items-center gap-2 px-3 py-2 rounded-md bg-primary text-white text-sm hover:bg-primary/90 transition"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </Link>
          )}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="bg-white rounded-xl shadow p-6 text-sm text-slate-500">
          Loading member…
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="bg-white rounded-xl shadow p-6 text-sm text-red-500">
          Failed to load member.{" "}
          <button onClick={() => refetch()} className="underline">
            Retry
          </button>
        </div>
      )}

      {/* Member card */}
      {!isLoading && !isError && member && (
        <div className="bg-white rounded-xl shadow p-6">

          {/* Identity header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <MemberAvatar
                memberCode={member.memberCode}
                firstName={member.firstName}
                lastName={member.lastName}
                hasPhoto={member.hasPhoto ?? false}
                size="lg"
              />
              <div>
                <div className="text-xl font-semibold text-slate-800">
                  {member.firstName} {member.lastName ?? ""}
                </div>
                <div className="text-sm text-slate-500 mt-0.5">
                  {member.memberCode}
                  <span className="mx-2 text-slate-300">·</span>
                  Family: {member.familyCode}
                </div>
              </div>
            </div>
            <span
              className={[
                "text-xs font-medium px-3 py-1 rounded-full",
                member.isActive
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-600",
              ].join(" ")}
            >
              {member.isActive ? "Active" : "Inactive"}
            </span>
          </div>

          {/* Personal details */}
          <Section title="Personal Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
              <Row label="First Name" value={member.firstName} />
              <Row label="Last Name" value={member.lastName} />
              <Row
                label="Gender"
                value={
                  member.gender
                    ? { MALE: "Male", FEMALE: "Female", OTHER: "Other" }[member.gender]
                    : undefined
                }
              />
              <Row label="Date of Birth" value={member.dob} />
              <Row label="Gotra" value={member.gotraName} />
              <Row label="Contact" value={member.contactNumber} />
              <Row label="Education" value={member.education} />
              <Row label="Occupation" value={member.occupation} />
              <Row
                label="Marital Status"
                value={
                  member.maritalStatus
                    ? { SINGLE: "Single", MARRIED: "Married", DIVORCED: "Divorced", WIDOWED: "Widowed" }[member.maritalStatus]
                    : undefined
                }
              />
            </div>
          </Section>

          {/* Current address */}
          {member.currentAddress && (
            <Section title="Current Address">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                <Row label="Village" value={member.currentAddress?.village} />
                <Row label="Tahsil" value={member.currentAddress?.tahsil} />
                <Row label="District" value={member.currentAddress?.district} />
                <Row label="State" value={member.currentAddress?.state} />
                <Row label="Country" value={member.currentAddress?.country} />
              </div>
            </Section>
          )}

          {/* Parental address */}
          {member.parentalAddress && (
            <Section title="Parental Address">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                <Row label="Village" value={member.parentalAddress?.village} />
                <Row label="Tahsil" value={member.parentalAddress?.tahsil} />
                <Row label="District" value={member.parentalAddress?.district} />
                <Row label="State" value={member.parentalAddress?.state} />
                <Row label="Country" value={member.parentalAddress?.country} />
              </div>
            </Section>
          )}

          {/* Society & family */}
          <Section title="Society & Family">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
              <Row label="Society" value={`${member.societyName ?? ""} (${member.societyCode})`} />
              <Row label="Family Code" value={member.familyCode} />
              <Row label="Member Code" value={member.memberCode} />
              <Row label="Created By" value={member.createdBy} />
              <Row label="Created At" value={member.createdAt} />
            </div>
          </Section>

          {/* Footer actions */}
          <div className="mt-8 flex items-center justify-end gap-2 pt-4 border-t">
            {member && (
              <Link
                to={`${ROUTES.PRIVATE.MEMBERS}/${member.memberCode}/print`}
                className="flex items-center gap-2 px-3 py-2 rounded-md border text-sm hover:bg-slate-50 transition"
              >
                <Printer className="w-4 h-4" />
                Print
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
