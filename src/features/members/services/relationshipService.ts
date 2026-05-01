import { api } from "../../../services/apiClient";
import { ENDPOINTS } from "../../../config/endpoints";
import { PersonRelationshipsResponse, RelationshipResponse } from "../types";

function unwrap<T>(res: any): T {
  return res.data?.data ?? res.data;
}

// ── Get all relationships for a person ────────────────────────────────────────
// Returns father, mother, spouse, children, siblings in one call

export async function getPersonRelationships(
  memberCode: string
): Promise<PersonRelationshipsResponse> {
  const res = await api.get(ENDPOINTS.relationships.forPerson(memberCode));
  return unwrap<PersonRelationshipsResponse>(res);
}

// ── Link a parent ─────────────────────────────────────────────────────────────
// relationshipType must be "FATHER" or "MOTHER"
// person1MemberCode = the child, person2MemberCode = the parent

export async function linkParent(
  childMemberCode: string,
  parentMemberCode: string,
  relationshipType: "FATHER" | "MOTHER",
  createdBy: string
): Promise<RelationshipResponse> {
  const res = await api.post(
    ENDPOINTS.relationships.linkParent(),
    {
      childMemberCode,
      parentMemberCode,
      relationshipType,
    },
    { headers: { "X-Created-By": createdBy } }
  );
  return unwrap<RelationshipResponse>(res);
}

// ── Link a spouse ─────────────────────────────────────────────────────────────

export async function linkSpouse(
  person1MemberCode: string,
  person2MemberCode: string,
  startDate: string | undefined,
  createdBy: string
): Promise<RelationshipResponse[]> {
  const res = await api.post(
    ENDPOINTS.relationships.linkSpouse(),
    {
      person1MemberCode,
      person2MemberCode,
      ...(startDate ? { startDate } : {}),
    },
    { headers: { "X-Created-By": createdBy } }
  );
  return unwrap<RelationshipResponse[]>(res);
}

// ── Remove / deactivate a relationship ───────────────────────────────────────

export async function deactivateRelationship(
  relationshipId: number,
  updatedBy: string
): Promise<void> {
  await api.patch(
    ENDPOINTS.relationships.deactivate(relationshipId),
    null,
    { headers: { "X-Created-By": updatedBy } }
  );
}
