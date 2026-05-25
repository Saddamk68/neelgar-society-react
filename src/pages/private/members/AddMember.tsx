import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/layout/PageHeader";

import {
  memberSchema,
  duplicateCheckSchema,
  MemberFormValues,
  DuplicateCheckValues,
} from "../../../features/members/member.schema";
import { checkDuplicates, createMember } from "../../../features/members/services/memberService";
import { searchFamilies, createFamily, getDistinctClans } from "../../../features/members/services/familyService";
import { DuplicateCandidate, Family } from "../../../features/members/types";
import { useAuth } from "../../../context/AuthContext";
import { useNotify } from "../../../services/notifications";
import { ROUTES } from "../../../constants/routes";
import FieldLabel from "../../../components/form/FieldLabel";
import DatePicker from "../../../components/form/DatePicker";
import GotraSelect from "@/features/gotras/components/GotraSelect";


// ── Step indicator ────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3;

function StepBar({ current }: { current: Step }) {
  const steps = [
    { n: 1, label: "Check Duplicates" },
    { n: 2, label: "Select Family" },
    { n: 3, label: "Member Details" },
  ];
  return (
    <div className="flex items-center gap-2 mb-8">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center gap-2">
          <div
            className={[
              "flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold border-2",
              current === s.n
                ? "border-primary bg-primary text-white"
                : current > s.n
                  ? "border-green-500 bg-green-500 text-white"
                  : "border-slate-300 bg-white text-slate-400",
            ].join(" ")}
          >
            {current > s.n ? "✓" : s.n}
          </div>
          <span
            className={[
              "text-sm",
              current === s.n ? "font-semibold text-primary" : "text-slate-400",
            ].join(" ")}
          >
            {s.label}
          </span>
          {i < steps.length - 1 && (
            <div
              className={[
                "w-12 h-0.5 mx-1",
                current > s.n ? "bg-green-500" : "bg-slate-200",
              ].join(" ")}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Shared input style helper ─────────────────────────────────────────────────

function inputClass(hasError?: boolean) {
  return [
    "w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 transition",
    hasError
      ? "border-red-400 ring-1 ring-red-400 focus:ring-red-400"
      : "border-slate-300 focus:ring-primary/40",
  ].join(" ");
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

// ── Main component ────────────────────────────────────────────────────────────

export default function AddMember() {
  const notify = useNotify();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState<Step>(1);
  const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>([]);
  const [duplicateChecked, setDuplicateChecked] = useState(false);

  // Family selection state
  const [familyMode, setFamilyMode] = useState<"existing" | "new">("existing");
  const [familySearch, setFamilySearch] = useState("");
  const [familyResults, setFamilyResults] = useState<Family[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [newVillage, setNewVillage] = useState("");
  const [familyLoading, setFamilyLoading] = useState(false);

  // Clan suggestions for new family creation
  const [newClanCode, setNewClanCode] = useState("");
  const [newClanName, setNewClanName] = useState("");
  const [clanSuggestions, setClanSuggestions] = useState<string[]>([]);

  // Parental address toggle
  const [showParentalAddress, setShowParentalAddress] = useState(false);

  // ── Step 1: Duplicate check form ────────────────────────────────────────────
  const dupForm = useForm<DuplicateCheckValues>({
    resolver: zodResolver(duplicateCheckSchema),
    mode: "onBlur",
  });

  // ── Step 3: Member detail form ───────────────────────────────────────────────
  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema) as any,
    mode: "onBlur",
    defaultValues: {
      societyId: 0,
      familyId: 0,
      firstName: "",
      lastName: "",
      contactNumber: "",
      education: "",
      occupation: "",
      gotraId: undefined as unknown as number,   // ← use undefined so schema doesn't fail on initial render
      createAccount: false,
      currentAddress: { village: "", tahsil: "", district: "", state: "", country: "" },
    },
  });

  const { register, watch, setValue, handleSubmit, formState: { errors, isSubmitting } } = form;
  const createAccount = watch("createAccount");
  const gotraId = watch("gotraId");
  const societyId = watch("societyId");

  // Pre-fill firstName/lastName/dob from Step 1 into Step 3
  useEffect(() => {
    if (step === 3) {
      const v = dupForm.getValues();
      setValue("firstName", v.firstName);
      setValue("lastName", v.lastName ?? "");
      setValue("dob", v.dob ?? "");
    }
  }, [step]);

  useEffect(() => {
    if (familyMode === "new" && user?.societyId) {
      getDistinctClans(user.societyId)
        .then(setClanSuggestions)
        .catch(() => { }); // non-critical
    }
  }, [familyMode]);

  // ── Step 1 handlers ─────────────────────────────────────────────────────────

  const handleDuplicateCheck: SubmitHandler<DuplicateCheckValues> = async (data) => {
    try {
      const results = await checkDuplicates(data);
      setDuplicates(results);
      setDuplicateChecked(true);
      if (results.length === 0) {
        // No duplicates — move to Step 2 automatically
        setStep(2);
      }
      // If duplicates found, UI shows them and user can choose to proceed
    } catch (err: any) {
      notify.error(err.message || "Duplicate check failed");
    }
  };

  const proceedAnyway = () => {
    setStep(2);
  };

  // ── Step 2 handlers ─────────────────────────────────────────────────────────

  const handleFamilySearch = async () => {
    if (!familySearch.trim()) return;
    if (!user?.societyId) {
      notify.error("Society information missing. Please re-login.");
      return;
    }
    setFamilyLoading(true);
    try {
      const results = await searchFamilies(user.societyId, familySearch);
      setFamilyResults(results);
      if (results.length === 0) notify.info("No families found. Try a different name or create a new one.");
    } catch (err: any) {
      notify.error(err.message || "Family search failed");
    } finally {
      setFamilyLoading(false);
    }
  };

  const selectFamily = (family: Family) => {
    setSelectedFamily(family);
    setValue("familyId", family.id);
    setValue("societyId", family.societyId);
  };

  const handleCreateFamily = async () => {
    if (!newVillage.trim()) {
      notify.error("Village is required to create a family");
      return;
    }
    if (!user?.societyId) {
      notify.error("Society information missing. Please re-login.");
      return;
    }
    setFamilyLoading(true);
    try {
      const created = await createFamily(
        user.societyId,
        newVillage.trim(),
        user.username,
        newClanCode.trim() || undefined,
        newClanName.trim() || undefined,
      );
      setSelectedFamily(created);
      setValue("familyId", created.id);
      setValue("societyId", created.societyId);
      notify.success(`Family ${created.familyCode} created!`);
    } catch (err: any) {
      notify.error(err.message || "Failed to create family");
    } finally {
      setFamilyLoading(false);
    }
  };

  const confirmFamily = () => {
    if (!selectedFamily) {
      notify.error("Please select or create a family first");
      return;
    }
    setStep(3);
  };

  // ── Step 3 submit ────────────────────────────────────────────────────────────

  const onSubmit: SubmitHandler<MemberFormValues> = async (data) => {
    try {
      await createMember(data, user?.username ?? "system");
      notify.success("Member created successfully!");
      navigate(ROUTES.PRIVATE.MEMBERS);
    } catch (err: any) {
      notify.error(err.message || "Failed to create member");
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="Add Member"
        subtitle="Follow the steps to register a new member."
        backTo={ROUTES.PRIVATE.MEMBERS}
      />

      <StepBar current={step} />

      {/* ══════════════════════════════════════════════════════
          STEP 1 — Duplicate Check
          ══════════════════════════════════════════════════════ */}
      {step === 1 && (
        <section className="bg-white rounded-xl shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold">Check for Existing Members</h2>
          <p className="text-sm text-slate-500">
            Enter the member's name and date of birth to check if they already exist.
          </p>

          <form onSubmit={dupForm.handleSubmit(handleDuplicateCheck)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <FieldLabel required>First Name</FieldLabel>
                <input
                  {...dupForm.register("firstName")}
                  className={inputClass(!!dupForm.formState.errors.firstName)}
                />
                {dupForm.formState.errors.firstName && (
                  <p className="text-xs text-red-500 mt-1">
                    {dupForm.formState.errors.firstName.message}
                  </p>
                )}
              </div>
              <div>
                <FieldLabel>Last Name</FieldLabel>
                <input
                  {...dupForm.register("lastName")}
                  className={inputClass()}
                />
              </div>
              <div>
                <FieldLabel>Date of Birth</FieldLabel>
                <DatePicker
                  value={dupForm.watch("dob") ?? ""}
                  onChange={(val) => dupForm.setValue("dob", val)}
                  maxDate={new Date()}
                />
              </div>
              <div>
                <FieldLabel>Date of Death</FieldLabel>
                <DatePicker
                  value={watch("dod") ?? ""}
                  onChange={(val) =>
                    setValue("dod", val, { shouldDirty: true })
                  }
                  maxDate={new Date()}
                />
                {watch("dod") && (
                  <p className="text-xs text-amber-600 mt-1">
                    This member will be marked as inactive.
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={dupForm.formState.isSubmitting}
              className="px-4 py-2 rounded-md bg-primary text-white text-sm hover:bg-primary/90 disabled:opacity-60 transition"
            >
              {dupForm.formState.isSubmitting ? "Checking…" : "Check for Duplicates"}
            </button>
          </form>

          {/* Duplicate results */}
          {duplicateChecked && duplicates.length > 0 && (
            <div className="mt-4 border border-yellow-300 bg-yellow-50 rounded-lg p-4">
              <p className="text-sm font-semibold text-yellow-800 mb-3">
                ⚠ {duplicates.length} possible duplicate(s) found:
              </p>
              <div className="space-y-2">
                {duplicates.map((d) => (
                  <div
                    key={d.memberCode}
                    className="flex items-center justify-between bg-white border border-yellow-200 rounded-md px-3 py-2 text-sm"
                  >
                    <span>
                      <span className="font-medium">{d.firstName} {d.lastName}</span>
                      <span className="text-slate-400 ml-2">({d.memberCode})</span>
                      {d.dob && <span className="text-slate-400 ml-2">DOB: {d.dob}</span>}
                    </span>
                    <span className="text-xs text-slate-400">{d.familyCode}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={proceedAnyway}
                  className="px-4 py-2 rounded-md bg-yellow-600 text-white text-sm hover:bg-yellow-700 transition"
                >
                  Proceed Anyway
                </button>
                <button
                  type="button"
                  onClick={() => { setDuplicates([]); setDuplicateChecked(false); }}
                  className="px-4 py-2 rounded-md border border-slate-300 text-sm hover:bg-slate-50 transition"
                >
                  Search Again
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ══════════════════════════════════════════════════════
          STEP 2 — Family Selection
          ══════════════════════════════════════════════════════ */}
      {step === 2 && (
        <section className="bg-white rounded-xl shadow p-6 space-y-5">
          <h2 className="text-lg font-semibold">Select or Create a Family</h2>

          {/* Mode toggle */}
          <div className="flex gap-3">
            {(["existing", "new"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => { setFamilyMode(mode); setSelectedFamily(null); }}
                className={[
                  "px-4 py-2 rounded-md text-sm border transition",
                  familyMode === mode
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50",
                ].join(" ")}
              >
                {mode === "existing" ? "Use Existing Family" : "Create New Family"}
              </button>
            ))}
          </div>

          {/* Existing family search */}
          {familyMode === "existing" && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search by head person name or village…"
                  value={familySearch}
                  onChange={(e) => setFamilySearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleFamilySearch()}
                  className={inputClass()}
                />
                <button
                  type="button"
                  onClick={handleFamilySearch}
                  disabled={familyLoading}
                  className="px-4 py-2 rounded-md bg-primary text-white text-sm hover:bg-primary/90 disabled:opacity-60 transition whitespace-nowrap"
                >
                  {familyLoading ? "Searching…" : "Search"}
                </button>
              </div>

              {familyResults.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  {familyResults.map((f) => (
                    <button
                      key={f.familyCode}
                      type="button"
                      onClick={() => selectFamily(f)}
                      className={[
                        "w-full flex items-center justify-between px-4 py-3 text-sm text-left border-b last:border-b-0 transition",
                        selectedFamily?.familyCode === f.familyCode
                          ? "bg-primary/10 border-primary/20"
                          : "hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <div>
                        <span className="font-medium">{f.familyCode}</span>
                        {f.headPersonName && (
                          <span className="text-slate-500 ml-2">— {f.headPersonName}</span>
                        )}
                      </div>
                      {f.village && (
                        <span className="text-slate-400 text-xs">{f.village}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* New family creation */}
          {familyMode === "new" && (
            <div className="space-y-3">
              <div>
                <FieldLabel required>Village</FieldLabel>
                <input
                  type="text"
                  placeholder="Enter village name…"
                  value={newVillage}
                  onChange={(e) => setNewVillage(e.target.value)}
                  className={inputClass()}
                />
              </div>

              <div>
                <FieldLabel>Clan Code <span className="text-slate-400 font-normal">(optional)</span></FieldLabel>
                <input
                  type="text"
                  placeholder="e.g. SHARMA-NLG"
                  value={newClanCode}
                  onChange={(e) => setNewClanCode(e.target.value)}
                  list="clan-code-suggestions"
                  className={inputClass()}
                />
                {clanSuggestions.length > 0 && (
                  <datalist id="clan-code-suggestions">
                    {clanSuggestions.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                )}
                <p className="text-xs text-slate-400 mt-1">
                  Type a new code or pick an existing one to group families into a clan.
                </p>
              </div>

              <div>
                <FieldLabel>Clan Name <span className="text-slate-400 font-normal">(optional)</span></FieldLabel>
                <input
                  type="text"
                  placeholder="e.g. Sharma Vansh"
                  value={newClanName}
                  onChange={(e) => setNewClanName(e.target.value)}
                  className={inputClass()}
                />
              </div>

              <button
                type="button"
                onClick={handleCreateFamily}
                disabled={familyLoading || !!selectedFamily}
                className="px-4 py-2 rounded-md bg-primary text-white text-sm hover:bg-primary/90 disabled:opacity-60 transition"
              >
                {familyLoading ? "Creating…" : "Create Family"}
              </button>
            </div>
          )}

          {/* Selected family confirmation */}
          {selectedFamily && (
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm">
              <span className="text-green-600 text-lg">✓</span>
              <div>
                <span className="font-medium text-green-800">{selectedFamily.familyCode}</span>
                {selectedFamily.headPersonName && (
                  <span className="text-green-600 ml-2">— {selectedFamily.headPersonName}</span>
                )}
                {selectedFamily.village && (
                  <span className="text-green-600 ml-2">({selectedFamily.village})</span>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 rounded-md border border-slate-300 text-sm hover:bg-slate-50 transition"
            >
              Back
            </button>
            <button
              type="button"
              onClick={confirmFamily}
              className="px-4 py-2 rounded-md bg-primary text-white text-sm hover:bg-primary/90 transition"
            >
              Continue
            </button>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════
          STEP 3 — Member Details
          ══════════════════════════════════════════════════════ */}
      {step === 3 && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* Personal Info */}
          <section className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FieldLabel required>First Name</FieldLabel>
                <input {...register("firstName")} className={inputClass(!!errors.firstName)} />
                {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName.message}</p>}
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
              <div>
                <FieldLabel>Date of Birth</FieldLabel>
                <DatePicker
                  value={watch("dob") ?? ""}
                  onChange={(val) => setValue("dob", val, { shouldDirty: true })}
                  hasError={!!errors.dob}
                  maxDate={new Date()}
                />
              </div>
              <div>
                <FieldLabel>Date of Death</FieldLabel>
                <DatePicker
                  value={watch("dod") ?? ""}
                  onChange={(val) => setValue("dod", val, { shouldDirty: true })}
                  maxDate={new Date()}
                />
                {watch("dod") && (
                  <p className="text-xs text-amber-600 mt-1">
                    This member will be marked as inactive.
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

              <div>
                <FieldLabel required>Gotra</FieldLabel>
                <GotraSelect
                  societyId={societyId}
                  value={gotraId || undefined}
                  onChange={(id) => setValue("gotraId", id, { shouldValidate: true })}
                  hasError={!!errors.gotraId}
                />
                {errors.gotraId && (
                  <p className="text-xs text-red-500 mt-1">{errors.gotraId.message}</p>
                )}
              </div>
            </div>
          </section>

          {/* Current Address */}
          <section className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Current Address</h2>
            <AddressFields prefix="currentAddress" register={register} errors={errors} />
          </section>

          {/* Parental Address (optional) */}
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
                Same as / fill parental address
              </label>
            </div>
            {showParentalAddress ? (
              <AddressFields prefix="parentalAddress" register={register} errors={errors} />
            ) : (
              <p className="text-sm text-slate-400">
                Optional — check the box above to add a parental/permanent address.
              </p>
            )}
          </section>

          {/* Account Creation */}
          <section className="bg-white rounded-xl shadow p-6 space-y-4">
            <h2 className="text-lg font-semibold">User Account</h2>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register("createAccount")}
                className="h-4 w-4 rounded border-slate-300"
              />
              <span className="text-sm">Create a login account for this member</span>
            </label>
            {createAccount && (
              <div>
                <FieldLabel required>Email</FieldLabel>
                <input
                  type="email"
                  {...register("email")}
                  className={inputClass(!!errors.email)}
                  placeholder="member@example.com"
                />
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
                )}
              </div>
            )}
          </section>

          {/* Actions — Back goes to Step 2, Cancel exits the wizard */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex items-center gap-2 px-4 py-2 rounded-md border border-slate-300 text-sm hover:bg-slate-50 transition"
            >
              ← Back
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate(ROUTES.PRIVATE.MEMBERS)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-md border border-slate-300 text-sm hover:bg-slate-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition"
              >
                {isSubmitting ? "Saving…" : "Save Member"}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
