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
                const spouseRels = relMap.get(father.memberCode);
                const fatherNodeId = `${father.memberCode}-anc-${gen}`;

                const fatherSpouses = spouseRels
                    ? currentSpouses(spouseRels.spouses)
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
            spouses: currentSpouses(childRels?.spouses),
            children: buildDescendants(child.memberCode, relMap, depth, currentDepth + 1, visited),
            nodeId: `${child.memberCode}-desc-${currentDepth + 1}`,
        });
    }
    return result;
}

// ── Main hook ─────────────────────────────────────────────────────────────────

export function useLineageTree(focalMemberCode: string, depth: number): LineageData {

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

    // Level 1: parents + children + current spouses of focal
    const level1Codes: string[] = [];
    if (focalRels) {
        if (focalRels.father) level1Codes.push(focalRels.father.memberCode);
        if (focalRels.mother) level1Codes.push(focalRels.mother.memberCode);
        for (const c of focalRels.children ?? []) level1Codes.push(c.memberCode);
        for (const s of currentSpouses(focalRels.spouses)) level1Codes.push(s.person.memberCode);
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

    const isLoading =
        memberLoading ||
        focalRelsLoading ||
        (level1Codes.length > 0 && depth >= 2 && level1Results.some((q) => q.isLoading));

    if (!focalMember || !focalRels) {
        return { focal: null, focalSpouses: [], ancestorRows: [], descendants: [], siblings: [], isLoading };
    }

    const ancestorRows = buildAncestorRows(focalMemberCode, relMap, depth);
    const descendants = buildDescendants(focalMemberCode, relMap, depth, 0, new Set([focalMemberCode]));

    return {
        focal: focalMember,
        focalSpouses: currentSpouses(focalRels.spouses),
        ancestorRows,
        descendants,
        siblings: focalRels.siblings ?? [],
        isLoading,
    };
}
