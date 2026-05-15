import { useMemo } from "react";
import { hierarchy, tree } from "d3-hierarchy";
import NodeCard, { NODE_W, NODE_H, SPOUSE_GAP, SPOUSE_W } from "./NodeCard";
import { crossbarPaths, marriagePath, marriageMidpoint } from "./connectors";
import { LineageNode } from "../../hooks/useLineageTree";

const H_GAP = 48;
const V_GAP = 80;
const PAD = 60;

// ── d3 layout ─────────────────────────────────────────────────────────────────

type D3Node = { x: number; y: number; data: LineageNode };

function runLayout(root: LineageNode): D3Node[] {
    const hier = hierarchy<LineageNode>(root, (d) => d.children);
    const layout = tree<LineageNode>()
        .nodeSize([NODE_W + H_GAP, NODE_H + V_GAP])
        .separation((a, b) => (a.data.spouse || b.data.spouse ? 2.2 : 1.4));
    layout(hier);
    const nodes: D3Node[] = [];
    hier.each((n) => nodes.push({ x: n.x!, y: n.y!, data: n.data }));
    return nodes;
}

function nodeBounds(nodes: D3Node[]) {
    if (!nodes.length) return { minX: 0, maxX: 0, minY: 0, maxY: 0, w: 0, h: 0 };
    const xs = nodes.flatMap((n) => [n.x, n.x + (n.data.spouse ? NODE_W + SPOUSE_GAP + SPOUSE_W : NODE_W)]);
    const ys = nodes.map((n) => n.y);
    const minX = Math.min(...xs) - NODE_W / 2;
    const maxX = Math.max(...xs) + NODE_W / 2;
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    return { minX, maxX, minY, maxY, w: maxX - minX, h: maxY - minY };
}

// ── SingleTree ────────────────────────────────────────────────────────────────

type SingleTreeProps = {
    root: LineageNode;
    offsetX: number;
    offsetY: number;
    skipRootCard?: boolean;  // true for ancestor tree — focal already drawn by descendant tree
    focalFamilyCode: string;
    focalMemberCode: string;
    depth: number;
};

function SingleTree({ root, offsetX, offsetY, skipRootCard, focalFamilyCode, focalMemberCode, depth }: SingleTreeProps) {
    const nodes = useMemo(
        () => runLayout(root),
        // depth in deps so memo re-runs when depth changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [root.nodeId, depth]
    );

    const nodeMap = useMemo(
        () => new Map(nodes.map((n) => [n.data.nodeId, n])),
        [nodes]
    );

    const connectorPaths = useMemo(() => {
        const result: string[] = [];
        for (const node of nodes) {
            if (!node.data.children.length) continue;
            const px = node.x + offsetX + NODE_W / 2;
            const py = node.y + offsetY + NODE_H;
            const childXs: number[] = [];
            let childTopY = 0;
            for (const child of node.data.children) {
                const cn = nodeMap.get(child.nodeId);
                if (!cn) continue;
                childXs.push(cn.x + offsetX + NODE_W / 2);
                childTopY = cn.y + offsetY;
            }
            if (childXs.length) result.push(...crossbarPaths(px, py, childXs, childTopY));
        }
        return result;
    }, [nodes, nodeMap, offsetX, offsetY]);

    const marriagePaths = useMemo(() =>
        nodes
            .filter((n) => !!n.data.spouse)
            .map((n) => {
                const leftX = n.x + offsetX + NODE_W;
                const rightX = leftX + SPOUSE_GAP;
                const y = n.y + offsetY + NODE_H / 2;
                return {
                    path: marriagePath(leftX, y, rightX, y),
                    mid: marriageMidpoint(leftX, y, rightX, y),
                };
            }),
        [nodes, offsetX, offsetY]
    );

    return (
        <>
            {connectorPaths.map((d, i) => (
                <path key={`c${i}`} d={d} fill="none" stroke="#cbd5e1" strokeWidth={1.5} strokeLinecap="round" />
            ))}

            {marriagePaths.map((m, i) => (
                <g key={`m${i}`}>
                    <path d={m.path} fill="none" stroke="#f9a8d4" strokeWidth={2} strokeDasharray="4 3" />
                    <text x={m.mid.x} y={m.mid.y + 5} textAnchor="middle" fontSize={12} fill="#f472b6">♥</text>
                </g>
            ))}

            {nodes.map((n) => {
                const isRoot = n.data.nodeId === root.nodeId;
                if (skipRootCard && isRoot) return null;

                const isFocal = n.data.member.memberCode === focalMemberCode;
                const cardX = n.x + offsetX;
                const cardY = n.y + offsetY;

                return (
                    <g key={n.data.nodeId}>
                        <foreignObject x={cardX} y={cardY} width={NODE_W} height={NODE_H} overflow="visible">
                            <div {...{ xmlns: "http://www.w3.org/1999/xhtml" }}>
                                <NodeCard member={n.data.member} isFocal={isFocal} focalFamilyCode={focalFamilyCode} />
                            </div>
                        </foreignObject>

                        {n.data.spouse && (
                            <foreignObject x={cardX + NODE_W + SPOUSE_GAP} y={cardY} width={SPOUSE_W} height={NODE_H} overflow="visible">
                                <div {...{ xmlns: "http://www.w3.org/1999/xhtml" }}>
                                    <NodeCard member={n.data.spouse} focalFamilyCode={focalFamilyCode} isSpouse />
                                </div>
                            </foreignObject>
                        )}
                    </g>
                );
            })}
        </>
    );
}

// ── Main TreeCanvas ───────────────────────────────────────────────────────────

type CanvasProps = {
    ancestorRoot: LineageNode | null;
    descendantRoot: LineageNode | null;
    siblings: import("../../features/members/types").Member[];
    focalFamilyCode: string;
    focalMemberCode: string;
    depth: number;
};

export default function TreeCanvas({ ancestorRoot, descendantRoot, siblings, focalFamilyCode, focalMemberCode, depth }: CanvasProps) {

    const ancestorNodes = useMemo(() => ancestorRoot ? runLayout(ancestorRoot) : [], [ancestorRoot?.nodeId, depth]);
    const descendantNodes = useMemo(() => descendantRoot ? runLayout(descendantRoot) : [], [descendantRoot?.nodeId, depth]);

    const aB = nodeBounds(ancestorNodes);
    const dB = nodeBounds(descendantNodes);

    // Ancestor tree: root is at y=0, parents at y=(NODE_H+V_GAP), grandparents at y=2*(NODE_H+V_GAP)
    // We want grandparents at TOP and root (focal) at BOTTOM of ancestor section.
    // So we flip: offsetY for ancestor = ancestorBaseY, but we render nodes at (maxAncestorY - n.y)
    // Simpler: just render ancestor nodes with y = (aB.maxY - n.y) + PAD
    // This puts deepest ancestors (highest y) at top and root (y=0) at bottom.

    const ancestorH = ancestorRoot && aB.maxY > 0 ? aB.maxY + NODE_H + V_GAP : 0;
    const siblingH = siblings.length > 0 ? NODE_H + V_GAP : 0;
    const focalH = NODE_H + V_GAP;
    const descendantH = descendantRoot && dB.maxY > 0 ? dB.maxY + NODE_H + V_GAP : 0;

    const totalH = PAD + ancestorH + siblingH + focalH + descendantH + PAD;

    const totalW = Math.max(aB.w, dB.w, siblings.length * (NODE_W + H_GAP)) + PAD * 2 + SPOUSE_GAP + SPOUSE_W;
    const centreX = totalW / 2;

    const focalBaseY = PAD + ancestorH + siblingH;
    const siblingBaseY = PAD + ancestorH;
    const descendantBaseY = focalBaseY + focalH;

    // For ancestor tree: flip y so ancestors appear above focal.
    // Root (focal) is at d3 y=0. Parents at y=228. We want parents ABOVE focal.
    // Render each ancestor node at: (focalBaseY - n.y) so root lands at focalBaseY, parents above.
    const ancestorOffsetX = centreX - NODE_W / 2;
    // We pass a custom offsetY per node via a wrapper — easiest to inline a custom render
    // Actually: offsetY such that root.y=0 → focalBaseY. So offsetY = focalBaseY.
    // Then node renders at n.y + offsetY. Root: 0 + focalBaseY = focalBaseY ✓
    // Parents: (NODE_H+V_GAP) + focalBaseY — goes DOWN not up.
    // So we negate: render at focalBaseY - n.y.
    // We handle this by passing a negative offsetY trick:
    // cardY = n.y + offsetY. We want cardY = focalBaseY - n.y.
    // That means: offsetY = focalBaseY - 2*n.y — not constant. Can't use a single offset.
    //
    // Correct approach: pass the nodes with pre-flipped y into a version of SingleTree
    // that just uses n.y directly. We'll build a flipped ancestor nodes array.

    const ancestorNodesFlipped: D3Node[] = useMemo(() =>
        ancestorNodes.map((n) => ({ ...n, y: focalBaseY - n.y })),
        [ancestorNodes, focalBaseY]
    );

    const siblingTotalW = siblings.length * (NODE_W + H_GAP) - H_GAP;
    const siblingStartX = centreX - siblingTotalW / 2;

    return (
        <svg width={totalW} height={totalH} className="block" style={{ minWidth: totalW }}>

            {/* Ancestor tree — using pre-flipped nodes rendered directly */}
            {ancestorRoot && ancestorNodesFlipped.map((n) => {
                const isRoot = n.data.nodeId === ancestorRoot.nodeId;
                if (isRoot) return null; // focal rendered by descendant tree

                const cardX = n.x + ancestorOffsetX;
                const cardY = n.y;

                return (
                    <g key={`anc-${n.data.nodeId}`}>
                        <foreignObject x={cardX} y={cardY} width={NODE_W} height={NODE_H} overflow="visible">
                            <div {...{ xmlns: "http://www.w3.org/1999/xhtml" }}>
                                <NodeCard member={n.data.member} focalFamilyCode={focalFamilyCode} />
                            </div>
                        </foreignObject>
                        {n.data.spouse && (
                            <foreignObject x={cardX + NODE_W + SPOUSE_GAP} y={cardY} width={SPOUSE_W} height={NODE_H} overflow="visible">
                                <div {...{ xmlns: "http://www.w3.org/1999/xhtml" }}>
                                    <NodeCard member={n.data.spouse} focalFamilyCode={focalFamilyCode} isSpouse />
                                </div>
                            </foreignObject>
                        )}
                    </g>
                );
            })}

            {/* Ancestor connectors — also need flipped y */}
            {ancestorRoot && (() => {
                const nodeMap = new Map(ancestorNodesFlipped.map((n) => [n.data.nodeId, n]));
                const paths: string[] = [];
                for (const node of ancestorNodesFlipped) {
                    if (!node.data.children.length) continue;
                    const px = node.x + ancestorOffsetX + NODE_W / 2;
                    // In ancestor tree, connector goes from TOP of parent card down to BOTTOM of child card
                    // (because ancestors are above, children below in flipped layout)
                    const py = node.y + NODE_H; // bottom of this card
                    const childXs: number[] = [];
                    let childBottomY = 0;
                    for (const child of node.data.children) {
                        const cn = nodeMap.get(child.nodeId);
                        if (!cn) continue;
                        childXs.push(cn.x + ancestorOffsetX + NODE_W / 2);
                        childBottomY = cn.y; // top of child card (child is above = lower y)
                    }
                    if (childXs.length) {
                        paths.push(...crossbarPaths(px, py, childXs, childBottomY));
                    }
                }
                return paths.map((d, i) => (
                    <path key={`ac${i}`} d={d} fill="none" stroke="#cbd5e1" strokeWidth={1.5} strokeLinecap="round" />
                ));
            })()}

            {/* Siblings */}
            {siblings.length > 0 && (
                <>
                    <text x={centreX} y={siblingBaseY - 8} textAnchor="middle" fontSize={10} fill="#94a3b8" fontWeight={600} letterSpacing={1}>
                        SIBLINGS ({siblings.length})
                    </text>
                    <line x1={centreX + NODE_W / 2} y1={siblingBaseY + NODE_H} x2={centreX + NODE_W / 2} y2={focalBaseY} stroke="#e2e8f0" strokeWidth={1.5} strokeDasharray="4 4" />
                    {siblings.map((sib, i) => (
                        <foreignObject key={sib.memberCode} x={siblingStartX + i * (NODE_W + H_GAP)} y={siblingBaseY} width={NODE_W} height={NODE_H} overflow="visible">
                            <div {...{ xmlns: "http://www.w3.org/1999/xhtml" }}>
                                <NodeCard member={sib} focalFamilyCode={focalFamilyCode} />
                            </div>
                        </foreignObject>
                    ))}
                    {siblings.length > 1 && (
                        <line
                            x1={siblingStartX + NODE_W / 2}
                            y1={siblingBaseY + NODE_H + 16}
                            x2={siblingStartX + (siblings.length - 1) * (NODE_W + H_GAP) + NODE_W / 2}
                            y2={siblingBaseY + NODE_H + 16}
                            stroke="#e2e8f0" strokeWidth={1.5}
                        />
                    )}
                </>
            )}

            {/* Descendant tree — includes focal card */}
            {descendantRoot && (
                <SingleTree
                    root={descendantRoot}
                    offsetX={centreX - NODE_W / 2}
                    offsetY={focalBaseY}
                    focalFamilyCode={focalFamilyCode}
                    focalMemberCode={focalMemberCode}
                    depth={depth}
                />
            )}
        </svg>
    );
}
