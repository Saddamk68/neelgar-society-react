import { MemberFormValues } from "./member.schema";

/* ===========================================================
   🔁 Mapper: Frontend (React Form) → Backend (Java DTO)
   =========================================================== */
export function toBackendPayload(values: MemberFormValues) {
  return {
    id: values.id ?? undefined,
    name: values.name,
    role: values.role ?? "MEMBER",
    fatherName: values.fatherName,
    motherName: values.motherName,
    motherGotra: values.motherGotra,
    dob: values.dob || null,
    education: values.education,
    occupation: values.occupation,
    gotra: values.gotra,
    contactNumber: values.contactNumber,
    photoId: values.photoId ?? null,
    maritalStatus: values.maritalStatus,
    gender: values.gender,
    isActive: values.isActive ?? true,

    // 🏠 Address
    address: values.address
      ? {
          id: values.address.id ?? undefined,
          memberId: values.address.memberId ?? undefined,
          currentState: values.address.currentState ?? "",
          currentDistrict: values.address.currentDistrict ?? "",
          currentTahsil: values.address.currentTahsil ?? "",
          currentVillage: values.address.currentVillage ?? "",
          paternalState: values.address.paternalState ?? "",
          paternalDistrict: values.address.paternalDistrict ?? "",
          paternalTahsil: values.address.paternalTahsil ?? "",
          paternalVillage: values.address.paternalVillage ?? "",
        }
      : null,

    // 💍 Spouse
    spouse:
      values.maritalStatus === "MARRIED" && values.spouse
        ? {
            id: values.spouse.id ?? undefined,
            memberId: values.spouse.memberId ?? undefined,
            name: values.spouse.name ?? "",
            dob: values.spouse.dob || null,
            gotra: values.spouse.gotra ?? "",
            education: values.spouse.education ?? "",
            occupation: values.spouse.occupation ?? "",
            photoId: values.spouse.photoId ?? null,
          }
        : null,

    // 👶 Children
    children:
      values.children?.map((c) => ({
        id: c.id ?? undefined,
        memberId: c.memberId ?? undefined,
        name: c.name ?? "",
        dob: c.dob || null,
        education: c.education ?? "",
        occupation: c.occupation ?? "",
        photoId: c.photoId ?? null,
      })) ?? [],
  };
}

/* ===========================================================
   🔁 Mapper: Backend (Java DTO) → Frontend (React Form)
   =========================================================== */
export function fromBackendResponse(member: any): MemberFormValues {
  if (!member) throw new Error("Invalid backend member response");

  return {
    id: member.id ?? undefined,
    name: member.name ?? "",
    role: member.role ?? "MEMBER",
    fatherName: member.fatherName ?? "",
    motherName: member.motherName ?? "",
    motherGotra: member.motherGotra ?? "",
    dob: member.dob ?? "",
    education: member.education ?? "",
    occupation: member.occupation ?? "",
    gotra: member.gotra ?? "",
    contactNumber: member.contactNumber ?? "",
    photoId: member.photoId ?? null,
    maritalStatus: member.maritalStatus ?? "SINGLE",
    gender: member.gender ?? "MALE",
    isActive: member.isActive ?? true,

    // 🏠 Address
    address: member.address
      ? {
          id: member.address.id ?? undefined,
          memberId: member.address.memberId ?? undefined,
          currentState: member.address.currentState ?? "",
          currentDistrict: member.address.currentDistrict ?? "",
          currentTahsil: member.address.currentTahsil ?? "",
          currentVillage: member.address.currentVillage ?? "",
          paternalState: member.address.paternalState ?? "",
          paternalDistrict: member.address.paternalDistrict ?? "",
          paternalTahsil: member.address.paternalTahsil ?? "",
          paternalVillage: member.address.paternalVillage ?? "",
        }
      : undefined,

    // 💍 Spouse
    spouse: member.spouse
      ? {
          id: member.spouse.id ?? undefined,
          memberId: member.spouse.memberId ?? undefined,
          name: member.spouse.name ?? "",
          dob: member.spouse.dob ?? "",
          gotra: member.spouse.gotra ?? "",
          education: member.spouse.education ?? "",
          occupation: member.spouse.occupation ?? "",
          photoId: member.spouse.photoId ?? null,
        }
      : undefined,

    // 👶 Children
    children:
      member.children?.map((c: any) => ({
        id: c.id ?? undefined,
        memberId: c.memberId ?? undefined,
        name: c.name ?? "",
        dob: c.dob ?? "",
        education: c.education ?? "",
        occupation: c.occupation ?? "",
        photoId: c.photoId ?? null,
      })) ?? [],
  };
}
