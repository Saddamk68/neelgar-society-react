import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { X, Search, Loader2, AlertTriangle } from "lucide-react";
import {
    reassignFamily,
    searchFamilies,
    ReassignmentReason,
} from "../features/members/services/familyService";
import { searchMembers } from "../features/members/services/memberService";
import { Member, Family } from "../features/members/types";
import { useAuth } from "../context/AuthContext";
import { ROUTES } from "../constants/routes";

type Step = 1 | 2 | 3;

// ── Small reusable pieces ─────────────────────────────────────────────────────

function StepIndicator({ current }: { current: Step }) {
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
            <span className="ml-2 text-xs text-slate-400">
                {current === 1 ? "Reason" : current === 2 ? "Target family" : "Confirm"}
            </span>
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

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

    const [step, setStep] = useState<Step>(1);
    const [reason, setReason] = useState<ReassignmentReason>("MARRIAGE");
    const [spouseQuery, setSpouseQuery] = useState("");
    const [selectedSpouse, setSelectedSpouse] = useState<Member | null>(null);
    const [familyQuery, setFamilyQuery] = useState("");
    const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
    const [createNew, setCreateNew] = useState(false);
    const [effectiveDate, setEffectiveDate] = useState("");

    // Spouse search (only for MARRIAGE)
    const { data: spouseResults, isFetching: spouseSearching } = useQuery<Member[]>({
        queryKey: ["member-search", spouseQuery],
        queryFn: () => searchMembers(spouseQuery),
        enabled: reason === "MARRIAGE" && spouseQuery.trim().length >= 2,
        staleTime: 30_000,
    });

    // Family search
    const { data: familyResults, isFetching: familySearching } = useQuery<Family[]>({
        queryKey: ["family-search", familyQuery, member.societyId],
        queryFn: () => searchFamilies(member.societyId, familyQuery),
        enabled: !createNew && familyQuery.trim().length >= 2,
        staleTime: 30_000,
    });

    const mutation = useMutation({
        mutationFn: () =>
            reassignFamily(
                {
                    personMemberCode: member.memberCode,
                    targetFamilyCode: createNew ? undefined : selectedFamily?.familyCode,
                    reason,
                    spouseMemberCode: selectedSpouse?.memberCode,
                    effectiveDate: effectiveDate || undefined,
                },
                user?.username ?? "system"
            ),
        onSuccess: (result) => {
            // Invalidate all affected queries
            queryClient.invalidateQueries({ queryKey: ["member", member.memberCode] });
            queryClient.invalidateQueries({ queryKey: ["relationships", member.memberCode] });
            if (member.familyCode) {
                queryClient.invalidateQueries({ queryKey: ["family", member.familyCode] });
                queryClient.invalidateQueries({ queryKey: ["family-members", member.familyCode] });
            }
            queryClient.invalidateQueries({
                queryKey: ["family", result.targetFamily.familyCode],
            });
            onClose();
            // Navigate to the updated member record
            navigate(`${ROUTES.PRIVATE.MEMBERS}/${member.memberCode}/view`);
        },
    });

    const fullName = [member.firstName, member.lastName].filter(Boolean).join(" ");

    // ── Step renders ──────────────────────────────────────────────────────────

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">

                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100">
                    <div>
                        <div className="font-semibold text-slate-800">Reassign family</div>
                        <div className="text-xs text-slate-400 mt-0.5">{fullName} · {member.memberCode}</div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-5 py-4">
                    <StepIndicator current={step} />

                    {/* ── Step 1: Reason ── */}
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
                                                    ? "Person is marrying and forming or joining a family. A spouse relationship will be created."
                                                    : "Internal record correction or household restructuring. No relationship changes."}
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>

                            {/* Spouse search — only for MARRIAGE */}
                            {reason === "MARRIAGE" && (
                                <div>
                                    <label className="text-xs font-medium text-slate-500 block mb-1">
                                        Spouse (optional — search by name or member code)
                                    </label>
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search spouse..."
                                            value={spouseQuery}
                                            onChange={(e) => {
                                                setSpouseQuery(e.target.value);
                                                setSelectedSpouse(null);
                                            }}
                                            className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                        />
                                        {spouseSearching && (
                                            <Loader2 className="absolute right-2.5 top-2.5 w-4 h-4 text-slate-400 animate-spin" />
                                        )}
                                    </div>

                                    {selectedSpouse && (
                                        <div className="mt-2 flex items-center justify-between text-sm bg-primary/5 border border-primary/20 rounded px-3 py-2">
                                            <span className="font-medium text-slate-700">
                                                {selectedSpouse.firstName} {selectedSpouse.lastName} · {selectedSpouse.memberCode}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => { setSelectedSpouse(null); setSpouseQuery(""); }}
                                                className="text-slate-400 hover:text-slate-600"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
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
                                                        onClick={() => {
                                                            setSelectedSpouse(m);
                                                            setSpouseQuery("");
                                                        }}
                                                        className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 border-b border-slate-100 last:border-0"
                                                    >
                                                        <span className="font-medium">{m.firstName} {m.lastName}</span>
                                                        <span className="text-slate-400 ml-2 font-mono text-xs">{m.memberCode}</span>
                                                    </button>
                                                ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Effective date */}
                            <div>
                                <label className="text-xs font-medium text-slate-500 block mb-1">
                                    Effective date (optional)
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

                    {/* ── Step 2: Target family ── */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <p className="text-sm text-slate-600">
                                Which family will <span className="font-medium">{fullName}</span> join?
                            </p>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={createNew}
                                    onChange={(e) => {
                                        setCreateNew(e.target.checked);
                                        setSelectedFamily(null);
                                        setFamilyQuery("");
                                    }}
                                    className="accent-primary"
                                />
                                <span className="text-sm text-slate-700">
                                    Create a new family for this person
                                </span>
                            </label>

                            {!createNew && (
                                <div>
                                    <label className="text-xs font-medium text-slate-500 block mb-1">
                                        Search existing families (by head name or village)
                                    </label>
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search families..."
                                            value={familyQuery}
                                            onChange={(e) => {
                                                setFamilyQuery(e.target.value);
                                                setSelectedFamily(null);
                                            }}
                                            className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                        />
                                        {familySearching && (
                                            <Loader2 className="absolute right-2.5 top-2.5 w-4 h-4 text-slate-400 animate-spin" />
                                        )}
                                    </div>

                                    {selectedFamily && (
                                        <div className="mt-2 flex items-center justify-between text-sm bg-primary/5 border border-primary/20 rounded px-3 py-2">
                                            <div>
                                                <span className="font-medium text-slate-700 font-mono">
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
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => { setSelectedFamily(null); setFamilyQuery(""); }}
                                                className="text-slate-400 hover:text-slate-600"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )}

                                    {!selectedFamily && familyResults && familyResults.length > 0 && (
                                        <div className="mt-1 border border-slate-200 rounded-md overflow-hidden">
                                            {familyResults.slice(0, 5).map((f) => (
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
                                </div>
                            )}

                            {createNew && (
                                <div className="text-sm text-slate-500 bg-slate-50 rounded p-3 border border-slate-200">
                                    A new family will be created automatically. {" "}
                                    <span className="font-medium text-slate-700">{fullName}</span> will be set as the family head.
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
                                    disabled={!createNew && !selectedFamily}
                                    onClick={() => setStep(3)}
                                    className="px-4 py-2 bg-primary text-white text-sm rounded-md hover:bg-primary/90 disabled:opacity-50 transition"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Step 3: Confirm ── */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <p className="text-sm text-slate-600 mb-3">Review the changes before confirming.</p>

                            <div className="bg-slate-50 border border-slate-200 rounded-lg divide-y divide-slate-200 text-sm">
                                <div className="flex px-3 py-2">
                                    <span className="w-32 text-slate-400 shrink-0">Member</span>
                                    <span className="font-medium text-slate-700">{fullName} · {member.memberCode}</span>
                                </div>
                                <div className="flex px-3 py-2">
                                    <span className="w-32 text-slate-400 shrink-0">From family</span>
                                    <span className="font-mono text-slate-700">{member.familyCode ?? "—"}</span>
                                </div>
                                <div className="flex px-3 py-2">
                                    <span className="w-32 text-slate-400 shrink-0">To family</span>
                                    <span className="font-mono text-slate-700">
                                        {createNew ? "(new family — auto-generated)" : selectedFamily?.familyCode}
                                    </span>
                                </div>
                                <div className="flex px-3 py-2">
                                    <span className="w-32 text-slate-400 shrink-0">Reason</span>
                                    <span className="text-slate-700">{reason === "MARRIAGE" ? "Marriage" : "Administrative"}</span>
                                </div>
                                {selectedSpouse && (
                                    <div className="flex px-3 py-2">
                                        <span className="w-32 text-slate-400 shrink-0">Spouse</span>
                                        <span className="text-slate-700">
                                            {selectedSpouse.firstName} {selectedSpouse.lastName} · {selectedSpouse.memberCode}
                                        </span>
                                    </div>
                                )}
                                {effectiveDate && (
                                    <div className="flex px-3 py-2">
                                        <span className="w-32 text-slate-400 shrink-0">Effective date</span>
                                        <span className="text-slate-700">{effectiveDate}</span>
                                    </div>
                                )}
                            </div>

                            {mutation.isError && (
                                <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
                                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                    <span>
                                        {(mutation.error as any)?.response?.data?.message
                                            ?? "Reassignment failed. Please check the details and try again."}
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
