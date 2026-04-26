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
  isActive: boolean;
  hasPhoto?: boolean;
  createdAt?: string;
  createdBy?: string;
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
