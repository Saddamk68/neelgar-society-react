/**
 * EditMember.tsx  — Fixes in this version:
 *
 *  1. Address fields now populate correctly from the API response.
 *     NOTE: This requires the backend to include currentAddress / parentalAddress
 *     in the PersonResponse (see backend note at the bottom of this file).
 *     Until the backend is updated, the address fields will load as empty —
 *     the save bug (issue 2) is also fixed so changes WILL be saved.
 *
 *  2. Save now works — root cause was currentAddress.village being required
 *     by Zod but arriving as empty when address isn't in the API response,
 *     causing silent validation failure. Fixed with a safe fallback and by
 *     ensuring the submit error is surfaced.
 *
 *  3. Family relationships section added (spouse, father, mother, children)
 *     using the existing /relationships API.
 *
 *  4. Marital status field added in Personal Information.
 *
 *  5. Custom DatePicker component replaces <input type="date">.
 *
 * ── BACKEND NOTE ─────────────────────────────────────────────────────────────
 *  To fix address pre-fill, add currentAddress and parentalAddress to
 *  PersonResponse.java and map them in PersonMapper.java.
 *
 *  In PersonResponse.java, add:
 *    private AddressEmbeddedResponse currentAddress;
 *    private AddressEmbeddedResponse parentalAddress;
 *
 *  In PersonMapper.java, add mapping expressions to pull the correct
 *  AddressType.CURRENT and AddressType.PARENTAL from person.getAddresses().
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useRef, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  UserPlus,
  X,
  Search,
} from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import FormFooter from "@/components/layout/FormFooter";
import DangerZone from "@/components/layout/DangerZone";
import EditMemberSkeleton from "@/components/skeletons/EditMemberSkeleton";

import {
  memberSchema,
  MemberFormValues,
} from "../../../features/members/member.schema";
import {
  getMember,
  updateMember,
  searchMembers,
  deactivateMember,
} from "../../../features/members/services/memberService";
import {
  getPersonRelationships,
  linkParent,
  linkSpouse,
  deactivateRelationship,
  createAndLinkParent,
  createAndLinkSpouse,
  createAndLinkChild,
  endRelationship,
} from "@/features/members/services/relationshipService";
import { Family, Member, PersonRelationshipsResponse } from "../../../features/members/types";
import { useAuth } from "../../../context/AuthContext";
import { useNotify } from "../../../services/notifications";
import { ROUTES } from "../../../constants/routes";
import FieldLabel from "../../../components/form/FieldLabel";
import {
  deleteMemberPhoto,
  uploadMemberPhoto,
} from "@/features/members/services/photoService";
import MemberAvatar from "@/components/MemberAvatar";
import { useQueryClient } from "@tanstack/react-query";
import DatePicker from "../../../components/form/DatePicker";
import GotraSelect from "@/features/gotras/components/GotraSelect";
import ConfirmDialog from "@/components/ConfirmDialog";
import DeactivateHeadDialog from "@/components/DeactivateHeadDialog";
import GeoUnitCascadeSelect, { GeoSelection } from "@/features/geo-units/components/GeoUnitCascadeSelect";
import { getAncestors } from "@/features/geo-units/services/geoUnitService";


function inputClass(hasError?: boolean) {
  return [
    "w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 transition",
    hasError
      ? "border-red-400 ring-1 ring-red-400 focus:ring-red-400"
      : "border-slate-300 focus:ring-primary/40",
  ].join(" ");
}

function AddressFields({
  prefix,
  watch,
  setValue,
  errors,
}: {
  prefix: "currentAddress" | "parentalAddress";
  watch: any;
  setValue: any;
  errors: any;
}) {
  const formGeoUnitId = watch(`${prefix}.geoUnitId`);
  const [geo, setGeo] = useState<GeoSelection>({});
  const [resolvedFor, setResolvedFor] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (formGeoUnitId && formGeoUnitId !== resolvedFor) {
      getAncestors(formGeoUnitId)
        .then((anc) => {
          setGeo(anc);
          setResolvedFor(formGeoUnitId);
        })
        .catch(() => {});
    }
  }, [formGeoUnitId]);

  function handleGeoChange(next: GeoSelection) {
    setGeo(next);
    setValue(`${prefix}.geoUnitId`, next.villageTownId, { shouldValidate: true, shouldDirty: true });
  }

  const err = errors?.[prefix]?.geoUnitId?.message;

  return (
    <div>
      <FieldLabel required={prefix === "currentAddress"}>State / District / Village-Town</FieldLabel>
      <GeoUnitCascadeSelect value={geo} onChange={handleGeoChange} />
      {err && <p className="text-xs text-red-500 mt-1">{err}</p>}
    </div>
  );
}

// ── Member search mini-dialog ─────────────────────────────────────────────────

function MemberSearchDialog({
  title,
  onSelect,
  onClose,
  excludeMemberCode,
}: {
  title: string;
  onSelect: (m: Member) => void;
  onClose: () => void;
  excludeMemberCode?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Member[]>([]);
  const [searching, setSearching] = useState(false);

  async function doSearch() {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await searchMembers(query.trim());
      setResults(res.filter((m) => m.memberCode !== excludeMemberCode));
    } catch {
      // ignore
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="Search by name or member code…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doSearch()}
            autoFocus
          />
          <button
            type="button"
            onClick={doSearch}
            disabled={searching}
            className="px-3 py-2 rounded-md bg-primary text-white text-sm hover:bg-primary/90 disabled:opacity-60 transition flex items-center gap-1"
          >
            <Search className="w-4 h-4" />
            {searching ? "…" : "Search"}
          </button>
        </div>

        <div className="space-y-1 max-h-60 overflow-y-auto">
          {results.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-4">
              {query ? "No results found." : "Type a name to search."}
            </p>
          )}
          {results.map((m) => (
            <button
              key={m.memberCode}
              type="button"
              onClick={() => onSelect(m)}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 transition flex items-center justify-between"
            >
              <span className="text-sm font-medium text-slate-700">
                {m.firstName} {m.lastName ?? ""}
              </span>
              <span className="text-xs text-slate-400">{m.memberCode}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Mini form for creating a new person inline ────────────────────────────────

function CreatePersonForm({
  title,
  defaultGeoUnitId,
  societyId,
  showFamilyOption,
  onSubmit,
  onClose,
  loading,
}: {
  title: string;
  defaultGeoUnitId?: number;
  societyId: number;
  showFamilyOption?: boolean;
  onSubmit: (data: {
    firstName: string;
    lastName: string;
    gender: "MALE" | "FEMALE" | "OTHER" | "";
    dob: string;
    gotraId: number;
    geoUnitId: number;
    familyMode: "current" | "new" | "existing";
    existingFamilyId?: number;
  }) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "OTHER" | "">("");
  const [dob, setDob] = useState("");
  const [gotra, setGotra] = useState("");
  const [geo, setGeo] = useState<GeoSelection>({});
  const [firstNameError, setFirstNameError] = useState("");
  const [gotraError, setGotraError] = useState("");
  const [villageError, setVillageError] = useState("");

  const [familyMode, setFamilyMode] = useState<"current" | "new" | "existing">("current");
  const [familySearch, setFamilySearch] = useState("");
  const [familyResults, setFamilyResults] = useState<Family[]>([]);
  const [selectedExistingFamily, setSelectedExistingFamily] = useState<Family | null>(null);
  const [familySearching, setFamilySearching] = useState(false);

  useEffect(() => {
    if (defaultGeoUnitId) {
      getAncestors(defaultGeoUnitId).then(setGeo).catch(() => {});
    }
  }, [defaultGeoUnitId]);

  function handleSubmit() {
    let valid = true;
    if (!firstName.trim()) {
      setFirstNameError("First name is required");
      valid = false;
    } else {
      setFirstNameError("");
    }
    if (!gotra.trim()) {
      setGotraError("Gotra is required");
      valid = false;
    } else {
      setGotraError("");
    }
    if (!geo.villageTownId) {
      setVillageError("Village/Town is required");
      valid = false;
    } else {
      setVillageError("");
    }
    if (!valid) return;
    onSubmit({
      firstName, lastName, gender, dob, gotraId: Number(gotra), geoUnitId: geo.villageTownId!,
      familyMode,
      existingFamilyId: familyMode === "existing" ? selectedExistingFamily?.id : undefined,
    });
  }

  const fieldCls = (err?: string) =>
    [
      "w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 transition",
      err ? "border-red-400 ring-1 ring-red-400" : "border-slate-300 focus:ring-primary/40",
    ].join(" ");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">{title}</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <FieldLabel required>First Name</FieldLabel>
            <input
              className={fieldCls(firstNameError)}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoFocus
            />
            {firstNameError && <p className="text-xs text-red-500 mt-1">{firstNameError}</p>}
          </div>

          <div>
            <FieldLabel>Last Name</FieldLabel>
            <input
              className={fieldCls()}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

          <div>
            <FieldLabel>Gender</FieldLabel>
            <select
              className={fieldCls()}
              value={gender}
              onChange={(e) => setGender(e.target.value as any)}
            >
              <option value="">Select</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <FieldLabel>Date of Birth</FieldLabel>
            <DatePicker
              value={dob}
              onChange={(val) => setDob(val)}
              maxDate={new Date()}
            />
          </div>

          <div>
            <FieldLabel required>Gotra</FieldLabel>
            <GotraSelect
              societyId={societyId}
              value={gotra ? Number(gotra) : undefined}
              onChange={(id) => {
                if (id) {
                  setGotra(String(id));
                } else {
                  setGotra("");
                }
                setGotraError("");
              }}
              hasError={!!gotraError}
            />
            {gotraError && (
              <p className="text-xs text-red-500 mt-1">{gotraError}</p>
            )}
          </div>

          <div>
            <FieldLabel required>State / District / Village-Town (for address)</FieldLabel>
            <GeoUnitCascadeSelect value={geo} onChange={setGeo} />
            {villageError && <p className="text-xs text-red-500 mt-1">{villageError}</p>}
            <p className="text-xs text-slate-400 mt-1">
              You can update the full address later from the member's Edit screen.
            </p>
          </div>
        </div>

        {showFamilyOption && (
          <div>
            <FieldLabel>Family</FieldLabel>
            <div className="space-y-2">
              {(["current", "new", "existing"] as const).map((mode) => (
                <label key={mode} className={[
                  "flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer text-sm transition",
                  familyMode === mode ? "border-primary bg-primary/5" : "border-slate-200 hover:border-slate-300",
                ].join(" ")}>
                  <input type="radio" name="familyMode" value={mode}
                    checked={familyMode === mode}
                    onChange={() => { setFamilyMode(mode); setSelectedExistingFamily(null); setFamilySearch(""); }}
                    className="mt-0.5 accent-primary" />
                  <div>
                    <div className="font-medium text-slate-700">
                      {mode === "current" ? "Join current family" : mode === "new" ? "Create new family" : "Pick existing family"}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {mode === "current"
                        ? "Spouse will be added to the same family as this member"
                        : mode === "new"
                          ? "A new family will be created with spouse as head"
                          : "Search and select an existing family"}
                    </div>
                  </div>
                </label>
              ))}
            </div>

            {familyMode === "existing" && (
              <div className="mt-2">
                {selectedExistingFamily ? (
                  <div className="flex items-center justify-between text-sm bg-primary/5 border border-primary/20 rounded px-3 py-2">
                    <span className="font-mono font-medium text-slate-700">{selectedExistingFamily.familyCode}</span>
                    <button type="button" onClick={() => setSelectedExistingFamily(null)}
                      className="text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <input
                      className={fieldCls()}
                      placeholder="Search by village or head name…"
                      value={familySearch}
                      onChange={async (e) => {
                        setFamilySearch(e.target.value);
                        if (e.target.value.trim().length < 2) { setFamilyResults([]); return; }
                        setFamilySearching(true);
                        try {
                          const { searchFamilies } = await import("../../../features/members/services/familyService");
                          const results = await searchFamilies(societyId, e.target.value.trim());
                          setFamilyResults(results);
                        } catch { } finally { setFamilySearching(false); }
                      }}
                    />
                    {familySearching && <p className="text-xs text-slate-400">Searching…</p>}
                    {familyResults.length > 0 && (
                      <div className="border border-slate-200 rounded-md overflow-hidden">
                        {familyResults.slice(0, 5).map(f => (
                          <button key={f.familyCode} type="button"
                            onClick={() => { setSelectedExistingFamily(f); setFamilyResults([]); }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 border-b border-slate-100 last:border-0">
                            <span className="font-mono font-medium">{f.familyCode}</span>
                            {f.headPersonName && <span className="text-slate-500 ml-2">{f.headPersonName}</span>}
                            {f.village && <span className="text-slate-400 ml-2 text-xs">· {f.village}</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 mt-5">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-2 rounded-md bg-primary text-white text-sm hover:bg-primary/90 disabled:opacity-60 transition"
          >
            {loading ? "Creating…" : "Create & Link"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-md border border-slate-300 text-sm hover:bg-slate-50 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Family Relationships section ──────────────────────────────────────────────

function FamilyRelationshipsSection({
  memberCode,
  memberId,
  currentMember,
  currentUsername,
  notify,
}: {
  memberCode: string;
  memberId: number;
  currentMember: Member | null;
  currentUsername: string;
  notify: ReturnType<typeof useNotify>;
}) {
  const [relationships, setRelationships] =
    useState<PersonRelationshipsResponse | null>(null);
  const [loadingRel, setLoadingRel] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // dialog = which role we are filling, mode = "search" or "create"
  const [dialog, setDialog] = useState<{
    role: "spouse" | "father" | "mother" | "child";
    mode: "search" | "create";
  } | null>(null);

  const [endMarriageDialog, setEndMarriageDialog] = useState<{
    relationshipId: number;
    spouseName: string;
  } | null>(null);
  const [endDate, setEndDate] = useState("");
  const [endReason, setEndReason] = useState("");
  const [endingMarriage, setEndingMarriage] = useState(false);

  async function reload() {
    const updated = await getPersonRelationships(memberCode);
    setRelationships(updated);
  }

  useEffect(() => {
    setLoadingRel(true);
    getPersonRelationships(memberCode)
      .then(setRelationships)
      .catch(() =>
        setRelationships({ memberCode, personName: "", children: [] })
      )
      .finally(() => setLoadingRel(false));
  }, [memberCode]);

  // ── Link existing member ──────────────────────────────────────────────────

  async function handleLinkExisting(m: Member) {
    if (!dialog) return;
    setActionLoading(true);
    try {
      if (dialog.role === "spouse") {
        await linkSpouse(memberCode, m.memberCode, undefined, currentUsername);
        notify.success("Spouse linked successfully.");
      } else if (dialog.role === "father") {
        await linkParent(memberCode, m.memberCode, "FATHER", currentUsername);
        notify.success("Father linked successfully.");
      } else if (dialog.role === "mother") {
        await linkParent(memberCode, m.memberCode, "MOTHER", currentUsername);
        notify.success("Mother linked successfully.");
      } else if (dialog.role === "child") {
        // For child: the current member is the parent, linked person is the child.
        // We need to know if this member is FATHER or MOTHER.
        const parentType =
          currentMember?.gender === "FEMALE" ? "MOTHER" : "FATHER";
        await linkParent(m.memberCode, memberCode, parentType, currentUsername);
        notify.success("Child linked successfully.");
      }
      await reload();
    } catch (err: any) {
      notify.error(err.message || "Failed to link relationship.");
    } finally {
      setActionLoading(false);
      setDialog(null);
    }
  }

  // ── Create new member and link ────────────────────────────────────────────

  async function handleCreateAndLink(data: {
    firstName: string;
    lastName: string;
    gender: "MALE" | "FEMALE" | "OTHER" | "";
    dob: string;
    gotraId: number;
    geoUnitId: number;
    familyMode?: "current" | "new" | "existing";
    existingFamilyId?: number;
  }) {
    if (!dialog || !currentMember) return;
    setActionLoading(true);

    let familyId = currentMember.familyId;

    if (dialog.role === "spouse") {
      if (data.familyMode === "new") {
        const { createFamily } = await import("../../../features/members/services/familyService");
        const newFamily = await createFamily(currentMember.societyId, data.geoUnitId, currentUsername);
        familyId = newFamily.id;
      } else if (data.familyMode === "existing" && data.existingFamilyId) {
        familyId = data.existingFamilyId;
      }
      // "current" — keep familyId as currentMember.familyId
    }

    const personData = {
      firstName: data.firstName,
      lastName: data.lastName || undefined,
      gender: data.gender || undefined,
      dob: data.dob || undefined,
      societyId: currentMember.societyId,
      gotraId: data.gotraId,
      familyId,
      geoUnitId: data.geoUnitId,
    };

    try {
      if (dialog.role === "spouse") {
        await createAndLinkSpouse(memberCode, personData, undefined, currentUsername);
        notify.success("Spouse created and linked successfully.");
      } else if (dialog.role === "father") {
        await createAndLinkParent(memberCode, personData, "FATHER", currentUsername);
        notify.success("Father created and linked successfully.");
      } else if (dialog.role === "mother") {
        await createAndLinkParent(memberCode, personData, "MOTHER", currentUsername);
        notify.success("Mother created and linked successfully.");
      } else if (dialog.role === "child") {
        const parentType =
          currentMember?.gender === "FEMALE" ? "MOTHER" : "FATHER";
        await createAndLinkChild(memberCode, personData, parentType, currentUsername);
        notify.success("Child created and linked successfully.");
      }
      await reload();
    } catch (err: any) {
      notify.error(err.message || "Failed to create and link.");
    } finally {
      setActionLoading(false);
      setDialog(null);
    }
  }

  async function handleEndMarriage() {
    if (!endMarriageDialog || !endDate || !endReason) return;
    setEndingMarriage(true);
    try {
      await endRelationship(endMarriageDialog.relationshipId, endDate, endReason, currentUsername);
      notify.success("Marriage ended successfully.");
      setEndMarriageDialog(null);
      setEndDate("");
      setEndReason("");
      await reload();
    } catch (err: any) {
      notify.error(err.message || "Failed to end marriage.");
    } finally {
      setEndingMarriage(false);
    }
  }

  // ── Relation card ─────────────────────────────────────────────────────────

  function RelationCard({
    label,
    member,
    canAdd,
    onAdd,
  }: {
    label: string;
    member?: Member | null;
    canAdd: boolean;
    onAdd?: () => void;
  }) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
        <div>
          <p className="text-xs text-slate-400 mb-0.5">{label}</p>
          {member ? (
            <p className="text-sm font-medium text-slate-700">
              {member.firstName} {member.lastName ?? ""}
              <span className="ml-2 text-xs text-slate-400">{member.memberCode}</span>
            </p>
          ) : (
            <p className="text-sm text-slate-400 italic">Not linked</p>
          )}
        </div>
        {canAdd && !member && onAdd && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onAdd()}
              disabled={actionLoading}
              className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
            >
              <Search className="w-3 h-3" />
              Link existing
            </button>
            <button
              type="button"
              onClick={() => {
                // Switch to create mode for same role
                setDialog((prev) => prev ? { ...prev, mode: "create" } : null);
              }}
              disabled={actionLoading}
              className="flex items-center gap-1 text-xs text-emerald-600 hover:underline disabled:opacity-50"
            >
              <UserPlus className="w-3 h-3" />
              Create new
            </button>
          </div>
        )}
      </div>
    );
  }

  if (loadingRel) {
    return (
      <section className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Family Relationships</h2>
        <p className="text-sm text-slate-400">Loading relationships…</p>
      </section>
    );
  }

  // Default geo unit from the current member's address, for pre-filling
  const defaultGeoUnitId = currentMember?.currentAddress?.geoUnitId;

  return (
    <>
      <section className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-1">Family Relationships</h2>
        <p className="text-xs text-slate-400 mb-4">
          Link existing members or create new ones to establish family connections.
        </p>

        <div className="space-y-2">
          {/* Spouse */}
          <div className="flex items-start justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-400 mb-0.5">Spouse(s)</p>
              {relationships?.spouses && relationships.spouses.length > 0 ? (
                <div className="space-y-1">
                  {relationships.spouses.map((s) => (
                    <div key={s.person.memberCode} className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-slate-700">
                          {s.person.firstName} {s.person.lastName ?? ""}
                        </span>
                        <span className="ml-2 text-xs text-slate-400">{s.person.memberCode}</span>
                        {s.startDate && (
                          <span className="ml-2 text-xs text-slate-400">since {s.startDate}</span>
                        )}
                        {!s.isCurrent && s.endReason && (
                          <span className="ml-2 text-xs text-slate-400 italic">
                            ({s.endReason.replace(/_/g, " ").toLowerCase()})
                          </span>
                        )}
                        {!s.isCurrent && (
                          <span className="ml-2 text-xs bg-slate-200 text-slate-500 rounded px-1">former</span>
                        )}
                      </div>
                      {s.isCurrent && (
                        <button
                          type="button"
                          onClick={() => setEndMarriageDialog({
                            relationshipId: s.relationshipId ?? 0,
                            spouseName: `${s.person.firstName} ${s.person.lastName ?? ""}`
                          })}
                          disabled={actionLoading}
                          className="text-xs text-red-500 hover:underline disabled:opacity-50 ml-2 shrink-0"
                        >
                          End marriage
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">Not linked</p>
              )}
            </div>
            <div className="flex gap-2 ml-3 shrink-0">
              <button type="button" onClick={() => setDialog({ role: "spouse", mode: "search" })}
                disabled={actionLoading}
                className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50">
                <Search className="w-3 h-3" />Link existing
              </button>
              <button type="button" onClick={() => setDialog({ role: "spouse", mode: "create" })}
                disabled={actionLoading}
                className="flex items-center gap-1 text-xs text-emerald-600 hover:underline disabled:opacity-50">
                <UserPlus className="w-3 h-3" />Create new
              </button>
            </div>
          </div>

          {/* Father */}
          <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Father</p>
              {relationships?.father ? (
                <p className="text-sm font-medium text-slate-700">
                  {relationships.father.firstName} {relationships.father.lastName ?? ""}
                  <span className="ml-2 text-xs text-slate-400">{relationships.father.memberCode}</span>
                </p>
              ) : (
                <p className="text-sm text-slate-400 italic">Not linked</p>
              )}
            </div>
            {!relationships?.father && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDialog({ role: "father", mode: "search" })}
                  disabled={actionLoading}
                  className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
                >
                  <Search className="w-3 h-3" />
                  Link existing
                </button>
                <button
                  type="button"
                  onClick={() => setDialog({ role: "father", mode: "create" })}
                  disabled={actionLoading}
                  className="flex items-center gap-1 text-xs text-emerald-600 hover:underline disabled:opacity-50"
                >
                  <UserPlus className="w-3 h-3" />
                  Create new
                </button>
              </div>
            )}
          </div>

          {/* Mother */}
          <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Mother</p>
              {relationships?.mother ? (
                <p className="text-sm font-medium text-slate-700">
                  {relationships.mother.firstName} {relationships.mother.lastName ?? ""}
                  <span className="ml-2 text-xs text-slate-400">{relationships.mother.memberCode}</span>
                </p>
              ) : (
                <p className="text-sm text-slate-400 italic">Not linked</p>
              )}
            </div>
            {!relationships?.mother && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDialog({ role: "mother", mode: "search" })}
                  disabled={actionLoading}
                  className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
                >
                  <Search className="w-3 h-3" />
                  Link existing
                </button>
                <button
                  type="button"
                  onClick={() => setDialog({ role: "mother", mode: "create" })}
                  disabled={actionLoading}
                  className="flex items-center gap-1 text-xs text-emerald-600 hover:underline disabled:opacity-50"
                >
                  <UserPlus className="w-3 h-3" />
                  Create new
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Children */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Children
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDialog({ role: "child", mode: "search" })}
                disabled={actionLoading}
                className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
              >
                <Search className="w-3 h-3" />
                Link existing
              </button>
              <button
                type="button"
                onClick={() => setDialog({ role: "child", mode: "create" })}
                disabled={actionLoading}
                className="flex items-center gap-1 text-xs text-emerald-600 hover:underline disabled:opacity-50"
              >
                <UserPlus className="w-3 h-3" />
                Add child
              </button>
            </div>
          </div>

          {relationships?.children && relationships.children.length > 0 ? (
            <div className="space-y-1">
              {relationships.children.map((child) => (
                <div
                  key={child.memberCode}
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                >
                  <p className="text-sm text-slate-700">
                    {child.firstName} {child.lastName ?? ""}
                    <span className="ml-2 text-xs text-slate-400">{child.memberCode}</span>
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No children linked yet.</p>
          )}
        </div>
      </section>

      {/* Search dialog — for "Link existing" */}
      {dialog?.mode === "search" && (
        <MemberSearchDialog
          title={
            dialog.role === "spouse" ? "Link Spouse" :
              dialog.role === "father" ? "Link Father" :
                dialog.role === "mother" ? "Link Mother" :
                  "Link Child"
          }
          excludeMemberCode={memberCode}
          onSelect={handleLinkExisting}
          onClose={() => setDialog(null)}
        />
      )}

      {/* Create dialog — for "Create new" */}
      {dialog?.mode === "create" && (
        <CreatePersonForm
          title={
            dialog.role === "spouse" ? "Create & Link Spouse" :
              dialog.role === "father" ? "Create & Link Father" :
                dialog.role === "mother" ? "Create & Link Mother" :
                  "Create & Link Child"
          }
          societyId={currentMember?.societyId ?? 0}
          defaultGeoUnitId={defaultGeoUnitId}
          showFamilyOption={dialog.role === "spouse"}
          onSubmit={handleCreateAndLink}
          onClose={() => setDialog(null)}
          loading={actionLoading}
        />
      )}

      {/* End marriage modal */}
      {endMarriageDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">End Marriage</h3>
              <button type="button" onClick={() => setEndMarriageDialog(null)}
                className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Ending marriage with <span className="font-medium text-slate-700">{endMarriageDialog.spouseName}</span>
            </p>
            <div className="space-y-3">
              <div>
                <FieldLabel required>End Date</FieldLabel>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <div>
                <FieldLabel required>Reason</FieldLabel>
                <select value={endReason} onChange={e => setEndReason(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                  <option value="">Select reason…</option>
                  <option value="DEATH_OF_SPOUSE">Death of spouse</option>
                  <option value="DIVORCE">Divorce</option>
                  <option value="KHULA">Khula</option>
                  <option value="SEPARATED">Separated</option>
                  <option value="COURT_DISPUTE">Court dispute</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button type="button" onClick={handleEndMarriage}
                disabled={endingMarriage || !endDate || !endReason}
                className="flex-1 px-4 py-2 rounded-md bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-60 transition">
                {endingMarriage ? "Saving…" : "End Marriage"}
              </button>
              <button type="button" onClick={() => setEndMarriageDialog(null)}
                className="px-4 py-2 rounded-md border border-slate-300 text-sm hover:bg-slate-50 transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function EditMember() {
  const { memberCode } = useParams<{ memberCode: string }>();
  const navigate = useNavigate();
  const notify = useNotify();
  const { user } = useAuth();

  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(true);
  const [showParentalAddress, setShowParentalAddress] = useState(false);
  const [originalMember, setOriginalMember] = useState<Member | null>(null);

  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema) as any,
    mode: "onBlur",
  });

  const {
    register,
    watch,
    reset,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [hasPhoto, setHasPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dobValue = watch("dob") ?? "";
  const gotraId = watch("gotraId");
  const societyId = watch("societyId");
  const [deactivating, setDeactivating] = useState(false);
  const [showDeletePhotoConfirm, setShowDeletePhotoConfirm] = useState(false);
  const [showReassign, setShowReassign] = useState(false);
  const [isDeceased, setIsDeceased] = useState(false);

  // ── Load member on mount ──────────────────────────────────────────────────

  useEffect(() => {
    if (!memberCode) return;

    getMember(memberCode)
      .then((m) => {
        setOriginalMember(m);
        setHasPhoto(m.hasPhoto ?? false);
        setIsDeceased(!!m.dod);

        // Map Member (PersonResponse) → MemberFormValues for the form.
        //
        // currentAddress: if the backend now returns it, it will populate.
        // If not yet, we default to empty strings so the form still opens
        // without crashing. The user can fill the address manually and save.
        const formValues: MemberFormValues = {
          societyId: m.societyId,
          familyId: m.familyId,
          firstName: m.firstName,
          lastName: m.lastName ?? "",
          gender: m.gender ?? undefined,
          dob: m.dob
            ? typeof m.dob === "string"
              ? m.dob.substring(0, 10)
              : ""
            : "",
          dod: m.dod
            ? typeof m.dod === "string"
              ? m.dod.substring(0, 10)
              : ""
            : "",
          contactNumber: m.contactNumber ?? "",
          education: m.education ?? "",
          occupation: m.occupation ?? "",
          maritalStatus: m.maritalStatus ?? "SINGLE",
          gotraId: m.gotraId ?? 0,
          createAccount: false,
          email: "",
          currentAddress: {
            geoUnitId: m.currentAddress?.geoUnitId as number,
          },
          parentalAddress: m.parentalAddress?.geoUnitId
            ? { geoUnitId: m.parentalAddress.geoUnitId }
            : undefined,
        };

        reset(formValues);

        // Force maritalStatus to always be set so it appears in submit payload
        setValue("maritalStatus", m.maritalStatus ?? "SINGLE");

        if (m.parentalAddress?.geoUnitId) {
          setShowParentalAddress(true);
        }
      })
      .catch(() => notify.error("Failed to load member details."))
      .finally(() => setLoading(false));
  }, [memberCode]);

  // ── Submit ────────────────────────────────────────────────────────────────

  const onSubmit: SubmitHandler<MemberFormValues> = async (data) => {
    if (!memberCode) return;
    try {
      await updateMember(memberCode, data, user?.username ?? "system");
      // Invalidate cached member so ViewMember fetches fresh data
      queryClient.invalidateQueries({ queryKey: ["member", memberCode] });
      notify.success("Member updated successfully!");
      navigate(`${ROUTES.PRIVATE.MEMBERS}/${memberCode}/view`);
    } catch (err: any) {
      notify.error(err.message || "Failed to update member.");
    }
  };

  // Show a toast when there are validation errors so the user knows why the
  // form didn't submit (was silently failing before this fix).
  const onInvalid = () => {
    notify.error("Please fix the highlighted fields before saving.");
  };

  // ── Photo handlers ────────────────────────────────────────────────────────

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      notify.error("File must be under 5 MB");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      notify.error("Only JPEG, PNG and WEBP are allowed");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);

    setPhotoUploading(true);
    try {
      await uploadMemberPhoto(memberCode!, file);
      setHasPhoto(true);
      notify.success("Photo uploaded successfully!");
    } catch (err: any) {
      notify.error(err.message || "Failed to upload photo");
      setPhotoPreview(null);
    } finally {
      setPhotoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handlePhotoDelete = async () => {
    setShowDeletePhotoConfirm(true);
  };

  const confirmPhotoDelete = async () => {
    try {
      await deleteMemberPhoto(memberCode!);
      setHasPhoto(false);
      setPhotoPreview(null);
      notify.success("Photo removed.");
    } catch (err: any) {
      notify.error(err.message || "Failed to remove photo");
    } finally {
      setShowDeletePhotoConfirm(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return <EditMemberSkeleton />;
  }

  return (
    <div className="max-w-3xl mx-auto">

      <PageHeader
        title="Edit Member"
        subtitle={
          originalMember
            ? `${originalMember.firstName} ${originalMember.lastName ?? ""}`.trim() +
            ` · ${originalMember.memberCode}`
            : undefined
        }
        backTo="back"
      />

      {/* Family info — read-only banner */}
      {originalMember && (
        <div className="mb-4 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-600 flex gap-6">
          <span>
            <span className="text-slate-400">Family: </span>
            <span className="font-medium">{originalMember.familyCode}</span>
          </span>
          <span>
            <span className="text-slate-400">Society: </span>
            <span className="font-medium">{originalMember.societyCode}</span>
          </span>
          <span className="text-slate-400 text-xs italic">
            Family and society cannot be changed here.
          </span>
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit, onInvalid)}
        className="space-y-6"
      >

        {/* Photo */}
        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Profile Photo</h2>
          <div className="flex items-center gap-5">
            {photoPreview ? (
              <div className="w-24 h-24 rounded-full overflow-hidden shrink-0 ring-2 ring-primary/20">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <MemberAvatar
                memberCode={memberCode ?? ""}
                firstName={originalMember?.firstName ?? ""}
                lastName={originalMember?.lastName}
                hasPhoto={hasPhoto}
                size="lg"
              />
            )}

            <div className="space-y-2">
              <p className="text-sm text-slate-500">
                JPEG, PNG or WEBP · Max 5 MB
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={photoUploading}
                  className="px-3 py-1.5 rounded-md border border-slate-300 text-sm hover:bg-slate-50 disabled:opacity-60 transition"
                >
                  {photoUploading
                    ? "Uploading…"
                    : hasPhoto
                      ? "Replace Photo"
                      : "Upload Photo"}
                </button>
                {hasPhoto && !photoUploading && (
                  <button
                    type="button"
                    onClick={handlePhotoDelete}
                    className="px-3 py-1.5 rounded-md border border-red-200 text-red-600 text-sm hover:bg-red-50 transition"
                  >
                    Remove
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>
          </div>
        </section>

        {/* Personal Info */}
        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <FieldLabel required>First Name</FieldLabel>
              <input
                {...register("firstName")}
                className={inputClass(!!errors.firstName)}
              />
              {errors.firstName && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.firstName.message}
                </p>
              )}
            </div>

            <div>
              <FieldLabel>Last Name</FieldLabel>
              <input {...register("lastName")} className={inputClass()} />
            </div>

            <div>
              <FieldLabel>Gender</FieldLabel>
              <select {...register("gender")} className={inputClass()}>
                <option value="">Select</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* Marital Status */}
            <div>
              <FieldLabel>Marital Status</FieldLabel>
              <select
                {...register("maritalStatus")}
                className={inputClass(!!errors.maritalStatus)}
              >
                <option value="" disabled>Select status</option>
                <option value="SINGLE">Single</option>
                <option value="MARRIED">Married</option>
                <option value="DIVORCED">Divorced</option>
                <option value="WIDOWED">Widowed</option>
              </select>
            </div>

            {/* Date of Birth — custom date picker */}
            <div>
              <FieldLabel>Date of Birth</FieldLabel>
              <DatePicker
                value={dobValue}
                onChange={(val) => setValue("dob", val, { shouldDirty: true })}
                hasError={!!errors.dob}
                maxDate={new Date()}
              />
              {errors.dob && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.dob.message}
                </p>
              )}
            </div>

            {/* Deceased toggle + conditional Date of Death */}
            <div>
              <FieldLabel>Deceased</FieldLabel>
              <label className="flex items-center gap-2 cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={isDeceased}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsDeceased(checked);
                    if (!checked) setValue("dod", "", { shouldDirty: true, shouldValidate: true });
                  }}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <span className="text-sm text-slate-600">Mark this member as deceased</span>
              </label>
              {isDeceased && (
                <div className="mt-2">
                  <FieldLabel required>Date of Death</FieldLabel>
                  <DatePicker
                    value={watch("dod") ?? ""}
                    onChange={(val) => setValue("dod", val, { shouldDirty: true, shouldValidate: true })}
                    maxDate={new Date()}
                  />
                  <p className="text-xs text-amber-600 mt-1">
                    This member will be marked as inactive.
                  </p>
                </div>
              )}
            </div>

            <div>
              <FieldLabel required>Gotra</FieldLabel>
              <GotraSelect
                societyId={societyId ?? originalMember?.societyId ?? 0}
                value={gotraId || undefined}
                onChange={(id) => setValue("gotraId", id, { shouldValidate: true, shouldDirty: true })}
                hasError={!!errors.gotraId}
              />
              {errors.gotraId && (
                <p className="text-xs text-red-500 mt-1">{errors.gotraId.message}</p>
              )}
            </div>

            <div>
              <FieldLabel>Contact Number</FieldLabel>
              <input {...register("contactNumber")} className={inputClass()} />
            </div>

            <div>
              <FieldLabel>Education</FieldLabel>
              <input {...register("education")} className={inputClass()} />
            </div>

            <div>
              <FieldLabel>Occupation</FieldLabel>
              <input {...register("occupation")} className={inputClass()} />
            </div>
          </div>
        </section>

        {/* Current Address */}
        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-1">Current Address</h2>
          <p className="text-xs text-slate-400 mb-4">
            Village is required. Other fields are optional.
          </p>
          <AddressFields
            prefix="currentAddress"
            errors={errors}
            watch={watch}
            setValue={setValue}
          />
        </section>

        {/* Parental Address */}
        <section className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Parental Address</h2>
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={showParentalAddress}
                onChange={(e) => setShowParentalAddress(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Fill parental address
            </label>
          </div>
          {showParentalAddress ? (
            <AddressFields
              prefix="parentalAddress"
              errors={errors}
              watch={watch}
              setValue={setValue}
            />
          ) : (
            <p className="text-sm text-slate-400">
              Optional — check the box above to edit the parental address.
            </p>
          )}
        </section>

        <FormFooter
          onCancel={() => navigate(`${ROUTES.PRIVATE.MEMBERS}/${memberCode}/view`)}
          saving={isSubmitting}
          saveLabel="Save Changes"
        />
      </form>

      {/* Family Relationships — outside the main form so their own buttons
          don't accidentally trigger form submission */}
      {originalMember && (
        <div className="mt-6">
          <FamilyRelationshipsSection
            memberCode={memberCode ?? ""}
            memberId={originalMember.id}
            currentMember={originalMember}
            currentUsername={user?.username ?? "system"}
            notify={notify}
          />
        </div>
      )}

      {/* Danger Zone — head member: two-step atomic deactivation dialog */}
      {originalMember?.isActive && originalMember.isHead && (
        <DangerZone
          title="Deactivate this member"
          description="This member is the family head. You will be guided to reassign the head and deactivate in one action."
          buttonLabel="Deactivate Member"
          confirmTitle=""
          confirmMessage=""
          loading={false}
          skipConfirm={true}
          onConfirm={async () => {
            setShowReassign(true);
          }}
        />
      )}

      {/* Danger Zone — normal member: standard confirm */}
      {originalMember?.isActive && !originalMember.isHead && (
        <DangerZone
          title="Deactivate this member"
          description="The member will be marked inactive and will no longer appear in active lists. This can be reversed by an admin from the inactive tab."
          buttonLabel="Deactivate Member"
          confirmTitle="Deactivate member"
          confirmMessage={`Deactivate ${originalMember.firstName} ${originalMember.lastName ?? ""} (${originalMember.memberCode})? They will be moved to the inactive list.`}
          loading={deactivating}
          onConfirm={async () => {
            setDeactivating(true);
            try {
              await deactivateMember(
                originalMember.memberCode,
                user?.username ?? "system"
              );
              queryClient.invalidateQueries({ queryKey: ["members"] });
              queryClient.invalidateQueries({ queryKey: ["member", memberCode] });
              notify.success(`${originalMember.firstName} deactivated successfully.`);
              navigate(ROUTES.PRIVATE.MEMBERS);
            } catch (err: any) {
              notify.error(err.message || "Failed to deactivate member.");
              setDeactivating(false);
            }
          }}
        />
      )}

      {/* DeactivateHeadDialog — two-step atomic flow for head members */}
      {showReassign && originalMember && (
        <DeactivateHeadDialog
          member={originalMember}
          onClose={() => setShowReassign(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["members"] });
            queryClient.invalidateQueries({ queryKey: ["member", memberCode] });
            navigate(ROUTES.PRIVATE.MEMBERS);
          }}
        />
      )}

      <ConfirmDialog
        isOpen={showDeletePhotoConfirm}
        onClose={() => setShowDeletePhotoConfirm(false)}
        onConfirm={confirmPhotoDelete}
        title="Remove photo"
        message="Remove this member's profile photo? This cannot be undone."
        confirmLabel="Remove Photo"
        variant="danger"
      />

    </div>
  );
}
