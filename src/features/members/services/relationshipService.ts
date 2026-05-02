import { api } from "../../../services/apiClient";
import { ENDPOINTS } from "../../../config/endpoints";
import { PersonRelationshipsResponse, RelationshipResponse } from "../types";
import { createMember } from "./memberService";

function unwrap<T>(res: any): T {
  return res.data?.data ?? res.data;
}

// ── Get all relationships for a person ────────────────────────────────────────

export async function getPersonRelationships(
  memberCode: string
): Promise<PersonRelationshipsResponse> {
  const res = await api.get(ENDPOINTS.relationships.forPerson(memberCode));
  return unwrap<PersonRelationshipsResponse>(res);
}

// ── Link a parent (existing member) ──────────────────────────────────────────
// FIX: backend field is "type", not "relationshipType"

export async function linkParent(
  childMemberCode: string,
  parentMemberCode: string,
  type: "FATHER" | "MOTHER",
  createdBy: string
): Promise<RelationshipResponse> {
  const res = await api.post(
    ENDPOINTS.relationships.linkParent(),
    {
      childMemberCode,
      parentMemberCode,
      type,           // ← was "relationshipType" — backend expects "type"
    },
    { headers: { "X-Created-By": createdBy } }
  );
  return unwrap<RelationshipResponse>(res);
}

// ── Link a spouse (existing member) ──────────────────────────────────────────

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

// ── Create a new member then immediately link as parent ───────────────────────

export async function createAndLinkParent(
  childMemberCode: string,
  newPersonData: {
    firstName: string;
    lastName?: string;
    gender?: "MALE" | "FEMALE" | "OTHER";
    dob?: string;
    societyId: number;
    familyId: number;
    village: string;
  },
  type: "FATHER" | "MOTHER",
  createdBy: string
): Promise<RelationshipResponse> {
  // Step 1: create the new member
  const created = await createMember(
    {
      societyId: newPersonData.societyId,
      familyId: newPersonData.familyId,
      firstName: newPersonData.firstName,
      lastName: newPersonData.lastName ?? "",
      gender: newPersonData.gender,
      dob: newPersonData.dob ?? "",
      contactNumber: "",
      education: "",
      occupation: "",
      maritalStatus: "MARRIED",
      currentAddress: {
        village: newPersonData.village,
        tahsil: "",
        district: "",
        state: "",
        country: "",
      },
      createAccount: false,
      email: "",
    },
    createdBy
  );

  // Step 2: link as parent
  return linkParent(childMemberCode, created.memberCode, type, createdBy);
}

// ── Create a new member then immediately link as spouse ───────────────────────

export async function createAndLinkSpouse(
  personMemberCode: string,
  newPersonData: {
    firstName: string;
    lastName?: string;
    gender?: "MALE" | "FEMALE" | "OTHER";
    dob?: string;
    societyId: number;
    familyId: number;
    village: string;
  },
  startDate: string | undefined,
  createdBy: string
): Promise<RelationshipResponse[]> {
  // Step 1: create the new member
  const created = await createMember(
    {
      societyId: newPersonData.societyId,
      familyId: newPersonData.familyId,
      firstName: newPersonData.firstName,
      lastName: newPersonData.lastName ?? "",
      gender: newPersonData.gender,
      dob: newPersonData.dob ?? "",
      contactNumber: "",
      education: "",
      occupation: "",
      maritalStatus: "MARRIED",
      currentAddress: {
        village: newPersonData.village,
        tahsil: "",
        district: "",
        state: "",
        country: "",
      },
      createAccount: false,
      email: "",
    },
    createdBy
  );

  // Step 2: link as spouse
  return linkSpouse(personMemberCode, created.memberCode, startDate, createdBy);
}

// ── Create a new member then link as child ────────────────────────────────────
// parentType = FATHER or MOTHER — tells the system which parent role this person plays

export async function createAndLinkChild(
  parentMemberCode: string,
  newPersonData: {
    firstName: string;
    lastName?: string;
    gender?: "MALE" | "FEMALE" | "OTHER";
    dob?: string;
    societyId: number;
    familyId: number;
    village: string;
  },
  parentType: "FATHER" | "MOTHER",
  createdBy: string
): Promise<RelationshipResponse> {
  // Step 1: create the new member (the child)
  const created = await createMember(
    {
      societyId: newPersonData.societyId,
      familyId: newPersonData.familyId,
      firstName: newPersonData.firstName,
      lastName: newPersonData.lastName ?? "",
      gender: newPersonData.gender,
      dob: newPersonData.dob ?? "",
      contactNumber: "",
      education: "",
      occupation: "",
      maritalStatus: "SINGLE",
      currentAddress: {
        village: newPersonData.village,
        tahsil: "",
        district: "",
        state: "",
        country: "",
      },
      createAccount: false,
      email: "",
    },
    createdBy
  );

  // Step 2: link — child's parent is this person
  return linkParent(created.memberCode, parentMemberCode, parentType, createdBy);
}

// ── Deactivate a relationship ─────────────────────────────────────────────────

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
