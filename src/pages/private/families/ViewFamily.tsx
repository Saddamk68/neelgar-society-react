import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Printer, UserCog } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import ViewFamilySkeleton from "@/components/skeletons/ViewFamilySkeleton";
import MemberAvatar from "@/components/MemberAvatar";
import { useNotify } from "@/services/notifications";
import { Family, Member } from "@/features/members/types";
import { getFamily, getFamilyMembers } from "@/features/members/services/familyService";
import { ROUTES } from "@/constants/routes";
import ReassignHeadDialog from "@/components/ReassignHeadDialog";
import { usePermission } from "@/hooks/usePermission";
import { PERM } from "@/constants/permissions";

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

export default function ViewFamily() {
    const { familyCode } = useParams<{ familyCode: string }>();
    const notify = useNotify();

    const queryClient = useQueryClient();
    const [showReassign, setShowReassign] = useState(false);
    const { can } = usePermission();

    const { data: family, isLoading: familyLoading, isError: familyError, refetch } =
        useQuery<Family>({
            queryKey: ["family", familyCode],
            queryFn: () => {
                if (!familyCode) throw new Error("Missing family code");
                return getFamily(familyCode);
            },
            enabled: !!familyCode,
            staleTime: 1000 * 60 * 2,
        });

    const { data: members = [], isLoading: membersLoading } = useQuery<Member[]>({
        queryKey: ["family-members", familyCode],
        queryFn: () => getFamilyMembers(familyCode!),
        enabled: !!familyCode,
        staleTime: 1000 * 60 * 2,
    });

    useEffect(() => {
        if (familyError) notify.error("Failed to load family details.");
    }, [familyError]);

    const isLoading = familyLoading || membersLoading;

    // ── Render ──────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-4 max-w-3xl mx-auto">

            <PageHeader
                title="Family Details"
                subtitle={
                    family
                        ? `${family.familyCode} · ${family.headPersonName ?? "No head assigned"}`
                        : undefined
                }
                backTo="back"
                actions={
                    family ? (
                        <>
                            {family.isActive && can(PERM.FAMILY_CREATE) && (
                                <button
                                    onClick={() => setShowReassign(true)}
                                    className="flex items-center gap-2 px-3 py-2 rounded-md border text-sm hover:bg-slate-50 transition"
                                >
                                    <UserCog className="w-4 h-4" />
                                    Reassign Head
                                </button>
                            )}
                            <Link
                                to={`${ROUTES.PRIVATE.FAMILIES}/${family.familyCode}/print`}
                                className="flex items-center gap-2 px-3 py-2 rounded-md border text-sm hover:bg-slate-50 transition"
                            >
                                <Printer className="w-4 h-4" />
                                Print
                            </Link>
                            {can(PERM.FAMILY_CREATE) && (
                                <Link
                                    to={`${ROUTES.PRIVATE.FAMILIES}/${family.familyCode}/edit`}
                                    className="flex items-center gap-2 px-3 py-2 rounded-md bg-primary text-white text-sm hover:bg-primary/90 transition"
                                >
                                    <Pencil className="w-4 h-4" />
                                    Edit
                                </Link>
                            )}
                        </>
                    ) : undefined
                }
            />

            {/* Loading */}
            {isLoading && <ViewFamilySkeleton />}

            {/* Error */}
            {familyError && (
                <div className="bg-white rounded-xl shadow p-6 text-sm text-red-500">
                    Failed to load family.{" "}
                    <button onClick={() => refetch()} className="underline">
                        Retry
                    </button>
                </div>
            )}

            {/* Family card */}
            {!isLoading && !familyError && family && (
                <div className="bg-white rounded-xl shadow p-6">

                    {/* Identity header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                                {(family.headPersonName ?? "?")[0].toUpperCase()}
                            </div>
                            <div>
                                <div className="text-xl font-semibold text-slate-800">
                                    {family.headPersonName ?? "No head assigned"}
                                </div>
                                <div className="text-sm text-slate-500 mt-0.5 font-mono">
                                    {family.familyCode}
                                </div>
                                {family.clanName && (
                                    <span className="inline-block mt-1 text-xs bg-violet-50 text-violet-700 border border-violet-200 rounded px-2 py-0.5">
                                        {family.clanName}
                                    </span>
                                )}
                            </div>
                        </div>
                        <span
                            className={[
                                "text-xs font-medium px-3 py-1 rounded-full",
                                family.isActive
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-600",
                            ].join(" ")}
                        >
                            {family.isActive ? "Active" : "Inactive"}
                        </span>
                    </div>

                    {/* Family details */}
                    <Section title="Family Information">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                            <Row label="Family Code" value={family.familyCode} />
                            <Row label="Village/Town" value={family.geoUnitName} />
                            <Row label="District" value={family.districtName} />
                            <Row label="State" value={family.stateName} />
                            <Row label="Clan Code" value={family.clanCode} />
                            <Row label="Clan Name" value={family.clanName} />
                            <Row label="Society" value={`${family.societyName} (${family.societyCode})`} />
                            <Row label="Head Member" value={family.headPersonName} />
                            <Row label="Created By" value={family.createdBy} />
                            <Row label="Created At" value={family.createdAt} />
                        </div>
                    </Section>

                    {/* Members section */}
                    <Section title={`Members (${members.length})`}>
                        {members.length === 0 ? (
                            <p className="text-sm text-slate-400">No active members in this family.</p>
                        ) : (
                            <div className="space-y-2">
                                {members.map((m) => (
                                    <div
                                        key={m.memberCode}
                                        className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition"
                                    >
                                        <MemberAvatar
                                            memberCode={m.memberCode}
                                            firstName={m.firstName}
                                            lastName={m.lastName}
                                            hasPhoto={m.hasPhoto ?? false}
                                            size="sm"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-slate-800">
                                                {m.firstName} {m.lastName ?? ""}
                                                {m.isHead && (
                                                    <span className="ml-2 text-xs bg-amber-100 text-amber-700 rounded px-1.5 py-0.5">
                                                        Head
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-slate-400 font-mono">{m.memberCode}</div>
                                        </div>
                                        <div className="text-xs text-slate-500 shrink-0">
                                            {m.gender && { MALE: "Male", FEMALE: "Female", OTHER: "Other" }[m.gender]}
                                            {m.dob && <span className="ml-2">{m.dob}</span>}
                                        </div>
                                        <Link
                                            to={`${ROUTES.PRIVATE.MEMBERS}/${m.memberCode}/view`}
                                            className="text-xs text-primary hover:underline shrink-0"
                                        >
                                            View
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Section>

                </div>
            )}

            {showReassign && family?.headPersonCode && (
                <ReassignHeadDialog
                    member={{
                        id: family.headPersonId!,
                        memberCode: family.headPersonCode,
                        familyCode: family.familyCode,
                        familyId: family.id,
                        societyId: family.societyId,
                        societyCode: family.societyCode,
                        firstName: family.headPersonName ?? "Head",
                        isActive: true,
                    } as Member}
                    onClose={() => setShowReassign(false)}
                    onSuccess={() => {
                        setShowReassign(false);
                        queryClient.invalidateQueries({ queryKey: ["family", familyCode] });
                        queryClient.invalidateQueries({ queryKey: ["family-members", familyCode] });
                    }}
                    onDeactivate={() => {
                        setShowReassign(false);
                        queryClient.invalidateQueries({ queryKey: ["family", familyCode] });
                    }}
                    mode="reassign"
                />
            )}

        </div>
    );
}
