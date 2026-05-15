import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, User } from "lucide-react";
import dagre from "@dagrejs/dagre";
import MemberAvatar from "../../../components/MemberAvatar";
import { useLineageTree, AncestorRow, AncestorNode, DescendantNode } from "../../../hooks/useLineageTree";
import { Member } from "../../../features/members/types";
import { ROUTES } from "../../../constants/routes";

// ── Layout constants ──────────────────────────────────────────────────────────

const NODE_W = 156;
const NODE_H = 150;
const SPOUSE_W = 156;
const SPOUSE_GAP = 40;   // gap between member and spouse cards
const H_SEP = 32;        // dagre horizontal separation between nodes
const V_SEP = 72;        // dagre vertical separation between ranks
const PAD = 48;          // canvas padding

// Total slot width for a node (includes spouse if present)
function slotW(hasSpouse: boolean) {
    return hasSpouse ? NODE_W + SPOUSE_GAP + SPOUSE_W : NODE_W;
}

// ── Types for the flat graph we feed to dagre ─────────────────────────────────

type GraphNode = {
    id: string;
    member: Member;
    spouse: Member | null;
    isFocal: boolean;
};

type GraphEdge = {
    from: string;
    to: string;
};

// ── Build flat graph from hook data ───────────────────────────────────────────

function buildGraph(
    focal: Member,
    focalSpouse: Member | null,
    ancestorRows: AncestorRow[],
    descendants: DescendantNode[],
    siblings: Member[],
): { nodes: GraphNode[]; edges: GraphEdge[] } {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const seen = new Set<string>();

    function addNode(id: string, member: Member, spouse: Member | null, isFocal = false) {
        if (seen.has(id)) return;
        seen.add(id);
        nodes.push({ id, member, spouse, isFocal });
    }

    // Focal
    addNode(focal.memberCode, focal, focalSpouse, true);

    // Siblings — same rank as focal, connected from same parents
    for (const sib of siblings) {
        addNode(`sib-${sib.memberCode}`, sib, null);
        // Edge will come from parent if parents exist; if not, no edge (they float beside focal)
    }

    // Ancestors — row by row
    // ancestorRows[0] = parents, ancestorRows[1] = grandparents, etc.
    for (let ri = 0; ri < ancestorRows.length; ri++) {
        const row = ancestorRows[ri];
        for (const an of row.nodes) {
            addNode(an.nodeId, an.member, an.spouse);
        }
    }

    // Edges: parent row → child row
    // ancestorRows[0].nodes → focal + siblings
    if (ancestorRows.length > 0) {
        const parentRow = ancestorRows[0];
        for (const parentNode of parentRow.nodes) {
            // Connect to focal
            edges.push({ from: parentNode.nodeId, to: focal.memberCode });
            // Connect to each sibling
            for (const sib of siblings) {
                edges.push({ from: parentNode.nodeId, to: `sib-${sib.memberCode}` });
            }
        }

        // Edges between ancestor rows
        for (let ri = 1; ri < ancestorRows.length; ri++) {
            const childRow = ancestorRows[ri - 1];
            const parentRow2 = ancestorRows[ri];
            // Each node in parentRow2 connects to the node in childRow it parented
            // We can't know this precisely without tracking parentage, so connect
            // each grandparent to the closest parent by position
            for (const grandparent of parentRow2.nodes) {
                for (const parent of childRow.nodes) {
                    edges.push({ from: grandparent.nodeId, to: parent.nodeId });
                }
            }
        }
    } else {
        // No parents — siblings still need to be on same rank as focal
        // We add a virtual hidden parent to group them
        if (siblings.length > 0) {
            const virtualId = "__virtual_parent__";
            nodes.push({ id: virtualId, member: focal, spouse: null, isFocal: false });
            edges.push({ from: virtualId, to: focal.memberCode });
            for (const sib of siblings) {
                edges.push({ from: virtualId, to: `sib-${sib.memberCode}` });
            }
        }
    }

    // Descendants — recursive
    function addDesc(parentId: string, descNodes: DescendantNode[]) {
        for (const d of descNodes) {
            addNode(d.nodeId, d.member, d.spouse);
            edges.push({ from: parentId, to: d.nodeId });
            if (d.children.length > 0) addDesc(d.nodeId, d.children);
        }
    }
    addDesc(focal.memberCode, descendants);

    return { nodes, edges };
}

// ── Run dagre layout ──────────────────────────────────────────────────────────

type LayoutNode = GraphNode & { x: number; y: number };

function runDagre(
    nodes: GraphNode[],
    edges: GraphEdge[],
): { layoutNodes: LayoutNode[]; canvasW: number; canvasH: number } {
    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: "TB", ranksep: V_SEP, nodesep: H_SEP, marginx: PAD, marginy: PAD });
    g.setDefaultEdgeLabel(() => ({}));

    for (const n of nodes) {
        g.setNode(n.id, { width: slotW(!!n.spouse), height: NODE_H });
    }
    for (const e of edges) {
        g.setEdge(e.from, e.to);
    }

    dagre.layout(g);

    const layoutNodes: LayoutNode[] = nodes.map((n) => {
        const pos = g.node(n.id);
        return {
            ...n,
            x: pos.x - slotW(!!n.spouse) / 2,
            y: pos.y - NODE_H / 2,
        };
    });

    const allX2 = layoutNodes.map((n) => n.x + slotW(!!n.spouse));
    const allY2 = layoutNodes.map((n) => n.y + NODE_H);
    const canvasW = Math.max(...allX2) + PAD;
    const canvasH = Math.max(...allY2) + PAD;

    return { layoutNodes, canvasW, canvasH };
}

// ── Build SVG connector paths ─────────────────────────────────────────────────

function buildPaths(
    layoutNodes: LayoutNode[],
    edges: GraphEdge[],
    virtualId: string,
): string[] {
    const nodeMap = new Map(layoutNodes.map((n) => [n.id, n]));
    const paths: string[] = [];

    // Group edges by parent so we can draw crossbar for multi-child
    const byParent = new Map<string, string[]>();
    for (const e of edges) {
        if (e.from === virtualId) continue; // virtual node — no connector
        const arr = byParent.get(e.from) ?? [];
        arr.push(e.to);
        byParent.set(e.from, arr);
    }

    for (const [fromId, toIds] of byParent.entries()) {
        const parent = nodeMap.get(fromId);
        if (!parent) continue;

        // Parent bottom-center (centre of the main card, not counting spouse)
        const px = parent.x + NODE_W / 2;
        const py = parent.y + NODE_H;

        const childCentres: number[] = toIds.map((tid) => {
            const child = nodeMap.get(tid);
            if (!child) return px;
            return child.x + NODE_W / 2;
        }).filter(Boolean);

        const childY = (() => {
            const first = nodeMap.get(toIds[0]);
            return first ? first.y : py + V_SEP;
        })();

        if (childCentres.length === 1) {
            // Single child — simple elbow
            const cx = childCentres[0];
            const midY = py + (childY - py) / 2;
            paths.push(`M ${px} ${py} C ${px} ${midY} ${cx} ${midY} ${cx} ${childY}`);
        } else {
            // Multiple children — stem + crossbar + drops
            const minCx = Math.min(...childCentres);
            const maxCx = Math.max(...childCentres);
            const barY = py + (childY - py) * 0.5;
            // Stem down to bar
            paths.push(`M ${px} ${py} L ${px} ${barY}`);
            // Horizontal crossbar
            paths.push(`M ${minCx} ${barY} L ${maxCx} ${barY}`);
            // Drops to each child
            for (const cx of childCentres) {
                paths.push(`M ${cx} ${barY} L ${cx} ${childY}`);
            }
        }
    }

    return paths;
}

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
            style={{ width: NODE_W, height: NODE_H }}
            className={[
                "flex flex-col items-center p-2.5 rounded-xl border-2 transition shrink-0",
                "text-center hover:shadow-md hover:scale-[1.02]",
                "focus:outline-none focus:ring-2 focus:ring-primary/30",
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

// ── Depth selector ────────────────────────────────────────────────────────────

function DepthSelector({ value, onChange }: { value: number; onChange: (n: number) => void }) {
    return (
        <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs text-slate-400 mr-1">Gen</span>
            {[1, 2, 3, 4].map((n) => (
                <button key={n} type="button" onClick={() => onChange(n)}
                    className={[
                        "w-7 h-7 rounded-full text-xs font-semibold transition",
                        value === n ? "bg-primary text-white shadow" : "bg-slate-100 text-slate-500 hover:bg-slate-200",
                    ].join(" ")}
                >{n}</button>
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

// ── Main ──────────────────────────────────────────────────────────────────────

export default function LineageView() {
    const { memberCode } = useParams<{ memberCode: string }>();
    const navigate = useNavigate();
    const [depth, setDepth] = useState(3);

    const { focal, focalSpouse, ancestorRows, descendants, siblings, isLoading } =
        useLineageTree(memberCode ?? "", depth);

    const focalFamilyCode = focal?.familyCode ?? "";
    const fullName = focal ? [focal.firstName, focal.lastName].filter(Boolean).join(" ") : "";

    const hasContent = !!focal &&
        (ancestorRows.length > 0 || descendants.length > 0 || siblings.length > 0 || !!focalSpouse);

    // ── Build + layout graph ──────────────────────────────────────────────────

    const VIRTUAL_ID = "__virtual_parent__";

    const { layoutNodes, connectorPaths, canvasW, canvasH } = useMemo(() => {
        if (!focal) return { layoutNodes: [], connectorPaths: [], canvasW: 0, canvasH: 0 };

        const { nodes, edges } = buildGraph(focal, focalSpouse, ancestorRows, descendants, siblings);
        const { layoutNodes, canvasW, canvasH } = runDagre(nodes, edges);
        const connectorPaths = buildPaths(layoutNodes, edges, VIRTUAL_ID);

        return { layoutNodes, connectorPaths, canvasW, canvasH };
    }, [focal?.memberCode, focalSpouse?.memberCode, ancestorRows, descendants, siblings, depth]);

    // Hide virtual node
    const visibleNodes = layoutNodes.filter((n) => n.id !== VIRTUAL_ID);

    // ── Render ────────────────────────────────────────────────────────────────

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
                    <DepthSelector value={depth} onChange={setDepth} />
                </div>
            </div>

            {/* Scrollable canvas */}
            <div className="flex-1 min-h-0 w-full overflow-auto app-scroll mt-3">

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
                        <button type="button"
                            onClick={() => navigate(`${ROUTES.PRIVATE.MEMBERS}/${memberCode}/view`)}
                            className="text-primary underline text-sm"
                        >
                            Go to member to add relationships
                        </button>
                    </div>
                )}

                {!isLoading && hasContent && focal && (
                    /* Centering wrapper */
                    <div style={{ minWidth: canvasW + 96, paddingBottom: 48 }}>
                        <div
                            className="relative"
                            style={{
                                width: canvasW,
                                height: canvasH,
                                marginLeft: "auto",
                                marginRight: "auto",
                            }}
                        >
                            {/* SVG connector layer */}
                            <svg
                                className="absolute inset-0 pointer-events-none"
                                width={canvasW}
                                height={canvasH}
                            >
                                {connectorPaths.map((d, i) => (
                                    <path
                                        key={i}
                                        d={d}
                                        fill="none"
                                        stroke="#cbd5e1"
                                        strokeWidth={1.5}
                                        strokeLinecap="round"
                                    />
                                ))}

                                {/* Marriage lines */}
                                {visibleNodes
                                    .filter((n) => !!n.spouse)
                                    .map((n) => {
                                        const lx = n.x + NODE_W;
                                        const rx = n.x + NODE_W + SPOUSE_GAP;
                                        const y = n.y + NODE_H / 2;
                                        const midX = (lx + rx) / 2;
                                        return (
                                            <g key={`marr-${n.id}`}>
                                                <line
                                                    x1={lx} y1={y}
                                                    x2={rx} y2={y}
                                                    stroke="#f9a8d4"
                                                    strokeWidth={2}
                                                    strokeDasharray="4 3"
                                                />
                                                <text
                                                    x={midX} y={y + 5}
                                                    textAnchor="middle"
                                                    fontSize={11}
                                                    fill="#f472b6"
                                                >♥</text>
                                            </g>
                                        );
                                    })}
                            </svg>

                            {/* HTML node cards */}
                            {visibleNodes.map((n) => (
                                <div
                                    key={n.id}
                                    className="absolute flex items-center"
                                    style={{ left: n.x, top: n.y }}
                                >
                                    <NodeCard
                                        member={n.member}
                                        isFocal={n.isFocal}
                                        focalFamilyCode={focalFamilyCode}
                                        onClick={() => navigate(`${ROUTES.PRIVATE.MEMBERS}/${n.member.memberCode}/view`)}
                                    />
                                    {n.spouse && (
                                        <>
                                            <div
                                                className="flex flex-col items-center shrink-0"
                                                style={{ width: SPOUSE_GAP }}
                                            />
                                            <NodeCard
                                                member={n.spouse}
                                                isSpouse
                                                focalFamilyCode={focalFamilyCode}
                                                onClick={() => navigate(`${ROUTES.PRIVATE.MEMBERS}/${n.spouse!.memberCode}/view`)}
                                            />
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
