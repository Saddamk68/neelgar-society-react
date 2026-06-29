import { ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { listByLevel, listChildren } from "../services/geoUnitService";

const selectCls =
  "w-full appearance-none rounded-lg border px-3 py-2.5 pr-9 text-sm shadow-sm transition bg-white border-slate-300 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed";

export type GeoSelection = {
  stateId?: number;
  districtId?: number;
  tehsilId?: number;
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

  const { data: tehsils = [], isLoading: loadingTehsils } = useQuery({
    queryKey: ["geo-units", "children", value.districtId],
    queryFn: () => listChildren(value.districtId as number),
    enabled: !!value.districtId,
    staleTime: 1000 * 60 * 30,
  });

  const { data: villagesTowns = [], isLoading: loadingVT } = useQuery({
    queryKey: ["geo-units", "children", value.tehsilId],
    queryFn: () => listChildren(value.tehsilId as number),
    enabled: !!value.tehsilId,
    staleTime: 1000 * 60 * 30,
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div>
        <label className="block text-xs text-slate-400 mb-1">State</label>
        <div className="relative">
          <select
            className={selectCls}
            value={value.stateId ?? ""}
            disabled={loadingStates}
            onChange={(e) =>
              onChange({ stateId: Number(e.target.value) || undefined, districtId: undefined, tehsilId: undefined, villageTownId: undefined })
            }
          >
            <option value="">{loadingStates ? "Loading…" : "Select state…"}</option>
            {states.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        </div>
      </div>

      <div>
        <label className="block text-xs text-slate-400 mb-1">District</label>
        <div className="relative">
          <select
            className={selectCls}
            value={value.districtId ?? ""}
            disabled={!value.stateId || loadingDistricts}
            onChange={(e) =>
              onChange({ ...value, districtId: Number(e.target.value) || undefined, tehsilId: undefined, villageTownId: undefined })
            }
          >
            <option value="">{loadingDistricts ? "Loading…" : "Select district…"}</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        </div>
      </div>

      <div>
        <label className="block text-xs text-slate-400 mb-1">Tehsil</label>
        <div className="relative">
          <select
            className={selectCls}
            value={value.tehsilId ?? ""}
            disabled={!value.districtId || loadingTehsils}
            onChange={(e) =>
              onChange({ ...value, tehsilId: Number(e.target.value) || undefined, villageTownId: undefined })
            }
          >
            <option value="">{loadingTehsils ? "Loading…" : "Select tehsil…"}</option>
            {tehsils.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        </div>
      </div>

      <div>
        <label className="block text-xs text-slate-400 mb-1">City / Town / Village</label>
        <div className="relative">
          <select
            className={selectCls}
            value={value.villageTownId ?? ""}
            disabled={!value.tehsilId || loadingVT}
            onChange={(e) => onChange({ ...value, villageTownId: Number(e.target.value) || undefined })}
          >
            <option value="">{loadingVT ? "Loading…" : "Select..."}</option>
            {villagesTowns.map((v) => (
              <option key={v.id} value={v.id}>{v.name}{v.unitType ? ` (${v.unitType})` : ""}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        </div>
      </div>
    </div>
  );
}
