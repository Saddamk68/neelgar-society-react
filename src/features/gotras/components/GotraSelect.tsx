import { useQuery } from "@tanstack/react-query";
import { listGotras } from "../services/gotraService";
import Select from "@/components/form/Select";

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

  return (
    <Select
      value={value}
      onChange={(v) => onChange(Number(v))} // always call onChange, even with 0 (caller handles validation)
      options={gotras.map((g) => ({ value: g.id, label: g.name }))}
      placeholder="Select gotra…"
      loading={isLoading}
      loadingLabel="Loading gotras…"
      hasError={hasError}
      disabled={disabled}
    />
  );
}
