import { useQuery } from "@tanstack/react-query";
import { listGotras } from "../services/gotraService";

export default function GotraSelect({
  societyId,
  value,
  onChange,
  hasError,
  disabled,
}: {
  societyId: number;
  value: number | undefined;
  onChange: (id: number) => void;
  hasError?: boolean;
  disabled?: boolean;
}) {
  const { data: gotras = [], isLoading } = useQuery({
    queryKey: ["gotras", societyId],
    queryFn: () => listGotras(societyId),
    enabled: societyId > 0,
    staleTime: 1000 * 60 * 10,
  });

  const cls = [
    "w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 transition bg-white",
    hasError
      ? "border-red-400 ring-1 ring-red-400 focus:ring-red-400"
      : "border-slate-300 focus:ring-primary/40",
    disabled ? "opacity-60 cursor-not-allowed" : "",
  ].join(" ");

  return (
    <select
      value={value ?? ""}
      onChange={(e) => {
        const v = Number(e.target.value);
        onChange(v);  // always call onChange, even with 0 (caller handles validation)
      }}
      disabled={disabled || isLoading}
      className={cls}
    >
      <option value="">
        {isLoading ? "Loading gotras…" : "Select gotra…"}
      </option>
      {gotras.map((g) => (
        <option key={g.id} value={g.id}>{g.name}</option>
      ))}
    </select>
  );
}
