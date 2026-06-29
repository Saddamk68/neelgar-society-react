import { useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import FieldLabel from "@/components/form/FieldLabel";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/services/notifications";
import GeoUnitCascadeSelect, { GeoSelection } from "@/features/geo-units/components/GeoUnitCascadeSelect";
import {
    getByGeoUnit,
    assignLocalAuthority,
    revokeLocalAuthority,
    lookupUserByMemberCode,
} from "@/features/local-authority/services/localAuthorityService";
import { LocalAuthorityRole, UserLookup } from "@/features/local-authority/local-authority-types";

function inputClass() {
    return "w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 transition border-slate-300 focus:ring-primary/40";
}

export default function LocalAuthority() {
    const notify = useNotify();
    const queryClient = useQueryClient();

    const [geo, setGeo] = useState<GeoSelection>({});
    const [memberCode, setMemberCode] = useState("");
    const [lookedUpUser, setLookedUpUser] = useState<UserLookup | null>(null);
    const [role, setRole] = useState<LocalAuthorityRole>("VILLAGE_PRESIDENT");
    const [isPublicVisible, setIsPublicVisible] = useState(false);
    const [looking, setLooking] = useState(false);
    const [assigning, setAssigning] = useState(false);

    const geoUnitId = geo.villageTownId;

    const { data: officers = [], isLoading } = useQuery({
        queryKey: ["local-authority", geoUnitId],
        queryFn: () => getByGeoUnit(geoUnitId as number),
        enabled: !!geoUnitId,
    });

    async function handleLookup() {
        if (!memberCode.trim()) return;
        setLooking(true);
        setLookedUpUser(null);
        try {
            const user = await lookupUserByMemberCode(memberCode.trim());
            setLookedUpUser(user);
        } catch (err: any) {
            notify.error(err.message || "No user account found for this member code");
        } finally {
            setLooking(false);
        }
    }

    async function handleAssign() {
        if (!geoUnitId) {
            notify.error("Select a state, district, and village/town first");
            return;
        }
        if (!lookedUpUser) {
            notify.error("Look up a member by their member code first");
            return;
        }
        setAssigning(true);
        try {
            await assignLocalAuthority(lookedUpUser.id, geoUnitId, role, isPublicVisible);
            notify.success(`${role.replace("_", " ")} assigned to ${lookedUpUser.personName ?? lookedUpUser.username}`);
            setMemberCode("");
            setLookedUpUser(null);
            setIsPublicVisible(false);
            queryClient.invalidateQueries({ queryKey: ["local-authority", geoUnitId] });
        } catch (err: any) {
            notify.error(err.message || "Failed to assign local authority");
        } finally {
            setAssigning(false);
        }
    }

    async function handleRevoke(scopeId: number) {
        if (!confirm("Revoke this title? The member will be demoted back to MEMBER.")) return;
        try {
            await revokeLocalAuthority(scopeId);
            notify.success("Local authority revoked");
            queryClient.invalidateQueries({ queryKey: ["local-authority", geoUnitId] });
        } catch (err: any) {
            notify.error(err.message || "Failed to revoke local authority");
        }
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <PageHeader
                title="Local Leadership"
                subtitle="Assign or revoke Village President / Secretary titles."
                backTo="back"
            />

            {/* Step 1: pick village */}
            <section className="bg-white rounded-xl shadow p-6 space-y-4">
                <h2 className="text-lg font-semibold">1. Select Village/Town</h2>
                <GeoUnitCascadeSelect value={geo} onChange={setGeo} />
            </section>

            {geoUnitId && (
                <>
                    {/* Current officers */}
                    <section className="bg-white rounded-xl shadow p-6 space-y-3">
                        <h2 className="text-lg font-semibold">Current Officers</h2>
                        {isLoading ? (
                            <p className="text-sm text-slate-400">Loading…</p>
                        ) : officers.length === 0 ? (
                            <p className="text-sm text-slate-400">No active President/Secretary assigned yet.</p>
                        ) : (
                            <div className="divide-y">
                                {officers.map((o) => (
                                    <div key={o.id} className="flex items-center justify-between py-3 text-sm">
                                        <div>
                                            <span className="font-medium">{o.personName ?? o.username}</span>
                                            <span className="text-slate-400 ml-2">({o.roleName.replace("_", " ")})</span>
                                            <div className="text-xs text-slate-400">Since {o.validFrom}</div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRevoke(o.id)}
                                            className="px-3 py-1.5 rounded-md border border-red-300 text-red-600 text-xs hover:bg-red-50 transition"
                                        >
                                            Revoke
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Assign new */}
                    <section className="bg-white rounded-xl shadow p-6 space-y-4">
                        <h2 className="text-lg font-semibold">2. Assign a Title</h2>

                        <div>
                            <FieldLabel required>Member Code</FieldLabel>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={memberCode}
                                    onChange={(e) => { setMemberCode(e.target.value); setLookedUpUser(null); }}
                                    onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                                    placeholder="e.g. NEE2603-SK0792"
                                    className={inputClass()}
                                />
                                <button
                                    type="button"
                                    onClick={handleLookup}
                                    disabled={looking}
                                    className="px-4 py-2 rounded-md bg-slate-100 text-sm hover:bg-slate-200 transition whitespace-nowrap disabled:opacity-60"
                                >
                                    {looking ? "Looking up…" : "Look Up"}
                                </button>
                            </div>
                            {lookedUpUser && (
                                <p className="text-xs text-green-600 mt-2">
                                    ✓ Found: {lookedUpUser.personName ?? lookedUpUser.username} — current role: {lookedUpUser.role}
                                    {lookedUpUser.role !== "MEMBER" && (
                                        <span className="text-red-500 ml-1">(Already has a local title)</span>
                                    )}
                                </p>
                            )}
                        </div>

                        <div>
                            <FieldLabel required>Title</FieldLabel>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value as LocalAuthorityRole)}
                                className={inputClass()}
                            >
                                <option value="VILLAGE_PRESIDENT">Village President</option>
                                <option value="VILLAGE_SECRETARY">Village Secretary</option>
                            </select>
                        </div>

                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isPublicVisible}
                                onChange={(e) => setIsPublicVisible(e.target.checked)}
                                className="h-4 w-4 rounded border-slate-300"
                            />
                            <span className="text-sm text-slate-600">
                                Show this officer's name on the public leadership page
                            </span>
                        </label>

                        <button
                            type="button"
                            onClick={handleAssign}
                            disabled={assigning || !lookedUpUser}
                            className="px-4 py-2 rounded-md bg-primary text-white text-sm hover:bg-primary/90 disabled:opacity-60 transition"
                        >
                            {assigning ? "Assigning…" : "Assign Title"}
                        </button>
                    </section>
                </>
            )}
        </div>
    );
}
