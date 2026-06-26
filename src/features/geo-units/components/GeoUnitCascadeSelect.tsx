import { useQuery } from "@tanstack/react-query";
import { listByLevel, listChildren } from "../services/geoUnitService";

const selectCls =
    "w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 transition bg-white border-slate-300 focus:ring-primary/40";

export type GeoSelection = {
    stateId?: number;
    districtId?: number;
    villageTownId?: number;
};

export default function GeoUnitCascadeSelect({
  value,
  onChange,
}: {
  value: GeoSelection;
  onChange: (next: GeoSelection) => void;
}) {
  const { data: states = [], isLoading: loadingStates } = useQuery({
    queryKey: ["geo-units", "STATE"],
    queryFn: () => listByLevel("STATE"),
    staleTime: 1000 * 60 * 30,
  });

  const { data: districts = [], isLoading: loadingDistricts } = useQuery({
    queryKey: ["geo-units", "children", value.stateId],
    queryFn: () => listChildren(value.stateId as number),
    enabled: !!value.stateId,
    staleTime: 1000 * 60 * 30,
  });

  const { data: villagesTowns = [], isLoading: loadingVT } = useQuery({
    queryKey: ["geo-units", "children", value.districtId],
    queryFn: () => listChildren(value.districtId as number),
    enabled: !!value.districtId,
    staleTime: 1000 * 60 * 30,
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label className="block text-xs text-slate-400 mb-1">State</label>
        <select
          className={selectCls}
          value={value.stateId ?? ""}
          disabled={loadingStates}
          onChange={(e) =>
            onChange({ stateId: Number(e.target.value) || undefined, districtId: undefined, villageTownId: undefined })
          }
        >
          <option value="">{loadingStates ? "Loading…" : "Select state…"}</option>
          {states.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs text-slate-400 mb-1">District</label>
        <select
          className={selectCls}
          value={value.districtId ?? ""}
          disabled={!value.stateId || loadingDistricts}
          onChange={(e) =>
            onChange({ ...value, districtId: Number(e.target.value) || undefined, villageTownId: undefined })
          }
        >
          <option value="">{loadingDistricts ? "Loading…" : "Select district…"}</option>
          {districts.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs text-slate-400 mb-1">Village / Town</label>
        <select
          className={selectCls}
          value={value.villageTownId ?? ""}
          disabled={!value.districtId || loadingVT}
          onChange={(e) => onChange({ ...value, villageTownId: Number(e.target.value) || undefined })}
        >
          <option value="">{loadingVT ? "Loading…" : "Select village/town…"}</option>
          {villagesTowns.map((v) => (
            <option key={v.id} value={v.id}>{v.name}{v.unitType ? ` (${v.unitType})` : ""}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
