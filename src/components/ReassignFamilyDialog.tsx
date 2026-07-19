import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { X, Search, Loader2, AlertTriangle, Users } from "lucide-react";
import {
    reassignFamily,
    searchFamilies,
    getFamily,
    ReassignmentReason,
} from "../features/members/services/familyService";
import { searchMembers } from "../features/members/services/memberService";
import { getPersonRelationships } from "../features/members/services/relationshipService";
import { Member, Family, PersonRelationshipsResponse } from "../features/members/types";
import { useAuth } from "../context/AuthContext";
import { ROUTES } from "../constants/routes";

type Step = 1 | 2 | 3;

// ── Helpers ───────────────────────────────────────────────────────────────────

function isFamilyCode(value: string) {
    return value.trim().toUpperCase().startsWith("FAM-");
}

function StepIndicator({ current }: { current: Step }) {
    const labels: Record<Step, string> = {
        1: "Reason",
        2: "Target family",
        3: "Confirm",
    };
    return (
        <div className="flex items-center gap-2 mb-6">
            {([1, 2, 3] as Step[]).map((s) => (
                <div key={s} className="flex items-center gap-2">
                    <div
                        className={[
                            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold",
                            s === current
                                ? "bg-primary text-white"
                                : s < current
                                    ? "bg-primary/20 text-primary"
                                    : "bg-slate-200 text-slate-400",
                        ].join(" ")}
                    >
                        {s}
                    </div>
                    {s < 3 && <div className="w-8 h-px bg-slate-200" />}
                </div>
            ))}
            <span className="ml-2 text-xs text-slate-400">{labels[current]}</span>
        </div>
    );
}

function MemberPickRow({
    member,
    label,
    checked,
    onChange,
}: {
    member: Member;
    label: string;
    checked: boolean;
    onChange: (v: boolean) => void;
}) {
    const fullName = [member.firstName, member.lastName].filter(Boolean).join(" ");
    return (
        <label className="flex items-center gap-3 py-2 px-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="accent-primary"
            />
            <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-slate-700">{fullName}</span>
                <span className="text-xs font-mono text-slate-400 ml-2">{member.memberCode}</span>
            </div>
            <span className="text-xs text-slate-400 shrink-0">{label}</span>
        </label>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function ReassignFamilyDialog({
    member,
    onClose,
}: {
    member: Member;
    onClose: () => void;
}) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const fullName = [member.firstName, member.lastName].filter(Boolean).join(" ");

    // ── Step state ────────────────────────────────────────────────────────────
    const [step, setStep] = useState<Step>(1);

    // Step 1
    const [reason, setReason] = useState<ReassignmentReason>("MARRIAGE");
    const [spouseQuery, setSpouseQuery] = useState("");
    const [selectedSpouse, setSelectedSpouse] = useState<Member | null>(null);
    const [effectiveDate, setEffectiveDate] = useState("");

    // Step 2
    const [createNew, setCreateNew] = useState(false);
    const [familyQuery, setFamilyQuery] = useState("");
    const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
    const [familyCodeError, setFamilyCodeError] = useState<string | null>(null);
    const [additionalCodes, setAdditionalCodes] = useState<Set<string>>(new Set());

    // ── Queries ───────────────────────────────────────────────────────────────

    // Spouse search
    const { data: spouseResults, isFetching: spouseSearching } = useQuery<Member[]>({
        queryKey: ["member-search", spouseQuery],
        queryFn: () => searchMembers(spouseQuery.trim()),
        enabled: reason === "MARRIAGE" && spouseQuery.trim().length >= 2 && !selectedSpouse,
        staleTime: 30_000,
    });

    // Family search — only when not a FAM- code
    const { data: familySearchResults, isFetching: familySearching } = useQuery<Family[]>({
        queryKey: ["family-search", familyQuery, member.societyId],
        queryFn: () => searchFamilies(member.societyId, familyQuery.trim()),
        enabled: !createNew && familyQuery.trim().length >= 2 && !isFamilyCode(familyQuery) && !selectedFamily,
        staleTime: 30_000,
    });

    // Family code exact lookup — only when input looks like FAM-
    const {
        data: familyByCodeResult,
        isFetching: familyCodeLooking,
        isError: familyByCodeError,
    } = useQuery<Family>({
        queryKey: ["family-by-code", familyQuery.trim().toUpperCase()],
        queryFn: () => getFamily(familyQuery.trim().toUpperCase()),
        enabled: !createNew && isFamilyCode(familyQuery) && familyQuery.trim().length >= 6 && !selectedFamily,
        staleTime: 30_000,
        retry: false,
    });

    useEffect(() => {
        if (familyByCodeResult && !selectedFamily) {
            setSelectedFamily(familyByCodeResult);
            setFamilyCodeError(null);
        }
    }, [familyByCodeResult]);

    useEffect(() => {
        if (familyByCodeError) {
            setFamilyCodeError(`Family "${familyQuery.trim().toUpperCase()}" not found.`);
        }
    }, [familyByCodeError]);

    // Relationships — fetch when entering step 2 in create-new mode to build checklist
    const { data: relationships, isLoading: relLoading } = useQuery<PersonRelationshipsResponse>({
        queryKey: ["relationships", member.memberCode],
        queryFn: () => getPersonRelationships(member.memberCode),
        enabled: step === 2 && createNew,
        staleTime: 0,
    });

    // Candidates to move — spouse + children from current family only
    const moveCandidates: { member: Member; label: string }[] = [];
    if (relationships) {
        (relationships.spouses ?? [])
            .filter(s => s.person.familyCode === member.familyCode)
            .forEach(s => moveCandidates.push({ member: s.person, label: "Spouse" }));
        (relationships.children ?? [])
            .filter((c) => c.familyCode === member.familyCode)
            .forEach((c) => moveCandidates.push({ member: c, label: "Child" }));
    }

    // ── Mutation ──────────────────────────────────────────────────────────────

    const mutation = useMutation({
        mutationFn: () =>
            reassignFamily(
                {
                    personMemberCode: member.memberCode,
                    targetFamilyCode: createNew ? undefined : selectedFamily?.familyCode,
                    reason,
                    spouseMemberCode: selectedSpouse?.memberCode,
                    effectiveDate: effectiveDate || undefined,
                    additionalMemberCodes: additionalCodes.size > 0
                        ? Array.from(additionalCodes)
                        : undefined,
                },
                user?.username ?? "system"
            ),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ["member", member.memberCode] });
            queryClient.invalidateQueries({ queryKey: ["relationships", member.memberCode] });
            if (member.familyCode) {
                queryClient.invalidateQueries({ queryKey: ["family", member.familyCode] });
                queryClient.invalidateQueries({ queryKey: ["family-members", member.familyCode] });
            }
            // Invalidate moved members too
            additionalCodes.forEach((code) => {
                queryClient.invalidateQueries({ queryKey: ["member", code] });
                queryClient.invalidateQueries({ queryKey: ["relationships", code] });
            });
            queryClient.invalidateQueries({ queryKey: ["family", result.targetFamily.familyCode] });
            onClose();
            navigate(`${ROUTES.PRIVATE.MEMBERS}/${member.memberCode}/view`);
        },
    });

    // ── Step 2 validation ─────────────────────────────────────────────────────

    const step2Valid = createNew || !!selectedFamily;

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100 shrink-0">
                    <div>
                        <div className="font-semibold text-slate-800">Reassign Family</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                            {fullName} · <span className="font-mono">{member.memberCode}</span>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-5 py-4 overflow-y-auto flex-1">
                    <StepIndicator current={step} />

                    {/* ── STEP 1: REASON ──────────────────────────────────────────── */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <p className="text-sm text-slate-600">
                                Why is <span className="font-medium">{fullName}</span> changing families?
                            </p>

                            <div className="space-y-2">
                                {(["MARRIAGE", "ADMINISTRATIVE"] as ReassignmentReason[]).map((r) => (
                                    <label
                                        key={r}
                                        className={[
                                            "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition",
                                            reason === r
                                                ? "border-primary bg-primary/5"
                                                : "border-slate-200 hover:border-slate-300",
                                        ].join(" ")}
                                    >
                                        <input
                                            type="radio"
                                            name="reason"
                                            value={r}
                                            checked={reason === r}
                                            onChange={() => {
                                                setReason(r);
                                                setSelectedSpouse(null);
                                                setSpouseQuery("");
                                            }}
                                            className="mt-0.5 accent-primary"
                                        />
                                        <div>
                                            <div className="text-sm font-medium text-slate-700">
                                                {r === "MARRIAGE" ? "Marriage" : "Administrative move"}
                                            </div>
                                            <div className="text-xs text-slate-400 mt-0.5">
                                                {r === "MARRIAGE"
                                                    ? "Both persons' marital status will be set to Married. A spouse relationship will be created."
                                                    : "Internal record correction or household restructuring. No relationship changes."}
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>

                            {/* Spouse search */}
                            {reason === "MARRIAGE" && (
                                <div>
                                    <label className="text-xs font-medium text-slate-500 block mb-1">
                                        Spouse <span className="text-slate-400 font-normal">(optional)</span>
                                    </label>

                                    {selectedSpouse ? (
                                        <div className="flex items-center justify-between text-sm bg-primary/5 border border-primary/20 rounded px-3 py-2">
                                            <span className="font-medium text-slate-700">
                                                {selectedSpouse.firstName} {selectedSpouse.lastName}
                                                <span className="font-mono text-xs text-slate-400 ml-2">
                                                    {selectedSpouse.memberCode}
                                                </span>
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => { setSelectedSpouse(null); setSpouseQuery(""); }}
                                                className="text-slate-400 hover:text-slate-600"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Search by name or member code…"
                                                value={spouseQuery}
                                                onChange={(e) => setSpouseQuery(e.target.value)}
                                                className="w-full pl-8 pr-8 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                            />
                                            {spouseSearching && (
                                                <Loader2 className="absolute right-2.5 top-2.5 w-4 h-4 text-slate-400 animate-spin" />
                                            )}
                                        </div>
                                    )}

                                    {!selectedSpouse && spouseResults && spouseResults.length > 0 && (
                                        <div className="mt-1 border border-slate-200 rounded-md overflow-hidden">
                                            {spouseResults
                                                .filter((m) => m.memberCode !== member.memberCode)
                                                .slice(0, 5)
                                                .map((m) => (
                                                    <button
                                                        key={m.memberCode}
                                                        type="button"
                                                        onClick={() => { setSelectedSpouse(m); setSpouseQuery(""); }}
                                                        className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 border-b border-slate-100 last:border-0"
                                                    >
                                                        <span className="font-medium">{m.firstName} {m.lastName}</span>
                                                        <span className="text-slate-400 font-mono text-xs ml-2">{m.memberCode}</span>
                                                    </button>
                                                ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Effective date */}
                            <div>
                                <label className="text-xs font-medium text-slate-500 block mb-1">
                                    Effective date <span className="text-slate-400 font-normal">(optional)</span>
                                </label>
                                <input
                                    type="date"
                                    value={effectiveDate}
                                    onChange={(e) => setEffectiveDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    className="px-4 py-2 bg-primary text-white text-sm rounded-md hover:bg-primary/90 transition"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 2: TARGET FAMILY ────────────────────────────────────── */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <p className="text-sm text-slate-600">
                                Which family will <span className="font-medium">{fullName}</span> join?
                            </p>

                            {/* Create new toggle */}
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={createNew}
                                    onChange={(e) => {
                                        setCreateNew(e.target.checked);
                                        setSelectedFamily(null);
                                        setFamilyQuery("");
                                        setFamilyCodeError(null);
                                        setAdditionalCodes(new Set());
                                    }}
                                    className="accent-primary"
                                />
                                <span className="text-sm text-slate-700">Create a new family for this person</span>
                            </label>

                            {/* Search existing */}
                            {!createNew && (
                                <div>
                                    <label className="text-xs font-medium text-slate-500 block mb-1">
                                        Search by head name, village, or family code
                                    </label>

                                    {selectedFamily ? (
                                        <div className="flex items-start justify-between bg-primary/5 border border-primary/20 rounded px-3 py-2">
                                            <div className="text-sm">
                                                <span className="font-mono font-medium text-slate-700">
                                                    {selectedFamily.familyCode}
                                                </span>
                                                {selectedFamily.headPersonName && (
                                                    <span className="text-slate-500 ml-2">
                                                        Head: {selectedFamily.headPersonName}
                                                    </span>
                                                )}
                                                {selectedFamily.village && (
                                                    <span className="text-slate-400 ml-2 text-xs">
                                                        · {selectedFamily.village}
                                                    </span>
                                                )}
                                                {selectedFamily.memberCount !== undefined && (
                                                    <span className="text-slate-400 ml-2 text-xs">
                                                        · {selectedFamily.memberCount} member{selectedFamily.memberCount !== 1 ? "s" : ""}
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedFamily(null);
                                                    setFamilyQuery("");
                                                    setFamilyCodeError(null);
                                                }}
                                                className="text-slate-400 hover:text-slate-600 ml-2 shrink-0"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="relative">
                                                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Sharma, Indore, or FAM-3K9A2F"
                                                    value={familyQuery}
                                                    onChange={(e) => {
                                                        setFamilyQuery(e.target.value);
                                                        setFamilyCodeError(null);
                                                    }}
                                                    className="w-full pl-8 pr-8 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                                />
                                                {(familySearching || familyCodeLooking) && (
                                                    <Loader2 className="absolute right-2.5 top-2.5 w-4 h-4 text-slate-400 animate-spin" />
                                                )}
                                            </div>

                                            {familyCodeError && (
                                                <p className="text-xs text-red-500 mt-1">{familyCodeError}</p>
                                            )}

                                            {!isFamilyCode(familyQuery) &&
                                                familySearchResults &&
                                                familySearchResults.length > 0 && (
                                                    <div className="mt-1 border border-slate-200 rounded-md overflow-hidden">
                                                        {familySearchResults.slice(0, 6).map((f) => (
                                                            <button
                                                                key={f.familyCode}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedFamily(f);
                                                                    setFamilyQuery("");
                                                                }}
                                                                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 border-b border-slate-100 last:border-0"
                                                            >
                                                                <span className="font-mono font-medium">{f.familyCode}</span>
                                                                {f.headPersonName && (
                                                                    <span className="text-slate-500 ml-2">{f.headPersonName}</span>
                                                                )}
                                                                {f.village && (
                                                                    <span className="text-slate-400 ml-2 text-xs">· {f.village}</span>
                                                                )}
                                                                {f.memberCount !== undefined && (
                                                                    <span className="text-slate-300 ml-2 text-xs">
                                                                        {f.memberCount} member{f.memberCount !== 1 ? "s" : ""}
                                                                    </span>
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Checklist — only for create new */}
                            {createNew && (
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Users className="w-4 h-4 text-slate-400" />
                                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            Who moves to the new family?
                                        </span>
                                    </div>

                                    {relLoading ? (
                                        <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            Loading family members…
                                        </div>
                                    ) : moveCandidates.length === 0 ? (
                                        <div className="text-xs text-slate-400 bg-slate-50 rounded p-3 border border-slate-200">
                                            No spouse or children found in the current family. Only{" "}
                                            <span className="font-medium text-slate-600">{fullName}</span> will be moved.
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <p className="text-xs text-slate-500">
                                                The following current family members can be moved with{" "}
                                                <span className="font-medium">{fullName}</span>. Tick those who should join
                                                the new family.
                                            </p>
                                            {moveCandidates.map(({ member: m, label }) => (
                                                <MemberPickRow
                                                    key={m.memberCode}
                                                    member={m}
                                                    label={label}
                                                    checked={additionalCodes.has(m.memberCode)}
                                                    onChange={(checked) => {
                                                        setAdditionalCodes((prev) => {
                                                            const next = new Set(prev);
                                                            checked ? next.add(m.memberCode) : next.delete(m.memberCode);
                                                            return next;
                                                        });
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    <div className="mt-3 text-xs text-slate-400 bg-slate-50 rounded p-3 border border-slate-200">
                                        <span className="font-medium text-slate-600">{fullName}</span> will become the
                                        head of the new family. A new family code will be auto-generated.
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between pt-2">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="px-4 py-2 border border-slate-200 text-sm rounded-md hover:bg-slate-50 transition"
                                >
                                    Back
                                </button>
                                <button
                                    type="button"
                                    disabled={!step2Valid}
                                    onClick={() => setStep(3)}
                                    className="px-4 py-2 bg-primary text-white text-sm rounded-md hover:bg-primary/90 disabled:opacity-50 transition"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 3: CONFIRM ─────────────────────────────────────────── */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <p className="text-sm text-slate-600">Review changes before confirming.</p>

                            <div className="bg-slate-50 border border-slate-200 rounded-lg divide-y divide-slate-200 text-sm">
                                <div className="flex px-3 py-2">
                                    <span className="w-36 text-slate-400 shrink-0">Member</span>
                                    <span className="font-medium text-slate-700">
                                        {fullName}
                                        <span className="font-mono text-xs text-slate-400 ml-2">{member.memberCode}</span>
                                    </span>
                                </div>
                                <div className="flex px-3 py-2">
                                    <span className="w-36 text-slate-400 shrink-0">From family</span>
                                    <span className="font-mono text-slate-700">{member.familyCode ?? "—"}</span>
                                </div>
                                <div className="flex px-3 py-2">
                                    <span className="w-36 text-slate-400 shrink-0">To family</span>
                                    <span className="font-mono text-slate-700">
                                        {createNew ? "New family (auto-generated)" : selectedFamily?.familyCode}
                                    </span>
                                </div>
                                <div className="flex px-3 py-2">
                                    <span className="w-36 text-slate-400 shrink-0">Reason</span>
                                    <span className="text-slate-700">
                                        {reason === "MARRIAGE" ? "Marriage" : "Administrative move"}
                                    </span>
                                </div>
                                {reason === "MARRIAGE" && (
                                    <div className="flex px-3 py-2">
                                        <span className="w-36 text-slate-400 shrink-0">Marital status</span>
                                        <span className="text-slate-700">
                                            Both persons will be set to{" "}
                                            <span className="font-medium text-green-700">Married</span>
                                        </span>
                                    </div>
                                )}
                                {selectedSpouse && (
                                    <div className="flex px-3 py-2">
                                        <span className="w-36 text-slate-400 shrink-0">Spouse</span>
                                        <span className="text-slate-700">
                                            {selectedSpouse.firstName} {selectedSpouse.lastName}
                                            <span className="font-mono text-xs text-slate-400 ml-2">
                                                {selectedSpouse.memberCode}
                                            </span>
                                        </span>
                                    </div>
                                )}
                                {additionalCodes.size > 0 && (
                                    <div className="flex px-3 py-2">
                                        <span className="w-36 text-slate-400 shrink-0">Also moving</span>
                                        <span className="text-slate-700">
                                            {moveCandidates
                                                .filter((c) => additionalCodes.has(c.member.memberCode))
                                                .map((c) => `${c.member.firstName} ${c.member.lastName ?? ""}`.trim())
                                                .join(", ")}
                                        </span>
                                    </div>
                                )}
                                {effectiveDate && (
                                    <div className="flex px-3 py-2">
                                        <span className="w-36 text-slate-400 shrink-0">Effective date</span>
                                        <span className="text-slate-700">{effectiveDate}</span>
                                    </div>
                                )}
                            </div>

                            {mutation.isError && (
                                <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
                                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                    <span>
                                        {(mutation.error as any)?.response?.data?.message ??
                                            "Reassignment failed. Please check the details and try again."}
                                    </span>
                                </div>
                            )}

                            <div className="flex justify-between pt-2">
                                <button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    disabled={mutation.isPending}
                                    className="px-4 py-2 border border-slate-200 text-sm rounded-md hover:bg-slate-50 transition"
                                >
                                    Back
                                </button>
                                <button
                                    type="button"
                                    onClick={() => mutation.mutate()}
                                    disabled={mutation.isPending}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm rounded-md hover:bg-primary/90 disabled:opacity-60 transition"
                                >
                                    {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {mutation.isPending ? "Reassigning…" : "Confirm reassignment"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
