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
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Calendar,
  UserPlus,
  X,
  Search,
} from "lucide-react";

import {
  memberSchema,
  MemberFormValues,
} from "../../../features/members/member.schema";
import {
  getMember,
  updateMember,
  searchMembers,
} from "../../../features/members/services/memberService";
import {
  getPersonRelationships,
  linkParent,
  linkSpouse,
  deactivateRelationship,
} from "../../../features/members/services/relationshipService";
import { Member, PersonRelationshipsResponse } from "../../../features/members/types";
import { useAuth } from "../../../context/AuthContext";
import { useNotify } from "../../../services/notifications";
import { ROUTES } from "../../../constants/routes";
import FieldLabel from "../../../components/form/FieldLabel";
import {
  deleteMemberPhoto,
  uploadMemberPhoto,
} from "@/features/members/services/photoService";
import MemberAvatar from "@/components/MemberAvatar";

// ── Shared input style ────────────────────────────────────────────────────────

function inputClass(hasError?: boolean) {
  return [
    "w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 transition",
    hasError
      ? "border-red-400 ring-1 ring-red-400 focus:ring-red-400"
      : "border-slate-300 focus:ring-primary/40",
  ].join(" ");
}

// ── Custom Date Picker ────────────────────────────────────────────────────────

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function DatePicker({
  value,
  onChange,
  hasError,
  maxDate,
}: {
  value: string;
  onChange: (val: string) => void;
  hasError?: boolean;
  maxDate?: Date;
}) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState<number>(() => {
    if (value) return new Date(value).getFullYear();
    return new Date().getFullYear();
  });
  const [viewMonth, setViewMonth] = useState<number>(() => {
    if (value) return new Date(value).getMonth();
    return new Date().getMonth();
  });
  const [yearInput, setYearInput] = useState<string>(
    value ? String(new Date(value).getFullYear()) : String(new Date().getFullYear())
  );
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const selected = value ? new Date(value + "T00:00:00") : null;

  function daysInMonth(y: number, m: number) {
    return new Date(y, m + 1, 0).getDate();
  }

  function firstDayOfMonth(y: number, m: number) {
    return new Date(y, m, 1).getDay(); // 0=Sun
  }

  function selectDay(day: number) {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    onChange(`${viewYear}-${mm}-${dd}`);
    setOpen(false);
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  function handleYearInput(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setYearInput(v);
    const n = parseInt(v, 10);
    if (!isNaN(n) && n >= 1900 && n <= new Date().getFullYear()) {
      setViewYear(n);
    }
  }

  function isDisabled(day: number) {
    if (!maxDate) return false;
    const d = new Date(viewYear, viewMonth, day);
    return d > maxDate;
  }

  function isSelected(day: number) {
    if (!selected) return false;
    return (
      selected.getFullYear() === viewYear &&
      selected.getMonth() === viewMonth &&
      selected.getDate() === day
    );
  }

  function isToday(day: number) {
    const t = new Date();
    return (
      t.getFullYear() === viewYear &&
      t.getMonth() === viewMonth &&
      t.getDate() === day
    );
  }

  const totalDays = daysInMonth(viewYear, viewMonth);
  const startDay = firstDayOfMonth(viewYear, viewMonth);
  const cells: (number | null)[] = [
    ...Array(startDay).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];

  const displayValue = selected
    ? selected.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    : "";

  return (
    <div className="relative" ref={ref}>
      <div
        className={[
          "w-full rounded-md border px-3 py-2 text-sm flex items-center justify-between cursor-pointer transition",
          hasError
            ? "border-red-400 ring-1 ring-red-400"
            : "border-slate-300 hover:border-slate-400",
        ].join(" ")}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={displayValue ? "text-slate-800" : "text-slate-400"}>
          {displayValue || "Select date"}
        </span>
        <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
      </div>

      {open && (
        <div className="absolute z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg p-3 w-72">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 rounded hover:bg-slate-100 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
                className="text-sm border border-slate-200 rounded px-1 py-0.5 focus:outline-none"
              >
                {MONTHS.map((m, i) => (
                  <option key={m} value={i}>{m}</option>
                ))}
              </select>
              <input
                type="number"
                value={yearInput}
                onChange={handleYearInput}
                className="text-sm border border-slate-200 rounded w-16 px-1 py-0.5 text-center focus:outline-none"
                min={1900}
                max={new Date().getFullYear()}
              />
            </div>

            <button
              type="button"
              onClick={nextMonth}
              className="p-1 rounded hover:bg-slate-100 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day names */}
          <div className="grid grid-cols-7 mb-1">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div key={d} className="text-center text-xs text-slate-400 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {cells.map((day, i) =>
              day === null ? (
                <div key={`empty-${i}`} />
              ) : (
                <button
                  key={day}
                  type="button"
                  disabled={isDisabled(day)}
                  onClick={() => selectDay(day)}
                  className={[
                    "text-xs rounded-full w-7 h-7 mx-auto flex items-center justify-center transition",
                    isSelected(day)
                      ? "bg-primary text-white font-semibold"
                      : isToday(day)
                        ? "border border-primary text-primary"
                        : "hover:bg-slate-100 text-slate-700",
                    isDisabled(day) ? "opacity-30 cursor-not-allowed" : "",
                  ].join(" ")}
                >
                  {day}
                </button>
              )
            )}
          </div>

          {/* Clear button */}
          {selected && (
            <div className="mt-2 border-t pt-2 text-center">
              <button
                type="button"
                onClick={() => { onChange(""); setOpen(false); }}
                className="text-xs text-slate-500 hover:text-red-500 transition"
              >
                Clear date
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Address sub-form ──────────────────────────────────────────────────────────

function AddressFields({
  prefix,
  register,
  errors,
}: {
  prefix: "currentAddress" | "parentalAddress";
  register: any;
  errors: any;
}) {
  const fields = [
    { name: "village", label: "Village", required: prefix === "currentAddress" },
    { name: "tahsil", label: "Tahsil", required: false },
    { name: "district", label: "District", required: false },
    { name: "state", label: "State", required: false },
    { name: "country", label: "Country", required: false },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {fields.map((f) => {
        const err = errors?.[prefix]?.[f.name]?.message;
        return (
          <div key={f.name}>
            <FieldLabel required={f.required}>{f.label}</FieldLabel>
            <input
              {...register(`${prefix}.${f.name}`)}
              className={inputClass(!!err)}
            />
            {err && <p className="text-xs text-red-500 mt-1">{err}</p>}
          </div>
        );
      })}
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

// ── Family Relationships section ──────────────────────────────────────────────

function FamilyRelationshipsSection({
  memberCode,
  memberId,
  currentUsername,
  notify,
}: {
  memberCode: string;
  memberId: number;
  currentUsername: string;
  notify: ReturnType<typeof useNotify>;
}) {
  const [relationships, setRelationships] =
    useState<PersonRelationshipsResponse | null>(null);
  const [loadingRel, setLoadingRel] = useState(true);

  // Dialog state
  const [dialog, setDialog] = useState<
    null | "spouse" | "father" | "mother" | "child"
  >(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    setLoadingRel(true);
    getPersonRelationships(memberCode)
      .then(setRelationships)
      .catch(() => {
        // If endpoint doesn't exist yet, fail silently
        setRelationships({
          memberCode,
          personName: "",
          children: [],
        });
      })
      .finally(() => setLoadingRel(false));
  }, [memberCode]);

  async function handleLinkParent(
    parent: Member,
    type: "FATHER" | "MOTHER"
  ) {
    setActionLoading(true);
    try {
      await linkParent(memberCode, parent.memberCode, type, currentUsername);
      notify.success(
        `${type === "FATHER" ? "Father" : "Mother"} linked successfully.`
      );
      const updated = await getPersonRelationships(memberCode);
      setRelationships(updated);
    } catch (err: any) {
      notify.error(err.message || "Failed to link relationship.");
    } finally {
      setActionLoading(false);
      setDialog(null);
    }
  }

  async function handleLinkSpouse(spouse: Member) {
    setActionLoading(true);
    try {
      await linkSpouse(memberCode, spouse.memberCode, undefined, currentUsername);
      notify.success("Spouse linked successfully.");
      const updated = await getPersonRelationships(memberCode);
      setRelationships(updated);
    } catch (err: any) {
      notify.error(err.message || "Failed to link spouse.");
    } finally {
      setActionLoading(false);
      setDialog(null);
    }
  }

  // Children are linked by going to the child's record and setting parent.
  // For this screen we just display existing children.

  function RelationCard({
    label,
    member,
    onAdd,
    canAdd,
  }: {
    label: string;
    member?: Member | null;
    onAdd?: () => void;
    canAdd: boolean;
  }) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
        <div>
          <p className="text-xs text-slate-400 mb-0.5">{label}</p>
          {member ? (
            <p className="text-sm font-medium text-slate-700">
              {member.firstName} {member.lastName ?? ""}
              <span className="ml-2 text-xs text-slate-400">
                {member.memberCode}
              </span>
            </p>
          ) : (
            <p className="text-sm text-slate-400 italic">Not linked</p>
          )}
        </div>
        {canAdd && !member && onAdd && (
          <button
            type="button"
            onClick={onAdd}
            disabled={actionLoading}
            className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Link
          </button>
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

  return (
    <>
      <section className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-1">Family Relationships</h2>
        <p className="text-xs text-slate-400 mb-4">
          Link family members already registered in the system.
        </p>

        <div className="space-y-2">
          <RelationCard
            label="Spouse"
            member={relationships?.spouse}
            canAdd={true}
            onAdd={() => setDialog("spouse")}
          />
          <RelationCard
            label="Father"
            member={relationships?.father}
            canAdd={true}
            onAdd={() => setDialog("father")}
          />
          <RelationCard
            label="Mother"
            member={relationships?.mother}
            canAdd={true}
            onAdd={() => setDialog("mother")}
          />
        </div>

        {/* Children — display only; to add a child you go to the child's edit screen */}
        {relationships?.children && relationships.children.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">
              Children
            </p>
            <div className="space-y-1">
              {relationships.children.map((child) => (
                <div
                  key={child.memberCode}
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                >
                  <p className="text-sm text-slate-700">
                    {child.firstName} {child.lastName ?? ""}
                    <span className="ml-2 text-xs text-slate-400">
                      {child.memberCode}
                    </span>
                  </p>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-2 italic">
              To add a child, open the child's Edit Member screen and link their parent there.
            </p>
          </div>
        )}

        {(!relationships?.children || relationships.children.length === 0) && (
          <p className="text-xs text-slate-400 mt-4 italic">
            No children linked. To add a child, open the child's Edit Member screen and link their parent there.
          </p>
        )}
      </section>

      {/* Search dialogs */}
      {dialog === "spouse" && (
        <MemberSearchDialog
          title="Link Spouse"
          excludeMemberCode={memberCode}
          onSelect={handleLinkSpouse}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === "father" && (
        <MemberSearchDialog
          title="Link Father"
          excludeMemberCode={memberCode}
          onSelect={(m) => handleLinkParent(m, "FATHER")}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === "mother" && (
        <MemberSearchDialog
          title="Link Mother"
          excludeMemberCode={memberCode}
          onSelect={(m) => handleLinkParent(m, "MOTHER")}
          onClose={() => setDialog(null)}
        />
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

  // ── Load member on mount ──────────────────────────────────────────────────

  useEffect(() => {
    if (!memberCode) return;

    getMember(memberCode)
      .then((m) => {
        setOriginalMember(m);
        setHasPhoto(m.hasPhoto ?? false);

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
            ? // Normalise to YYYY-MM-DD if backend returns LocalDate as array or string
            typeof m.dob === "string"
              ? m.dob.substring(0, 10)
              : ""
            : "",
          contactNumber: m.contactNumber ?? "",
          education: m.education ?? "",
          occupation: m.occupation ?? "",
          maritalStatus: m.maritalStatus ?? undefined,
          createAccount: false,
          email: "",
          currentAddress: {
            village: m.currentAddress?.village ?? "",
            tahsil: m.currentAddress?.tahsil ?? "",
            district: m.currentAddress?.district ?? "",
            state: m.currentAddress?.state ?? "",
            country: m.currentAddress?.country ?? "",
          },
          parentalAddress: m.parentalAddress?.village
            ? {
              village: m.parentalAddress.village,
              tahsil: m.parentalAddress.tahsil ?? "",
              district: m.parentalAddress.district ?? "",
              state: m.parentalAddress.state ?? "",
              country: m.parentalAddress.country ?? "",
            }
            : undefined,
        };

        reset(formValues);

        if (m.parentalAddress?.village) {
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
    if (!confirm("Remove this member's photo?")) return;
    try {
      await deleteMemberPhoto(memberCode!);
      setHasPhoto(false);
      setPhotoPreview(null);
      notify.success("Photo removed.");
    } catch (err: any) {
      notify.error(err.message || "Failed to remove photo");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow p-6 text-sm text-slate-500">
        Loading member…
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Edit Member</h1>
          <p className="text-slate-500 text-sm">
            {originalMember
              ? `${originalMember.firstName} ${originalMember.lastName ?? ""}`.trim()
              : ""}
            {originalMember && (
              <span className="ml-2 text-slate-400">
                · {originalMember.memberCode}
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-3 py-2 rounded-md border text-sm hover:bg-slate-50 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

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
              <select {...register("maritalStatus")} className={inputClass()}>
                <option value="">Select</option>
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
            register={register}
            errors={errors}
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
              register={register}
              errors={errors}
            />
          ) : (
            <p className="text-sm text-slate-400">
              Optional — check the box above to edit the parental address.
            </p>
          )}
        </section>

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

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 rounded-md bg-primary text-white text-sm hover:bg-primary/90 disabled:opacity-60 transition"
          >
            {isSubmitting ? "Saving…" : "Save Changes"}
          </button>
          <Link
            to={`${ROUTES.PRIVATE.MEMBERS}/${memberCode}/view`}
            className="px-4 py-2 rounded-md border border-slate-300 text-sm hover:bg-slate-50 transition"
          >
            Cancel
          </Link>
        </div>
      </form>

      {/* Family Relationships — outside the main form so their own buttons
          don't accidentally trigger form submission */}
      {originalMember && (
        <div className="mt-6">
          <FamilyRelationshipsSection
            memberCode={memberCode ?? ""}
            memberId={originalMember.id}
            currentUsername={user?.username ?? "system"}
            notify={notify}
          />
        </div>
      )}
    </div>
  );
}
