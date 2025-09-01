import { MemberFormValues } from "./member.schema";

// ---------- Mapper: Frontend → Backend ----------
export function toBackendPayload(values: MemberFormValues) {
  return {
    id: values.id ?? undefined, // only for update
    name: values.name,
    fatherName: values.fatherName,
    motherName: values.motherName,
    motherGotra: values.motherGotra,
    dob: values.dob || null,
    education: values.education,
    occupation: values.occupation,
    gotra: values.gotra,
    contactNumber: values.contactNumber,
    photoPath: values.photoPath,
    maritalStatus: values.maritalStatus,
    // Keep active / gender / aadhaar / pan for now
    gender: values.gender,
    isActive: values.active,
    aadhaar: values.aadhaar,
    pan: values.pan,

    // ---------- Nested objects ----------
    address: {
      currentState: values.currentState,
      currentDistrict: values.currentDistrict,
      currentTahsil: values.currentTahsil,
      currentVillage: values.currentVillage,
      paternalState: values.paternalState,
      paternalDistrict: values.paternalDistrict,
      paternalTahsil: values.paternalTahsil,
      paternalVillage: values.paternalVillage,
    },

    spouse:
      values.maritalStatus === "MARRIED"
        ? {
            name: values.spouseName,
            dob: values.spouseDob || null,
            education: values.spouseEducation,
            occupation: values.spouseOccupation,
            gotra: values.spouseGotra,
            photoPath: values.spousePhotoPath,
          }
        : null,

    children:
      values.children?.map((c) => ({
        name: c.name,
        dob: c.dob || null,
        education: c.education,
        occupation: c.occupation,
        photoPath: c.photoPath,
      })) ?? [],
  };
}

// ---------- Mapper: Backend → Frontend ----------
export function fromBackendResponse(member: any): MemberFormValues {
  return {
    id: member.id ?? "",
    name: member.name ?? "",
    fatherName: member.fatherName ?? "",
    motherName: member.motherName ?? "",
    motherGotra: member.motherGotra ?? "",
    dob: member.dob ?? "",
    gender: member.gender ?? "MALE",
    maritalStatus: member.maritalStatus ?? "SINGLE",
    education: member.education ?? "",
    occupation: member.occupation ?? "",
    gotra: member.gotra ?? "",
    photoPath: member.photoPath ?? "",

    contactNumber: member.contactNumber ?? "",
    email: member.email ?? "",
    active: member.isActive ?? true,
    aadhaar: member.aadhaar ?? "",
    pan: member.pan ?? "",

    // Address
    currentState: member.address?.currentState ?? "",
    currentDistrict: member.address?.currentDistrict ?? "",
    currentTahsil: member.address?.currentTahsil ?? "",
    currentVillage: member.address?.currentVillage ?? "",
    paternalState: member.address?.paternalState ?? "",
    paternalDistrict: member.address?.paternalDistrict ?? "",
    paternalTahsil: member.address?.paternalTahsil ?? "",
    paternalVillage: member.address?.paternalVillage ?? "",

    // Spouse
    spouseName: member.spouse?.name ?? "",
    spouseDob: member.spouse?.dob ?? "",
    spouseEducation: member.spouse?.education ?? "",
    spouseOccupation: member.spouse?.occupation ?? "",
    spouseGotra: member.spouse?.gotra ?? "",
    spousePhotoPath: member.spouse?.photoPath ?? "",

    // Children
    children:
      member.children?.map((c: any) => ({
        name: c.name ?? "",
        dob: c.dob ?? "",
        education: c.education ?? "",
        occupation: c.occupation ?? "",
        photoPath: c.photoPath ?? "",
      })) ?? [],
  };
}
