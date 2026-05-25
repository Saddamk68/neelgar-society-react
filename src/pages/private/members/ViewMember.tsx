import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRightLeft, Pencil, Printer, GitFork } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import ViewMemberSkeleton from "@/components/skeletons/ViewMemberSkeleton";
import { getMember } from "../../../features/members/services/memberService";
import { Member, PersonRelationshipsResponse } from "../../../features/members/types";
import { useNotify } from "../../../services/notifications";
import { ROUTES } from "../../../constants/routes";
import MemberAvatar from "@/components/MemberAvatar";
import { useAuth } from "@/context/AuthContext";
import ReassignFamilyDialog from "@/components/ReassignFamilyDialog";
import { getPersonRelationships } from "@/features/members/services/relationshipService";

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
  const notify = useNotify();
  const { role } = useAuth();
  const [showReassign, setShowReassign] = useState(false);
  const canReassign = ["SUPER_ADMIN", "ADMIN", "PRESIDENT"].includes(role);

  const { data: member, isLoading, isError, refetch } = useQuery<Member>({
    queryKey: ["member", memberCode],
    queryFn: () => {
      if (!memberCode) throw new Error("Missing member code");
      return getMember(memberCode);
    },
    enabled: !!memberCode,
    staleTime: 1000 * 60 * 2,
  });

  const [relationships, setRelationships] = useState<PersonRelationshipsResponse | null>(null);

  useEffect(() => {
    if (!memberCode) return;
    getPersonRelationships(memberCode).then(setRelationships).catch(() => { });
  }, [memberCode]);

  useEffect(() => {
    if (isError) notify.error("Failed to load member details.");
  }, [isError]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 max-w-3xl mx-auto">

      <PageHeader
        title="Member Details"
        subtitle={member ? `${member.firstName} ${member.lastName ?? ""}`.trim() : undefined}
        backTo={ROUTES.PRIVATE.MEMBERS}
        actions={
          member ? (
            <>
              <Link
                to={`${ROUTES.PRIVATE.MEMBERS}/${member.memberCode}/print`}
                className="flex items-center gap-2 px-3 py-2 rounded-md border text-sm hover:bg-slate-50 transition"
              >
                <Printer className="w-4 h-4" />
                Print
              </Link>
              {canReassign && member && (
                <button
                  type="button"
                  onClick={() => setShowReassign(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md border text-sm hover:bg-slate-50 transition"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  Reassign family
                </button>
              )}
              <Link
                to={`${ROUTES.PRIVATE.MEMBERS}/${member.memberCode}/lineage`}
                className="flex items-center gap-2 px-3 py-2 rounded-md border text-sm hover:bg-slate-50 transition"
              >
                <GitFork className="w-4 h-4" />
                Lineage
              </Link>
              <Link
                to={`${ROUTES.PRIVATE.MEMBERS}/${member.memberCode}/edit`}
                className="flex items-center gap-2 px-3 py-2 rounded-md bg-primary text-white text-sm hover:bg-primary/90 transition"
              >
                <Pencil className="w-4 h-4" />
                Edit
              </Link>
            </>
          ) : undefined
        }
      />

      {/* Loading */}
      {isLoading && <ViewMemberSkeleton />}

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
              {member.dod && (
                <Row label="Date of Death" value={member.dod} />
              )}
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

          <Section title="Relationships">
            <div className="space-y-3">

              {/* Spouses */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Wife / Wives</p>
                {relationships?.spouses && relationships.spouses.length > 0 ? (
                  <div className="space-y-2">
                    {/* Current wives */}
                    {relationships.spouses.filter(s => s.isCurrent).map(s => (
                      <div key={s.person.memberCode} className="flex items-start gap-2 text-sm">
                        <span className="text-pink-400 mt-0.5">♥</span>
                        <div>
                          <span className="font-medium text-slate-700">{s.person.firstName} {s.person.lastName ?? ""}</span>
                          <span className="ml-2 text-xs text-slate-400">{s.person.memberCode}</span>
                          {s.startDate && <span className="ml-2 text-xs text-slate-400">married {s.startDate}</span>}
                          {s.person.dod && <span className="ml-2 text-xs text-slate-400">† {s.person.dod.substring(0, 4)}</span>}
                        </div>
                      </div>
                    ))}
                    {/* Former wives */}
                    {relationships.spouses.filter(s => !s.isCurrent).map(s => (
                      <div key={s.person.memberCode} className="flex items-start gap-2 text-sm opacity-60">
                        <span className="text-slate-400 mt-0.5">○</span>
                        <div>
                          <span className="font-medium text-slate-600">{s.person.firstName} {s.person.lastName ?? ""}</span>
                          <span className="ml-2 text-xs text-slate-400">{s.person.memberCode}</span>
                          {s.startDate && s.endDate && (
                            <span className="ml-2 text-xs text-slate-400">{s.startDate} – {s.endDate}</span>
                          )}
                          {s.endReason && (
                            <span className="ml-2 text-xs bg-slate-100 text-slate-500 rounded px-1">
                              {s.endReason.replace(/_/g, " ").toLowerCase()}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">—</p>
                )}
              </div>

              {/* Father */}
              {relationships?.father && (
                <div className="flex gap-2 text-sm">
                  <div className="w-36 text-slate-500 shrink-0">Father</div>
                  <div className="font-medium text-slate-800">
                    {relationships.father.firstName} {relationships.father.lastName ?? ""}
                    <span className="ml-2 text-xs text-slate-400">{relationships.father.memberCode}</span>
                  </div>
                </div>
              )}

              {/* Mother */}
              {relationships?.mother && (
                <div className="flex gap-2 text-sm">
                  <div className="w-36 text-slate-500 shrink-0">Mother</div>
                  <div className="font-medium text-slate-800">
                    {relationships.mother.firstName} {relationships.mother.lastName ?? ""}
                    <span className="ml-2 text-xs text-slate-400">{relationships.mother.memberCode}</span>
                  </div>
                </div>
              )}

              {/* Children */}
              {relationships?.children && relationships.children.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Children</p>
                  <div className="space-y-1">
                    {relationships.children.map(c => (
                      <div key={c.memberCode} className="text-sm text-slate-700">
                        {c.firstName} {c.lastName ?? ""}
                        <span className="ml-2 text-xs text-slate-400">{c.memberCode}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </Section>

        </div>
      )}

      {showReassign && member && (
        <ReassignFamilyDialog
          member={member}
          onClose={() => setShowReassign(false)}
        />
      )}

    </div>
  );
}
