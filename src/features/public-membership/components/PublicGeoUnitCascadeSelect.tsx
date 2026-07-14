import { useQuery } from "@tanstack/react-query";
import { listGeoUnitsByLevel, listGeoUnitChildren } from "../services/publicGeoGotraService";
import Select from "@/components/form/Select";

export type GeoSelection = {
    stateId?: number;
    districtId?: number;
    tehsilId?: number;
    villageTownId?: number;
};

export default function PublicGeoUnitCascadeSelect({
    value,
    onChange,
}: {
    value: GeoSelection;
    onChange: (next: GeoSelection) => void;
}) {
    const { data: states = [], isLoading: loadingStates } = useQuery({
        queryKey: ["public-geo-units", "STATE"],
        queryFn: () => listGeoUnitsByLevel("STATE"),
        staleTime: 1000 * 60 * 30,
    });

    const { data: districts = [], isLoading: loadingDistricts } = useQuery({
        queryKey: ["public-geo-units", "children", value.stateId],
        queryFn: () => listGeoUnitChildren(value.stateId as number),
        enabled: !!value.stateId,
        staleTime: 1000 * 60 * 30,
    });

    const { data: tehsils = [], isLoading: loadingTehsils } = useQuery({
        queryKey: ["public-geo-units", "children", value.districtId],
        queryFn: () => listGeoUnitChildren(value.districtId as number),
        enabled: !!value.districtId,
        staleTime: 1000 * 60 * 30,
    });

    const { data: villagesTowns = [], isLoading: loadingVT } = useQuery({
        queryKey: ["public-geo-units", "children", value.tehsilId],
        queryFn: () => listGeoUnitChildren(value.tehsilId as number),
        enabled: !!value.tehsilId,
        staleTime: 1000 * 60 * 30,
    });

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
                <label className="block text-xs text-slate-400 mb-1">State</label>
                <Select
                    value={value.stateId ?? ""}
                    loading={loadingStates}
                    loadingLabel="Loading…"
                    placeholder="Select state…"
                    onChange={(v) =>
                        onChange({ stateId: Number(v) || undefined, districtId: undefined, tehsilId: undefined, villageTownId: undefined })
                    }
                    options={states.map((s) => ({ value: s.id, label: s.name }))}
                />
            </div>

            <div>
                <label className="block text-xs text-slate-400 mb-1">District</label>
                <Select
                    value={value.districtId ?? ""}
                    disabled={!value.stateId}
                    loading={loadingDistricts}
                    loadingLabel="Loading…"
                    placeholder="Select district…"
                    onChange={(v) =>
                        onChange({ ...value, districtId: Number(v) || undefined, tehsilId: undefined, villageTownId: undefined })
                    }
                    options={districts.map((d) => ({ value: d.id, label: d.name }))}
                />
            </div>

            <div>
                <label className="block text-xs text-slate-400 mb-1">Tehsil</label>
                <Select
                    value={value.tehsilId ?? ""}
                    disabled={!value.districtId}
                    loading={loadingTehsils}
                    loadingLabel="Loading…"
                    placeholder="Select tehsil…"
                    onChange={(v) => onChange({ ...value, tehsilId: Number(v) || undefined, villageTownId: undefined })}
                    options={tehsils.map((t) => ({ value: t.id, label: t.name }))}
                />
            </div>

            <div>
                <label className="block text-xs text-slate-400 mb-1">City / Town / Village</label>
                <Select
                    value={value.villageTownId ?? ""}
                    disabled={!value.tehsilId}
                    loading={loadingVT}
                    loadingLabel="Loading…"
                    placeholder="Select..."
                    onChange={(v) => onChange({ ...value, villageTownId: Number(v) || undefined })}
                    options={villagesTowns.map((v) => ({
                        value: v.id,
                        label: v.name + (v.unitType ? ` (${v.unitType})` : ""),
                    }))}
                />
            </div>
        </div>
    );
}
