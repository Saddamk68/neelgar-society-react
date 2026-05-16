import { useQueries, useQuery } from "@tanstack/react-query";
import { getPersonRelationships } from "../features/members/services/relationshipService";
import { Member, PersonRelationshipsResponse } from "../features/members/types";

// ── Types ─────────────────────────────────────────────────────────────────────

export type AncestorRow = {
    generation: number;   // 1 = parents, 2 = grandparents, etc.
    nodes: AncestorNode[];
};

export type AncestorNode = {
    member: Member;
    spouse: Member | null;
    parentNodeIds: string[];  // nodeIds in the row above (generation+1)
    nodeId: string;
};

export type DescendantNode = {
    member: Member;
    spouse: Member | null;
    children: DescendantNode[];
    nodeId: string;
};

export type LineageData = {
    focal: Member | null;
    focalSpouse: Member | null;
    ancestorRows: AncestorRow[];    // index 0 = parents, index 1 = grandparents, etc.
    descendants: DescendantNode[];  // direct children of focal
    siblings: Member[];
    isLoading: boolean;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function findMember(code: string, relMap: Map<string, PersonRelationshipsResponse>): Member | null {
    for (const r of relMap.values()) {
        if (r.father?.memberCode === code) return r.father;
        if (r.mother?.memberCode === code) return r.mother;
        if (r.spouse?.memberCode === code) return r.spouse;
        for (const c of r.children ?? []) if (c.memberCode === code) return c;
        for (const s of r.siblings ?? []) if (s.memberCode === code) return s;
    }
    return null;
}

// Build ancestor rows — each row is one generation above the previous.
// Row 0 = parents of focal, Row 1 = grandparents, etc.
function buildAncestorRows(
    focalCode: string,
    relMap: Map<string, PersonRelationshipsResponse>,
    depth: number
): AncestorRow[] {

    const rows: AncestorRow[] = [];

    // generation tracking
    let currentGeneration: {
        memberCode: string;
        nodeId: string;
    }[] = [
            {
                memberCode: focalCode,
                nodeId: focalCode,
            },
        ];

    for (let gen = 1; gen <= depth; gen++) {

        const nodes: AncestorNode[] = [];

        const nextGeneration: {
            memberCode: string;
            nodeId: string;
        }[] = [];

        for (const childRef of currentGeneration) {

            const rels = relMap.get(childRef.memberCode);

            if (!rels) continue;

            // ─────────────────────────────────────────────
            // Father
            // ─────────────────────────────────────────────

            if (rels.father) {

                const father = rels.father;

                const spouseRels = relMap.get(father.memberCode);

                const fatherNodeId = `${father.memberCode}-anc-${gen}`;

                nodes.push({
                    member: father,
                    spouse: spouseRels?.spouse ?? rels.mother ?? null,

                    // IMPORTANT:
                    // connect to EXACT nodeId below
                    parentNodeIds: [childRef.nodeId],

                    nodeId: fatherNodeId,
                });

                nextGeneration.push({
                    memberCode: father.memberCode,
                    nodeId: fatherNodeId,
                });
            }

            // ─────────────────────────────────────────────
            // Mother standalone
            // ─────────────────────────────────────────────

            if (rels.mother && !rels.father) {

                const mother = rels.mother;

                const motherNodeId = `${mother.memberCode}-anc-${gen}`;

                nodes.push({
                    member: mother,
                    spouse: null,

                    // IMPORTANT:
                    // connect to EXACT nodeId below
                    parentNodeIds: [childRef.nodeId],

                    nodeId: motherNodeId,
                });

                nextGeneration.push({
                    memberCode: mother.memberCode,
                    nodeId: motherNodeId,
                });
            }
        }

        if (nodes.length === 0) {
            break;
        }

        rows.push({
            generation: gen,
            nodes,
        });

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
            spouse: childRels?.spouse ?? null,
            children: buildDescendants(child.memberCode, relMap, depth, currentDepth + 1, visited),
            nodeId: `${child.memberCode}-desc-${currentDepth + 1}`,
        });
    }
    return result;
}

// ── Main hook ─────────────────────────────────────────────────────────────────

export function useLineageTree(focalMemberCode: string, depth: number): LineageData {

    // Focal member object
    const { data: focalMember, isLoading: memberLoading } = useQuery<Member>({
        queryKey: ["member", focalMemberCode],
        queryFn: async () => {
            const { getMember } = await import("../features/members/services/memberService");
            return getMember(focalMemberCode);
        },
        staleTime: 1000 * 60 * 2,
        enabled: !!focalMemberCode,
    });

    // Focal relationships
    const { data: focalRels, isLoading: focalRelsLoading } = useQuery<PersonRelationshipsResponse>({
        queryKey: ["relationships", focalMemberCode],
        queryFn: () => getPersonRelationships(focalMemberCode),
        staleTime: 0,
        enabled: !!focalMemberCode,
    });

    // Level 1: parents + children of focal
    const level1Codes: string[] = [];
    if (focalRels) {
        if (focalRels.father) level1Codes.push(focalRels.father.memberCode);
        if (focalRels.mother) level1Codes.push(focalRels.mother.memberCode);
        for (const c of focalRels.children ?? []) level1Codes.push(c.memberCode);
    }

    const level1Results = useQueries({
        queries: level1Codes.map((code) => ({
            queryKey: ["relationships", code],
            queryFn: () => getPersonRelationships(code),
            staleTime: 0,
            enabled: !!focalRels && depth >= 2,
        })),
    });

    const level1Map = new Map<string, PersonRelationshipsResponse>();
    if (focalRels) level1Map.set(focalMemberCode, focalRels);
    level1Codes.forEach((code, i) => {
        const d = level1Results[i]?.data;
        if (d) level1Map.set(code, d);
    });

    // Level 2
    const level2Codes: string[] = [];
    if (depth >= 3 && level1Results.every((q) => !q.isLoading)) {
        for (const code of level1Codes) {
            const r = level1Map.get(code);
            if (!r) continue;
            if (r.father && !level1Map.has(r.father.memberCode)) level2Codes.push(r.father.memberCode);
            if (r.mother && !level1Map.has(r.mother.memberCode)) level2Codes.push(r.mother.memberCode);
            for (const c of r.children ?? []) {
                if (!level1Map.has(c.memberCode)) level2Codes.push(c.memberCode);
            }
        }
    }

    const level2Results = useQueries({
        queries: level2Codes.map((code) => ({
            queryKey: ["relationships", code],
            queryFn: () => getPersonRelationships(code),
            staleTime: 0,
            enabled: depth >= 3 && level1Results.every((q) => !q.isLoading),
        })),
    });

    const level2Map = new Map(level1Map);
    level2Codes.forEach((code, i) => {
        const d = level2Results[i]?.data;
        if (d) level2Map.set(code, d);
    });

    // Level 3
    const level3Codes: string[] = [];
    if (depth >= 4 && level2Results.every((q) => !q.isLoading)) {
        for (const code of level2Codes) {
            const r = level2Map.get(code);
            if (!r) continue;
            if (r.father && !level2Map.has(r.father.memberCode)) level3Codes.push(r.father.memberCode);
            if (r.mother && !level2Map.has(r.mother.memberCode)) level3Codes.push(r.mother.memberCode);
            for (const c of r.children ?? []) {
                if (!level2Map.has(c.memberCode)) level3Codes.push(c.memberCode);
            }
        }
    }

    const level3Results = useQueries({
        queries: level3Codes.map((code) => ({
            queryKey: ["relationships", code],
            queryFn: () => getPersonRelationships(code),
            staleTime: 0,
            enabled: depth >= 4 && level2Results.every((q) => !q.isLoading),
        })),
    });

    const relMap = new Map(level2Map);
    level3Codes.forEach((code, i) => {
        const d = level3Results[i]?.data;
        if (d) relMap.set(code, d);
    });

    // Loading — only block on initial data
    const isLoading =
        memberLoading ||
        focalRelsLoading ||
        (level1Codes.length > 0 && depth >= 2 && level1Results.some((q) => q.isLoading));

    if (!focalMember || !focalRels) {
        return { focal: null, focalSpouse: null, ancestorRows: [], descendants: [], siblings: [], isLoading };
    }

    const ancestorRows = buildAncestorRows(focalMemberCode, relMap, depth);
    const descendants = buildDescendants(focalMemberCode, relMap, depth, 0, new Set([focalMemberCode]));

    return {
        focal: focalMember,
        focalSpouse: focalRels.spouse ?? null,
        ancestorRows,
        descendants,
        siblings: focalRels.siblings ?? [],
        isLoading,
    };
}
