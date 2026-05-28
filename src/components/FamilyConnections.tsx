import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getPersonRelationships } from "../features/members/services/relationshipService";
import { Member, PersonRelationshipsResponse } from "../features/members/types";
import { ROUTES } from "../constants/routes";

// ── Single reference row ──────────────────────────────────────────────────────

function RelationRow({
    label,
    member,
    currentSocietyId,
}: {
    label: string;
    member: Member;
    currentSocietyId: number;
}) {
    const navigate = useNavigate();
    const fullName = [member.firstName, member.lastName].filter(Boolean).join(" ");
    const isInSystem = !!member.familyCode;
    const isOutsideSociety = !member.familyCode || member.societyId !== currentSocietyId;

    return (
        <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
            <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 w-16 shrink-0">{label}</span>
                <span className="text-sm text-slate-700">{fullName}</span>
                <span className="text-xs font-mono text-slate-400">{member.memberCode}</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                {isInSystem && !isOutsideSociety ? (
                    <button
                        type="button"
                        onClick={() =>
                            navigate(`${ROUTES.PRIVATE.FAMILIES}/${member.familyCode}/view`)
                        }
                        className="text-xs font-mono px-2 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition print:pointer-events-none"
                    >
                        {member.familyCode}
                    </button>
                ) : isInSystem && isOutsideSociety ? (
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-500">
                            {member.familyCode}
                        </span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200">
                            Other society
                        </span>
                    </div>
                ) : (
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-400">
                        Not in system
                    </span>
                )}
            </div>
        </div>
    );
}

// ── Section ───────────────────────────────────────────────────────────────────

function Section({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="mb-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                {title}
            </div>
            {children}
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function FamilyConnections({
    memberCode,
    societyId,
}: {
    memberCode: string;
    societyId: number;
}) {
    const { data, isLoading, isError } = useQuery<PersonRelationshipsResponse>({
        queryKey: ["relationships", memberCode],
        queryFn: () => getPersonRelationships(memberCode),
        enabled: !!memberCode,
        staleTime: 1000 * 60 * 5,
    });

    if (isLoading) {
        return (
            <div className="text-xs text-slate-400 py-2 text-center">
                Loading family connections…
            </div>
        );
    }

    if (isError || !data) return null;

    const { father, mother, spouses, children, siblings } = data;

    // Nothing to show — collapse section entirely
    const hasAny =
        father || mother || spouses?.length || children?.length || siblings?.length;
    if (!hasAny) return null;

    return (
        <div className="border border-slate-200 rounded-lg p-4 mb-4 bg-slate-50 print:border-slate-300">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Family Connections
            </div>

            {/* Parents */}
            {(father || mother) && (
                <Section title="Parents">
                    {father && <RelationRow label="Father" member={father} currentSocietyId={societyId} />}
                    {mother && <RelationRow label="Mother" member={mother} currentSocietyId={societyId} />}
                </Section>
            )}

            {/* Spouse */}
            {spouses && spouses.length > 0 && (
                <Section title="Spouse">
                    {spouses.map((sp, i) => (
                        <RelationRow key={i} label="Spouse" member={sp.person} currentSocietyId={societyId} />
                    ))}
                </Section>
            )}

            {/* Children */}
            {children && children.length > 0 && (
                <Section title={`Children (${children.length})`}>
                    {children.map((child) => (
                        <RelationRow key={child.memberCode} label="Child" member={child} currentSocietyId={societyId} />
                    ))}
                </Section>
            )}

            {/* Siblings */}
            {siblings && siblings.length > 0 && (
                <Section title={`Siblings (${siblings.length})`}>
                    {siblings.map((sib) => (
                        <RelationRow key={sib.memberCode} label="Sibling" member={sib} currentSocietyId={societyId} />
                    ))}
                </Section>
            )}
        </div>
    );
}
