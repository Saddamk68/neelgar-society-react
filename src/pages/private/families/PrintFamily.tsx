import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Printer, ArrowLeft } from "lucide-react";
import MemberAvatar from "@/components/MemberAvatar";
import { Family, Member } from "@/features/members/types";
import { getFamily, getFamilyMembers } from "@/features/members/services/familyService";
import { ROUTES } from "@/constants/routes";
import PageHeader from "@/components/layout/PageHeader";

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

function val(v?: string | null) {
    return v || "—";
}

// ── Member block ──────────────────────────────────────────────────────────────

function MemberBlock({ member, isHead }: { member: Member; isHead: boolean }) {
    return (
        <div
            className={[
                "border rounded-lg p-4 mb-4 print:border-slate-300 print:mb-3",
                isHead ? "border-primary/40 bg-primary/5" : "border-slate-200 bg-white",
            ].join(" ")}
        >
            <div className="flex items-center gap-4 mb-3">
                <div className="print:hidden">
                    <MemberAvatar
                        memberCode={member.memberCode}
                        firstName={member.firstName}
                        lastName={member.lastName}
                        hasPhoto={member.hasPhoto ?? false}
                        size="sm"
                    />
                </div>
                <div className="flex-1 flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800 text-base">
                                {member.firstName} {member.lastName ?? ""}
                            </span>
                            {isHead && (
                                <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">
                                    Family Head
                                </span>
                            )}
                        </div>
                        <span className="text-xs text-slate-400 font-mono mt-0.5 block">
                            {member.memberCode}
                        </span>
                    </div>
                    {member.gotraName && (
                        <div className="text-right shrink-0">
                            <span className="text-xs text-slate-400">Gotra</span>
                            <div className="text-sm font-semibold text-slate-700">{member.gotraName}</div>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                <div className="flex gap-2">
                    <span className="text-slate-400 w-24 shrink-0">Gender</span>
                    <span>{val(member.gender)}</span>
                </div>
                <div className="flex gap-2">
                    <span className="text-slate-400 w-24 shrink-0">Date of Birth</span>
                    <span>{formatDate(member.dob)}</span>
                </div>
                <div className="flex gap-2">
                    <span className="text-slate-400 w-24 shrink-0">Contact</span>
                    <span>{val(member.contactNumber)}</span>
                </div>
                <div className="flex gap-2">
                    <span className="text-slate-400 w-24 shrink-0">Occupation</span>
                    <span>{val(member.occupation)}</span>
                </div>
                <div className="flex gap-2">
                    <span className="text-slate-400 w-24 shrink-0">Education</span>
                    <span>{val(member.education)}</span>
                </div>
            </div>
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PrintFamily() {
    const { familyCode } = useParams<{ familyCode: string }>();
    const navigate = useNavigate();

    const {
        data: family,
        isLoading: familyLoading,
        isError: familyError,
    } = useQuery<Family>({
        queryKey: ["family", familyCode],
        queryFn: () => getFamily(familyCode!),
        enabled: !!familyCode,
        staleTime: 1000 * 60 * 5,
    });

    const {
        data: members = [],
        isLoading: membersLoading,
    } = useQuery<Member[]>({
        queryKey: ["family-members", familyCode],
        queryFn: () => getFamilyMembers(familyCode!),
        enabled: !!familyCode,
        staleTime: 1000 * 60 * 5,
    });

    const isLoading = familyLoading || membersLoading;

    // Head first, then everyone else
    const headMember = members.find((m) => m.id === family?.headPersonId);
    const otherMembers = members.filter((m) => m.id !== family?.headPersonId);

    // ── Error state ───────────────────────────────────────────────────────────

    if (familyError) {
        return (
            <div className="p-6 text-red-500 text-sm">
                Failed to load family details.{" "}
                <button
                    type="button"
                    onClick={() => navigate(ROUTES.PRIVATE.FAMILIES)}
                    className="underline"
                >
                    Go back
                </button>
            </div>
        );
    }

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="max-w-2xl mx-auto">
            {/* Screen-only controls */}
            <div className="print:hidden mb-4">
                <PageHeader
                    title="Print Preview"
                    subtitle={family ? `${family.familyCode} · ${family.headPersonName ?? "No head assigned"}` : undefined}
                    backTo="back"
                    actions={
                        <button
                            type="button"
                            onClick={() => window.print()}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-white text-sm hover:bg-primary/90 disabled:opacity-60 transition"
                        >
                            <Printer className="w-4 h-4" />
                            {isLoading ? "Loading…" : "Print"}
                        </button>
                    }
                />
            </div>

            {/* Printable content */}
            <div className="bg-white rounded-xl shadow print:shadow-none print:rounded-none print:max-w-full">
                <div className="p-6 print:p-4">

                    {/* Letterhead */}
                    <div className="border-b-2 border-slate-800 pb-4 mb-6 print:mb-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="text-xl font-bold text-slate-800 tracking-wide">
                                    {family?.societyName ?? family?.societyCode ?? "Society"}
                                </div>
                                <div className="text-sm text-slate-500 mt-0.5">
                                    Family Registration Record
                                </div>
                            </div>
                            <div className="text-right text-xs text-slate-400">
                                <div>
                                    Printed: {new Date().toLocaleDateString("en-IN", {
                                        day: "2-digit", month: "short", year: "numeric",
                                    })}
                                </div>
                                {family && (
                                    <>
                                        <div className="mt-1 font-mono">{family.familyCode}</div>
                                        {family.clanName && (
                                            <div className="mt-1">{family.clanName}</div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Loading */}
                    {isLoading && (
                        <div className="text-sm text-slate-500 py-8 text-center">
                            Loading family details…
                        </div>
                    )}

                    {/* Content */}
                    {!isLoading && family && (
                        <>
                            {/* Family summary row */}
                            <div className="grid grid-cols-4 gap-4 mb-6 text-sm">
                                <div>
                                    <div className="text-slate-400 text-xs mb-0.5">Village/Town</div>
                                    <div className="font-medium text-slate-700">{val(family.geoUnitName)}</div>
                                </div>
                                <div>
                                    <div className="text-slate-400 text-xs mb-0.5">District</div>
                                    <div className="font-medium text-slate-700">{val(family.districtName)}</div>
                                </div>
                                <div>
                                    <div className="text-slate-400 text-xs mb-0.5">Clan</div>
                                    <div className="font-medium text-slate-700">{val(family.clanName ?? family.clanCode)}</div>
                                </div>
                                <div>
                                    <div className="text-slate-400 text-xs mb-0.5">Total Members</div>
                                    <div className="font-medium text-slate-700">{members.length}</div>
                                </div>
                            </div>

                            {/* Family Head */}
                            {headMember && (
                                <>
                                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                                        Family Head
                                    </div>
                                    <MemberBlock member={headMember} isHead={true} />
                                </>
                            )}

                            {/* Other members */}
                            {otherMembers.length > 0 && (
                                <>
                                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 mt-5">
                                        Other Members ({otherMembers.length})
                                    </div>
                                    {otherMembers.map((m) => (
                                        <MemberBlock key={m.memberCode} member={m} isHead={false} />
                                    ))}
                                </>
                            )}

                            {members.length === 0 && (
                                <div className="text-sm text-slate-400 py-2">
                                    No active members found in this family.
                                </div>
                            )}

                            {/* Footer */}
                            <div className="mt-8 pt-4 border-t border-slate-200 text-xs text-slate-400 flex justify-between">
                                <span>Family Code: {family.familyCode}</span>
                                <span>Society: {family.societyCode}</span>
                            </div>
                        </>
                    )}

                </div>
            </div>
        </div>
    );
}
