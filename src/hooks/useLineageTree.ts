import { useQueries, useQuery } from "@tanstack/react-query";
import { getPersonRelationships } from "../features/members/services/relationshipService";
import { Member, PersonRelationshipsResponse, SpouseDetail } from "../features/members/types";

// ── Types ─────────────────────────────────────────────────────────────────────

export type AncestorRow = {
    generation: number;
    nodes: AncestorNode[];
};

export type AncestorNode = {
    member: Member;
    spouses: SpouseDetail[];
    parentNodeIds: string[];
    nodeId: string;
};

export type DescendantNode = {
    member: Member;
    spouses: SpouseDetail[];
    children: DescendantNode[];
    nodeId: string;
};

export type LineageData = {
    focal: Member | null;
    focalSpouses: SpouseDetail[];
    ancestorRows: AncestorRow[];
    descendants: DescendantNode[];
    siblings: Member[];
    isLoading: boolean;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function currentSpouses(spouses: SpouseDetail[] | undefined): SpouseDetail[] {
    return (spouses ?? []).filter(s => s.isCurrent);
}

// Extract all codes that need fetching from a single relationship response
function extractCodes(r: PersonRelationshipsResponse, known: Set<string>): string[] {
    const codes: string[] = [];
    if (r.father && !known.has(r.father.memberCode)) codes.push(r.father.memberCode);
    if (r.mother && !known.has(r.mother.memberCode)) codes.push(r.mother.memberCode);
    for (const c of r.children ?? []) {
        if (!known.has(c.memberCode)) codes.push(c.memberCode);
    }
    for (const s of r.spouses ?? []) {
        if (!known.has(s.person.memberCode)) codes.push(s.person.memberCode);
    }
    return codes;
}

// Build ancestor rows from relMap
function buildAncestorRows(
    focalCode: string,
    relMap: Map<string, PersonRelationshipsResponse>,
    depth: number
): AncestorRow[] {
    const rows: AncestorRow[] = [];
    let currentGeneration: { memberCode: string; nodeId: string }[] = [
        { memberCode: focalCode, nodeId: focalCode },
    ];

    for (let gen = 1; gen <= depth; gen++) {
        const nodes: AncestorNode[] = [];
        const nextGeneration: { memberCode: string; nodeId: string }[] = [];

        for (const childRef of currentGeneration) {
            const rels = relMap.get(childRef.memberCode);
            if (!rels) continue;

            if (rels.father) {
                const father = rels.father;
                const fatherNodeId = `${father.memberCode}-anc-${gen}`;
                const spouseRels = relMap.get(father.memberCode);
                const fatherSpouses = spouseRels
                    ? (spouseRels.spouses ?? [])
                    : rels.mother
                        ? [{ person: rels.mother, isCurrent: true }]
                        : [];

                nodes.push({
                    member: father,
                    spouses: fatherSpouses,
                    parentNodeIds: [childRef.nodeId],
                    nodeId: fatherNodeId,
                });
                nextGeneration.push({ memberCode: father.memberCode, nodeId: fatherNodeId });
            }

            if (rels.mother && !rels.father) {
                const mother = rels.mother;
                const motherNodeId = `${mother.memberCode}-anc-${gen}`;
                nodes.push({
                    member: mother,
                    spouses: [],
                    parentNodeIds: [childRef.nodeId],
                    nodeId: motherNodeId,
                });
                nextGeneration.push({ memberCode: mother.memberCode, nodeId: motherNodeId });
            }
        }

        if (nodes.length === 0) break;
        rows.push({ generation: gen, nodes });
        currentGeneration = nextGeneration;
    }

    return rows;
}

// Build descendant tree recursively
function buildDescendants(
    memberCode: string,
    relMap: Map<string, PersonRelationshipsResponse>,
    depth: number,
    currentDepth: number,
    visited: Set<string>
): DescendantNode[] {
    if (currentDepth >= depth) return [];
    const rels = relMap.get(memberCode);
    if (!rels) return [];

    const result: DescendantNode[] = [];
    for (const child of rels.children ?? []) {
        if (visited.has(child.memberCode)) continue;
        visited.add(child.memberCode);
        const childRels = relMap.get(child.memberCode);
        result.push({
            member: child,
            spouses: childRels?.spouses ?? [],
            children: buildDescendants(child.memberCode, relMap, depth, currentDepth + 1, visited),
            nodeId: `${child.memberCode}-desc-${currentDepth + 1}`,
        });
    }
    return result;
}

// Collect all undiscovered codes from a map of results
function discoverNextWave(
    results: Map<string, PersonRelationshipsResponse>,
    known: Set<string>
): string[] {
    const next: string[] = [];
    for (const r of results.values()) {
        for (const code of extractCodes(r, known)) {
            if (!next.includes(code)) next.push(code);
        }
    }
    return next;
}

// ── Main hook ─────────────────────────────────────────────────────────────────

export function useLineageTree(focalMemberCode: string, depth: number): LineageData {

    // ── Wave 0: focal ─────────────────────────────────────────────────────────
    const { data: focalMember, isLoading: memberLoading } = useQuery<Member>({
        queryKey: ["member", focalMemberCode],
        queryFn: async () => {
            const { getMember } = await import("../features/members/services/memberService");
            return getMember(focalMemberCode);
        },
        staleTime: 1000 * 60 * 2,
        enabled: !!focalMemberCode,
    });

    const { data: focalRels, isLoading: focalRelsLoading } = useQuery<PersonRelationshipsResponse>({
        queryKey: ["relationships", focalMemberCode],
        queryFn: () => getPersonRelationships(focalMemberCode),
        staleTime: 0,
        enabled: !!focalMemberCode,
    });

    // ── Wave 1 ────────────────────────────────────────────────────────────────
    const w0Map = new Map<string, PersonRelationshipsResponse>();
    if (focalRels) w0Map.set(focalMemberCode, focalRels);

    const w1Codes = focalRels ? extractCodes(focalRels, new Set(w0Map.keys())) : [];

    const w1Results = useQueries({
        queries: w1Codes.map(code => ({
            queryKey: ["relationships", code],
            queryFn: () => getPersonRelationships(code),
            staleTime: 0,
            enabled: !!focalRels,
        })),
    });

    const w1Map = new Map(w0Map);
    w1Codes.forEach((code, i) => { const d = w1Results[i]?.data; if (d) w1Map.set(code, d); });
    const w1Done = w1Results.every(q => !q.isLoading);

    // ── Wave 2 ────────────────────────────────────────────────────────────────
    const w2Codes = w1Done ? discoverNextWave(w1Map, new Set(w1Map.keys())) : [];

    const w2Results = useQueries({
        queries: w2Codes.map(code => ({
            queryKey: ["relationships", code],
            queryFn: () => getPersonRelationships(code),
            staleTime: 0,
            enabled: w1Done,
        })),
    });

    const w2Map = new Map(w1Map);
    w2Codes.forEach((code, i) => { const d = w2Results[i]?.data; if (d) w2Map.set(code, d); });
    const w2Done = w1Done && w2Results.every(q => !q.isLoading);

    // ── Wave 3 ────────────────────────────────────────────────────────────────
    const w3Codes = w2Done ? discoverNextWave(w2Map, new Set(w2Map.keys())) : [];

    const w3Results = useQueries({
        queries: w3Codes.map(code => ({
            queryKey: ["relationships", code],
            queryFn: () => getPersonRelationships(code),
            staleTime: 0,
            enabled: w2Done,
        })),
    });

    const w3Map = new Map(w2Map);
    w3Codes.forEach((code, i) => { const d = w3Results[i]?.data; if (d) w3Map.set(code, d); });
    const w3Done = w2Done && w3Results.every(q => !q.isLoading);

    // ── Wave 4 ────────────────────────────────────────────────────────────────
    const w4Codes = w3Done ? discoverNextWave(w3Map, new Set(w3Map.keys())) : [];

    const w4Results = useQueries({
        queries: w4Codes.map(code => ({
            queryKey: ["relationships", code],
            queryFn: () => getPersonRelationships(code),
            staleTime: 0,
            enabled: w3Done,
        })),
    });

    const w4Map = new Map(w3Map);
    w4Codes.forEach((code, i) => { const d = w4Results[i]?.data; if (d) w4Map.set(code, d); });
    const w4Done = w3Done && w4Results.every(q => !q.isLoading);

    // ── Wave 5 ────────────────────────────────────────────────────────────────
    const w5Codes = w4Done ? discoverNextWave(w4Map, new Set(w4Map.keys())) : [];

    const w5Results = useQueries({
        queries: w5Codes.map(code => ({
            queryKey: ["relationships", code],
            queryFn: () => getPersonRelationships(code),
            staleTime: 0,
            enabled: w4Done,
        })),
    });

    const w5Map = new Map(w4Map);
    w5Codes.forEach((code, i) => { const d = w5Results[i]?.data; if (d) w5Map.set(code, d); });
    const w5Done = w4Done && w5Results.every(q => !q.isLoading);

    // ── Wave 6 ────────────────────────────────────────────────────────────────
    const w6Codes = w5Done ? discoverNextWave(w5Map, new Set(w5Map.keys())) : [];

    const w6Results = useQueries({
        queries: w6Codes.map(code => ({
            queryKey: ["relationships", code],
            queryFn: () => getPersonRelationships(code),
            staleTime: 0,
            enabled: w5Done,
        })),
    });

    const w6Map = new Map(w5Map);
    w6Codes.forEach((code, i) => { const d = w6Results[i]?.data; if (d) w6Map.set(code, d); });
    const w6Done = w5Done && w6Results.every(q => !q.isLoading);

    // ── Wave 7 ────────────────────────────────────────────────────────────────
    const w7Codes = w6Done ? discoverNextWave(w6Map, new Set(w6Map.keys())) : [];

    const w7Results = useQueries({
        queries: w7Codes.map(code => ({
            queryKey: ["relationships", code],
            queryFn: () => getPersonRelationships(code),
            staleTime: 0,
            enabled: w6Done,
        })),
    });

    const w7Map = new Map(w6Map);
    w7Codes.forEach((code, i) => { const d = w7Results[i]?.data; if (d) w7Map.set(code, d); });
    const w7Done = w6Done && w7Results.every(q => !q.isLoading);

    // ── Final relMap ──────────────────────────────────────────────────────────
    const relMap = w7Map;

    const isLoading =
        memberLoading ||
        focalRelsLoading ||
        (w1Codes.length > 0 && !w1Done);

    if (!focalMember || !focalRels) {
        return { focal: null, focalSpouses: [], ancestorRows: [], descendants: [], siblings: [], isLoading };
    }

    const ancestorRows = buildAncestorRows(focalMemberCode, relMap, depth);
    const descendants = buildDescendants(focalMemberCode, relMap, depth, 0, new Set([focalMemberCode]));

    return {
        focal: focalMember,
        focalSpouses: focalRels.spouses ?? [],
        ancestorRows,
        descendants,
        siblings: focalRels.siblings ?? [],
        isLoading,
    };
}
