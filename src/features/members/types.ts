// Matches PersonResponse from the REST API
export type Member = {
  id: number;
  memberCode: string;
  familyId: number;
  familyCode: string;
  societyId: number;
  societyCode: string;
  societyName?: string;
  firstName: string;
  lastName?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  dob?: string;
  contactNumber?: string;
  education?: string;
  occupation?: string;
  maritalStatus?: "SINGLE" | "MARRIED" | "DIVORCED" | "WIDOWED";
  isActive: boolean;
  hasPhoto?: boolean;
  createdAt?: string;
  createdBy?: string;
  // Address fields — populated once backend includes them in PersonResponse
  currentAddress?: AddressData;
  parentalAddress?: AddressData;
};

export type AddressData = {
  village: string;
  tahsil?: string;
  district?: string;
  state?: string;
  country?: string;
};

// Matches FamilyResponse from the REST API
export type Family = {
  id: number;
  familyCode: string;
  societyId: number;
  societyCode: string;
  societyName: string;
  headPersonId?: number;
  headPersonName?: string;
  village?: string;
  isActive: boolean;
  createdAt?: string;
};

// What the duplicate check endpoint returns
export type DuplicateCandidate = {
  id: number;
  memberCode: string;
  firstName: string;
  lastName?: string;
  dob?: string;
  familyCode: string;
  societyCode: string;
};

// Relationship types — matches backend enums
export type RelationshipType = "FATHER" | "MOTHER" | "SPOUSE";

export type RelationshipResponse = {
  id: number;
  person1Id: number;
  person1MemberCode: string;
  person1Name: string;
  person2Id: number;
  person2MemberCode: string;
  person2Name: string;
  relationshipType: RelationshipType;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  warning?: string;
};

// GET /relationships/person/{memberCode} response
export type PersonRelationshipsResponse = {
  memberCode: string;
  personName: string;
  father?: Member;
  mother?: Member;
  spouse?: Member;
  children?: Member[];
  siblings?: Member[];
};
