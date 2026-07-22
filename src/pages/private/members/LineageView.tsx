import { useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ReactFlow,
    ReactFlowProvider,
    Background,
    Controls,
    MiniMap,
    Panel,
    useReactFlow,
    Handle,
    Position,
    type Node,
    type Edge,
    type NodeProps,
    BackgroundVariant,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import dagre from "@dagrejs/dagre";
import { flextree } from "d3-flextree";
import { User } from "lucide-react";

import MemberAvatar from "../../../components/MemberAvatar";

import {
    useLineageTree,
    AncestorRow,
    DescendantNode,
} from "../../../hooks/useLineageTree";

import {
    Member,
    SpouseDetail,
} from "../../../features/members/types";

import { ROUTES } from "../../../constants/routes";
import PageHeader from "@/components/layout/PageHeader";
import { usePermission } from "@/hooks/usePermission";
import ReorderChildrenModal from "./ReorderChildrenModal";
import { PERM } from "@/constants/permissions";

// ── Layout constants ──────────────────────────────────────────────────────────

const NODE_W = 190;
const NODE_H = 188;
const SPOUSE_W = 190;
const SPOUSE_GAP = 60;
const MORE_PILL_W = 76;

const H_SEP = 140;
const V_SEP = NODE_H + 120;
const PAD = 120;

function slotW(spouseCount: number, showSpouses: boolean): number {
    if (!showSpouses || spouseCount === 0) return NODE_W;
    return NODE_W + (SPOUSE_GAP + SPOUSE_W) * spouseCount;
}

// ── Node data type ────────────────────────────────────────────────────────────

type MemberNodeData = {
    member: Member;
    currentSpouses: SpouseDetail[];
    motherName?: string;
    isFocal: boolean;
    generationLevel: number;
    focalFamilyCode: string;
    showSpouses: boolean;
    onNavigate: (memberCode: string) => void;
} & Record<string, unknown>;

// ── Spouse color palette ──────────────────────────────────────────────────────

const spouseStyles = [
    { border: "border-pink-300", bg: "bg-pink-50", tag: "bg-pink-100 text-pink-700", label: "text-pink-500", line: "#f9a8d4" },
    { border: "border-violet-300", bg: "bg-violet-50", tag: "bg-violet-100 text-violet-700", label: "text-violet-500", line: "#c4b5fd" },
    { border: "border-teal-300", bg: "bg-teal-50", tag: "bg-teal-100 text-teal-700", label: "text-teal-500", line: "#5eead4" },
    { border: "border-orange-300", bg: "bg-orange-50", tag: "bg-orange-100 text-orange-700", label: "text-orange-500", line: "#fdba74" },
];

// ── Member card ───────────────────────────────────────────────────────────────

function MemberCard({
    member,
    isFocal,
    isSpouse,
    spouseIndex,
    focalFamilyCode,
    generationLevel,
    motherName,
    onClick,
}: {
    member: Member;
    isFocal?: boolean;
    isSpouse?: boolean;
    spouseIndex?: number;
    focalFamilyCode: string;
    generationLevel: number;
    motherName?: string;
    onClick: () => void;
}) {
    const fullName = [member.firstName, member.lastName].filter(Boolean).join(" ");
    const isSameFamily = member.familyCode === focalFamilyCode;
    const birthYear = member.dob ? member.dob.substring(0, 4) : null;
    const deathYear = member.dod ? member.dod.substring(0, 4) : null;

    const yearRange = (() => {
        if (!birthYear && !deathYear) return null;
        const start = birthYear ?? "?";
        const end = deathYear ?? "present";
        return `${start} – ${end}`;
    })();

    const spouseStyle = isSpouse && spouseIndex !== undefined
        ? spouseStyles[spouseIndex % spouseStyles.length]
        : null;

    let border = "border-slate-300";
    let bg = "bg-white";
    if (isFocal) { border = "border-blue-500"; bg = "bg-blue-50"; }
    else if (spouseStyle) { border = spouseStyle.border; bg = spouseStyle.bg; }
    else if (!isSameFamily) { border = "border-amber-400"; bg = "bg-amber-50"; }
    if (!member.isActive) bg += " opacity-60";

    return (
        <button
            type="button"
            onClick={onClick}
            title={`View lineage — ${fullName}`}
            style={{ width: NODE_W, height: NODE_H }}
            className={[
                "flex flex-col items-center pt-3 pb-2 px-2.5 rounded-xl border-2 transition shrink-0",
                "text-center hover:shadow-lg hover:scale-[1.02]",
                "focus:outline-none focus:ring-2 focus:ring-blue-300",
                border, bg,
            ].join(" ")}
        >
            <div className="flex flex-col items-center w-full pt-1">
                <MemberAvatar
                    memberCode={member.memberCode}
                    firstName={member.firstName}
                    lastName={member.lastName}
                    hasPhoto={member.hasPhoto ?? false}
                    size="sm"
                />

                {/* Name + year range */}
                <div className="mt-1.5 text-sm font-semibold text-slate-800 leading-tight line-clamp-2 w-full">
                    {fullName}
                </div>
                {yearRange && (
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5 w-full">
                        {yearRange}
                    </div>
                )}

                <div className="text-xs font-mono text-slate-400 mt-0.5 truncate w-full">
                    {member.memberCode}
                </div>
                {typeof (member as any).__debugX === "number" && (
                    <div className="text-[9px] font-mono text-red-500">
                        x:{Math.round((member as any).__debugX)}
                    </div>
                )}

                <div className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold mt-1">
                    {generationLevel === 0
                        ? "Focal Generation"
                        : generationLevel > 0
                            ? `Generation +${generationLevel}`
                            : `Generation ${generationLevel}`}
                </div>

                {member.familyCode && (
                    <div className={[
                        "text-xs mt-1 px-1.5 py-0.5 rounded font-mono truncate w-full",
                        isSameFamily
                            ? "bg-slate-100 text-slate-500"
                            : spouseStyle
                                ? spouseStyle.tag
                                : "bg-amber-100 text-amber-700",
                    ].join(" ")}>
                        {member.familyCode}
                    </div>
                )}

                {isSpouse && spouseStyle && (
                    <div className={`text-xs mt-0.5 font-medium ${spouseStyle.label}`}>
                        {(() => {
                            const roleLabel = member.gender === "MALE" ? "Husband" : member.gender === "FEMALE" ? "Wife" : "Spouse";
                            return member.dod ? `${roleLabel} (deceased)` : !member.isActive ? `${roleLabel} (inactive)` : roleLabel;
                        })()}
                    </div>
                )}

                {isFocal && (
                    <div className="text-xs mt-0.5 text-blue-600 font-medium">● You are here</div>
                )}

                {motherName && (
                    <div className="text-[10px] mt-0.5 px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 truncate w-full">
                        Mother: {motherName}
                    </div>
                )}
            </div>
        </button>
    );
}

// ── ReactFlow custom node ─────────────────────────────────────────────────────

function MemberNode({ data }: NodeProps<Node<MemberNodeData>>) {
    const { member, currentSpouses, motherName, isFocal, focalFamilyCode, showSpouses, onNavigate } = data;

    const visibleSpouses = showSpouses ? currentSpouses : [];
    const totalWidth = slotW(visibleSpouses.length, showSpouses);
    const sourceCenterX = visibleSpouses.length > 0 ? NODE_W + SPOUSE_GAP / 2 : NODE_W / 2;
    const targetCenterX = NODE_W / 2;

    return (
        <div className="relative flex items-center" style={{ gap: 0, width: totalWidth, pointerEvents: "all" }}>
            <Handle type="target" position={Position.Top} id="top"
                style={{ left: targetCenterX, top: 0, transform: "translateX(-50%)", opacity: 0 }} />

            <MemberCard
                member={member}
                isFocal={isFocal}
                generationLevel={data.generationLevel}
                focalFamilyCode={focalFamilyCode}
                motherName={motherName}
                onClick={() => onNavigate(member.memberCode)}
            />

            {visibleSpouses.map((spouse, idx) => (
                <div key={spouse.person.memberCode} className="flex items-center shrink-0">
                    <svg width={SPOUSE_GAP} height={NODE_H} style={{ overflow: "visible" }}>
                        <line x1={0} y1={NODE_H / 2} x2={SPOUSE_GAP} y2={NODE_H / 2}
                            stroke={spouseStyles[idx % spouseStyles.length].line} strokeWidth={2} strokeDasharray="5 3" />
                        <text x={SPOUSE_GAP / 2} y={NODE_H / 2 + 5} textAnchor="middle" fontSize={11}
                            fill={spouseStyles[idx % spouseStyles.length].line}>♥</text>
                    </svg>
                    <MemberCard
                        member={spouse.person}
                        isSpouse
                        spouseIndex={idx}
                        generationLevel={data.generationLevel}
                        focalFamilyCode={focalFamilyCode}
                        onClick={() => onNavigate(spouse.person.memberCode)}
                    />
                </div>
            ))}

            <Handle type="source" position={Position.Bottom} id="bottom"
                style={{ left: sourceCenterX, bottom: 0, transform: "translateX(-50%)", opacity: 0 }} />
        </div>
    );
}

const nodeTypes = { member: MemberNode };

// ── Graph types ───────────────────────────────────────────────────────────────

type GNode = {
    id: string;
    member: Member;
    currentSpouses: SpouseDetail[];
    motherName?: string;
    isFocal: boolean;
    generationLevel: number;
};
type GEdge = { from: string; to: string };

const VIRTUAL_ID = "__vp__";

// ── Build graph data ──────────────────────────────────────────────────────────

function buildGraph(
    focal: Member,
    focalSpouses: SpouseDetail[],
    ancestorRows: AncestorRow[],
    siblings: Member[],
): { gnodes: GNode[]; gedges: GEdge[] } {

    const gnodes: GNode[] = [];
    const gedges: GEdge[] = [];
    const seen = new Set<string>();

    function add(id: string, member: Member, currentSpouses: SpouseDetail[], generationLevel: number, isFocal = false, motherName?: string) {
        if (seen.has(id)) return;
        seen.add(id);
        gnodes.push({ id, member, currentSpouses, isFocal, generationLevel, motherName });
    }

    add(focal.memberCode, focal, focalSpouses, 0, true);
    for (const sib of siblings) add(`sibling-${sib.memberCode}`, sib, [], 0);
    for (const row of ancestorRows) {
        for (const an of row.nodes) add(an.nodeId, an.member, an.spouses, -row.generation);
    }

    if (ancestorRows.length > 0) {
        for (const p of ancestorRows[0].nodes) {
            gedges.push({ from: p.nodeId, to: focal.memberCode });
            for (const sib of siblings) gedges.push({ from: p.nodeId, to: `sibling-${sib.memberCode}` });
        }
        for (let ri = 1; ri < ancestorRows.length; ri++) {
            for (const parentNode of ancestorRows[ri - 1].nodes) {
                for (const ancestorNode of ancestorRows[ri].nodes) {
                    if ((ancestorNode.parentNodeIds ?? []).includes(parentNode.nodeId)) {
                        gedges.push({ from: ancestorNode.nodeId, to: parentNode.nodeId });
                    }
                }
            }
        }
    } else if (siblings.length > 0) {
        gnodes.push({ id: VIRTUAL_ID, member: focal, currentSpouses: [], isFocal: false, generationLevel: -999 });
        gedges.push({ from: VIRTUAL_ID, to: focal.memberCode });
        for (const sib of siblings) gedges.push({ from: VIRTUAL_ID, to: `sibling-${sib.memberCode}` });
    }

    // NOTE: descendants are intentionally NOT added here — they're laid out
    // separately via d3-hierarchy in buildFlow(), then merged using focal's
    // dagre-computed position as the anchor point.
    return { gnodes, gedges };
}

// ── Sort children by effective birth order ────────────────────────────────────
// Priority: manual birthOrder (if set) → DOB → stable fallback by code.
// Same rule used in ReorderChildrenModal — keep both in sync if this changes.

function sortChildrenByBirthOrder(nodes: DescendantNode[]): DescendantNode[] {
    function sortKey(n: DescendantNode): [number, string] {
        if (n.member.birthOrder != null) return [0, String(n.member.birthOrder).padStart(10, "0")];
        if (n.member.dob) return [1, n.member.dob];
        return [2, n.member.memberCode];
    }
    return [...nodes]
        .sort((a, b) => {
            const [ta, va] = sortKey(a);
            const [tb, vb] = sortKey(b);
            if (ta !== tb) return ta - tb;
            return va < vb ? -1 : va > vb ? 1 : 0;
        })
        .map(n => ({ ...n, children: sortChildrenByBirthOrder(n.children) }));
}

// ── d3-hierarchy layout for descendants only ──────────────────────────────────
// Guarantees: (1) strict left-to-right birth order, (2) each subtree moves as
// one rigid block — neither is guaranteed by dagre's crossing-minimization.

type D3DescNode = {
    id: string;
    member: Member;
    spouses: SpouseDetail[];
    children?: D3DescNode[];
};

// ── d3-flextree layout for descendants only ───────────────────────────────────
// Returns positions RELATIVE to focal (root) at (0,0), plus the subtree's
// total horizontal extent — both needed before dagre runs, so dagre can
// reserve enough room for this fan-out and avoid overlapping neighbors.

type DescLayoutResult = {
    positions: Map<string, { x: number; y: number; genLevel: number }>;
    leftExtent: number;   // furthest point left of focal's center (positive number)
    rightExtent: number;  // furthest point right of focal's center (positive number)
};

function computeDescendantLayout(
    focal: Member,
    descendants: DescendantNode[],
    showSpouses: boolean,
): DescLayoutResult {
    const positions = new Map<string, { x: number; y: number; genLevel: number }>();
    if (descendants.length === 0) return { positions, leftExtent: 0, rightExtent: 0 };

    const sorted = sortChildrenByBirthOrder(descendants);

    function toD3(n: DescendantNode): D3DescNode {
        return { id: n.nodeId, member: n.member, spouses: n.spouses, children: n.children.map(toD3) };
    }

    const rootData: D3DescNode = {
        id: focal.memberCode,
        member: focal,
        spouses: [],
        children: sorted.map(toD3),
    };

    type FlexNode = { data: D3DescNode };

    const layout = flextree<D3DescNode>({
        nodeSize: (node: FlexNode) => [
            slotW(node.data.spouses.length, showSpouses) + H_SEP,
            V_SEP,
        ],
    });

    const root = layout.hierarchy(rootData);
    layout(root);

    const rootX = root.x ?? 0;
    const rootY = root.y ?? 0;

    let leftExtent = 0;
    let rightExtent = 0;

    root.each((node: ReturnType<typeof layout.hierarchy>) => {
        const relX = (node.x ?? 0) - rootX;
        const relY = (node.y ?? 0) - rootY;
        const w = slotW(node.data.spouses.length, showSpouses);

        // Track how far this node's own footprint extends left/right of center
        leftExtent = Math.max(leftExtent, -(relX - w / 2));
        rightExtent = Math.max(rightExtent, relX + w / 2);

        if (node.data.id === focal.memberCode) return; // root itself — positioned by dagre separately
        positions.set(node.data.id, { x: relX, y: relY, genLevel: node.depth });
    });

    return { positions, leftExtent, rightExtent };
}

// ── Build ReactFlow nodes/edges from dagre layout ─────────────────────────────

function buildFlow(
    gnodes: GNode[],
    gedges: GEdge[],
    focal: Member,
    descendants: DescendantNode[],
    focalFamilyCode: string,
    showSpouses: boolean,
    onNavigate: (code: string) => void,
): { nodes: Node<MemberNodeData>[]; edges: Edge[] } {

    // Compute descendant fan-out FIRST (relative coordinates), so dagre can
    // reserve enough width for focal's column before placing siblings next to it
    const descLayout = computeDescendantLayout(focal, descendants, showSpouses);
    const focalOwnWidth = slotW(
        gnodes.find(n => n.id === focal.memberCode)?.currentSpouses.length ?? 0,
        showSpouses,
    );
    const maxHalfExtent = Math.max(descLayout.leftExtent, descLayout.rightExtent);
    const focalReservedWidth = Math.max(focalOwnWidth, maxHalfExtent * 2 || focalOwnWidth);

    // ── Pass 1: dagre for ancestors / siblings / focal ──────────────────────
    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: "TB", ranksep: V_SEP, nodesep: H_SEP, edgesep: 80, marginx: PAD, marginy: PAD, ranker: "network-simplex" });
    g.setDefaultEdgeLabel(() => ({}));

    for (const n of gnodes) {
        const width = n.id === focal.memberCode
            ? focalReservedWidth
            : slotW(n.currentSpouses.length, showSpouses);
        g.setNode(n.id, { width, height: NODE_H });
    }
    for (const e of gedges) g.setEdge(e.from, e.to);
    dagre.layout(g);

    const nodes: Node<MemberNodeData>[] = gnodes
        .filter(n => n.id !== VIRTUAL_ID)
        .map(n => {
            const pos = g.node(n.id);
            const w = slotW(n.currentSpouses.length, showSpouses);
            return {
                id: n.id,
                type: "member",
                position: { x: pos.x - w / 2, y: pos.y - NODE_H / 2 },
                width: w,
                height: NODE_H,
                data: { member: n.member, currentSpouses: n.currentSpouses, motherName: n.motherName, isFocal: n.isFocal, generationLevel: n.generationLevel, focalFamilyCode, showSpouses, onNavigate },
                draggable: false, selectable: false,
            };
        });

    const edges: Edge[] = gedges
        .filter(e => e.from !== VIRTUAL_ID)
        .map((e, i) => ({
            id: `e-${i}`, source: e.from, target: e.to,
            sourceHandle: "bottom", targetHandle: "top",
            type: "smoothstep", style: { stroke: "#3b82f6", strokeWidth: 2 }, zIndex: 1, animated: false,
        }));

    // ── Pass 2: offset the pre-computed relative descendant layout onto focal's dagre position ──
    const focalDagrePos = g.node(focal.memberCode);
    const descPositions = new Map(
        [...descLayout.positions.entries()].map(([id, pos]) => [
            id,
            { x: pos.x + focalDagrePos.x, y: pos.y + focalDagrePos.y, genLevel: pos.genLevel },
        ]),
    );

    function collectDescNodes(list: DescendantNode[]): DescendantNode[] {
        return list.flatMap(d => [d, ...collectDescNodes(d.children)]);
    }
    const flatDescendants = collectDescNodes(descendants);

    for (const d of flatDescendants) {
        const pos = descPositions.get(d.nodeId);
        if (!pos) continue;
        const w = slotW(d.spouses.length, showSpouses);
        nodes.push({
            id: d.nodeId,
            type: "member",
            position: { x: pos.x - w / 2, y: pos.y - NODE_H / 2 },
            width: w,
            height: NODE_H,
            data: {
                member: d.member, currentSpouses: d.spouses, motherName: undefined,
                isFocal: false, generationLevel: pos.genLevel, focalFamilyCode, showSpouses, onNavigate,
            },
            draggable: false, selectable: false,
        });
    }

    function collectDescEdges(parentId: string, list: DescendantNode[]): { source: string; target: string }[] {
        return list.flatMap(d => [
            { source: parentId, target: d.nodeId },
            ...collectDescEdges(d.nodeId, d.children),
        ]);
    }
    const descEdges = collectDescEdges(focal.memberCode, descendants);

    for (const e of descEdges) {
        edges.push({
            id: `e-desc-${e.source}-${e.target}`, source: e.source, target: e.target,
            sourceHandle: "bottom", targetHandle: "top",
            type: "smoothstep", style: { stroke: "#3b82f6", strokeWidth: 2 }, zIndex: 1, animated: false,
        });
    }

    return { nodes, edges };
}

// ── Legend ────────────────────────────────────────────────────────────────────

function Legend({ showSpouses }: { showSpouses: boolean }) {
    const items = [
        ...(showSpouses ? [{ bg: "bg-pink-50", border: "border-pink-300", label: "Spouse" }] : []),
        { bg: "bg-blue-50", border: "border-blue-500", label: "Focal" },
        { bg: "bg-white", border: "border-slate-300", label: "Same family" },
        { bg: "bg-amber-50", border: "border-amber-400", label: "Other family" },
    ];
    return (
        <div className="flex flex-col items-end gap-1 text-xs text-slate-500">
            <div className="flex items-center gap-3">
                {items.map(({ bg, border, label }) => (
                    <div key={label} className="flex items-center gap-1.5">
                        <div className={`w-3.5 h-3.5 rounded ${bg} border-2 ${border}`} />
                        {label}
                    </div>
                ))}
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
                <span className="text-xs font-mono">yyyy – yyyy</span>
                <span>Birth – Death / present</span>
            </div>
        </div>
    );
}

// ── Toggle button ─────────────────────────────────────────────────────────────

function SpouseToggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
    return (
        <button type="button" onClick={onToggle}
            className="flex items-center gap-2.5 text-sm text-slate-600 select-none"
            title={enabled ? "Switch to Family view" : "Switch to Marriage view"}
        >
            <span className={enabled ? "text-pink-600 font-medium" : "text-slate-400"}>
                Marriage View
            </span>
            <div className={[
                "relative w-10 h-5 rounded-full transition-colors duration-200",
                enabled ? "bg-pink-400" : "bg-slate-200",
            ].join(" ")}>
                <div className={[
                    "absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200",
                    enabled ? "translate-x-5" : "translate-x-0.5",
                ].join(" ")} />
            </div>
        </button>
    );
}

// ── Inner component ───────────────────────────────────────────────────────────

function LineageFlowInner({
    memberCode, focal, focalSpouses, ancestorRows, descendants, siblings, isLoading,
}: {
    memberCode: string | undefined;
    focal: Member | null;
    focalSpouses: SpouseDetail[];
    ancestorRows: AncestorRow[];
    descendants: DescendantNode[];
    siblings: Member[];
    isLoading: boolean;
}) {
    const navigate = useNavigate();
    const { can } = usePermission();

    // Toggle OFF by default — Family view per plan
    const [showSpouses, setShowSpouses] = useState(true);
    const [showReorder, setShowReorder] = useState(false);

    useReactFlow();

    const focalFamilyCode = focal?.familyCode ?? "";
    const fullName = focal ? [focal.firstName, focal.lastName].filter(Boolean).join(" ") : "";
    const hasContent = !!focal && (ancestorRows.length > 0 || descendants.length > 0 || siblings.length > 0 || focalSpouses.length > 0);

    const onNavigate = useCallback((targetCode: string) => {
        navigate(`${ROUTES.PRIVATE.MEMBERS}/${targetCode}/lineage`);
    }, [navigate]);

    const { nodes, edges } = useMemo(() => {
        if (!focal) return { nodes: [], edges: [] };
        const { gnodes, gedges } = buildGraph(focal, focalSpouses, ancestorRows, siblings);
        return buildFlow(gnodes, gedges, focal, descendants, focalFamilyCode, showSpouses, onNavigate);
    }, [focal, focalSpouses, ancestorRows, descendants, siblings, focalFamilyCode, showSpouses, onNavigate]);

    return (
        <div className="flex flex-col" style={{ height: "calc(100vh - 64px - 40px - 32px)" }}>

            {/* Top bar */}
            <PageHeader
                title={isLoading ? "Loading…" : `Lineage — ${fullName}`}
                subtitle={focal ? `${focal.memberCode} · ${focal.familyCode}${focal.dod ? ` (${focal.dod.substring(0, 4)})` : ""}` : undefined}
                backTo={`${ROUTES.PRIVATE.MEMBERS}/${memberCode}/view`}
                actions={
                    <div className="flex flex-col items-end gap-1.5">
                        <div className="flex items-center gap-2">
                            {can(PERM.RELATIONSHIP_MANAGE) && descendants.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => setShowReorder(true)}
                                    className="text-xs px-2.5 py-1 rounded-md border hover:bg-slate-50 transition"
                                >
                                    Reorder children
                                </button>
                            )}
                            <SpouseToggle enabled={showSpouses} onToggle={() => setShowSpouses(v => !v)} />
                        </div>
                        <Legend showSpouses={showSpouses} />
                    </div>
                }
            />

            {/* Canvas */}
            <div className="flex-1 min-h-0 w-full mt-3 rounded-xl overflow-hidden border border-slate-200">
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
                        <button type="button" onClick={() => navigate(`${ROUTES.PRIVATE.MEMBERS}/${memberCode}/view`)}
                            className="text-primary underline text-sm">
                            Go to member to add relationships
                        </button>
                    </div>
                )}

                {!isLoading && hasContent && focal && (
                    <ReactFlow
                        nodes={nodes} edges={edges} nodeTypes={nodeTypes}
                        defaultEdgeOptions={{ zIndex: 1 }}
                        fitView fitViewOptions={{ padding: 0.3, includeHiddenNodes: true }}
                        minZoom={0.01} maxZoom={2}
                        nodesDraggable={false} nodesConnectable={false} elementsSelectable={false}
                        panOnScroll zoomOnScroll panOnDrag
                        proOptions={{ hideAttribution: true }}
                        style={{ background: "#f8fafc" }}
                    >
                        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#e2e8f0" />
                        <Controls showInteractive={false} />
                        <MiniMap
                            nodeColor={n => {
                                const d = n.data as MemberNodeData;
                                if (d?.isFocal) return "#3b82f6";
                                if (d?.member?.familyCode === focalFamilyCode) return "#94a3b8";
                                return "#fbbf24";
                            }}
                            maskColor="rgba(248,250,252,0.75)"
                            style={{ border: "1px solid #e2e8f0", borderRadius: 8 }}
                        />
                        <Panel position="top-right">
                            <div className="text-xs text-slate-400 bg-white/90 border border-slate-200 rounded px-2 py-1 shadow-sm">
                                Click any card to explore their lineage · Drag to pan · Scroll to zoom
                            </div>
                        </Panel>
                    </ReactFlow>
                )}
            </div>

            {showReorder && (
                <ReorderChildrenModal
                    children={descendants}
                    onClose={() => setShowReorder(false)}
                    onSaved={() => window.location.reload()}
                />
            )}
        </div>
    );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function LineageView() {
    const { memberCode } = useParams<{ memberCode: string }>();
    const depth = 10;
    const { focal, focalSpouses, ancestorRows, descendants, siblings, isLoading } = useLineageTree(memberCode ?? "", depth);

    return (
        <ReactFlowProvider>
            <LineageFlowInner
                memberCode={memberCode}
                focal={focal}
                focalSpouses={focalSpouses}
                ancestorRows={ancestorRows}
                descendants={descendants}
                siblings={siblings}
                isLoading={isLoading}
            />
        </ReactFlowProvider>
    );
}
