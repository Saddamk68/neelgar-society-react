import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getFamily, updateFamily, getDistinctClans } from "../../../features/members/services/familyService";
import { Family } from "../../../features/members/types";
import { useAuth } from "../../../context/AuthContext";
import { useNotify } from "../../../services/notifications";
import { ROUTES } from "../../../constants/routes";
import FieldLabel from "../../../components/form/FieldLabel";

function inputClass(hasError?: boolean) {
    return [
        "w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 transition",
        hasError
            ? "border-red-400 ring-1 ring-red-400 focus:ring-red-400"
            : "border-slate-300 focus:ring-primary/40",
    ].join(" ");
}

export default function EditFamily() {
    const { familyCode } = useParams<{ familyCode: string }>();
    const navigate = useNavigate();
    const notify = useNotify();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // ── Form state ────────────────────────────────────────────────────────────
    const [village, setVillage] = useState("");
    const [clanCode, setClanCode] = useState("");
    const [clanName, setClanName] = useState("");
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<{ village?: string; clan?: string }>({});

    // ── Load family ───────────────────────────────────────────────────────────
    const { data: family, isLoading, isError } = useQuery<Family>({
        queryKey: ["family", familyCode],
        queryFn: () => getFamily(familyCode!),
        enabled: !!familyCode,
        staleTime: 1000 * 60 * 2,
    });

    // Pre-fill form when family loads
    useEffect(() => {
        if (family) {
            setVillage(family.village ?? "");
            setClanCode(family.clanCode ?? "");
            setClanName(family.clanName ?? "");
        }
    }, [family]);

    // ── Load clan suggestions ─────────────────────────────────────────────────
    const [clanSuggestions, setClanSuggestions] = useState<string[]>([]);

    useEffect(() => {
        if (user?.societyId) {
            getDistinctClans(user.societyId)
                .then(setClanSuggestions)
                .catch(() => { });
        }
    }, [user?.societyId]);

    // ── Validation ────────────────────────────────────────────────────────────
    function validate(): boolean {
        const e: typeof errors = {};
        if (!village.trim()) e.village = "Village is required";
        if (clanCode && !/^[A-Za-z0-9_-]+$/.test(clanCode)) {
            e.clan = "Clan code may only contain letters, numbers, hyphens and underscores";
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    // ── Submit ────────────────────────────────────────────────────────────────
    async function handleSave() {
        if (!validate()) {
            notify.error("Please fix the highlighted fields before saving.");
            return;
        }
        if (!user?.username) return;

        setSaving(true);
        try {
            await updateFamily(
                familyCode!,
                family!.societyId,
                village.trim(),
                user.username,
                clanCode || undefined,
                clanName || undefined,
            );
            // Invalidate so Families list and ViewFamily both refresh
            queryClient.invalidateQueries({ queryKey: ["family", familyCode] });
            queryClient.invalidateQueries({ queryKey: ["families"] });
            notify.success("Family updated successfully!");
            navigate(`${ROUTES.PRIVATE.FAMILIES}/${familyCode}/view`);
        } catch (err: any) {
            notify.error(err.message || "Failed to update family.");
        } finally {
            setSaving(false);
        }
    }

    // ── Render ────────────────────────────────────────────────────────────────

    if (isLoading) {
        return (
            <div className="bg-white rounded-xl shadow p-6 text-sm text-slate-500">
                Loading family…
            </div>
        );
    }

    if (isError || !family) {
        return (
            <div className="bg-white rounded-xl shadow p-6 text-sm text-red-500">
                Failed to load family.{" "}
                <Link to={ROUTES.PRIVATE.FAMILIES} className="underline">Go back</Link>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold">Edit Family</h1>
                    <p className="text-slate-500 text-sm">
                        {family.familyCode}
                        {family.headPersonName && (
                            <span className="ml-2 text-slate-400">· {family.headPersonName}</span>
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

            {/* Read-only info banner */}
            <div className="mb-4 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-600 flex gap-6">
                <span>
                    <span className="text-slate-400">Family Code: </span>
                    <span className="font-medium font-mono">{family.familyCode}</span>
                </span>
                <span>
                    <span className="text-slate-400">Society: </span>
                    <span className="font-medium">{family.societyCode}</span>
                </span>
                <span className="text-slate-400 text-xs italic">
                    Family code and society cannot be changed.
                </span>
            </div>

            {/* Form */}
            <div className="bg-white rounded-xl shadow p-6 space-y-5">
                <h2 className="text-lg font-semibold">Family Details</h2>

                {/* Village */}
                <div>
                    <FieldLabel required>Village</FieldLabel>
                    <input
                        type="text"
                        value={village}
                        onChange={(e) => setVillage(e.target.value)}
                        className={inputClass(!!errors.village)}
                        placeholder="Enter village name…"
                    />
                    {errors.village && (
                        <p className="text-xs text-red-500 mt-1">{errors.village}</p>
                    )}
                </div>

                {/* Clan Code */}
                <div>
                    <FieldLabel>
                        Clan Code{" "}
                        <span className="text-slate-400 font-normal">(optional)</span>
                    </FieldLabel>
                    <input
                        type="text"
                        value={clanCode}
                        onChange={(e) => setClanCode(e.target.value.toUpperCase())}
                        className={inputClass(!!errors.clan)}
                        placeholder="e.g. SHARMA-NLG"
                        list="edit-clan-suggestions"
                    />
                    {clanSuggestions.length > 0 && (
                        <datalist id="edit-clan-suggestions">
                            {clanSuggestions.map((c) => (
                                <option key={c} value={c} />
                            ))}
                        </datalist>
                    )}
                    {errors.clan && (
                        <p className="text-xs text-red-500 mt-1">{errors.clan}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">
                        Auto-uppercased. Pick an existing code from suggestions to join a clan,
                        or type a new one to create a new clan group.
                    </p>
                </div>

                {/* Clan Name */}
                <div>
                    <FieldLabel>
                        Clan Name{" "}
                        <span className="text-slate-400 font-normal">(optional)</span>
                    </FieldLabel>
                    <input
                        type="text"
                        value={clanName}
                        onChange={(e) => setClanName(e.target.value)}
                        className={inputClass()}
                        placeholder="e.g. Sharma Vansh"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                        Human-readable name for this clan group.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 rounded-md bg-primary text-white text-sm hover:bg-primary/90 disabled:opacity-60 transition"
                    >
                        {saving ? "Saving…" : "Save Changes"}
                    </button>
                    <Link
                        to={`${ROUTES.PRIVATE.FAMILIES}/${familyCode}/view`}
                        className="px-4 py-2 rounded-md border border-slate-300 text-sm hover:bg-slate-50 transition"
                    >
                        Cancel
                    </Link>
                </div>
            </div>
        </div>
    );
}
