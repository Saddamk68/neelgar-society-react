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
import { ArrowLeft, User } from "lucide-react";
import MemberAvatar from "../../../components/MemberAvatar";
import { useLineageTree, AncestorRow, DescendantNode } from "../../../hooks/useLineageTree";
import { Member } from "../../../features/members/types";
import { ROUTES } from "../../../constants/routes";

// ── Layout constants ──────────────────────────────────────────────────────────

const NODE_W = 190;
const NODE_H = 210;
const SPOUSE_W = 190;
const SPOUSE_GAP = 60;

// IMPORTANT:
// Large spacing prevents collisions.
const H_SEP = 140;
const V_SEP = 180;
const PAD = 120;

function slotW(hasSpouse: boolean) {
    return hasSpouse ? NODE_W + SPOUSE_GAP + SPOUSE_W : NODE_W;
}

// ── Custom node data ──────────────────────────────────────────────────────────

type MemberNodeData = {
    member: Member;
    spouse: Member | null;
    isFocal: boolean;
    generationLevel: number;
    focalFamilyCode: string;
    onNavigate: (memberCode: string) => void;
} & Record<string, unknown>;

// ── Member card ───────────────────────────────────────────────────────────────

function MemberCard({
    member,
    isFocal,
    isSpouse,
    focalFamilyCode,
    generationLevel,
    onClick,
}: {
    member: Member;
    isFocal?: boolean;
    isSpouse?: boolean;
    focalFamilyCode: string;
    generationLevel: number;
    onClick: () => void;
}) {
    const fullName = [member.firstName, member.lastName].filter(Boolean).join(" ");
    const isSameFamily = member.familyCode === focalFamilyCode;

    let border = "border-slate-300";
    let bg = "bg-white";
    if (isFocal) { border = "border-blue-500"; bg = "bg-blue-50"; }
    else if (isSpouse) { border = "border-pink-300"; bg = "bg-pink-50"; }
    else if (!isSameFamily) { border = "border-amber-400"; bg = "bg-amber-50"; }
    if (!member.isActive) bg += " opacity-60";

    return (
        <button
            type="button"
            onClick={onClick}
            title={`View lineage — ${fullName}`}
            style={{ width: NODE_W, height: NODE_H }}
            className={[
                "flex flex-col items-center p-2.5 rounded-xl border-2 transition shrink-0",
                "text-center hover:shadow-lg hover:scale-[1.02]",
                "focus:outline-none focus:ring-2 focus:ring-blue-300",
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
            <div className="mt-1.5 text-sm font-semibold text-slate-800 leading-tight line-clamp-3 w-full">
                {fullName}
            </div>
            <div className="text-xs font-mono text-slate-400 mt-0.5 truncate w-full">
                {member.memberCode}
            </div>
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
                    isSameFamily ? "bg-slate-100 text-slate-500"
                        : isSpouse ? "bg-pink-100 text-pink-700"
                            : "bg-amber-100 text-amber-700",
                ].join(" ")}>
                    {member.familyCode}
                </div>
            )}
            {isSpouse && <div className="text-xs mt-0.5 text-pink-500 font-medium">Spouse</div>}
            {isFocal && <div className="text-xs mt-0.5 text-blue-600 font-medium">● You are here</div>}
        </button>
    );
}

// ── @xyflow custom node ───────────────────────────────────────────────────────

function MemberNode({ data }: NodeProps<Node<MemberNodeData>>) {

    const {
        member,
        spouse,
        isFocal,
        focalFamilyCode,
        onNavigate,
    } = data;

    // total width of couple block
    const totalWidth = spouse
        ? NODE_W + SPOUSE_GAP + SPOUSE_W
        : NODE_W;

    // exact center of relationship
    const relationshipCenterX = spouse
        ? NODE_W + (SPOUSE_GAP / 2)
        : NODE_W / 2;

    return (
        <div
            className="relative flex items-center"
            style={{
                gap: 0,
                width: totalWidth,
            }}
        >

            {/* ───────────────────────────────────── */}
            {/* TOP RELATIONSHIP HANDLE */}
            {/* ───────────────────────────────────── */}

            <Handle
                type="target"
                position={Position.Top}
                id="top"
                style={{
                    left: relationshipCenterX,
                    top: 0,
                    transform: "translateX(-50%)",
                    opacity: 0,
                }}
            />

            {/* ───────────────────────────────────── */}
            {/* MAIN MEMBER */}
            {/* ───────────────────────────────────── */}

            <MemberCard
                member={member}
                isFocal={isFocal}
                generationLevel={data.generationLevel}
                focalFamilyCode={focalFamilyCode}
                onClick={() => onNavigate(member.memberCode)}
            />

            {/* ───────────────────────────────────── */}
            {/* SPOUSE */}
            {/* ───────────────────────────────────── */}

            {spouse && (
                <>
                    <svg
                        width={SPOUSE_GAP}
                        height={NODE_H}
                        className="shrink-0"
                        style={{ overflow: "visible" }}
                    >
                        <line
                            x1={0}
                            y1={95}
                            x2={SPOUSE_GAP}
                            y2={95}
                            stroke="#f9a8d4"
                            strokeWidth={2}
                            strokeDasharray="5 3"
                        />

                        <text
                            x={SPOUSE_GAP / 2}
                            y={NODE_H / 2 + 5}
                            textAnchor="middle"
                            fontSize={11}
                            fill="#f472b6"
                        >
                            ♥
                        </text>
                    </svg>

                    <MemberCard
                        member={spouse}
                        isSpouse
                        generationLevel={data.generationLevel}
                        focalFamilyCode={focalFamilyCode}
                        onClick={() => onNavigate(spouse.memberCode)}
                    />
                </>
            )}

            {/* ───────────────────────────────────── */}
            {/* BOTTOM RELATIONSHIP HANDLE */}
            {/* ───────────────────────────────────── */}

            <Handle
                type="source"
                position={Position.Bottom}
                id="bottom"
                style={{
                    left: relationshipCenterX,
                    bottom: 0,
                    transform: "translateX(-50%)",
                    opacity: 0,
                }}
            />
        </div>
    );
}

const nodeTypes = { member: MemberNode };

// ── Graph builder types ───────────────────────────────────────────────────────

type GNode = {
    id: string;
    member: Member;
    spouse: Member | null;
    isFocal: boolean;
    generationLevel: number;
};
type GEdge = { from: string; to: string };

const VIRTUAL_ID = "__vp__";

function buildGraph(
    focal: Member,
    focalSpouse: Member | null,
    ancestorRows: AncestorRow[],
    descendants: DescendantNode[],
    siblings: Member[],
): { gnodes: GNode[]; gedges: GEdge[] } {
    const gnodes: GNode[] = [];
    const gedges: GEdge[] = [];
    const seen = new Set<string>();

    function add(
        id: string,
        member: Member,
        spouse: Member | null,
        generationLevel: number,
        isFocal = false,
    ) {
        if (seen.has(id)) return;

        seen.add(id);

        gnodes.push({
            id,
            member,
            spouse,
            isFocal,
            generationLevel,
        });
    }

    add(focal.memberCode, focal, focalSpouse, 0, true);
    for (const sib of siblings) {
        add(`sibling-${sib.memberCode}`, sib, null, 0);
    }
    for (const row of ancestorRows) {
        for (const an of row.nodes) {
            add(an.nodeId, an.member, an.spouse, row.generation);
        }
    }

    if (ancestorRows.length > 0) {
        for (const p of ancestorRows[0].nodes) {
            gedges.push({ from: p.nodeId, to: focal.memberCode });
            for (const sib of siblings) gedges.push({ from: p.nodeId, to: `sibling-${sib.memberCode}` });
        }
        for (let ri = 1; ri < ancestorRows.length; ri++) {
            const currentRow = ancestorRows[ri];
            const previousRow = ancestorRows[ri - 1];

            for (const parentNode of previousRow.nodes) {
                const parentCode = parentNode.nodeId;

                for (const ancestorNode of currentRow.nodes) {
                    const parentRels = ancestorNode.parentNodeIds ?? [];

                    if (parentRels.includes(parentCode)) {
                        gedges.push({
                            from: ancestorNode.nodeId,
                            to: parentNode.nodeId,
                        });
                    }
                }
            }
        }
    } else if (siblings.length > 0) {
        gnodes.push({ id: VIRTUAL_ID, member: focal, spouse: null, isFocal: false, generationLevel: -999, });
        gedges.push({ from: VIRTUAL_ID, to: focal.memberCode });
        for (const sib of siblings) gedges.push({ from: VIRTUAL_ID, to: `sibling-${sib.memberCode}` });
    }

    function addDesc(
        parentId: string,
        nodes: DescendantNode[],
        generationLevel = 1,
    ) {
        for (const d of nodes) {
            add(
                d.nodeId,
                d.member,
                d.spouse,
                generationLevel,
            );

            gedges.push({
                from: parentId,
                to: d.nodeId,
            });

            if (d.children.length) {
                addDesc(
                    d.nodeId,
                    d.children,
                    generationLevel + 1,
                );
            }
        }
    }
    addDesc(focal.memberCode, descendants);

    return { gnodes, gedges };
}

function buildFlow(
    gnodes: GNode[],
    gedges: GEdge[],
    focalFamilyCode: string,
    onNavigate: (code: string) => void,
): { nodes: Node<MemberNodeData>[]; edges: Edge[] } {
    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: "TB", ranksep: V_SEP, nodesep: H_SEP, edgesep: 80, marginx: PAD, marginy: PAD, ranker: "network-simplex", });
    g.setDefaultEdgeLabel(() => ({}));

    for (const n of gnodes) g.setNode(n.id, { width: slotW(!!n.spouse), height: NODE_H });
    for (const e of gedges) g.setEdge(e.from, e.to);

    dagre.layout(g);

    const nodes: Node<MemberNodeData>[] = gnodes
        .filter((n) => n.id !== VIRTUAL_ID)
        .map((n) => {
            const pos = g.node(n.id);
            return {
                id: n.id,
                type: "member",
                position: {
                    x: pos.x - slotW(!!n.spouse) / 2,
                    y: pos.y - NODE_H / 2,
                },
                data: {
                    member: n.member,
                    spouse: n.spouse,
                    isFocal: n.isFocal,
                    generationLevel: n.generationLevel,
                    focalFamilyCode,
                    onNavigate,
                },
                draggable: false,
                selectable: false,
                focusable: false,
            };
        });

    const edges: Edge[] = gedges
        .filter((e) => e.from !== VIRTUAL_ID)
        .map((e, i) => ({
            id: `e-${i}`,
            source: e.from,
            target: e.to,

            sourceHandle: "bottom",
            targetHandle: "top",
            type: "smoothstep",
            style: {
                stroke: "#3b82f6",
                strokeWidth: 2,
            },
            zIndex: 1,
            animated: false,
        }));

    return { nodes, edges };
}

// ── Legend ────────────────────────────────────────────────────────────────────

function Legend() {
    return (
        <div className="flex items-center gap-3 flex-wrap text-xs text-slate-500">
            {[
                { bg: "bg-blue-50", border: "border-blue-500", label: "Focal" },
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

// ── Inner component (needs ReactFlowProvider context) ─────────────────────────

function LineageFlowInner({
    memberCode,
    focal,
    focalSpouse,
    ancestorRows,
    descendants,
    siblings,
    isLoading,
}: {
    memberCode: string | undefined;
    focal: Member | null;
    focalSpouse: Member | null;
    ancestorRows: AncestorRow[];
    descendants: DescendantNode[];
    siblings: Member[];
    isLoading: boolean;
}) {
    const navigate = useNavigate();
    const { fitView } = useReactFlow();

    const focalFamilyCode = focal?.familyCode ?? "";
    const fullName = focal ? [focal.firstName, focal.lastName].filter(Boolean).join(" ") : "";

    const hasContent = !!focal &&
        (ancestorRows.length > 0 || descendants.length > 0 || siblings.length > 0 || !!focalSpouse);

    // Clicking any card navigates to THEIR lineage — tree is explorable
    const onNavigate = useCallback((targetCode: string) => {
        navigate(`${ROUTES.PRIVATE.MEMBERS}/${targetCode}/lineage`);
    }, [navigate]);

    const { nodes, edges } = useMemo(() => {
        if (!focal) return { nodes: [], edges: [] };
        const { gnodes, gedges } = buildGraph(focal, focalSpouse, ancestorRows, descendants, siblings);
        return buildFlow(gnodes, gedges, focalFamilyCode, onNavigate);
    }, [
        focal?.memberCode,
        focalSpouse?.memberCode,
        ancestorRows,
        descendants,
        siblings,
        onNavigate,
    ]);

    return (
        <div className="flex flex-col" style={{ height: "calc(100vh - 64px - 40px - 32px)" }}>

            {/* Controls bar — never scrolls */}
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

                <div className="flex items-center gap-3 flex-wrap justify-end">
                    <Legend />
                </div>
            </div>

            {/* Canvas area */}
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
                    <ReactFlow
                        defaultEdgeOptions={{
                            zIndex: 1,
                        }}
                        nodes={nodes}
                        edges={edges}
                        nodeTypes={nodeTypes}
                        fitView
                        fitViewOptions={{
                            padding: 0.3,
                            includeHiddenNodes: true,
                        }}
                        minZoom={0.01}
                        maxZoom={2}
                        nodesDraggable={false}
                        nodesConnectable={false}
                        elementsSelectable={false}
                        panOnScroll
                        zoomOnScroll
                        panOnDrag
                        proOptions={{ hideAttribution: true }}
                        style={{ background: "#f8fafc" }}
                    >
                        <Background
                            variant={BackgroundVariant.Dots}
                            gap={24}
                            size={1}
                            color="#e2e8f0"
                        />
                        <Controls showInteractive={false} />
                        <MiniMap
                            nodeColor={(n) => {
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
        </div>
    );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function LineageView() {
    const { memberCode } = useParams<{ memberCode: string }>();
    const depth = 10;

    const { focal, focalSpouse, ancestorRows, descendants, siblings, isLoading } =
        useLineageTree(memberCode ?? "", depth);

    return (
        <ReactFlowProvider>
            <LineageFlowInner
                memberCode={memberCode}
                focal={focal}
                focalSpouse={focalSpouse}
                ancestorRows={ancestorRows}
                descendants={descendants}
                siblings={siblings}
                isLoading={isLoading}
            />
        </ReactFlowProvider>
    );
}
