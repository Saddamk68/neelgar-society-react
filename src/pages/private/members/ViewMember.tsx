import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRightLeft, Pencil, Printer, GitFork, KeyRound, EllipsisVertical } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import ViewMemberSkeleton from "@/components/skeletons/ViewMemberSkeleton";
import { getMember } from "../../../features/members/services/memberService";
import { Member, PersonRelationshipsResponse } from "../../../features/members/types";
import { useNotify } from "../../../services/notifications";
import { ROUTES } from "../../../constants/routes";
import MemberAvatar from "@/components/MemberAvatar";
import ReassignFamilyDialog from "@/components/ReassignFamilyDialog";
import { getPersonRelationships } from "@/features/members/services/relationshipService";
import { usePermission } from "@/hooks/usePermission";
import { PERM } from "@/constants/permissions";
import { provisionUserAccount } from "@/features/users/services/userService";
import RequestChangesModal from "@/components/RequestChangesModal";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(val?: string | null): string {
  if (!val) return "—";
  try {
    return new Date(val).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch {
    return val;
  }
}

// ── Actions dropdown ──────────────────────────────────────────────────────────

function ActionsMenu({ children, dataTour }: { children: React.ReactNode; dataTour?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        data-tour={dataTour}
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 px-3 py-2 rounded-md border text-sm hover:bg-slate-50 transition"
      >
        <EllipsisVertical className="w-5 h-5" />
      </button>

      {open && (
        <>
          {/* backdrop — clicking outside closes menu */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-1 w-52 bg-white rounded-xl shadow-lg border border-slate-100 py-1 text-sm">
            {children}
          </div>
        </>
      )}
    </div>
  );
}

function ActionItem({
  icon: Icon,
  label,
  onClick,
  href,
  danger,
  disabled,
}: {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
  href?: string;
  danger?: boolean;
  disabled?: boolean;
}) {
  const cls = [
    "flex items-center gap-3 w-full px-4 py-2 hover:bg-slate-50 transition text-left",
    danger ? "text-red-600" : "text-slate-700",
    disabled ? "opacity-40 pointer-events-none" : "",
  ].join(" ");

  if (href) {
    return (
      <Link to={href} className={cls}>
        <Icon className="w-4 h-4 shrink-0" />
        {label}
      </Link>
    );
  }

  return (
    <button type="button" className={cls} onClick={onClick} disabled={disabled}>
      <Icon className="w-4 h-4 shrink-0" />
      {label}
    </button>
  );
}

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
  const { can } = usePermission();
  const [showReassign, setShowReassign] = useState(false);
  const canReassign = can(PERM.FAMILY_CREATE);
  const [showProvision, setShowProvision] = useState(false);
  const [provisionEmail, setProvisionEmail] = useState("");
  const [provisioning, setProvisioning] = useState(false);
  const canManageUsers = can(PERM.USER_MANAGE);
  const [showRequestChanges, setShowRequestChanges] = useState(false);
  const canEditSelf = can(PERM.MEMBER_SELF_EDIT);

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

  // ── Provision handler ────────────────────────────────────────────────────────

  async function handleProvision() {
    if (!member) return;
    setProvisioning(true);
    try {
      await provisionUserAccount(member.id, provisionEmail || undefined);
      notify.success("Login account provisioned. Awaiting admin approval.");
      setShowProvision(false);
      setProvisionEmail("");
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Failed to provision account.";
      notify.error(msg);
    } finally {
      setProvisioning(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 max-w-3xl mx-auto">

      <PageHeader
        title="Member Details"
        subtitle={member ? `${member.firstName} ${member.lastName ?? ""}`.trim() : undefined}
        backTo="back"
        actions={
          member ? (
            <div className="flex items-center gap-2">
              <Link
                to={`${ROUTES.PRIVATE.MEMBERS}/${member.memberCode}/lineage`}
                className="flex items-center gap-2 px-3 py-2 rounded-md bg-primary text-white text-sm hover:bg-primary/90 transition"
              >
                <GitFork className="w-4 h-4" />
                Lineage
              </Link>

              <ActionsMenu dataTour="ellipsis-menu">
                {can(PERM.MEMBER_UPDATE) && (
                  <ActionItem
                    icon={Pencil}
                    label="Edit"
                    href={`${ROUTES.PRIVATE.MEMBERS}/${member.memberCode}/edit`}
                  />
                )}
                {member.isSelf && !can(PERM.MEMBER_UPDATE) && canEditSelf && (
                  <ActionItem
                    icon={Pencil}
                    label="Request Changes"
                    onClick={() => setShowRequestChanges(true)}
                  />
                )}
                <ActionItem
                  icon={Printer}
                  label="Print"
                  href={`${ROUTES.PRIVATE.MEMBERS}/${member.memberCode}/print`}
                />
                {canReassign && (
                  <ActionItem
                    icon={ArrowRightLeft}
                    label="Reassign Family"
                    onClick={() => setShowReassign(true)}
                  />
                )}
                {canManageUsers && member.isActive && !member.hasUser && (
                  <>
                    <div className="border-t border-slate-100 my-1" />
                    <ActionItem
                      icon={KeyRound}
                      label="Provision Login"
                      onClick={() => setShowProvision(true)}
                    />
                  </>
                )}
              </ActionsMenu>
            </div>
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
              <Row label="Date of Birth" value={formatDate(member.dob)} />
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
                <Row label="Village/Town" value={member.currentAddress?.geoUnitName} />
                <Row label="District" value={member.currentAddress?.districtName} />
                <Row label="State" value={member.currentAddress?.stateName} />
              </div>
            </Section>
          )}

          {/* Parental address */}
          {member.parentalAddress && (
            <Section title="Parental Address">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                <Row label="Village/Town" value={member.parentalAddress?.geoUnitName} />
                <Row label="District" value={member.parentalAddress?.districtName} />
                <Row label="State" value={member.parentalAddress?.stateName} />
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

      {/* Provision login modal */}
      {showProvision && member && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">

            <h2 className="text-base font-semibold text-slate-800 mb-1">
              Provision Login Account
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              Creates login credentials for{" "}
              <span className="font-medium text-slate-700">
                {member.firstName} {member.lastName ?? ""}
              </span>{" "}
              ({member.memberCode}). Username will be the member code. A default
              password will be generated. The account will require admin approval
              before the member can log in.
            </p>

            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email address <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="email"
              value={provisionEmail}
              onChange={e => setProvisionEmail(e.target.value)}
              placeholder="member@example.com"
              className="w-full border rounded-md px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/40 mb-5"
            />

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setShowProvision(false); setProvisionEmail(""); }}
                className="px-4 py-2 text-sm rounded-md border hover:bg-slate-50 transition"
                disabled={provisioning}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProvision}
                disabled={provisioning}
                className="px-4 py-2 text-sm rounded-md bg-primary text-white hover:bg-primary/90 transition disabled:opacity-60"
              >
                {provisioning ? "Provisioning…" : "Provision Account"}
              </button>
            </div>

          </div>
        </div>
      )}

      {showRequestChanges && member && (
        <RequestChangesModal
          member={member}
          onClose={() => setShowRequestChanges(false)}
        />
      )}

    </div>
  );
}
