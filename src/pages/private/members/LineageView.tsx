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

const NODE_W = 160;
const NODE_H = 152;
const SPOUSE_W = 160;
const SPOUSE_GAP = 44;
const H_SEP = 40;
const V_SEP = 80;
const PAD = 60;

function slotW(hasSpouse: boolean) {
    return hasSpouse ? NODE_W + SPOUSE_GAP + SPOUSE_W : NODE_W;
}

// ── Custom node data ──────────────────────────────────────────────────────────

type MemberNodeData = {
    member: Member;
    spouse: Member | null;
    isFocal: boolean;
    focalFamilyCode: string;
    onNavigate: (memberCode: string) => void;
} & Record<string, unknown>;

// ── Member card ───────────────────────────────────────────────────────────────

function MemberCard({
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
            {isFocal && <div className="text-xs mt-0.5 text-blue-600 font-medium">● You are here</div>}
        </button>
    );
}

// ── @xyflow custom node ───────────────────────────────────────────────────────

function MemberNode({ data }: NodeProps<Node<MemberNodeData>>) {
    const { member, spouse, isFocal, focalFamilyCode, onNavigate } = data;
    return (
        <div className="flex items-center" style={{ gap: spouse ? SPOUSE_GAP : 0 }}>
            <MemberCard
                member={member}
                isFocal={isFocal}
                focalFamilyCode={focalFamilyCode}
                onClick={() => onNavigate(member.memberCode)}
            />
            {spouse && (
                <>
                    <svg
                        width={SPOUSE_GAP}
                        height={NODE_H}
                        className="shrink-0"
                        style={{ overflow: "visible" }}
                    >
                        <line
                            x1={0} y1={NODE_H / 2}
                            x2={SPOUSE_GAP} y2={NODE_H / 2}
                            stroke="#f9a8d4"
                            strokeWidth={2}
                            strokeDasharray="4 3"
                        />
                        <text
                            x={SPOUSE_GAP / 2} y={NODE_H / 2 + 5}
                            textAnchor="middle"
                            fontSize={11}
                            fill="#f472b6"
                        >♥</text>
                    </svg>
                    <MemberCard
                        member={spouse}
                        isSpouse
                        focalFamilyCode={focalFamilyCode}
                        onClick={() => onNavigate(spouse.memberCode)}
                    />
                </>
            )}
        </div>
    );
}

const nodeTypes = { member: MemberNode };

// ── Graph builder types ───────────────────────────────────────────────────────

type GNode = { id: string; member: Member; spouse: Member | null; isFocal: boolean };
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

    function add(id: string, member: Member, spouse: Member | null, isFocal = false) {
        if (seen.has(id)) return;
        seen.add(id);
        gnodes.push({ id, member, spouse, isFocal });
    }

    add(focal.memberCode, focal, focalSpouse, true);
    for (const sib of siblings) add(`sib-${sib.memberCode}`, sib, null);
    for (const row of ancestorRows) {
        for (const an of row.nodes) add(an.nodeId, an.member, an.spouse);
    }

    if (ancestorRows.length > 0) {
        for (const p of ancestorRows[0].nodes) {
            gedges.push({ from: p.nodeId, to: focal.memberCode });
            for (const sib of siblings) gedges.push({ from: p.nodeId, to: `sib-${sib.memberCode}` });
        }
        for (let ri = 1; ri < ancestorRows.length; ri++) {
            for (const gp of ancestorRows[ri].nodes) {
                for (const p of ancestorRows[ri - 1].nodes) {
                    gedges.push({ from: gp.nodeId, to: p.nodeId });
                }
            }
        }
    } else if (siblings.length > 0) {
        gnodes.push({ id: VIRTUAL_ID, member: focal, spouse: null, isFocal: false });
        gedges.push({ from: VIRTUAL_ID, to: focal.memberCode });
        for (const sib of siblings) gedges.push({ from: VIRTUAL_ID, to: `sib-${sib.memberCode}` });
    }

    function addDesc(parentId: string, nodes: DescendantNode[]) {
        for (const d of nodes) {
            add(d.nodeId, d.member, d.spouse);
            gedges.push({ from: parentId, to: d.nodeId });
            if (d.children.length) addDesc(d.nodeId, d.children);
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
    g.setGraph({ rankdir: "TB", ranksep: V_SEP, nodesep: H_SEP, marginx: PAD, marginy: PAD });
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
                data: { member: n.member, spouse: n.spouse, isFocal: n.isFocal, focalFamilyCode, onNavigate },
                width: slotW(!!n.spouse),
                height: NODE_H,
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
            type: "smoothstep",
            style: { stroke: "#cbd5e1", strokeWidth: 1.5 },
        }));

    return { nodes, edges };
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
    depth,
    setDepth,
}: {
    memberCode: string | undefined;
    focal: Member | null;
    focalSpouse: Member | null;
    ancestorRows: AncestorRow[];
    descendants: DescendantNode[];
    siblings: Member[];
    isLoading: boolean;
    depth: number;
    setDepth: (n: number) => void;
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
        depth,
        onNavigate,
    ]);

    const handleDepthChange = useCallback((n: number) => {
        setDepth(n);
        setTimeout(() => fitView({ padding: 0.15, duration: 400 }), 300);
    }, [setDepth, fitView]);

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
                    <DepthSelector value={depth} onChange={handleDepthChange} />
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
                        nodes={nodes}
                        edges={edges}
                        nodeTypes={nodeTypes}
                        fitView
                        fitViewOptions={{ padding: 0.15 }}
                        minZoom={0.05}
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
                            gap={20}
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
    const [depth, setDepth] = useState(3);

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
                depth={depth}
                setDepth={setDepth}
            />
        </ReactFlowProvider>
    );
}
