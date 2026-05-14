import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, User } from "lucide-react";
import { getPersonRelationships } from "../../../features/members/services/relationshipService";
import { getMember } from "../../../features/members/services/memberService";
import { Member, PersonRelationshipsResponse } from "../../../features/members/types";
import { ROUTES } from "../../../constants/routes";
import MemberAvatar from "@/components/MemberAvatar";


// ── Node card ─────────────────────────────────────────────────────────────────

function NodeCard({
    member,
    isFocal,
    currentFamilyCode,
}: {
    member: Member;
    isFocal?: boolean;
    currentFamilyCode: string;
}) {
    const navigate = useNavigate();
    const fullName = [member.firstName, member.lastName].filter(Boolean).join(" ");
    const isSameFamily = member.familyCode === currentFamilyCode;

    return (
        <button
            type="button"
            onClick={() =>
                navigate(`${ROUTES.PRIVATE.MEMBERS}/${member.memberCode}/view`)
            }
            className={[
                "flex flex-col items-center p-3 rounded-xl border-2 transition w-36 shrink-0 text-center group",
                isFocal
                    ? "border-primary bg-primary/5 shadow-md"
                    : isSameFamily
                        ? "border-slate-300 bg-white hover:border-primary/50 hover:shadow"
                        : "border-amber-300 bg-amber-50 hover:border-amber-400 hover:shadow",
            ].join(" ")}
        >
            <MemberAvatar
                memberCode={member.memberCode}
                firstName={member.firstName}
                lastName={member.lastName}
                hasPhoto={member.hasPhoto ?? false}
                size="sm"
            />
            <div className="mt-2 text-xs font-semibold text-slate-800 leading-tight line-clamp-2">
                {fullName}
            </div>
            <div className="text-xs font-mono text-slate-400 mt-0.5 truncate w-full">
                {member.memberCode}
            </div>
            {member.familyCode && (
                <div
                    className={[
                        "text-xs mt-1 px-1.5 py-0.5 rounded font-mono",
                        isSameFamily
                            ? "bg-slate-100 text-slate-500"
                            : "bg-amber-100 text-amber-700",
                    ].join(" ")}
                >
                    {member.familyCode}
                </div>
            )}
            {isFocal && (
                <div className="mt-1 text-xs text-primary font-medium">You are here</div>
            )}
        </button>
    );
}

// ── Connector line ────────────────────────────────────────────────────────────

function VConnector() {
    return (
        <div className="flex justify-center">
            <div className="w-px h-8 bg-slate-300" />
        </div>
    );
}

// ── Row of nodes ──────────────────────────────────────────────────────────────

function NodeRow({
    members,
    isFocal,
    currentFamilyCode,
    label,
}: {
    members: Member[];
    isFocal?: boolean;
    currentFamilyCode: string;
    label?: string;
}) {
    return (
        <div>
            {label && (
                <div className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    {label}
                </div>
            )}
            <div className="flex items-start justify-center gap-4 flex-wrap">
                {members.map((m) => (
                    <NodeCard
                        key={m.memberCode}
                        member={m}
                        isFocal={isFocal && members.length === 1}
                        currentFamilyCode={currentFamilyCode}
                    />
                ))}
            </div>
        </div>
    );
}

// ── Generation level fetcher ──────────────────────────────────────────────────

function useRelationships(memberCode: string | undefined, enabled: boolean) {
    return useQuery<PersonRelationshipsResponse>({
        queryKey: ["relationships", memberCode],
        queryFn: () => getPersonRelationships(memberCode!),
        enabled: !!memberCode && enabled,
        staleTime: 0,
    });
}

// ── Grandparent row builder ───────────────────────────────────────────────────

function GrandparentRow({
    parentCode,
    currentFamilyCode,
}: {
    parentCode: string;
    currentFamilyCode: string;
}) {
    const { data: parentRels } = useRelationships(parentCode, true);

    const grandparents: Member[] = [
        parentRels?.father,
        parentRels?.mother,
    ].filter((m): m is Member => !!m);

    if (grandparents.length === 0) return null;

    return (
        <div className="flex items-start justify-center gap-4 flex-wrap">
            {grandparents.map((gp) => (
                <NodeCard
                    key={gp.memberCode}
                    member={gp}
                    currentFamilyCode={currentFamilyCode}
                />
            ))}
        </div>
    );
}

// ── Child subtree ─────────────────────────────────────────────────────────────

function ChildSubtree({
    child,
    currentFamilyCode,
    depth,
}: {
    child: Member;
    currentFamilyCode: string;
    depth: number;
}) {
    const { data: childRels } = useRelationships(child.memberCode, depth < 4);

    const grandchildren: Member[] = childRels?.children ?? [];

    return (
        <div className="flex flex-col items-center gap-0">
            <NodeCard member={child} currentFamilyCode={currentFamilyCode} />
            {grandchildren.length > 0 && depth < 3 && (
                <>
                    <VConnector />
                    <div className="flex items-start justify-center gap-3 flex-wrap">
                        {grandchildren.map((gc) => (
                            <NodeCard
                                key={gc.memberCode}
                                member={gc}
                                currentFamilyCode={currentFamilyCode}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function LineageView() {
    const { memberCode } = useParams<{ memberCode: string }>();
    const navigate = useNavigate();

    // Focal member
    const { data: member, isLoading: memberLoading } = useQuery<Member>({
        queryKey: ["member", memberCode],
        queryFn: () => getMember(memberCode!),
        enabled: !!memberCode,
        staleTime: 1000 * 60 * 2,
    });

    // Focal member's relationships
    const { data: focalRels, isLoading: relsLoading } = useRelationships(
        memberCode,
        !!memberCode
    );

    const isLoading = memberLoading || relsLoading;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24 text-sm text-slate-400">
                Loading lineage…
            </div>
        );
    }

    if (!member) {
        return (
            <div className="p-6 text-sm text-red-500">
                Member not found.{" "}
                <button
                    type="button"
                    onClick={() => navigate(ROUTES.PRIVATE.MEMBERS)}
                    className="underline"
                >
                    Go back
                </button>
            </div>
        );
    }

    const parents: Member[] = [
        focalRels?.father,
        focalRels?.mother,
    ].filter((m): m is Member => !!m);

    const spouse = focalRels?.spouse;
    const children: Member[] = focalRels?.children ?? [];
    const siblings: Member[] = focalRels?.siblings ?? [];

    const currentFamilyCode = member.familyCode;
    const fullName = [member.firstName, member.lastName].filter(Boolean).join(" ");

    return (
        <div className="space-y-4 max-w-5xl mx-auto">

            {/* Header */}
            <div className="flex items-center justify-between">
                <button
                    type="button"
                    onClick={() =>
                        navigate(`${ROUTES.PRIVATE.MEMBERS}/${member.memberCode}/view`)
                    }
                    className="flex items-center gap-2 px-3 py-2 rounded-md border text-sm hover:bg-slate-50 transition"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>
                <div className="text-center">
                    <div className="text-lg font-semibold text-slate-800">
                        Lineage — {fullName}
                    </div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">
                        {member.memberCode} · {member.familyCode}
                    </div>
                </div>
                <div className="w-24" /> {/* spacer to center title */}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 justify-center flex-wrap text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded border-2 border-slate-300 bg-white" />
                    Same family
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded border-2 border-amber-300 bg-amber-50" />
                    Different family
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded border-2 border-primary bg-primary/5" />
                    Focal member
                </div>
            </div>

            {/* Tree canvas */}
            <div className="bg-white rounded-xl shadow p-6 overflow-x-auto">
                <div className="min-w-max mx-auto flex flex-col items-center gap-0">

                    {/* ── Generation +2: Grandparents ── */}
                    {parents.length > 0 && (
                        <>
                            <div className="flex items-start justify-center gap-12 flex-wrap">
                                {parents.map((parent) => (
                                    <GrandparentRow
                                        key={parent.memberCode}
                                        parentCode={parent.memberCode}
                                        currentFamilyCode={currentFamilyCode}
                                    />
                                ))}
                            </div>
                            {parents.some((p) => {
                                // only show this connector if at least one parent has parents
                                return true;
                            }) && <VConnector />}
                        </>
                    )}

                    {/* ── Generation +1: Parents ── */}
                    {parents.length > 0 && (
                        <>
                            <NodeRow
                                members={parents}
                                currentFamilyCode={currentFamilyCode}
                                label="Parents"
                            />
                            <VConnector />
                        </>
                    )}

                    {/* ── Generation 0: Focal + Spouse + Siblings ── */}
                    <div className="flex flex-col items-center gap-3">

                        {/* Siblings row — above focal */}
                        {siblings.length > 0 && (
                            <div className="flex flex-col items-center gap-2 w-full">
                                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    Siblings ({siblings.length})
                                </div>
                                <div className="flex items-start justify-center gap-3 flex-wrap">
                                    {siblings.map((s) => (
                                        <NodeCard
                                            key={s.memberCode}
                                            member={s}
                                            currentFamilyCode={currentFamilyCode}
                                        />
                                    ))}
                                </div>
                                <div className="flex justify-center w-full">
                                    <div className="w-px h-6 bg-slate-200" />
                                </div>
                            </div>
                        )}

                        {/* Focal + Spouse side by side */}
                        <div className="flex items-center gap-6">
                            <NodeCard
                                member={member}
                                isFocal
                                currentFamilyCode={currentFamilyCode}
                            />
                            {spouse && (
                                <>
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="text-xs text-slate-400">married</div>
                                        <div className="w-8 h-px bg-slate-300" />
                                    </div>
                                    <NodeCard
                                        member={spouse}
                                        currentFamilyCode={currentFamilyCode}
                                    />
                                </>
                            )}
                        </div>
                    </div>

                    {/* ── Generation -1 & -2: Children (+ grandchildren) ── */}
                    {children.length > 0 && (
                        <>
                            <VConnector />
                            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                Children ({children.length})
                            </div>
                            <div className="flex items-start justify-center gap-6 flex-wrap">
                                {children.map((child) => (
                                    <ChildSubtree
                                        key={child.memberCode}
                                        child={child}
                                        currentFamilyCode={currentFamilyCode}
                                        depth={1}
                                    />
                                ))}
                            </div>
                        </>
                    )}

                </div>
            </div>

            {/* Empty state */}
            {parents.length === 0 && children.length === 0 && siblings.length === 0 && !spouse && (
                <div className="bg-white rounded-xl shadow p-10 text-center text-slate-400 text-sm">
                    <User className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                    No relationships linked yet for this member.{" "}
                    <Link
                        to={`${ROUTES.PRIVATE.MEMBERS}/${member.memberCode}/view`}
                        className="underline text-primary"
                    >
                        View member
                    </Link>{" "}
                    to add relationships.
                </div>
            )}

        </div>
    );
}
