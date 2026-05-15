import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, User } from "lucide-react";
import MemberAvatar from "../../../components/MemberAvatar";
import { useLineageTree, AncestorRow, DescendantNode } from "../../../hooks/useLineageTree";
import { Member } from "../../../features/members/types";
import { ROUTES } from "../../../constants/routes";

// ── Constants ─────────────────────────────────────────────────────────────────

const CARD_W = 152;   // px
const CARD_H = 140;   // px
const CARD_GAP = 32;  // horizontal gap between cards
const ROW_GAP = 48;   // vertical gap between rows

// ── Node card ─────────────────────────────────────────────────────────────────

function NodeCard({
    member,
    isFocal,
    isSpouse,
    focalFamilyCode,
    onClick,
}: {
    member: Member;
    isFocal?: boolean;
    isSpouse?: boolean;
    focalFamilyCode: string;
    onClick: () => void;
}) {
    const fullName = [member.firstName, member.lastName].filter(Boolean).join(" ");
    const isSameFamily = member.familyCode === focalFamilyCode;

    let border = "border-slate-300";
    let bg = "bg-white";
    if (isFocal) { border = "border-primary"; bg = "bg-primary/10"; }
    else if (isSpouse) { border = "border-pink-300"; bg = "bg-pink-50"; }
    else if (!isSameFamily) { border = "border-amber-400"; bg = "bg-amber-50"; }
    if (!member.isActive) bg += " opacity-60";

    return (
        <button
            type="button"
            onClick={onClick}
            title={`View ${fullName}`}
            style={{ width: CARD_W, minHeight: CARD_H }}
            className={[
                "flex flex-col items-center p-2.5 rounded-xl border-2 transition shrink-0",
                "text-center hover:shadow-md hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary/30",
                border, bg,
            ].join(" ")}
        >
            <MemberAvatar
                memberCode={member.memberCode}
                firstName={member.firstName}
                lastName={member.lastName}
                hasPhoto={member.hasPhoto ?? false}
                size="sm"
            />
            <div className="mt-1.5 text-xs font-semibold text-slate-800 leading-tight line-clamp-2 w-full">
                {fullName}
            </div>
            <div className="text-xs font-mono text-slate-400 mt-0.5 truncate w-full">
                {member.memberCode}
            </div>
            {member.familyCode && (
                <div className={[
                    "text-xs mt-1 px-1.5 py-0.5 rounded font-mono truncate w-full",
                    isSameFamily ? "bg-slate-100 text-slate-500"
                        : isSpouse ? "bg-pink-100 text-pink-700"
                            : "bg-amber-100 text-amber-700",
                ].join(" ")}>
                    {member.familyCode}
                </div>
            )}
            {isSpouse && <div className="text-xs mt-0.5 text-pink-500 font-medium">Spouse</div>}
            {isFocal && <div className="text-xs mt-0.5 text-primary font-medium">● You are here</div>}
        </button>
    );
}

// ── Couple — member + optional spouse side by side ────────────────────────────

function CoupleUnit({
    member,
    spouse,
    isFocal,
    focalFamilyCode,
    navigate,
}: {
    member: Member;
    spouse: Member | null;
    isFocal?: boolean;
    focalFamilyCode: string;
    navigate: (path: string) => void;
}) {
    return (
        <div className="flex items-center gap-2 shrink-0">
            <NodeCard
                member={member}
                isFocal={isFocal}
                focalFamilyCode={focalFamilyCode}
                onClick={() => navigate(`${ROUTES.PRIVATE.MEMBERS}/${member.memberCode}/view`)}
            />
            {spouse && (
                <>
                    <div className="flex flex-col items-center gap-0.5 shrink-0">
                        <span className="text-pink-400 text-xs">♥</span>
                        <div className="w-6 h-px bg-pink-300" />
                    </div>
                    <NodeCard
                        member={spouse}
                        isSpouse
                        focalFamilyCode={focalFamilyCode}
                        onClick={() => navigate(`${ROUTES.PRIVATE.MEMBERS}/${spouse.memberCode}/view`)}
                    />
                </>
            )}
        </div>
    );
}

// ── Ancestor row ──────────────────────────────────────────────────────────────

function AncestorRowView({
    row,
    label,
    focalFamilyCode,
    navigate,
}: {
    row: AncestorRow;
    label: string;
    focalFamilyCode: string;
    navigate: (path: string) => void;
}) {
    return (
        <div className="flex flex-col items-center gap-2">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</div>
            <div className="flex items-start justify-center gap-6 flex-wrap">
                {row.nodes.map((node) => (
                    <CoupleUnit
                        key={node.nodeId}
                        member={node.member}
                        spouse={node.spouse}
                        focalFamilyCode={focalFamilyCode}
                        navigate={navigate}
                    />
                ))}
            </div>
        </div>
    );
}

// ── Descendant tree ───────────────────────────────────────────────────────────

function DescendantTree({
    nodes,
    focalFamilyCode,
    navigate,
    depth,
}: {
    nodes: DescendantNode[];
    focalFamilyCode: string;
    navigate: (path: string) => void;
    depth: number;
}) {
    if (nodes.length === 0) return null;

    return (
        <div className="flex items-start justify-center gap-6 flex-wrap">
            {nodes.map((node) => (
                <div key={node.nodeId} className="flex flex-col items-center gap-2">
                    {/* Connector from parent */}
                    <div className="w-px h-8 bg-slate-300" />
                    <CoupleUnit
                        member={node.member}
                        spouse={node.spouse}
                        focalFamilyCode={focalFamilyCode}
                        navigate={navigate}
                    />
                    {node.children.length > 0 && (
                        <DescendantTree
                            nodes={node.children}
                            focalFamilyCode={focalFamilyCode}
                            navigate={navigate}
                            depth={depth}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}

// ── Connector between rows ────────────────────────────────────────────────────

function RowConnector() {
    return (
        <div className="flex justify-center">
            <div className="w-px h-8 bg-slate-300" />
        </div>
    );
}

// ── Depth selector ────────────────────────────────────────────────────────────

function DepthSelector({ value, onChange }: { value: number; onChange: (n: number) => void }) {
    return (
        <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs text-slate-400 mr-1">Depth</span>
            {[1, 2, 3, 4].map((n) => (
                <button
                    key={n}
                    type="button"
                    onClick={() => onChange(n)}
                    className={[
                        "w-7 h-7 rounded-full text-xs font-semibold transition",
                        value === n ? "bg-primary text-white shadow" : "bg-slate-100 text-slate-500 hover:bg-slate-200",
                    ].join(" ")}
                >
                    {n}
                </button>
            ))}
        </div>
    );
}

// ── Legend ────────────────────────────────────────────────────────────────────

function Legend() {
    return (
        <div className="flex items-center gap-3 flex-wrap text-xs text-slate-500">
            {[
                { bg: "bg-primary/10", border: "border-primary", label: "Focal" },
                { bg: "bg-white", border: "border-slate-300", label: "Same family" },
                { bg: "bg-amber-50", border: "border-amber-400", label: "Other family" },
                { bg: "bg-pink-50", border: "border-pink-300", label: "Spouse" },
            ].map(({ bg, border, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                    <div className={`w-4 h-4 rounded ${bg} border-2 ${border}`} />
                    {label}
                </div>
            ))}
        </div>
    );
}

// ── Generation label helper ───────────────────────────────────────────────────

function genLabel(gen: number): string {
    if (gen === 1) return "Parents";
    if (gen === 2) return "Grandparents";
    if (gen === 3) return "Great-grandparents";
    return `Generation +${gen}`;
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function LineageView() {
    const { memberCode } = useParams<{ memberCode: string }>();
    const navigate = useNavigate();
    const [depth, setDepth] = useState(3);

    const { focal, focalSpouse, ancestorRows, descendants, siblings, isLoading } =
        useLineageTree(memberCode ?? "", depth);

    const focalFamilyCode = focal?.familyCode ?? "";
    const fullName = focal ? [focal.firstName, focal.lastName].filter(Boolean).join(" ") : "";

    const hasContent =
        !!focal &&
        (ancestorRows.length > 0 || descendants.length > 0 || siblings.length > 0 || !!focalSpouse);

    return (
        // Outer: fills the content area exactly — no page scroll
        <div className="flex flex-col" style={{ height: "calc(100vh - 64px - 40px - 32px)" }}>

            {/* ── Fixed controls bar — never scrolls ── */}
            <div className="shrink-0 flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-200 bg-background">
                <button
                    type="button"
                    onClick={() => navigate(`${ROUTES.PRIVATE.MEMBERS}/${memberCode}/view`)}
                    className="flex items-center gap-2 px-3 py-2 rounded-md border text-sm hover:bg-slate-50 transition"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>

                <div className="text-center min-w-0">
                    <div className="text-base font-semibold text-slate-800 truncate">
                        {isLoading ? "Loading…" : `Lineage — ${fullName}`}
                    </div>
                    {focal && (
                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                            {focal.memberCode} · {focal.familyCode}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <Legend />
                    <DepthSelector value={depth} onChange={setDepth} />
                </div>
            </div>

            {/* ── Scrollable tree area — both axes ── */}
            <div className="flex-1 min-h-0 overflow-auto app-scroll mt-3">

                {isLoading && (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400 text-sm">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        Building lineage tree…
                    </div>
                )}

                {!isLoading && !hasContent && (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400 text-sm">
                        <User className="w-12 h-12 text-slate-200" />
                        <span>No relationships linked yet.</span>
                        <button
                            type="button"
                            onClick={() => navigate(`${ROUTES.PRIVATE.MEMBERS}/${memberCode}/view`)}
                            className="text-primary underline text-sm"
                        >
                            Go to member to add relationships
                        </button>
                    </div>
                )}

                {!isLoading && hasContent && focal && (
                    // Inner: min-width ensures horizontal scroll kicks in; padding gives breathing room
                    <div className="flex justify-center min-w-full pb-12">
                        <div className="inline-flex flex-col items-center gap-0 min-w-max px-12">

                            {/* ── Ancestors (deepest first — rendered top to bottom) ── */}
                            {[...ancestorRows].reverse().map((row, i, arr) => (
                                <div key={`anc-${row.generation}`} className="flex flex-col items-center">
                                    <AncestorRowView
                                        row={row}
                                        label={genLabel(row.generation)}
                                        focalFamilyCode={focalFamilyCode}
                                        navigate={navigate}
                                    />
                                    {/* Connector down to next row (or to siblings/focal) */}
                                    <RowConnector />
                                </div>
                            ))}

                            {/* ── Siblings ── */}
                            {siblings.length > 0 && (
                                <div className="flex flex-col items-center gap-2">
                                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                        Siblings ({siblings.length})
                                    </div>
                                    <div className="flex items-start justify-center gap-4 flex-wrap">
                                        {siblings.map((sib) => (
                                            <NodeCard
                                                key={sib.memberCode}
                                                member={sib}
                                                focalFamilyCode={focalFamilyCode}
                                                onClick={() => navigate(`${ROUTES.PRIVATE.MEMBERS}/${sib.memberCode}/view`)}
                                            />
                                        ))}
                                    </div>
                                    <RowConnector />
                                </div>
                            )}

                            {/* ── Focal member + spouse ── */}
                            <div className="flex flex-col items-center gap-0">
                                <CoupleUnit
                                    member={focal}
                                    spouse={focalSpouse}
                                    isFocal
                                    focalFamilyCode={focalFamilyCode}
                                    navigate={navigate}
                                />

                                {/* ── Descendants ── */}
                                {descendants.length > 0 && (
                                    <div className="flex flex-col items-center gap-0 mt-0">
                                        <RowConnector />
                                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                            Children ({descendants.length})
                                        </div>
                                        {/* Horizontal crossbar when multiple children */}
                                        {descendants.length > 1 && (
                                            <div className="flex items-start justify-center gap-6 flex-wrap">
                                                <div className="flex flex-col items-center">
                                                    {/* Top crossbar line spanning children */}
                                                    <div
                                                        style={{
                                                            width: `${descendants.length * (CARD_W + CARD_GAP + 8) - CARD_GAP}px`,
                                                            maxWidth: "100%",
                                                        }}
                                                        className="h-px bg-slate-300 mb-0"
                                                    />
                                                    <div className="flex items-start justify-center gap-6 flex-wrap">
                                                        <DescendantTree
                                                            nodes={descendants}
                                                            focalFamilyCode={focalFamilyCode}
                                                            navigate={navigate}
                                                            depth={depth}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {descendants.length === 1 && (
                                            <DescendantTree
                                                nodes={descendants}
                                                focalFamilyCode={focalFamilyCode}
                                                navigate={navigate}
                                                depth={depth}
                                            />
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
