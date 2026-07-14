import { useQuery } from "@tanstack/react-query";
import { listGotrasBySociety } from "../services/publicGeoGotraService";
import Select from "@/components/form/Select";

export default function PublicGotraSelect({
    societyId,
    value,
    onChange,
    hasError,
}: {
    societyId: number;
    value: number | undefined;
    onChange: (id: number) => void;
    hasError?: boolean;
}) {
    const { data: gotras = [], isLoading } = useQuery({
        queryKey: ["public-gotras", societyId],
        queryFn: () => listGotrasBySociety(societyId),
        enabled: societyId > 0,
        staleTime: 1000 * 60 * 10,
    });

    return (
        <Select
            value={value}
            onChange={(v) => onChange(Number(v))}
            options={gotras.map((g) => ({ value: g.id, label: g.name }))}
            placeholder="Select gotra…"
            loading={isLoading}
            loadingLabel="Loading gotras…"
            hasError={hasError}
        />
    );
}
