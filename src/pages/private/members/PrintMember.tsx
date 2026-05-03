import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Printer, ArrowLeft } from "lucide-react";
import { getMember } from "../../../features/members/services/memberService";
import { getFamilyMembers, getFamily } from "../../../features/members/services/familyService";
import { Member } from "../../../features/members/types";
import { ROUTES } from "../../../constants/routes";
import MemberAvatar from "../../../components/MemberAvatar";

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

// ── Member detail block ───────────────────────────────────────────────────────

function MemberBlock({
    member,
    isHead,
}: {
    member: Member;
    isHead?: boolean;
}) {
    const address = (member as any).currentAddress;

    return (
        <div
            className={[
                "border rounded-lg p-4 mb-4 print:border-slate-300 print:mb-3",
                isHead ? "border-primary/40 bg-primary/5" : "border-slate-200 bg-white",
            ].join(" ")}
        >
            {/* Member header row */}
            <div className="flex items-center gap-4 mb-3">
                {/* Avatar — hidden on print to save ink unless browser supports it */}
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

            {/* Details grid */}
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
                {address?.village && (
                    <div className="flex gap-2">
                        <span className="text-slate-400 w-24 shrink-0">Town/Village</span>
                        <span>
                            {[address.village]
                                .filter(Boolean)
                                .join(", ")}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PrintMember() {
    const { memberCode } = useParams<{ memberCode: string }>();
    const [includeFamily, setIncludeFamily] = useState(false);

    // Fetch the main member
    const {
        data: member,
        isLoading: memberLoading,
        isError: memberError,
    } = useQuery<Member>({
        queryKey: ["member", memberCode],
        queryFn: () => getMember(memberCode!),
        enabled: !!memberCode,
        staleTime: 1000 * 60 * 5,
    });

    // Fetch family details (to know who the actual head is)
    const { data: familyData } = useQuery({
        queryKey: ["family", member?.familyCode],
        queryFn: () => getFamily(member!.familyCode),
        enabled: !!member?.familyCode && includeFamily,
        staleTime: 1000 * 60 * 5,
    });

    // Fetch family members only when toggle is on
    const {
        data: familyMembers,
        isLoading: familyLoading,
    } = useQuery<Member[]>({
        queryKey: ["family-members", member?.familyCode],
        queryFn: () => getFamilyMembers(member!.familyCode),
        enabled: !!member?.familyCode && includeFamily,
        staleTime: 1000 * 60 * 5,
    });

    const isLoading = memberLoading || (includeFamily && familyLoading);
    const headPersonId = familyData?.headPersonId ?? null;

    // When showing full family: always lead with the family head.
    // Find head from the full members list (not just "other" members).
    const allFamilyMembers = familyMembers ?? [];

    const headMember = includeFamily && headPersonId
        ? (allFamilyMembers.find(m => m.id === headPersonId) ?? member!)
        : null;

    // Everyone except the head — preserves original order
    const nonHeadMembers = includeFamily
        ? allFamilyMembers.filter(m => m.id !== headPersonId)
        : [];

    // ── Render ────────────────────────────────────────────────────────────────

    if (memberError) {
        return (
            <div className="p-6 text-red-500 text-sm">
                Failed to load member details.{" "}
                <Link to={ROUTES.PRIVATE.MEMBERS} className="underline">
                    Go back
                </Link>
            </div>
        );
    }

    return (
        <>
            {/* ── Screen-only controls (hidden on print) ───────────────────────── */}
            <div className="print:hidden mb-6 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <Link
                        to={member
                            ? `${ROUTES.PRIVATE.MEMBERS}/${member.memberCode}/view`
                            : ROUTES.PRIVATE.MEMBERS}
                        className="flex items-center gap-2 px-3 py-2 rounded-md border text-sm hover:bg-slate-50 transition"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </Link>
                    <h1 className="text-lg font-semibold text-slate-800">Print Preview</h1>
                </div>

                <div className="flex items-center gap-4">
                    {/* Family toggle */}
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600 select-none">
                        <div
                            onClick={() => setIncludeFamily((v) => !v)}
                            className={[
                                "relative w-10 h-5 rounded-full transition-colors cursor-pointer",
                                includeFamily ? "bg-primary" : "bg-slate-300",
                            ].join(" ")}
                        >
                            <div
                                className={[
                                    "absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform",
                                    includeFamily ? "translate-x-5" : "translate-x-0.5",
                                ].join(" ")}
                            />
                        </div>
                        Include all family members
                    </label>

                    <button
                        onClick={() => window.print()}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-white text-sm hover:bg-primary/90 disabled:opacity-60 transition"
                    >
                        <Printer className="w-4 h-4" />
                        {isLoading ? "Loading…" : "Print"}
                    </button>
                </div>
            </div>

            {/* ── Printable content ─────────────────────────────────────────────── */}
            <div className="max-w-2xl mx-auto bg-white rounded-xl shadow print:shadow-none print:rounded-none print:max-w-full">
                <div className="p-6 print:p-4">

                    {/* Letterhead */}
                    <div className="border-b-2 border-slate-800 pb-4 mb-6 print:mb-4">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                {/* Show member avatar in letterhead only when single member view */}
                                {!includeFamily && member && (
                                    <MemberAvatar
                                        memberCode={member.memberCode}
                                        firstName={member.firstName}
                                        lastName={member.lastName}
                                        hasPhoto={member.hasPhoto ?? false}
                                        size="md"
                                    />
                                )}
                                <div>
                                    <div className="text-xl font-bold text-slate-800 tracking-wide">
                                        {member?.societyName ?? member?.societyCode ?? "Society"}
                                    </div>
                                    <div className="text-sm text-slate-500 mt-0.5">
                                        Member Registration Record
                                    </div>
                                </div>
                            </div>
                            <div className="text-right text-xs text-slate-400">
                                <div>
                                    Printed: {new Date().toLocaleDateString("en-IN", {
                                        day: "2-digit", month: "short", year: "numeric",
                                    })}
                                </div>
                                {member && (
                                    <div className="mt-1">Family: {member.familyCode}</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Loading state */}
                    {memberLoading && (
                        <div className="text-sm text-slate-500 py-8 text-center">
                            Loading member details…
                        </div>
                    )}

                    {/* Member details */}
                    {member && (
                        <>
                            {/* ── Full family view ── */}
                            {includeFamily ? (
                                <>
                                    {/* Section label */}
                                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                                        Family Head
                                    </div>

                                    {/* Head member — always first */}
                                    {familyLoading ? (
                                        <div className="text-sm text-slate-400 py-4 text-center">
                                            Loading family members…
                                        </div>
                                    ) : headMember ? (
                                        <MemberBlock
                                            member={headMember}
                                            isHead={true}
                                        />
                                    ) : (
                                        // Family data not yet loaded — show current member as placeholder
                                        <MemberBlock
                                            member={member}
                                            isHead={member.id === headPersonId}
                                        />
                                    )}

                                    {/* Rest of family */}
                                    {!familyLoading && nonHeadMembers.length > 0 && (
                                        <>
                                            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 mt-5">
                                                Other Family Members ({nonHeadMembers.length})
                                            </div>
                                            {nonHeadMembers.map((m, i) => (
                                                <MemberBlock
                                                    key={m.memberCode}
                                                    member={m}
                                                    isHead={false}
                                                />
                                            ))}
                                        </>
                                    )}

                                    {!familyLoading && allFamilyMembers.length === 0 && (
                                        <div className="text-sm text-slate-400 py-2">
                                            No active members found in this family.
                                        </div>
                                    )}
                                </>
                            ) : (
                                /* ── Single member view ── */
                                <>
                                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                                        Member Details
                                    </div>
                                    <MemberBlock
                                        member={member}
                                        isHead={false}
                                    />
                                </>
                            )}

                            {/* Footer */}
                            <div className="mt-8 pt-4 border-t border-slate-200 text-xs text-slate-400 flex justify-between">
                                <span>Member Code: {member.memberCode}</span>
                                <span>Society: {member.societyCode}</span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
