import { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Pencil, ArrowLeft } from "lucide-react";
import { MemberFormValues } from "@/features/members/member.schema";
import { getMember } from "../../../features/members/services/memberService";
import { useNotify } from "../../../services/notifications";
import { PRIVATE } from "../../../constants/messages";
import { ROUTES } from "../../../constants/routes";

function Row({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex gap-2">
      <div className="w-36 text-text-muted text-sm">{label}</div>
      <div className="flex-1 font-medium">{value ?? "-"}</div>
    </div>
  );
}

export default function ViewMember() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const notify = useNotify();

  const {
    data: member,
    isLoading,
    isError,
    refetch,
  } = useQuery<MemberFormValues>({
    queryKey: ["member", id],
    queryFn: () => {
      if (!id) throw new Error("Missing member id");
      return getMember(id);
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  });

  useEffect(() => {
    if (isError) {
      notify.error("Failed to load member details.");
    }
  }, [isError, notify]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">{PRIVATE.MEMBERS_TITLE}</h1>
          <p className="text-text-muted">Member details</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-3 py-2 rounded-md border hover:bg-gray-50"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {member && (
            <Link
              to={`${ROUTES.PRIVATE.MEMBERS}/${member.id}/edit`}
              className="flex items-center gap-2 px-3 py-2 rounded-md bg-primary text-white hover:opacity-95"
              aria-label="Edit member"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </Link>
          )}
        </div>
      </div>

      {/* Loading / Error */}
      {isLoading && (
        <div className="bg-white rounded-xl shadow p-4">
          <div className="text-sm text-text-muted">Loading member…</div>
        </div>
      )}
      {isError && (
        <div className="bg-white rounded-xl shadow p-4">
          <div className="text-sm text-danger">Failed to load member. <button onClick={() => refetch()} className="underline">Retry</button></div>
        </div>
      )}

      {/* Details */}
      {!isLoading && !isError && member && (
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex gap-6 items-start">
            {/* Photo */}
            <div className="w-36 flex-shrink-0">
              <div className="w-36 h-36 bg-gray-100 rounded-md overflow-hidden border">
                {member.photoPath ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={member.photoPath} alt={`${member.name} photo`} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">No photo</div>
                )}
              </div>
            </div>

            {/* Main info */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-lg font-semibold">{member.name}</div>
                  <div className="text-text-muted text-sm">ID: {member.id}</div>
                </div>

                <div className="text-right text-sm text-text-muted">
                  <div>{member.gotra ?? "-"}</div>
                  <div>{member.role ?? ""}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                <Row label="Father" value={member.fatherName} />
                <Row label="Mother" value={member.motherName} />
                <Row label="Gender" value={member.gender ?? "-"} />
                <Row label="Marital Status" value={member.maritalStatus ?? "-"} />
                <Row label="DOB" value={member.dob ?? "-"} />
                <Row label="Education" value={member.education} />
                <Row label="Occupation" value={member.occupation} />
                <Row label="Gotra" value={member.gotra} />
                <Row label="Phone" value={member.contactNumber ?? member.contactNumber ?? "-"} />
                <Row label="Email" value={member.email ?? "-"} />
                <Row label="Aadhaar" value={member.aadhaar ?? "-"} />
                <Row label="PAN" value={member.pan ?? "-"} />
              </div>
            </div>
          </div>

          {/* Addresses */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-semibold mb-2">Current Address</h3>
              <div className="text-sm text-text-muted space-y-1">
                <div>{member.currentVillage ?? "-"}, {member.currentTahsil ?? ""}</div>
                <div>{member.currentDistrict ?? ""}</div>
                <div>{member.currentState ?? ""}</div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2">Paternal Address</h3>
              <div className="text-sm text-text-muted space-y-1">
                <div>{member.paternalVillage ?? "-"}, {member.paternalTahsil ?? ""}</div>
                <div>{member.paternalDistrict ?? ""}</div>
                <div>{member.paternalState ?? ""}</div>
              </div>
            </div>
          </div>

          {/* Spouse */}
          {member.maritalStatus === "MARRIED" && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold mb-2">Spouse</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="text-sm"><span className="text-text-muted">Name: </span>{member.spouseName ?? "-"}</div>
                <div className="text-sm"><span className="text-text-muted">DOB: </span>{member.spouseDob ?? "-"}</div>
                <div className="text-sm"><span className="text-text-muted">Gotra: </span>{member.spouseGotra ?? "-"}</div>
              </div>
            </div>
          )}

          {/* Children */}
          {member.children && member.children.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold mb-2">Children</h3>
              <div className="space-y-2">
                {member.children.map((c, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="text-sm font-medium">{c.name}</div>
                    <div className="text-sm text-text-muted">{c.dob ?? ""}</div>
                    <div className="text-sm text-text-muted">{c.education ?? ""}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer actions */}
          <div className="mt-6 flex items-center justify-end gap-2">
            <button onClick={() => navigate(-1)} className="px-3 py-2 rounded border hover:bg-gray-50">
              Close
            </button>
            <Link to={`${ROUTES.PRIVATE.MEMBERS}/${member.id}/edit`} className="px-3 py-2 rounded bg-primary text-white">
              Edit
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
