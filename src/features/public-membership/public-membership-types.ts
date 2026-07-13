export type ApplicationStatus =
    | "PENDING"
    | "UNDER_REVIEW"
    | "NEEDS_INFO"
    | "APPROVED"
    | "REJECTED"
    | "WITHDRAWN";

export interface MemberApplicationSubmitPayload {
    firstName: string;
    lastName: string;
    gender: "MALE" | "FEMALE" | "OTHER";
    dob: string; // yyyy-MM-dd
    maritalStatus: "SINGLE" | "MARRIED" | "DIVORCED" | "WIDOWED";
    gotraId: number;
    contactNumber?: string;
    email: string;
    geoUnitId: number;
    claimedFamilyCode?: string;
    relationshipClaim?: string;
    otpVerificationToken: string;
}

export interface MemberApplicationStatusResponse {
    referenceCode: string;
    status: ApplicationStatus;
    emailVerified: boolean;
    mobileVerified: boolean;
    reviewNotes?: string;
    rejectionReason?: string;
    approvedMemberCode?: string;
}

export interface MemberApplicationEditableDetails {
  referenceCode: string;
  firstName: string;
  lastName: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  dob: string;
  maritalStatus: "SINGLE" | "MARRIED" | "DIVORCED" | "WIDOWED";
  gotraId: number;
  contactNumber?: string;
  geoUnitId: number;
  claimedFamilyCode?: string;
  relationshipClaim?: string;
  reviewNotes?: string;
}

export interface MemberApplicationResubmitPayload {
  firstName: string;
  lastName: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  dob: string;
  maritalStatus: "SINGLE" | "MARRIED" | "DIVORCED" | "WIDOWED";
  gotraId: number;
  contactNumber?: string;
  geoUnitId: number;
  claimedFamilyCode?: string;
  relationshipClaim?: string;
  otpVerificationToken: string;
}
