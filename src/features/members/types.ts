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
  dod?: string;
  contactNumber?: string;
  education?: string;
  occupation?: string;
  residenceName?: string;
  maritalStatus?: "SINGLE" | "MARRIED" | "DIVORCED" | "WIDOWED";
  currentAddress?: AddressData;
  parentalAddress?: AddressData;
  gotraId?: number;
  gotraName?: string;
  isHead?: boolean;
  isActive: boolean;
  hasPhoto?: boolean;
  hasUser?: boolean;  
  createdAt?: string;
  createdBy?: string;
};

export type AddressData = {
  geoUnitId: number;
  geoUnitName?: string;
  districtName?: string;
  stateName?: string;
};

// Matches FamilyResponse from the REST API
export type Family = {
  id: number;
  familyCode: string;
  societyId: number;
  societyCode: string;
  societyName: string;
  headPersonId?: number;
  headPersonCode?: string;
  headPersonName?: string;
  headPersonContact?: string;
  village?: string;
  geoUnitId?: number;
  geoUnitName?: string;
  districtName?: string;
  stateName?: string;
  clanCode?: string;
  clanName?: string;
  memberCount?: number;
  isActive: boolean;
  createdAt?: string;
  createdBy?: string;
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

export type MarriageEndReason =
  | "DEATH_OF_SPOUSE"
  | "DIVORCE"
  | "KHULA"
  | "SEPARATED"
  | "COURT_DISPUTE"
  | "OTHER";

export type SpouseDetail = {
  person: Member;
  startDate?: string;
  endDate?: string;
  endReason?: MarriageEndReason;
  isCurrent: boolean;
  relationshipId?: number;
};

// GET /relationships/person/{memberCode} response
export type PersonRelationshipsResponse = {
  memberCode: string;
  personName: string;
  father?: Member;
  mother?: Member;
  spouses?: SpouseDetail[];
  children?: Member[];
  siblings?: Member[];
};
