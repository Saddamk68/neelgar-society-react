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
    lookupPersonByMemberCode,
} from "@/features/local-authority/services/localAuthorityService";
import { LocalAuthorityRole, PersonLookup } from "@/features/local-authority/local-authority-types";
import ConfirmDialog from "@/components/ConfirmDialog";
import Select from "@/components/form/Select";

function inputClass() {
    return "w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 transition border-slate-300 focus:ring-primary/40";
}

export default function LocalAuthority() {
    const notify = useNotify();
    const queryClient = useQueryClient();

    const [geo, setGeo] = useState<GeoSelection>({});
    const [memberCode, setMemberCode] = useState("");
    const [lookedUpPerson, setLookedUpPerson] = useState<PersonLookup | null>(null);
    const [role, setRole] = useState<LocalAuthorityRole>("VILLAGE_PRESIDENT");
    const [isPublicVisible, setIsPublicVisible] = useState(true);
    const [looking, setLooking] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [revokeTarget, setRevokeTarget] = useState<number | null>(null);

    const geoUnitId = geo.villageTownId;

    const { data: officers = [], isLoading } = useQuery({
        queryKey: ["local-authority", geoUnitId],
        queryFn: () => getByGeoUnit(geoUnitId as number),
        enabled: !!geoUnitId,
    });

    async function handleLookup() {
        if (!memberCode.trim()) return;
        setLooking(true);
        setLookedUpPerson(null);
        try {
            const person = await lookupPersonByMemberCode(memberCode.trim());
            setLookedUpPerson(person);
        } catch (err: any) {
            notify.error(err.message || "No member found with this member code");
        } finally {
            setLooking(false);
        }
    }

    async function handleAssign() {
        if (!geoUnitId) {
            notify.error("Select a state, district, and village/town first");
            return;
        }
        if (!lookedUpPerson) {
            notify.error("Look up a member by their member code first");
            return;
        }
        setAssigning(true);
        try {
            const result = await assignLocalAuthority(lookedUpPerson.personId, geoUnitId, role, isPublicVisible);
            notify.success(
                result.accountAutoProvisioned
                    ? `${role.replace("_", " ")} assigned to ${lookedUpPerson.personName}. A new login was created for them (username: ${lookedUpPerson.memberCode}).`
                    : `${role.replace("_", " ")} assigned to ${lookedUpPerson.personName ?? lookedUpPerson.memberCode}`
            );
            setMemberCode("");
            setLookedUpPerson(null);
            setIsPublicVisible(true);
            queryClient.invalidateQueries({ queryKey: ["local-authority", geoUnitId] });
        } catch (err: any) {
            notify.error(err.message || "Failed to assign local authority");
        } finally {
            setAssigning(false);
        }
    }

    async function handleRevoke(scopeId: number) {
        try {
            await revokeLocalAuthority(scopeId);
            setRevokeTarget(null);
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
                <h2 className="text-lg font-semibold">1. Select City / Town / Village</h2>
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
                                            onClick={() => setRevokeTarget(o.id)}
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
                                    onChange={(e) => { setMemberCode(e.target.value); setLookedUpPerson(null); }}
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
                            {lookedUpPerson && (
                                <p className="text-xs text-green-600 mt-2">
                                    ✓ Found: {lookedUpPerson.personName ?? lookedUpPerson.memberCode}
                                    {lookedUpPerson.hasUserAccount ? (
                                        <>
                                            {" "}— current role: {lookedUpPerson.currentRole}
                                            {lookedUpPerson.currentRole !== "MEMBER" && (
                                                <span className="text-red-500 ml-1">(Already has a local title)</span>
                                            )}
                                        </>
                                    ) : (
                                        <span className="text-amber-600 ml-1">
                                            (No login yet — one will be created automatically, username: {lookedUpPerson.memberCode})
                                        </span>
                                    )}
                                </p>
                            )}
                        </div>

                        <div>
                            <FieldLabel required>Title</FieldLabel>
                            <Select
                                value={role}
                                onChange={(v) => setRole(v as LocalAuthorityRole)}
                                options={[
                                    { value: "VILLAGE_PRESIDENT", label: "Village President" },
                                    { value: "VILLAGE_SECRETARY", label: "Village Secretary" },
                                ]}
                            />
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
                            disabled={assigning || !lookedUpPerson}
                            className="px-4 py-2 rounded-md bg-primary text-white text-sm hover:bg-primary/90 disabled:opacity-60 transition"
                        >
                            {assigning ? "Assigning…" : "Assign Title"}
                        </button>
                    </section>
                </>
            )}

            <ConfirmDialog
                isOpen={revokeTarget !== null}
                onClose={() => setRevokeTarget(null)}
                onConfirm={() => revokeTarget !== null && handleRevoke(revokeTarget)}
                variant="warning"
                title="Revoke Local Title?"
                message="This member will be demoted back to MEMBER and their local authority scope will be deactivated."
                confirmLabel="Yes, Revoke"
                cancelLabel="Keep Title"
            />

        </div>
    );
}
