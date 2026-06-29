import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PageHeader from "@/components/layout/PageHeader";
import FieldLabel from "@/components/form/FieldLabel";
import { useAuth } from "@/context/AuthContext";
import { useNotify } from "@/services/notifications";
import {
    listByLevel,
    listChildren,
    createGeoUnit,
    deactivateGeoUnit,
} from "@/features/geo-units/services/geoUnitService";
import { GeoLevel, GeoUnit, GeoUnitType } from "@/features/geo-units/geo-unit-types";

function inputClass() {
    return "w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 transition border-slate-300 focus:ring-primary/40";
}

export default function GeoUnits() {
    const { user } = useAuth();
    const notify = useNotify();
    const qc = useQueryClient();

    const [level, setLevel] = useState<GeoLevel>("STATE");
    const [parentStateId, setParentStateId] = useState<number | undefined>();
    const [parentDistrictId, setParentDistrictId] = useState<number | undefined>();
    const [parentTehsilId, setParentTehsilId] = useState<number | undefined>();
    const [unitType, setUnitType] = useState<GeoUnitType>("VILLAGE");
    const [name, setName] = useState("");
    const [saving, setSaving] = useState(false);

    const { data: states = [] } = useQuery({
        queryKey: ["geo-units", "STATE"],
        queryFn: () => listByLevel("STATE"),
    });

    const { data: districts = [] } = useQuery({
        queryKey: ["geo-units", "children", parentStateId],
        queryFn: () => listChildren(parentStateId as number),
        enabled: !!parentStateId && (level === "TEHSIL" || level === "VILLAGE_TOWN"),
    });

    const { data: tehsils = [] } = useQuery({
        queryKey: ["geo-units", "children", parentDistrictId],
        queryFn: () => listChildren(parentDistrictId as number),
        enabled: !!parentDistrictId && level === "VILLAGE_TOWN",
    });

    // List for the "existing entries" panel — shows whatever level is selected
    const listParentId = level === "DISTRICT" ? parentStateId
        : level === "TEHSIL" ? parentDistrictId
            : level === "VILLAGE_TOWN" ? parentTehsilId
                : undefined;

    const { data: existingItems = [], isLoading } = useQuery<GeoUnit[]>({
        queryKey: ["geo-units", "browse", level, listParentId],
        queryFn: () => level === "STATE" ? listByLevel("STATE") : listChildren(listParentId as number),
        enabled: level === "STATE" || !!listParentId,
    });

    function resetForm() {
        setName("");
        setUnitType("VILLAGE");
    }

    async function handleCreate() {
        if (!name.trim()) {
            notify.error("Name is required");
            return;
        }
        let parentId: number | undefined;
        if (level === "DISTRICT") {
            if (!parentStateId) { notify.error("Select a state first"); return; }
            parentId = parentStateId;
        } else if (level === "TEHSIL") {
            if (!parentDistrictId) { notify.error("Select a state and district first"); return; }
            parentId = parentDistrictId;
        } else if (level === "VILLAGE_TOWN") {
            if (!parentTehsilId) { notify.error("Select a state, district and tehsil first"); return; }
            parentId = parentTehsilId;
        }

        setSaving(true);
        try {
            await createGeoUnit(
                name.trim(),
                level,
                parentId,
                level === "VILLAGE_TOWN" ? unitType : undefined,
                user?.username ?? "system"
            );
            notify.success(`${name.trim()} created.`);
            resetForm();
            qc.invalidateQueries({ queryKey: ["geo-units"] });
        } catch (err: any) {
            notify.error(err?.response?.data?.message || err?.message || "Failed to create.");
        } finally {
            setSaving(false);
        }
    }

    async function handleDeactivate(item: GeoUnit) {
        if (!confirm(`Deactivate "${item.name}"? It will no longer be selectable.`)) return;
        try {
            await deactivateGeoUnit(item.id, user?.username ?? "system");
            notify.success(`${item.name} deactivated.`);
            qc.invalidateQueries({ queryKey: ["geo-units"] });
        } catch (err: any) {
            notify.error(err?.response?.data?.message || err?.message || "Failed to deactivate.");
        }
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <PageHeader
                title="States, Districts & Towns/Villages"
                subtitle="Add or deactivate geo units used across member, family, and leadership forms."
                backTo="back"
            />

            {/* Add form */}
            <section className="bg-white rounded-xl shadow p-6 space-y-4">
                <h2 className="text-lg font-semibold">Add New</h2>

                <div>
                    <FieldLabel required>Level</FieldLabel>
                    <select
                        value={level}
                        onChange={(e) => {
                            setLevel(e.target.value as GeoLevel);
                            setParentStateId(undefined);
                            setParentDistrictId(undefined);
                            setParentTehsilId(undefined);
                        }}
                        className={inputClass()}
                    >
                        <option value="STATE">State</option>
                        <option value="DISTRICT">District</option>
                        <option value="TEHSIL">Tehsil</option>
                        <option value="VILLAGE_TOWN">City / Town / Village</option>
                    </select>
                </div>

                {(level === "DISTRICT" || level === "TEHSIL" || level === "VILLAGE_TOWN") && (
                    <div>
                        <FieldLabel required>State</FieldLabel>
                        <select
                            value={parentStateId ?? ""}
                            onChange={(e) => { setParentStateId(Number(e.target.value) || undefined); setParentDistrictId(undefined); setParentTehsilId(undefined); }}
                            className={inputClass()}
                        >
                            <option value="">Select state…</option>
                            {states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                )}

                {(level === "TEHSIL" || level === "VILLAGE_TOWN") && (
                    <div>
                        <FieldLabel required>District</FieldLabel>
                        <select
                            value={parentDistrictId ?? ""}
                            onChange={(e) => { setParentDistrictId(Number(e.target.value) || undefined); setParentTehsilId(undefined); }}
                            disabled={!parentStateId}
                            className={inputClass()}
                        >
                            <option value="">Select district…</option>
                            {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                )}

                {level === "VILLAGE_TOWN" && (
                    <div>
                        <FieldLabel required>Tehsil</FieldLabel>
                        <select
                            value={parentTehsilId ?? ""}
                            onChange={(e) => setParentTehsilId(Number(e.target.value) || undefined)}
                            disabled={!parentDistrictId}
                            className={inputClass()}
                        >
                            <option value="">Select tehsil…</option>
                            {tehsils.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                )}

                {level === "VILLAGE_TOWN" && (
                    <div>
                        <FieldLabel required>Type</FieldLabel>
                        <select value={unitType} onChange={(e) => setUnitType(e.target.value as GeoUnitType)} className={inputClass()}>
                            <option value="VILLAGE">Village</option>
                            <option value="TOWN">Town</option>
                            <option value="CITY">City</option>
                        </select>
                    </div>
                )}

                <div>
                    <FieldLabel required>Name</FieldLabel>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={level === "STATE" ? "e.g. Madhya Pradesh" : level === "DISTRICT" ? "e.g. Morena" : "e.g. Jora"}
                        className={inputClass()}
                    />
                </div>

                <button
                    type="button"
                    onClick={handleCreate}
                    disabled={saving}
                    className="px-4 py-2 rounded-md bg-primary text-white text-sm hover:bg-primary/90 disabled:opacity-60 transition"
                >
                    {saving ? "Creating…" : "Create"}
                </button>
            </section>

            {/* Existing list for the selected level/parent */}
            <section className="bg-white rounded-xl shadow p-6 space-y-3">
                <h2 className="text-lg font-semibold">
                    Existing {level === "STATE" ? "States" : level === "DISTRICT" ? "Districts" : level === "TEHSIL" ? "Tehsils" : "Villages/Towns"}
                </h2>
                {(level !== "STATE" && !listParentId) ? (
                    <p className="text-sm text-slate-400">Select a parent above to see existing entries.</p>
                ) : isLoading ? (
                    <p className="text-sm text-slate-400">Loading…</p>
                ) : existingItems.length === 0 ? (
                    <p className="text-sm text-slate-400">None yet.</p>
                ) : (
                    <div className="divide-y">
                        {existingItems.map((item) => (
                            <div key={item.id} className="flex items-center justify-between py-2.5 text-sm">
                                <span>{item.name}{item.unitType ? ` (${item.unitType})` : ""}</span>
                                <button
                                    type="button"
                                    onClick={() => handleDeactivate(item)}
                                    className="px-3 py-1 rounded-md border border-red-300 text-red-600 text-xs hover:bg-red-50 transition"
                                >
                                    Deactivate
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
